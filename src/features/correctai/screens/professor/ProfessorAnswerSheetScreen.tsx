import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { File } from 'expo-file-system';

import { Card, Icon, Icons, ScreenFrame } from '@/features/correctai/components/ui';
import { classes, exams } from '@/features/correctai/data/mock-data';
import { correctAiTheme } from '@/features/correctai/theme';
import type { Exam } from '@/features/correctai/types';
import {
  answerSheetChoices,
  classNamesFromIds,
  formatAnswerSheetDate,
  getResponseSheetOptionFromQuestions,
  ProfessorScreenProps,
  scannedCopiesCount,
} from './shared';

const { colors, spacing, radius } = correctAiTheme;

type AnswerSheetLayout = {
  columns: number;
  columnGap: number;
  rowGap: number;
  questionHeaderWidth: number;
  questionHeaderFontSize: number;
  bubbleHeaderFontSize: number;
  questionNumberWidth: number;
  questionNumberFontSize: number;
  questionRowMinHeight: number;
  bubbleSize: number;
  bubbleBorderWidth: number;
  instructionText: string;
};

const answerSheetLayouts: Record<20 | 50 | 100, AnswerSheetLayout> = {
  20: {
    columns: 2,
    columnGap: spacing.sm,
    rowGap: 2,
    questionHeaderWidth: 16,
    questionHeaderFontSize: 9,
    bubbleHeaderFontSize: 8,
    questionNumberWidth: 16,
    questionNumberFontSize: 9,
    questionRowMinHeight: 15,
    bubbleSize: 9.5,
    bubbleBorderWidth: 1,
    instructionText: 'MARQUEZ VOTRE RÉPONSE DANS LA BULLE CORRECTE.',
  },
  50: {
    columns: 5,
    columnGap: 4,
    rowGap: 1,
    questionHeaderWidth: 12,
    questionHeaderFontSize: 7,
    bubbleHeaderFontSize: 6.5,
    questionNumberWidth: 12,
    questionNumberFontSize: 7,
    questionRowMinHeight: 11,
    bubbleSize: 6.8,
    bubbleBorderWidth: 0.9,
    instructionText: 'MARQUEZ ENTIÈREMENT LA BULLE DE VOTRE RÉPONSE.',
  },
  100: {
    columns: 4,
    columnGap: 3,
    rowGap: 0.5,
    questionHeaderWidth: 10,
    questionHeaderFontSize: 6.2,
    bubbleHeaderFontSize: 5.6,
    questionNumberWidth: 10,
    questionNumberFontSize: 6.2,
    questionRowMinHeight: 8.5,
    bubbleSize: 5.2,
    bubbleBorderWidth: 0.75,
    instructionText: 'MARQUEZ ENTIÈREMENT LA BULLE DE VOTRE RÉPONSE.',
  },
};

function getAnswerSheetLayout(questionCount: number) {
  if (questionCount >= 100) return answerSheetLayouts[100];
  if (questionCount >= 50) return answerSheetLayouts[50];
  return answerSheetLayouts[20];
}

function AnswerSheetColumn({
  count,
  start,
  layout,
}: {
  count: number;
  start: number;
  layout: AnswerSheetLayout;
}) {
  if (count <= 0) {
    return <View style={styles.answerSheetColumn} />;
  }

  return (
    <View style={styles.answerSheetColumn}>
      <View style={[styles.answerSheetColumnHeader, { gap: 2, paddingBottom: 1 }]}>
        <Text
          style={[
            styles.answerSheetQuestionHeader,
            {
              width: layout.questionHeaderWidth,
              fontSize: layout.questionHeaderFontSize,
            },
          ]}>
          N°
        </Text>
        {answerSheetChoices.map((choice) => (
          <Text
            key={choice}
            style={[
              styles.answerSheetBubbleHeader,
              {
                fontSize: layout.bubbleHeaderFontSize,
              },
            ]}>
            {choice}
          </Text>
        ))}
      </View>
      {Array.from({ length: count }, (_, index) => {
        const questionNumber = start + index;

        return (
          <View
            key={questionNumber}
            style={[
              styles.answerSheetQuestionRow,
              {
                minHeight: layout.questionRowMinHeight,
                gap: layout.rowGap,
              },
            ]}>
            <Text
              style={[
                styles.answerSheetQuestionNumber,
                {
                  width: layout.questionNumberWidth,
                  fontSize: layout.questionNumberFontSize,
                },
              ]}>
              {questionNumber}
            </Text>
            <View style={[styles.answerSheetBubbles, { gap: layout.rowGap }]}>
              {answerSheetChoices.map((choice) => (
                <View
                  key={choice}
                  style={[
                    styles.answerSheetBubble,
                    {
                      width: layout.bubbleSize,
                      height: layout.bubbleSize,
                      borderWidth: layout.bubbleBorderWidth,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function AnswerSheetFormField({
  label,
  value,
  style,
}: {
  label: string;
  value?: string;
  style?: any;
}) {
  return (
    <View style={[styles.answerSheetFormField, style]}>
      <Text style={styles.answerSheetFormLabel}>{label}</Text>
      <View style={styles.answerSheetFormValueLine}>
        {value ? (
          <Text ellipsizeMode="tail" numberOfLines={1} style={styles.answerSheetFormValue}>
            {value}
          </Text>
        ) : (
          <View style={styles.answerSheetFormBlank} />
        )}
      </View>
    </View>
  );
}

function buildAnswerSheetHtml({ exam, questionCount, classValue, dateValue }: { exam: Exam; questionCount: number; classValue: string; dateValue: string }) {
  const choices = ['A', 'B', 'C', 'D', 'E'];
  const layout = getAnswerSheetLayout(questionCount);
  const perColumn = Math.ceil(questionCount / layout.columns);
  const columns = Array.from({ length: layout.columns }, (_, ci) => {
    const start = ci * perColumn + 1;
    const count = Math.max(0, Math.min(perColumn, questionCount - ci * perColumn));
    return { start, count };
  });

  const columnsHtml = columns.map((col) => {
    const rows: string[] = [];
    rows.push(`<div class="qcol-header" style="gap:${layout.rowGap}px;padding-bottom:1px">
      <span class="qcol-header-num" style="width:${layout.questionHeaderWidth}px;font-size:${layout.questionHeaderFontSize}px">N°</span>
      ${choices.map((c) => `<span class="qcol-header-choice" style="font-size:${layout.bubbleHeaderFontSize}px">${c}</span>`).join('')}
    </div>`);
    for (let i = 0; i < col.count; i++) {
      const q = col.start + i;
      rows.push(`<div class="qcol-row" style="min-height:${layout.questionRowMinHeight}px;gap:${layout.rowGap}px">
        <span class="qcol-num" style="width:${layout.questionNumberWidth}px;font-size:${layout.questionNumberFontSize}px">${q}</span>
        <div class="qcol-bubbles" style="gap:${layout.rowGap}px">
          ${choices.map(() => `<span class="qcol-bubble" style="width:${layout.bubbleSize}px;height:${layout.bubbleSize}px;border-width:${layout.bubbleBorderWidth}px"></span>`).join('')}
        </div>
      </div>`);
    }
    return `<div class="qcol">${rows.join('')}</div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<style>
  @page { margin: 10mm; size: A4; }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #121422;
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }
  .sheet {
    width: 100%;
    max-width: 700px;
    border: 1.5px solid #121422;
    border-radius: 8px;
    padding: 14px;
    position: relative;
    background: #fff;
    box-shadow: 0 4px 20px rgba(31,36,64,0.08);
  }
  .corner { position: absolute; width: 14px; height: 14px; }
  .corner-tl { top: 6px; left: 6px; border-top: 3px solid #121422; border-left: 3px solid #121422; }
  .corner-tr { top: 6px; right: 6px; border-top: 3px solid #121422; border-right: 3px solid #121422; }
  .corner-bl { bottom: 6px; left: 6px; border-bottom: 3px solid #121422; border-left: 3px solid #121422; }
  .corner-br { bottom: 6px; right: 6px; border-bottom: 3px solid #121422; border-right: 3px solid #121422; }
  .header { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding-bottom: 6px; }
  .brand { display: flex; flex-direction: column; gap: 2px; }
  .brand-logo { width: 74px; height: 22px; }
  .brand-sub { color: #657084; font-size: 11px; font-weight: 600; }
  .title-block { text-align: right; }
  .title { color: #121422; font-size: 11px; font-weight: 900; line-height: 16px; margin: 0; }
  .subtitle { color: #657084; font-size: 10px; font-weight: 700; margin: 0; }
  .divider { height: 2px; background: #6C5CFF; border-radius: 999px; margin: 0; }
  .form { padding: 4px 0; display: flex; flex-direction: column; gap: 4px; }
  .form-row { display: flex; gap: 8px; }
  .form-field { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .form-label { color: #6C5CFF; font-size: 10px; font-weight: 800; letter-spacing: 0.2px; }
  .form-line { min-height: 16px; border-bottom: 1px solid #D2D7F4; display: flex; align-items: flex-end; }
  .form-value { color: #121422; font-size: 11px; font-weight: 700; line-height: 14px; padding-bottom: 2px; }
  .inst { text-align: center; padding: 1px 0; color: #6C5CFF; font-size: 9px; font-weight: 800; }
  .qcols { display: flex; flex-direction: row; gap: ${layout.columnGap}px; padding: 1px 0; flex: 1; }
  .qcol { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
  .qcol-header { display: flex; flex-direction: row; align-items: center; }
  .qcol-header-num { color: #657084; font-weight: 800; text-align: left; }
  .qcol-header-choice { flex: 1; color: #657084; font-weight: 800; text-align: center; }
  .qcol-row { display: flex; flex-direction: row; align-items: center; }
  .qcol-num { color: #121422; font-weight: 800; text-align: left; }
  .qcol-bubbles { flex: 1; display: flex; flex-direction: row; align-items: center; justify-content: space-between; }
  .qcol-bubble { display: inline-block; border: 1px solid #B6BCF5; border-radius: 50%; background: #fff; }
  .sig { padding-top: 2px; }
  .sig-label { color: #657084; font-size: 10px; font-weight: 800; }
  .sig-line { height: 14px; border-bottom: 1px solid #121422; margin-top: 2px; border-radius: 4px; }
  .footer { padding-top: 4px; display: flex; justify-content: space-between; }
  .footer-text { color: #657084; font-size: 9px; font-weight: 600; }
</style>
</head>
<body>
<div class="sheet">
  <div class="corner corner-tl"></div>
  <div class="corner corner-tr"></div>
  <div class="corner corner-bl"></div>
  <div class="corner corner-br"></div>

  <div class="header">
    <div class="brand">
      <svg class="brand-logo" viewBox="0 0 74 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="74" height="22" rx="4" fill="#6C5CFF"/>
        <text x="8" y="16" fill="#fff" font-size="12" font-weight="900" font-family="Arial">C</text>
        <text x="16" y="16" fill="#fff" font-size="12" font-weight="600" font-family="Arial">AI</text>
      </svg>
      <span class="brand-sub">Correction intelligente par IA</span>
    </div>
    <div class="title-block">
      <p class="title">FEUILLE DE REPONSES QCM</p>
      <p class="subtitle">${questionCount} Questions - Format A4</p>
    </div>
  </div>

  <div class="divider"></div>

  <div class="form">
    <div class="form-row">
      <div class="form-field">
        <span class="form-label">NOM COMPLET</span>
        <div class="form-line"></div>
      </div>
      <div class="form-field">
        <span class="form-label">CLASSE</span>
        <div class="form-line"><span class="form-value">${classValue}</span></div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-field">
        <span class="form-label">MATRICULE</span>
        <div class="form-line"></div>
      </div>
      <div class="form-field">
        <span class="form-label">DATE</span>
        <div class="form-line"><span class="form-value">${dateValue}</span></div>
      </div>
    </div>
  </div>

  <div class="inst">${layout.instructionText}</div>

  <div class="qcols">
    ${columnsHtml}
  </div>

  <div class="sig">
    <span class="sig-label">N° DE FEUILLE / SIGNATURE</span>
    <div class="sig-line"></div>
  </div>

  <div class="footer">
    <span class="footer-text">CorrectAI - Feuille de reponses</span>
    <span class="footer-text">1 / 1</span>
  </div>
</div>
</body>
</html>`;
}

function buildPdfImageHtml(dataUri: string) {
  return `<!DOCTYPE html>
<html style="margin:0;padding:0">
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #fff; }
  body { display: flex; align-items: center; justify-content: center; }
  img { display: block; max-width: 595px; max-height: 842px; object-fit: contain; }
</style>
</head>
<body>
  <img src="${dataUri}" />
</body>
</html>`;
}

export function ProfessorAnswerSheetScreen({ examsData, classesData, onNavigate, selectedExam }: ProfessorScreenProps) {
  const examList = examsData ?? exams;
  const exam = selectedExam ?? examList[0] ?? null;
  const [pdfDialogVisible, setPdfDialogVisible] = useState(false);
  const answerSheetRef = useRef<View>(null);

  if (!exam) {
    return (
      <ScreenFrame compactHeader onBack={() => onNavigate('professor-exam-menu')} title="Feuille de réponses">
        <Card icon={Icons.doc} style={styles.listCard} title="Aucun examen disponible">
          <Text style={styles.emptyText}>Ajoutez ou selectionnez un examen pour generer la feuille de réponses.</Text>
        </Card>
      </ScreenFrame>
    );
  }

  const responseSheet = getResponseSheetOptionFromQuestions(exam.questions);
  const questionCount = responseSheet.questions;
  const layout = getAnswerSheetLayout(questionCount);
  const isHundredQuestions = questionCount >= 100;
  const questionsPerColumn = Math.ceil(questionCount / layout.columns);
  const answerSheetColumns = Array.from({ length: layout.columns }, (_, columnIndex) => {
    const start = columnIndex * questionsPerColumn + 1;
    const count = Math.max(0, Math.min(questionsPerColumn, questionCount - columnIndex * questionsPerColumn));

    return {
      count,
      start,
    };
  });
  const sheetHeight = 476;
  const classList = classesData ?? classes;
  const classValue = exam.classIds?.length ? classNamesFromIds(exam.classIds, classList).join(', ') : exam.className;
  const dateValue = formatAnswerSheetDate(exam.date);
  const screenTitle = `Feuille ${questionCount} Questions`;
  const paperSubtitle = `${questionCount} Questions - Format A4`;

  const handlePrint = async () => {
    try {
      if (Platform.OS === 'web') {
        const html = buildAnswerSheetHtml({ exam, questionCount, classValue, dateValue });
        await Print.printAsync({ html });
        return;
      }
      const dataUri = await captureRef(answerSheetRef, {
        format: 'png',
        quality: 1,
        width: 1190,
        result: 'data-uri',
      });
      const imageHtml = buildPdfImageHtml(dataUri);
      await Print.printAsync({ html: imageHtml });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      Alert.alert('Impression', `Impossible de lancer l'impression pour le moment. ${message}`);
    }
  };

  const handlePdfDownload = async () => {
    setPdfDialogVisible(false);
    try {
      if (Platform.OS === 'web') {
        const html = buildAnswerSheetHtml({ exam, questionCount, classValue, dateValue });
        await Print.printAsync({ html });
        Alert.alert('PDF genere', 'Le PDF a ete genere avec succes.');
        return;
      }
      const dataUri = await captureRef(answerSheetRef, {
        format: 'png',
        quality: 1,
        width: 1190,
        result: 'data-uri',
      });
      const imageHtml = buildPdfImageHtml(dataUri);
      const result = await Print.printToFileAsync({ html: imageHtml, width: 595, height: 842 });
      if (!result.uri) {
        Alert.alert('Erreur', 'Impossible de generer le fichier PDF. Veuillez reessayer.');
        return;
      }
      const shareUri = (() => {
        try {
          const pdfFile = new File(result.uri);
          return pdfFile.contentUri || result.uri;
        } catch {
          return result.uri;
        }
      })();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Partager la feuille de reponse' });
        Alert.alert('Succes', 'Le PDF a ete genere et partage avec succes.');
        return;
      }
      await Print.printAsync({ html: imageHtml });
      Alert.alert('Succes', 'Le PDF a ete genere avec succes.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      Alert.alert('Erreur de generation', `Impossible de generer le PDF. ${message}`);
    }
  };

  return (
    <ScreenFrame compactHeader onBack={() => onNavigate('professor-exam-menu')} scrollable={false} title={screenTitle}>
      <View style={styles.answerSheetPage}>
        <View style={styles.answerSheetActionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={handlePrint}
            style={({ pressed }) => [styles.answerSheetActionButton, styles.answerSheetActionButtonOutline, pressed && styles.pressed]}>
            <Icon name={Icons.printer} color={colors.primary} size={16} />
            <Text style={styles.answerSheetActionLabel}>Imprimer</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPdfDialogVisible(true)}
            style={({ pressed }) => [styles.answerSheetActionButton, styles.answerSheetActionButtonSolid, pressed && styles.pressed]}>
            <Icon name={Icons.download} color={colors.card} size={16} />
            <Text style={styles.answerSheetActionLabelSolid}>PDF</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onNavigate('professor-scanner')}
            style={({ pressed }) => [styles.answerSheetActionButton, styles.answerSheetActionButtonOutline, pressed && styles.pressed]}>
            <Icon name={Icons.camera} color={colors.primary} size={16} />
            <Text style={styles.answerSheetActionLabel}>Scanner</Text>
          </Pressable>
        </View>

        <View style={styles.answerSheetMetaRow}>
          <View style={styles.answerSheetMetaItem}>
            <Icon name={Icons.copy} color={colors.primary} size={13} />
            <Text style={styles.answerSheetMetaText}>{`Copies : ${String(scannedCopiesCount(exam)).padStart(2, '0')}`}</Text>
          </View>
          <View style={styles.answerSheetMetaDivider} />
          <View style={styles.answerSheetMetaItem}>
            <Icon name={Icons.doc} color={colors.primary} size={13} />
            <Text style={styles.answerSheetMetaText}>Format : A4</Text>
          </View>
          <View style={styles.answerSheetMetaDivider} />
          <View style={styles.answerSheetMetaItem}>
            <Icon name={Icons.info} color={colors.primary} size={13} />
            <Text style={styles.answerSheetMetaText}>{`Questions : ${questionCount}`}</Text>
          </View>
          <View style={styles.answerSheetMetaDivider} />
          <View style={styles.answerSheetMetaItem}>
            <Icon name={Icons.info} color={colors.primary} size={13} />
            <Text style={styles.answerSheetMetaText}>Choix : A-E</Text>
          </View>
        </View>

        <View
          ref={answerSheetRef}
          style={[
            styles.answerSheetPaper,
            isHundredQuestions && {
              padding: 6,
              gap: 4,
            },
            { height: sheetHeight },
          ]}>
          <View style={styles.answerSheetCornerTopLeft} />
          <View style={styles.answerSheetCornerTopRight} />
          <View style={styles.answerSheetCornerBottomLeft} />
          <View style={styles.answerSheetCornerBottomRight} />
          <View
            style={[
              styles.answerSheetPaperHeader,
              isHundredQuestions && {
                gap: 6,
                paddingBottom: 2,
              },
            ]}>
            <View style={styles.answerSheetBrandBlock}>
              <Image
                source={require('../../../../../assets/images/correctai-splash-logo.png')}
                resizeMode="contain"
                style={[styles.answerSheetLogo, isHundredQuestions && { width: 68, height: 20 }]}
              />
              <Text style={styles.answerSheetBrandSubtitle}>Correction intelligente par IA</Text>
            </View>
            <View style={styles.answerSheetPaperTitleBlock}>
              <Text style={[styles.answerSheetPaperTitle, isHundredQuestions && { fontSize: 10, lineHeight: 14 }]}>
                FEUILLE DE RÉPONSES QCM
              </Text>
              <Text style={[styles.answerSheetPaperSubtitle, isHundredQuestions && { fontSize: 8.5 }]}>{paperSubtitle}</Text>
            </View>
          </View>

          <View style={styles.answerSheetPaperDivider} />

          <View style={[styles.answerSheetFormSection, isHundredQuestions && { gap: 2 }]}>
            <View style={[styles.answerSheetFormRow, isHundredQuestions && { gap: 6 }]}>
              <AnswerSheetFormField label="Nom complet" style={styles.answerSheetFormHalf} />
              <AnswerSheetFormField label="Classe" value={classValue} style={styles.answerSheetFormHalf} />
            </View>
            <View style={[styles.answerSheetFormRow, isHundredQuestions && { gap: 6 }]}>
              <AnswerSheetFormField label="Matricule" style={styles.answerSheetFormHalf} />
              <AnswerSheetFormField label="Date" value={dateValue} style={styles.answerSheetFormHalf} />
            </View>
          </View>

          <View style={[styles.answerSheetInstructions, isHundredQuestions && { paddingVertical: 0 }]}>
            <Text style={[styles.answerSheetInstructionsText, isHundredQuestions && { fontSize: 8.4 }]}>
              {layout.instructionText}
            </Text>
          </View>

          <View style={[styles.answerSheetColumns, { gap: layout.columnGap }, isHundredQuestions && { paddingVertical: 0 }]}>
            {answerSheetColumns.map((column) => (
              <AnswerSheetColumn
                key={column.start}
                count={column.count}
                layout={layout}
                start={column.start}
              />
            ))}
          </View>

          <View style={[styles.answerSheetSignatureRow, isHundredQuestions && { paddingTop: 0, gap: 1 }]}>
            <Text style={styles.answerSheetSignatureLabel}>N° DE FEUILLE / SIGNATURE</Text>
            <View style={styles.answerSheetSignatureLine} />
          </View>

          <View style={[styles.answerSheetPaperFooter, isHundredQuestions && { paddingTop: 0 }]}>
            <Text style={styles.answerSheetFooterBrand}>CorrectAI - Feuille de réponses</Text>
          </View>
        </View>

        <View style={styles.answerSheetBottomBar}>
          <Text style={styles.answerSheetBottomPage}>1 / 1</Text>
          <Text style={styles.answerSheetBottomText}>Prêt à imprimer</Text>
          <View style={styles.answerSheetStatusPill}>
            <Icon name={Icons.check} color={colors.success} size={18} />
          </View>
        </View>
      </View>

      <Modal animationType="fade" transparent visible={pdfDialogVisible} onRequestClose={() => setPdfDialogVisible(false)}>
        <Pressable style={styles.pdfDialogBackdrop} onPress={() => setPdfDialogVisible(false)}>
          <Pressable style={styles.pdfDialogCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.pdfDialogIconWrap}>
              <Icon name={Icons.download} color={colors.primary} size={28} />
            </View>
            <Text style={styles.pdfDialogTitle}>Telecharger la feuille de reponse</Text>
            <Text style={styles.pdfDialogDescription}>
              Voulez-vous generer et telecharger cette feuille de reponse au format PDF ?
            </Text>
            <View style={styles.pdfDialogActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPdfDialogVisible(false)}
                style={({ pressed }) => [styles.pdfDialogButton, styles.pdfDialogButtonCancel, pressed && styles.pressed]}>
                <Text style={styles.pdfDialogButtonCancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handlePdfDownload}
                style={({ pressed }) => [styles.pdfDialogButton, styles.pdfDialogButtonConfirm, pressed && styles.pressed]}>
                <Icon name={Icons.download} color={colors.card} size={16} />
                <Text style={styles.pdfDialogButtonConfirmText}>Telecharger</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  emptyText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  listCard: { gap: spacing.md },
  answerSheetPage: {
    gap: spacing.md,
    alignItems: 'stretch',
  },
  answerSheetActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  answerSheetActionButton: {
    minHeight: 38,
    borderRadius: radius.md,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  answerSheetActionButtonOutline: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  answerSheetActionButtonSolid: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  answerSheetActionLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  answerSheetActionLabelSolid: {
    color: colors.card,
    fontSize: 13,
    fontWeight: '800',
  },
  answerSheetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    flexWrap: 'wrap',
    rowGap: 4,
    columnGap: 8,
  },
  answerSheetMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  answerSheetMetaDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.border,
  },
  answerSheetMetaText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  answerSheetPaper: {
    width: '100%',
    maxWidth: 328,
    alignSelf: 'center',
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
    boxShadow: '0 10px 18px rgba(31, 36, 64, 0.12)',
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  answerSheetCornerTopLeft: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 14,
    height: 14,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.ink,
  },
  answerSheetCornerTopRight: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.ink,
  },
  answerSheetCornerBottomLeft: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 14,
    height: 14,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.ink,
  },
  answerSheetCornerBottomRight: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 14,
    height: 14,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.ink,
  },
  answerSheetPaperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  answerSheetBrandBlock: {
    gap: 2,
    alignItems: 'flex-start',
    flexShrink: 1,
  },
  answerSheetLogo: {
    width: 74,
    height: 22,
  },
  answerSheetBrandSubtitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  answerSheetPaperTitleBlock: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 1,
  },
  answerSheetPaperTitle: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'right',
    lineHeight: 16,
  },
  answerSheetPaperSubtitle: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  answerSheetPaperDivider: {
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  answerSheetFormSection: {
    gap: 4,
  },
  answerSheetFormRow: {
    flexDirection: 'row',
    gap: 8,
  },
  answerSheetFormHalf: {
    flex: 1,
  },
  answerSheetFormField: {
    flex: 1,
    gap: 2,
  },
  answerSheetFormLabel: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  answerSheetFormValueLine: {
    minHeight: 16,
    justifyContent: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#D2D7F4',
  },
  answerSheetFormValue: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    paddingBottom: 2,
  },
  answerSheetFormBlank: {
    minHeight: 14,
  },
  answerSheetInstructions: {
    alignItems: 'center',
    paddingVertical: 1,
  },
  answerSheetInstructionsText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  answerSheetColumns: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 1,
  },
  answerSheetColumn: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  answerSheetColumnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 1,
  },
  answerSheetQuestionHeader: {
    width: 18,
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'left',
  },
  answerSheetBubbleHeader: {
    flex: 1,
    color: colors.muted,
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  answerSheetQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 11,
  },
  answerSheetQuestionNumber: {
    width: 18,
    color: colors.ink,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'left',
  },
  answerSheetBubbles: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 1,
  },
  answerSheetBubble: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#B6BCF5',
    backgroundColor: colors.card,
  },
  answerSheetSignatureRow: {
    gap: 2,
    paddingTop: 1,
  },
  answerSheetSignatureLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  answerSheetSignatureLine: {
    height: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    backgroundColor: colors.screen,
  },
  answerSheetPaperFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: 2,
  },
  answerSheetFooterBrand: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  answerSheetBottomPage: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  answerSheetBottomText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  answerSheetBottomBar: {
    minHeight: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    boxShadow: '0 8px 14px rgba(31, 36, 64, 0.08)',
    elevation: 3,
  },
  answerSheetStatusPill: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfDialogBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(18, 22, 38, 0.52)',
  },
  pdfDialogCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    boxShadow: '0 12px 24px rgba(31, 36, 64, 0.16)',
    elevation: 10,
  },
  pdfDialogIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfDialogTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  pdfDialogDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  pdfDialogActions: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  pdfDialogButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pdfDialogButtonCancel: {
    backgroundColor: colors.neutralSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pdfDialogButtonConfirm: {
    backgroundColor: colors.primary,
  },
  pdfDialogButtonCancelText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  pdfDialogButtonConfirmText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '800',
  },
});
