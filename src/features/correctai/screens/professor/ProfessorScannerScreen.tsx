import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppScreen, ScannedCopy } from '@/features/correctai/types';
import { OCR_SERVICE_URL } from '@/constants/api';

type CornerPoint = { x: number; y: number };

type DetectedAnswer = {
  question: number;
  answer: string | null;
  confidence: number;
};

type ScannerProps = {
  activeTab?: string;
  onNavigate?: (screen: AppScreen) => void;
  onRegisterAnswerKeyScan?: () => void;
  onRegisterExamScan?: (draft?: {
    studentName?: string;
    matricule?: string;
    calculatedScore?: string;
    aiConfidence?: number;
    detectedAnswers?: string[];
    detectedAnswersCount?: number;
    imageUri?: string;
    metadata?: { source?: 'scanner'; processedAt?: string };
  }) => {
    id: string;
    studentName: string;
    matricule: string;
    calculatedScore?: string;
    imageUri?: string;
  } | null;
  scannerMode?: 'copies' | 'key';
  selectedExam?: { questions?: number } | null;
};

const STABILITY_FRAMES = 3;
const DETECTION_INTERVAL_MS = 1200;
const SMALL_PICTURE_QUALITY = 0.3;
const MIN_CAPTURE_INTERVAL_MS = 3000;

async function uriToBlob(uri: string, mimeType: string = 'image/jpeg'): Promise<Blob> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

function averageCorners(a: CornerPoint[], b: CornerPoint[]): boolean {
  if (a.length !== 4 || b.length !== 4) return false;
  const threshold = 30;
  for (let i = 0; i < 4; i++) {
    const dx = Math.abs(a[i].x - b[i].x);
    const dy = Math.abs(a[i].y - b[i].y);
    if (dx > threshold || dy > threshold) return false;
  }
  return true;
}

export function ProfessorScannerScreen(props: ScannerProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [isAligned, setIsAligned] = useState(false);
  const [isStable, setIsStable] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [detectedCorners, setDetectedCorners] = useState<CornerPoint[]>([]);
  const [previousCorners, setPreviousCorners] = useState<CornerPoint[]>([]);
  const [stabilityCount, setStabilityCount] = useState(0);
  const [detectionMessage, setDetectionMessage] = useState('');
  const [cameraDimensions, setCameraDimensions] = useState({ width: 0, height: 0 });

  const [scanResultVisible, setScanResultVisible] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [parsedAnswers, setParsedAnswers] = useState<DetectedAnswer[]>([]);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [capturedCopy, setCapturedCopy] = useState<ScannedCopy | null>(null);

  const autoCaptureDone = useRef(false);
  const isCapturingRef = useRef(false);
  const scanResultVisibleRef = useRef(false);
  const lastCaptureTime = useRef(0);

  const questionCount = props.selectedExam?.questions ?? 20;
  const isKeyMode = props.scannerMode === 'key';
  const canCapture = isAligned && isStable && !isCapturing;

  isCapturingRef.current = isCapturing;
  scanResultVisibleRef.current = scanResultVisible;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission?.granted, requestPermission]);

  useEffect(() => {
    setIsAligned(false);
    setIsStable(false);
    setCameraReady(false);
    setIsCapturing(false);
    setDetectedCorners([]);
    setPreviousCorners([]);
    setStabilityCount(0);
    setDetectionMessage('');
    setScanResultVisible(false);
    setCapturedImageUri(null);
    setParsedAnswers([]);
    setAiConfidence(0);
    setCapturedCopy(null);
  }, [isKeyMode, props.selectedExam?.questions]);

  const runDetection = useCallback(async () => {
    if (!cameraReady || !permission?.granted || isCapturingRef.current || scanResultVisibleRef.current) return;

    const camera = cameraRef.current;
    if (!camera) return;

    try {
      const image = await camera.takePictureAsync({
        quality: SMALL_PICTURE_QUALITY,
        skipProcessing: true,
      });

      if (!image?.uri) return;

      const filename = image.uri.split('/').pop() ?? 'frame.jpg';
      let fileBlob: Blob;
      try {
        fileBlob = await uriToBlob(image.uri);
      } catch {
        return;
      }

      const formData = new FormData();
      formData.append('file', fileBlob, filename);

      const response = await fetch(`${OCR_SERVICE_URL}/detect-corners`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) return;

      const data = await response.json();

      if (data.detected && data.corners?.length === 4) {
        const newCorners: CornerPoint[] = data.corners;
        setDetectedCorners(newCorners);
        setDetectionMessage(data.message);

        if (previousCorners.length === 4 && averageCorners(previousCorners, newCorners)) {
          const nextCount = stabilityCount + 1;
          setStabilityCount(nextCount);
          if (nextCount >= STABILITY_FRAMES) {
            setIsAligned(true);
            setIsStable(true);
          }
        } else {
          setStabilityCount(1);
          setIsAligned(true);
          setIsStable(false);
        }
        setPreviousCorners(newCorners);
      } else {
        setDetectedCorners([]);
        setPreviousCorners([]);
        setStabilityCount(0);
        setIsAligned(false);
        setIsStable(false);
        setDetectionMessage(data.message ?? '');
      }
    } catch {
      setDetectedCorners([]);
      setIsAligned(false);
      setIsStable(false);
    }
  }, [cameraReady, permission?.granted, previousCorners, stabilityCount]);

  useEffect(() => {
    if (!permission?.granted || !cameraReady || scanResultVisibleRef.current) {
      setIsAligned(false);
      setIsStable(false);
      return;
    }

    const interval = setInterval(runDetection, DETECTION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [cameraReady, permission?.granted, runDetection]);

  const doCapture = useCallback(async () => {
    if (!canCapture || autoCaptureDone.current || scanResultVisible) return;

    const now = Date.now();
    if (now - lastCaptureTime.current < MIN_CAPTURE_INTERVAL_MS) return;
    lastCaptureTime.current = now;

    const camera = cameraRef.current;
    if (!camera) return;

    autoCaptureDone.current = true;
    setIsCapturing(true);

    try {
      const image = await camera.takePictureAsync({ quality: 0.9, skipProcessing: true });

      let answers: string[] = [];
      let conf = 0;

      if (image?.uri && detectedCorners.length === 4) {
        try {
          const filename = image.uri.split('/').pop() ?? 'capture.jpg';
          let fileBlob: Blob;
          try {
            fileBlob = await uriToBlob(image.uri);
          } catch {
            return;
          }

          const formData = new FormData();
          formData.append('file', fileBlob, filename);
          formData.append('corners_json', JSON.stringify(detectedCorners));
          formData.append('questions', String(questionCount));

          const res = await fetch(`${OCR_SERVICE_URL}/detect-bubbles`, {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.answers?.length) {
              answers = data.answers.map((a: any) => a.answer ?? '');
              conf = Math.round(
                data.answers.reduce((s: number, a: any) => s + (a.confidence ?? 0), 0) /
                  data.answers.length * 100,
              );
            }
          }
        } catch {
          // OMR service unavailable
        }
      }

      const createdCopy = props.onRegisterExamScan?.({
        studentName: 'À extraire plus tard',
        matricule: 'À extraire plus tard',
        calculatedScore: '--',
        aiConfidence: conf,
        detectedAnswers: answers,
        detectedAnswersCount: answers.length,
        imageUri: image?.uri,
        metadata: { source: 'scanner', processedAt: new Date().toISOString() },
      }) ?? null;

      if (!createdCopy) {
        Alert.alert('Scan impossible', "La copie n'a pas pu être enregistrée.");
        setIsAligned(false);
        setIsStable(false);
        autoCaptureDone.current = false;
        return;
      }

      setCapturedImageUri(image?.uri ?? null);
      setCapturedCopy(createdCopy as any);
      setAiConfidence(conf);
      setParsedAnswers(
        answers.map((answer, i) => ({
          question: i + 1,
          answer: answer || null,
          confidence: conf / 100,
        })),
      );
      setScanResultVisible(true);
      setIsAligned(false);
      setIsStable(false);
    } catch {
      Alert.alert('Scan impossible', "Nous n'avons pas pu capturer le document. Réessayez.");
      setIsAligned(false);
      setIsStable(false);
      autoCaptureDone.current = false;
    } finally {
      setIsCapturing(false);
    }
  }, [canCapture, permission, requestPermission, detectedCorners, questionCount, scanResultVisible, props.onRegisterExamScan]);

  useEffect(() => {
    if (canCapture && !autoCaptureDone.current && !scanResultVisible) {
      doCapture();
    }
  }, [canCapture, doCapture, scanResultVisible]);

  const onCameraLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setCameraDimensions({ width, height });
  }, []);

  const goBack = () => {
    props.onNavigate?.(isKeyMode ? 'professor-answer-key' : 'professor-exam-menu');
  };

  const closeBottomSheet = () => {
    setScanResultVisible(false);
    setDetectedCorners([]);
    setPreviousCorners([]);
    setStabilityCount(0);
    setIsAligned(false);
    setIsStable(false);
    setDetectionMessage('');
    autoCaptureDone.current = false;
    lastCaptureTime.current = 0;
  };

  const handleValidate = () => {
    setScanResultVisible(false);
    props.onNavigate?.('professor-copy-review');
  };

  const handleModify = () => {
    setScanResultVisible(false);
    props.onNavigate?.('professor-copy-revision');
  };

  const handleRetake = () => {
    closeBottomSheet();
  };

  const detectedCount = parsedAnswers.filter((a) => a.answer).length;
  const confidenceAvg =
    parsedAnswers.length > 0
      ? Math.round(parsedAnswers.reduce((s, a) => s + a.confidence, 0) / parsedAnswers.length * 100)
      : 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={goBack} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Scanner</Text>
        <View style={styles.headerIcon}>
          <Ionicons name="settings-outline" size={18} color="rgba(255,255,255,0.9)" />
        </View>
      </View>

      <View style={styles.content}>
        {permission?.granted ? (
          <View style={styles.scannerShell} onLayout={onCameraLayout}>
            <CameraView
              ref={cameraRef}
              facing="back"
              onCameraReady={() => setCameraReady(true)}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.scannerTint} pointerEvents="none" />

            <View style={styles.a4Frame} pointerEvents="none">
              <View style={[styles.corner, styles.cornerTopLeft, isAligned && isStable && styles.cornerReady]} />
              <View style={[styles.corner, styles.cornerTopRight, isAligned && isStable && styles.cornerReady]} />
              <View style={[styles.corner, styles.cornerBottomLeft, isAligned && isStable && styles.cornerReady]} />
              <View style={[styles.corner, styles.cornerBottomRight, isAligned && isStable && styles.cornerReady]} />
              <View style={[styles.frameOutline, isAligned && isStable && styles.frameOutlineReady]} />
            </View>

            {detectedCorners.length === 4 && cameraDimensions.width > 0 && (
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <CornerQuadrilateral
                  corners={detectedCorners}
                  isStable={isStable}
                />
                <CornerOverlay
                  corners={detectedCorners}
                  isStable={isStable}
                />
              </View>
            )}

            <View style={styles.guidanceWrap}>
              <Text style={styles.guidanceText}>
                Alignez la feuille de réponses dans le cadre
              </Text>
              {isAligned && isStable ? (
                <View style={styles.alignBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#4ADE80" />
                  <Text style={styles.alignBadgeText}>Document détecté</Text>
                </View>
              ) : detectionMessage ? (
                <Text style={styles.subText}>{detectionMessage}</Text>
              ) : null}
            </View>

            <View style={[styles.bottomDock, { paddingBottom: Math.max(insets.bottom, 14) }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !canCapture }}
                disabled={!canCapture}
                onPress={doCapture}
                style={({ pressed }) => [
                  styles.captureButton,
                  !canCapture && styles.captureButtonDisabled,
                  pressed && canCapture && styles.captureButtonPressed,
                ]}>
                {isCapturing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera-outline" size={24} color={canCapture ? '#FFFFFF' : 'rgba(255,255,255,0.45)'} />
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.permissionPanel}>
            <Ionicons name="camera-outline" size={32} color="#B7B8C9" />
            <Text style={styles.permissionText}>Autorisation caméra requise</Text>
          </View>
        )}
      </View>

      <Modal
        transparent
        animationType="slide"
        visible={scanResultVisible}
        onRequestClose={closeBottomSheet}
      >
        <View style={styles.bottomSheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeBottomSheet} />
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />

            <View style={styles.bottomSheetImage}>
              {capturedImageUri ? (
                <Text style={styles.bottomSheetImageText}>Scan terminé ✓</Text>
              ) : (
                <Text style={styles.bottomSheetImageText}>Scan terminé</Text>
              )}
            </View>

            <View style={styles.bottomSheetStats}>
              <View style={styles.bsStat}>
                <Text style={styles.bsStatValue}>{detectedCount}/{questionCount}</Text>
                <Text style={styles.bsStatLabel}>Détectées</Text>
              </View>
              <View style={styles.bsDivider} />
              <View style={styles.bsStat}>
                <Text style={styles.bsStatValue}>{confidenceAvg}%</Text>
                <Text style={styles.bsStatLabel}>Confiance</Text>
              </View>
              <View style={styles.bsDivider} />
              <View style={styles.bsStat}>
                <Text style={styles.bsStatValue}>{capturedCopy?.studentName ?? '---'}</Text>
                <Text style={styles.bsStatLabel}>Étudiant</Text>
              </View>
            </View>

            <View style={styles.bottomSheetAnswers}>
              <Text style={styles.bsSectionTitle}>Aperçu des réponses</Text>
              <View style={styles.bsAnswersList}>
                {parsedAnswers.slice(0, Math.min(parsedAnswers.length, 5)).map((item) => {
                  const pct = Math.round(item.confidence * 100);
                  const color = pct >= 80 ? '#00B884' : pct >= 50 ? '#F2A000' : '#F04452';
                  return (
                    <View key={item.question} style={styles.bsAnswerRow}>
                      <Text style={styles.bsQNum}>Q{item.question}</Text>
                      <Text style={[styles.bsAnswer, item.answer ? { color } : { color: '#B7B8C9' }]}>
                        {item.answer ?? '---'}
                      </Text>
                      {item.answer && (
                        <View style={[styles.bsConfBadge, { backgroundColor: color + '20' }]}>
                          <Text style={[styles.bsConfText, { color }]}>{pct}%</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
                {parsedAnswers.length > 5 && (
                  <Text style={styles.bsMoreText}>+{parsedAnswers.length - 5} autres questions</Text>
                )}
              </View>
            </View>

            <View style={styles.bottomSheetActions}>
              <Pressable style={styles.bsSecondaryBtn} onPress={handleModify}>
                <Ionicons name="create-outline" size={18} color="#121422" />
                <Text style={styles.bsSecondaryBtnText}>Modifier</Text>
              </Pressable>
              <Pressable style={styles.bsPrimaryBtn} onPress={handleValidate}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.bsPrimaryBtnText}>Valider</Text>
              </Pressable>
            </View>

            <Pressable style={styles.retakeBtn} onPress={handleRetake}>
              <Text style={styles.retakeBtnText}>Refaire le scan</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function CornerQuadrilateral({
  corners,
  isStable,
}: {
  corners: CornerPoint[];
  isStable: boolean;
}) {
  const color = isStable ? 'rgba(74, 222, 128, 0.3)' : 'rgba(108, 92, 255, 0.25)';
  const borderColor = isStable ? '#4ADE80' : '#6C5CFF';

  const top = Math.min(...corners.map((c) => c.y));
  const left = Math.min(...corners.map((c) => c.x));
  const right = Math.max(...corners.map((c) => c.x));
  const bottom = Math.max(...corners.map((c) => c.y));

  const width = right - left;
  const height = bottom - top;

  return (
    <View style={StyleSheet.absoluteFill}>
      {corners.map((corner, i) => {
        const next = corners[(i + 1) % 4];
        const dx = next.x - corner.x;
        const dy = next.y - corner.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        return (
          <View
            key={`line-${i}`}
            style={[
              styles.quadLine,
              {
                left: corner.x,
                top: corner.y,
                width: len,
                transform: [{ rotate: `${angle}deg` }],
                backgroundColor: borderColor,
              },
            ]}
          />
        );
      })}
      <View
        style={[
          styles.quadFill,
          {
            left,
            top,
            width,
            height,
            backgroundColor: color,
            borderColor: borderColor,
          },
        ]}
      />
    </View>
  );
}

function CornerOverlay({
  corners,
  isStable,
}: {
  corners: CornerPoint[];
  isStable: boolean;
}) {
  const color = isStable ? '#4ADE80' : '#6C5CFF';

  return (
    <View style={StyleSheet.absoluteFill}>
      {corners.map((corner, index) => (
        <View
          key={`dot-${index}`}
          style={[
            styles.overlayDot,
            {
              left: corner.x - 8,
              top: corner.y - 8,
              backgroundColor: color,
              borderColor: '#FFFFFF',
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#10111A',
  },
  header: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6C5CFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  headerIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
    paddingTop: 6,
    paddingHorizontal: 14,
  },
  scannerShell: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1B1831',
    position: 'relative',
  },
  scannerTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 8, 18, 0.15)',
  },
  a4Frame: {
    position: 'absolute',
    top: 32,
    left: 20,
    right: 20,
    bottom: 148,
    aspectRatio: 210 / 297,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameOutline: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'transparent',
  },
  frameOutlineReady: {
    borderColor: 'rgba(74, 222, 128, 0.35)',
  },
  corner: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  cornerReady: {
    borderColor: '#4ADE80',
    shadowColor: '#4ADE80',
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
  cornerTopLeft: {
    top: -3,
    left: -3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 18,
  },
  cornerTopRight: {
    top: -3,
    right: -3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 18,
  },
  cornerBottomLeft: {
    bottom: -3,
    left: -3,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 18,
  },
  cornerBottomRight: {
    bottom: -3,
    right: -3,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 18,
  },
  guidanceWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 108,
    alignItems: 'center',
    gap: 6,
  },
  guidanceText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  subText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  alignBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  alignBadgeText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CFF',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#6C5CFF',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  captureButtonDisabled: {
    backgroundColor: '#3F4154',
    shadowOpacity: 0,
    elevation: 0,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  captureButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  overlayDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  quadFill: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 4,
  },
  quadLine: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
  },
  permissionPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  permissionText: {
    color: '#D8DAEA',
    fontSize: 14,
    fontWeight: '700',
  },

  // Bottom sheet
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 13, 29, 0.55)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 34,
    gap: 12,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D8DAEA',
    alignSelf: 'center',
    marginBottom: 4,
  },
  bottomSheetImage: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetImageText: {
    color: '#00B884',
    fontSize: 18,
    fontWeight: '800',
  },
  bottomSheetStats: {
    flexDirection: 'row',
    backgroundColor: '#F6F7FC',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  bsStat: {
    flex: 1,
    alignItems: 'center',
  },
  bsStatValue: {
    color: '#121422',
    fontSize: 15,
    fontWeight: '800',
  },
  bsStatLabel: {
    color: '#657084',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  bsDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E8ECF0',
  },
  bottomSheetAnswers: {
    gap: 8,
  },
  bsSectionTitle: {
    color: '#121422',
    fontSize: 14,
    fontWeight: '800',
  },
  bsAnswersList: {
    gap: 4,
  },
  bsAnswerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F7FC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  bsQNum: {
    width: 28,
    color: '#657084',
    fontSize: 12,
    fontWeight: '700',
  },
  bsAnswer: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  bsConfBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bsConfText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bsMoreText: {
    color: '#657084',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  bottomSheetActions: {
    flexDirection: 'row',
    gap: 10,
  },
  bsSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF1FB',
    gap: 6,
  },
  bsSecondaryBtnText: {
    color: '#121422',
    fontSize: 13,
    fontWeight: '800',
  },
  bsPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CFF',
    gap: 6,
  },
  bsPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  retakeBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  retakeBtnText: {
    color: '#6C5CFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
