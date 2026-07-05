import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  type PhotoFile,
} from 'react-native-vision-camera';
import { useSkiaFrameProcessor } from 'react-native-vision-camera';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { OpenCV } from 'react-native-fast-opencv';
import { Skia, PaintStyle } from '@shopify/react-native-skia';
import { useSharedValue, Worklets } from 'react-native-worklets-core';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppScreen, ScannedCopy, ScannedCopyDraft } from '@/features/correctai/types';
import { OCR_SERVICE_URL } from '@/constants/api';
import { uploadScannerMultipart } from '@/features/correctai/upload';

type CornerPoint = { x: number; y: number };

type ScannerProps = {
  activeTab?: string;
  onNavigate?: (screen: AppScreen) => void;
  onRegisterAnswerKeyScan?: () => void;
  onRegisterExamScan?: (draft?: ScannedCopyDraft) => ScannedCopy | null;
  scannerMode?: 'copies' | 'key';
  selectedExam?: { questions?: number } | null;
};

// ── Tuning constants ─────────────────────────────────────────────────────────

const CAPTURE_QUALITY = 0.92;
const STABILITY_FRAMES = 12; // ~10-15 frames as requested
const MIN_CAPTURE_INTERVAL_MS = 3000;

// ── Main component ────────────────────────────────────────────────────────────

export function ProfessorScannerScreen(props: ScannerProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraReady, setCameraReady] = useState(false);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [isCapturing, setIsCapturing] = useState(false);
  const [scanResultVisible, setScanResultVisible] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [capturedCopy, setCapturedCopy] = useState<ScannedCopy | null>(null);
  const [cameraFrozen, setCameraFrozen] = useState(false);

  // ── Settings state ─────────────────────────────────────────────────────────
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(true);
  const [imageQuality, setImageQuality] = useState<number>(CAPTURE_QUALITY);
  const [torchEnabled, setTorchEnabled] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const autoCaptureDone = useRef(false);
  const isCapturingRef = useRef(false);
  const scanResultVisibleRef = useRef(false);
  const lastCaptureTime = useRef(0);

  isCapturingRef.current = isCapturing;
  scanResultVisibleRef.current = scanResultVisible;

  const questionCount = props.selectedExam?.questions ?? 20;
  const isKeyMode = props.scannerMode === 'key';

  // ── Shared Values from Worklet ─────────────────────────────────────────────
  const isAlignedShared = useSharedValue(false);
  const isStableShared = useSharedValue(false);
  const detectedCornersShared = useSharedValue<CornerPoint[]>([]);

  // Local React state updated from shared values (so UI can react)
  const [isAligned, setIsAligned] = useState(false);
  const [isStable, setIsStable] = useState(false);
  const [detectedCorners, setDetectedCorners] = useState<CornerPoint[]>([]);

  const updateReactState = Worklets.createRunOnJS((aligned: boolean, stable: boolean, corners: CornerPoint[]) => {
    setIsAligned(aligned);
    setIsStable(stable);
    setDetectedCorners(corners);
  });

  // ── Permission request ────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  // ── Reset on mode/exam change ─────────────────────────────────────────────
  useEffect(() => {
    setIsAligned(false);
    setIsStable(false);
    setCameraReady(false);
    setIsCapturing(false);
    setDetectedCorners([]);
    setScanResultVisible(false);
    setCapturedImageUri(null);
    setCapturedCopy(null);
    autoCaptureDone.current = false;
    isAlignedShared.value = false;
    isStableShared.value = false;
    detectedCornersShared.value = [];
  }, [isKeyMode, props.selectedExam?.questions]);

  // ── High-quality capture + scan ────────────────────────────────────────────
  const doCapture = useCallback(async () => {
    if (autoCaptureDone.current || scanResultVisible) return;

    const now = Date.now();
    if (now - lastCaptureTime.current < MIN_CAPTURE_INTERVAL_MS) return;
    lastCaptureTime.current = now;

    const camera = cameraRef.current;
    if (!camera) return;

    autoCaptureDone.current = true;
    setIsCapturing(true);

    try {
      const photo: PhotoFile = await camera.takePhoto({
        flash: flashMode === 'auto' ? 'auto' : flashMode === 'on' ? 'on' : 'off',
        enableShutterSound: false,
      });

      const imageUri = `file://${photo.path}`;

      let studentName: string | null = null;
      let matricule: string | null = null;
      let className: string | null = null;
      let answers: string[] = [];
      let conf = 0;
      let ocrResultPayload: ScannedCopyDraft['ocrResult'];
      let omrResultPayload: ScannedCopyDraft['omrResult'];
      let warpedImageUri: string | undefined;

      const currentCorners = detectedCornersShared.value;
      if (currentCorners && currentCorners.length === 4) {
        // Map corners back to the original photo dimensions.
        // We downscaled to 360x640 in the worklet.
        // Also account for orientation differences if necessary.
        const cornersJson = JSON.stringify(currentCorners);

        const scanUpload = await Promise.race([
          uploadScannerMultipart({
            requestUrl: `${OCR_SERVICE_URL}/scan`,
            imageUri,
            label: 'scan',
            fields: {
              questions: questionCount,
              lang: 'fra+eng',
              corners_json: cornersJson,
              detection_image_width: 360,
              detection_image_height: 640,
            },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('/scan timed out after 30s')), 30000),
          ),
        ]);

        if (scanUpload.status === 200) {
          const scanData = JSON.parse(scanUpload.body);

          if (!scanData.detected) {
            autoCaptureDone.current = false;
            Alert.alert(
              'Repositionner la feuille',
              "La feuille n'a pas pu être recadrée. Repositionnez-la et réessayez.",
            );
            return;
          }

          if (scanData.warped_image_base64) {
            try {
              const { FileSystem } = await import('expo-file-system');
              const warpedPath = `${FileSystem.cacheDirectory}warped_${Date.now()}.jpg`;
              await FileSystem.writeAsStringAsync(
                warpedPath,
                scanData.warped_image_base64,
                { encoding: FileSystem.EncodingType.Base64 },
              );
              warpedImageUri = warpedPath;
            } catch (err) {
              console.log('[Scanner] Failed to save warped image:', String(err));
            }
          }

          if (scanData.ocr) {
            const ocr = scanData.ocr;
            studentName = ocr.name || null;
            matricule = ocr.matricule || null;
            className = ocr.class_name || ocr.className || null;
            ocrResultPayload = {
              extracted: Boolean(ocr.extracted),
              name: ocr.name || null,
              matricule: ocr.matricule || null,
              className: ocr.class_name || ocr.className || null,
              confidence: Math.round((ocr.confidence ?? 0) * 100),
              missingFields: Array.isArray(ocr.missing_fields)
                ? ocr.missing_fields
                : Array.isArray(ocr.missingFields)
                  ? ocr.missingFields
                  : [],
            };
          }

          if (scanData.omr?.answers?.length) {
            const parsed = scanData.omr.answers.map((a: any, i: number) => ({
              question: Number(a.question) || i + 1,
              answer: a.answer ?? null,
              confidence: Math.round((a.confidence ?? 0) * 100),
            }));
            answers = parsed.map((a: { answer: string | null }) => a.answer ?? '');
            omrResultPayload = { detected: Boolean(scanData.omr.detected), answers: parsed };
            conf = Math.round(
              scanData.omr.answers.reduce((s: number, a: any) => s + (a.confidence ?? 0), 0) /
                scanData.omr.answers.length * 100,
            );
          } else {
            omrResultPayload = { detected: false, answers: [] };
          }
        } else {
          autoCaptureDone.current = false;
          Alert.alert('Erreur serveur', `Erreur ${scanUpload.status}. Réessayez.`);
          return;
        }
      }

      const displayUri = warpedImageUri ?? imageUri;
      setCameraFrozen(true);
      setCapturedImageUri(displayUri);
      setScanResultVisible(true);
      
      // Stop capture triggers
      isAlignedShared.value = false;
      isStableShared.value = false;
      updateReactState(false, false, []);

      const createdCopy = props.onRegisterExamScan?.({
        studentName: studentName ?? 'À extraire plus tard',
        matricule: matricule ?? 'À extraire plus tard',
        className: className ?? undefined,
        calculatedScore: '--',
        aiConfidence: conf,
        detectedAnswers: answers,
        detectedAnswersCount: answers.length,
        imageUri: warpedImageUri ?? imageUri,
        ocrResult: ocrResultPayload,
        omrResult: omrResultPayload,
        metadata: { source: 'scanner', processedAt: new Date().toISOString() },
      }) ?? null;

      if (!createdCopy) {
        Alert.alert('Scan impossible', "La copie n'a pas pu être enregistrée.");
      } else {
        setCapturedCopy(createdCopy);
      }
    } catch (err) {
      console.log('[Scanner] doCapture error:', err instanceof Error ? err.message : String(err));
      Alert.alert('Scan impossible', "Nous n'avons pas pu capturer le document. Réessayez.");
      autoCaptureDone.current = false;
    } finally {
      setIsCapturing(false);
    }
  }, [
    flashMode, questionCount, props.onRegisterExamScan, scanResultVisible
  ]);

  const triggerCaptureJS = Worklets.createRunOnJS(doCapture);

  // ── Frame Processor ────────────────────────────────────────────────────────
  const { resize } = useResizePlugin();
  const stabilityCounter = useSharedValue(0);

  const frameProcessor = useSkiaFrameProcessor((frame) => {
    'worklet';
    frame.render();

    // Skip processing if we're currently showing results or capturing
    if (isCapturingRef.current || scanResultVisibleRef.current || autoCaptureDone.current) {
      return;
    }

    // Downscale for performance
    const resized = resize(frame, { scale: { width: 360, height: 640 }, pixelFormat: 'bgr', dataType: 'uint8' });
    
    // Convert to Mat
    const src = OpenCV.invoke('matFromImageData', {
      rows: resized.height,
      cols: resized.width,
      type: OpenCV.constants.CV_8UC3,
      data: resized.buffer
    });

    const gray = OpenCV.invoke('cvtColor', src, OpenCV.constants.COLOR_BGR2GRAY);
    // Use adaptive threshold to handle lighting variations
    const thresh = OpenCV.invoke('adaptiveThreshold', gray, 255, OpenCV.constants.ADAPTIVE_THRESH_GAUSSIAN_C, OpenCV.constants.THRESH_BINARY_INV, 11, 2);

    const contours = OpenCV.invoke('findContours', thresh, OpenCV.constants.RETR_EXTERNAL, OpenCV.constants.CHAIN_APPROX_SIMPLE);
    
    const candidateCorners: any[] = [];
    const minMarkerArea = 50;
    const maxMarkerArea = 2000;

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = OpenCV.invoke('contourArea', contour);
      
      if (area > minMarkerArea && area < maxMarkerArea) {
        const rect = OpenCV.invoke('boundingRect', contour);
        const aspect = rect.width / rect.height;
        // Looking for roughly square markers
        if (aspect > 0.7 && aspect < 1.3) {
          candidateCorners.push({
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
          });
        }
      }
    }

    // If we have exactly 4 candidates, assume they are the corners (in reality, more robust sorting/filtering is needed)
    let found4 = false;
    if (candidateCorners.length === 4) {
      // Sort corners (top-left, top-right, bottom-right, bottom-left)
      candidateCorners.sort((a, b) => a.y - b.y);
      const top = candidateCorners.slice(0, 2).sort((a, b) => a.x - b.x);
      const bottom = candidateCorners.slice(2, 4).sort((a, b) => b.x - a.x); // bottom right then bottom left
      
      const sorted = [...top, ...bottom];
      detectedCornersShared.value = sorted;
      found4 = true;
      stabilityCounter.value += 1;
      isAlignedShared.value = true;
    } else {
      isAlignedShared.value = false;
      stabilityCounter.value = 0;
      isStableShared.value = false;
      detectedCornersShared.value = [];
    }

    if (stabilityCounter.value >= STABILITY_FRAMES) {
      isStableShared.value = true;
      if (autoCaptureEnabled) {
        triggerCaptureJS();
      }
    }

    updateReactState(isAlignedShared.value, isStableShared.value, detectedCornersShared.value);

    // Draw visual feedback
    const paint = Skia.Paint();
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(3);
    paint.setColor(isStableShared.value ? Skia.Color('green') : (found4 ? Skia.Color('yellow') : Skia.Color('red')));
    
    // Scale coordinates back up to frame size for drawing
    const scaleX = frame.width / 360;
    const scaleY = frame.height / 640;

    if (found4) {
      const path = Skia.Path();
      const c = detectedCornersShared.value;
      path.moveTo(c[0].x * scaleX, c[0].y * scaleY);
      path.lineTo(c[1].x * scaleX, c[1].y * scaleY);
      path.lineTo(c[2].x * scaleX, c[2].y * scaleY);
      path.lineTo(c[3].x * scaleX, c[3].y * scaleY);
      path.close();
      frame.drawPath(path, paint);
    }
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  const goBack = () => {
    props.onNavigate?.(isKeyMode ? 'professor-answer-key' : 'professor-exam-menu');
  };

  const closeBottomSheet = () => {
    setScanResultVisible(false);
    setCameraFrozen(false);
    setCapturedImageUri(null);
    setCapturedCopy(null);
    autoCaptureDone.current = false;
    lastCaptureTime.current = 0;
    isAlignedShared.value = false;
    isStableShared.value = false;
    detectedCornersShared.value = [];
    updateReactState(false, false, []);
  };

  const handleReviewCopy = () => { closeBottomSheet(); props.onNavigate?.('professor-copy-detail'); };
  const handleContinueAndSave = () => { closeBottomSheet(); };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={goBack} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Scanner</Text>
        <Pressable accessibilityRole="button" onPress={() => setSettingsVisible(true)} style={styles.headerIcon}>
          <Ionicons name="settings-outline" size={18} color="rgba(255,255,255,0.9)" />
        </Pressable>
      </View>

      <View style={styles.content}>
        {hasPermission && device ? (
          <View style={styles.scannerShell}>
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={!cameraFrozen}
              photo
              frameProcessor={frameProcessor}
              torch={torchEnabled ? 'on' : 'off'}
              onInitialized={() => {
                console.log('[Scanner] Vision Camera initialized');
                setCameraReady(true);
              }}
              onError={(err) => {
                console.log('[Scanner] Camera error:', err.message);
                setCameraReady(false);
              }}
            />

            {cameraFrozen && capturedImageUri && (
              <Image source={{ uri: capturedImageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            )}

            <View style={styles.scannerTint} pointerEvents="none" />

            <View style={styles.a4Frame} pointerEvents="none">
              <View style={[styles.corner, styles.cornerTopLeft, isAligned && isStable && styles.cornerReady]} />
              <View style={[styles.corner, styles.cornerTopRight, isAligned && isStable && styles.cornerReady]} />
              <View style={[styles.corner, styles.cornerBottomLeft, isAligned && isStable && styles.cornerReady]} />
              <View style={[styles.corner, styles.cornerBottomRight, isAligned && isStable && styles.cornerReady]} />
              <View style={[styles.frameOutline, isAligned && isStable && styles.frameOutlineReady]} />
            </View>

            <View style={styles.guidanceWrap}>
              <Text style={styles.guidanceText}>
                Alignez la feuille de réponses dans le cadre
              </Text>
              {isAligned && isStable ? (
                <View style={styles.alignBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#4ADE80" />
                  <Text style={styles.alignBadgeText}>Document détecté</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.permissionPanel}>
            <Ionicons name="camera-outline" size={32} color="#B7B8C9" />
            <Text style={styles.permissionText}>
              {!hasPermission ? 'Autorisation caméra requise' : 'Aucune caméra arrière disponible'}
            </Text>
            {!hasPermission && (
              <Pressable style={styles.permissionBtn} onPress={requestPermission}>
                <Text style={styles.permissionBtnText}>Autoriser</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      <Modal transparent animationType="slide" visible={scanResultVisible} onRequestClose={closeBottomSheet}>
        <View style={styles.bottomSheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeBottomSheet} />
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />
            <Text style={styles.bottomSheetTitle}>Scan terminé</Text>
            <Text style={styles.bottomSheetSubtitle}>Vérifiez les informations extraites avant de continuer.</Text>
            <View style={styles.bottomSheetSummaryCard}>
              <View style={styles.bottomSheetSummaryItem}>
                <Text style={styles.bottomSheetSummaryLabel}>Nom complet</Text>
                <Text numberOfLines={1} style={styles.bottomSheetSummaryValue}>
                  {capturedCopy?.studentName ?? 'À extraire plus tard'}
                </Text>
              </View>
              <View style={styles.bottomSheetSummaryItem}>
                <Text style={styles.bottomSheetSummaryLabel}>Matricule</Text>
                <Text numberOfLines={1} style={styles.bottomSheetSummaryValue}>
                  {capturedCopy?.matricule ?? 'À extraire plus tard'}
                </Text>
              </View>
              <View style={styles.bottomSheetSummaryItem}>
                <Text style={styles.bottomSheetSummaryLabel}>Note obtenue</Text>
                <Text numberOfLines={1} style={styles.bottomSheetSummaryValue}>
                  {capturedCopy?.calculatedScore ?? '--'}
                </Text>
              </View>
            </View>
            <View style={styles.bottomSheetActions}>
              <Pressable style={styles.bsSecondaryBtn} onPress={handleReviewCopy}>
                <Text style={styles.bsSecondaryBtnText}>Réviser la copie</Text>
              </Pressable>
              <Pressable style={styles.bsPrimaryBtn} onPress={handleContinueAndSave}>
                <Text style={styles.bsPrimaryBtnText}>Continuer et enregistrer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={settingsVisible} onRequestClose={() => setSettingsVisible(false)}>
        <Pressable style={styles.settingsBackdrop} onPress={() => setSettingsVisible(false)}>
          <Pressable style={styles.settingsPanel} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.settingsTitle}>Paramètres appareil photo</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Flash</Text>
              <View style={styles.settingOptions}>
                {(['auto', 'on', 'off'] as const).map((mode) => (
                  <Pressable
                    key={mode}
                    style={[styles.settingChip, flashMode === mode && styles.settingChipActive]}
                    onPress={() => setFlashMode(mode)}>
                    <Text style={[styles.settingChipText, flashMode === mode && styles.settingChipTextActive]}>
                      {mode === 'auto' ? 'Auto' : mode === 'on' ? 'Activé' : 'Désactivé'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Capture auto</Text>
              <View style={styles.settingOptions}>
                {([true, false] as const).map((val) => (
                  <Pressable
                    key={String(val)}
                    style={[styles.settingChip, autoCaptureEnabled === val && styles.settingChipActive]}
                    onPress={() => setAutoCaptureEnabled(val)}>
                    <Text style={[styles.settingChipText, autoCaptureEnabled === val && styles.settingChipTextActive]}>
                      {val ? 'Activée' : 'Désactivée'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Lampe torche</Text>
              <View style={styles.settingOptions}>
                {([true, false] as const).map((val) => (
                  <Pressable
                    key={String(val)}
                    style={[styles.settingChip, torchEnabled === val && styles.settingChipActive]}
                    onPress={() => setTorchEnabled(val)}>
                    <Text style={[styles.settingChipText, torchEnabled === val && styles.settingChipTextActive]}>
                      {val ? 'Allumée' : 'Éteinte'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Styles (unchanged from original design) ───────────────────────────────────

const styles = StyleSheet.create({
  screen:             { flex: 1, backgroundColor: '#10111A' },
  header:             { height: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#6C5CFF', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)' },
  headerIcon:         { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
  headerTitle:        { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  content:            { flex: 1, paddingTop: 6, paddingHorizontal: 14 },
  scannerShell:       { flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: '#1B1831', position: 'relative' },
  scannerTint:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7, 8, 18, 0.15)' },
  a4Frame:            { position: 'absolute', top: 32, left: 20, right: 20, bottom: 148, aspectRatio: 210 / 297, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
  frameOutline:       { position: 'absolute', width: '100%', height: '100%', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'transparent' },
  frameOutlineReady:  { borderColor: 'rgba(74, 222, 128, 0.35)' },
  corner:             { position: 'absolute', width: 90, height: 90, borderWidth: 5, borderColor: 'rgba(255,255,255,0.92)', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 6 },
  cornerReady:        { borderColor: '#4ADE80', shadowColor: '#4ADE80', shadowOpacity: 0.5, shadowRadius: 14 },
  cornerTopLeft:      { top: -3, left: -3, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTopRight:     { top: -3, right: -3, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBottomLeft:   { bottom: -3, left: -3, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBottomRight:  { bottom: -3, right: -3, borderLeftWidth: 0, borderTopWidth: 0 },
  guidanceWrap:       { position: 'absolute', left: 24, right: 24, bottom: 108, alignItems: 'center', gap: 6 },
  guidanceText:       { color: '#FFFFFF', fontSize: 16, lineHeight: 22, textAlign: 'center', fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  alignBadge:         { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(74, 222, 128, 0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  alignBadgeText:     { color: '#4ADE80', fontSize: 13, fontWeight: '700' },
  permissionPanel:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  permissionText:     { color: '#D8DAEA', fontSize: 14, fontWeight: '700' },
  permissionBtn:      { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: '#6C5CFF' },
  permissionBtnText:  { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  bottomSheetBackdrop:     { flex: 1, backgroundColor: 'rgba(12, 13, 29, 0.55)', justifyContent: 'flex-end' },
  bottomSheet:             { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 34, gap: 12 },
  bottomSheetHandle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D8DAEA', alignSelf: 'center', marginBottom: 4 },
  bottomSheetTitle:        { color: '#121422', fontSize: 22, fontWeight: '900', lineHeight: 28 },
  bottomSheetSubtitle:     { color: '#6A7283', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  bottomSheetSummaryCard:  { backgroundColor: '#F6F7FC', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  bottomSheetSummaryItem:  { gap: 2 },
  bottomSheetSummaryLabel: { color: '#6F4CEB', fontSize: 12, fontWeight: '800', lineHeight: 16 },
  bottomSheetSummaryValue: { color: '#121422', fontSize: 16, fontWeight: '800', lineHeight: 21 },
  bottomSheetActions:      { flexDirection: 'row', gap: 10 },
  bsSecondaryBtn:          { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF1FB', borderWidth: 1, borderColor: '#E1E5F2', paddingHorizontal: 12 },
  bsSecondaryBtnText:      { color: '#121422', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  bsPrimaryBtn:            { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6C5CFF', paddingHorizontal: 12 },
  bsPrimaryBtnText:        { color: '#FFFFFF', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  settingsBackdrop:        { flex: 1, backgroundColor: 'rgba(12, 13, 29, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  settingsPanel:           { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 340, gap: 16 },
  settingsTitle:           { color: '#121422', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  settingRow:              { gap: 8 },
  settingLabel:            { color: '#657084', fontSize: 13, fontWeight: '700' },
  settingOptions:          { flexDirection: 'row', gap: 8 },
  settingChip:             { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: '#F6F7FC' },
  settingChipActive:       { backgroundColor: '#6C5CFF' },
  settingChipText:         { color: '#657084', fontSize: 12, fontWeight: '700' },
  settingChipTextActive:   { color: '#FFFFFF' },
});
