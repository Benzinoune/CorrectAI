# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Project Context

## Goal
- Refactor CorrectAI project so every screen has its own dedicated file ("one page = one file"), fix scanner auto-capture loop, and delete dead code.

## Constraints & Preferences
- Do not change UI, backend logic, or application behavior.
- Only improve architecture, file organization, and maintainability.
- Verify navigation still works, route names unchanged, imports updated, TypeScript no errors.
- Do not delete anything until verified safe.

## Progress

### Done
- **Scanner fix**: removed `autoCaptureDone.current = false` from init effect (`useEffect` on `[isKeyMode, props.selectedExam?.questions]`) and from error paths (`doCapture` catch/`!createdCopy`). Only `closeBottomSheet` resets it now. Removed duplicate `setDetectedCorners([])` in init effect.
- **Super admin extraction (11 screens)** fully completed:
  - `screens/super-admin/shared.ts` with types, helpers, sub-components, styles.
  - 11 individual files: `SuperAdminHomeScreen`, `SuperAdminEstablishmentsScreen`, `SuperAdminEstablishmentDetailScreen`, `SuperAdminNewEstablishmentScreen`, `SuperAdminEstablishmentSettingsScreen`, `SuperAdminAdminsScreen`, `SuperAdminAdminDetailScreen`, `SuperAdminNewAdminScreen`, `SuperAdminProfessorsScreen`, `SuperAdminProfessorDetailScreen`, `SuperAdminNewProfessorScreen`.
  - Updated `screens/super-admin/index.ts` barrel file.
- **Student extraction (5 screens)** fully completed:
  - `screens/student/shared.ts` with types, helpers, styles.
  - 5 individual files: `StudentHomeScreen`, `StudentExamsScreen`, `StudentExamResultScreen`, `StudentReportScreen`, `StudentProfileScreen`.
- **Professor extraction: 4 screens fully extracted**, 16 screens remain in the monolithic `ProfessorScreens.tsx` (8660 lines).

### Professor Screens — Extraction Status
**Fully extracted (have own implementation):**
| File | Lines | Notes |
|------|-------|-------|
| ProfessorHomeScreen.tsx | 254 | Real component |
| ProfessorScannerScreen.tsx | 943 | Real component, different props |
| ProfessorScanResultScreen.tsx | 345 | Real component, different props |
| ProfessorCopyRevisionScreen.tsx | 663 | Real component |

**Stub files (re-export from ProfessorScreens.tsx — need extraction):**
| File | Line in ProfessorScreens.tsx |
|------|------------------------------|
| ProfessorStudentsScreen.tsx | line 771 |
| ProfessorStudentDetailScreen.tsx | line 873 |
| ProfessorStudentEditScreen.tsx | line 941 |
| ProfessorAddStudentScreen.tsx | line 1125 |
| ProfessorClassesScreen.tsx | line 1318 |
| ProfessorClassDetailScreen.tsx | line 1702 |
| ProfessorExamsScreen.tsx | line 1970 |
| ProfessorNewExamScreen.tsx | line 2269 |
| ProfessorExamMenuScreen.tsx | line 2459 |
| ProfessorAnswerSheetScreen.tsx | line 2973 |
| ProfessorCopyDetailScreen.tsx | line 4441 (barrel directly re-exports) |
| ProfessorReviewCopiesScreen.tsx | line 4937 (barrel directly re-exports) |
| ProfessorCopyReviewScreen.tsx | line 5251 (barrel directly re-exports) |
| ProfessorAnswerKeyScreen.tsx | line 5358 |
| ProfessorAnswerDetailScreen.tsx | line 5449 |
| ProfessorAccountScreen.tsx | line 5550 |

**Dead code in ProfessorScreens.tsx:**
- Duplicate `ProfessorScannerScreen` copy: lines 3862-4440 (replaced by individual ProfessorScannerScreen.tsx)

### Currently In Progress
- Extracting 16 remaining professor screens from `ProfessorScreens.tsx` into individual `professor/*.tsx` files.

### Blocked
- None.

## Key Decisions
- Keep `ProfessorScreens.tsx` intact during transition; stub files re-export from it.
- For screens being extracted: create individual file with own styles, import helpers from `shared.ts`.
- After all extractions verified, delete `ProfessorScreens.tsx`, `StudentScreens.tsx`, `SuperAdminScreens.tsx`, `AuthScreens.tsx`, `AdminScreens.tsx`.

## Architecture

### Imports flow
- `CorrectAiApp.tsx` → barrel (`professor/index.ts`) → individual files (or → `ProfessorScreens.tsx` for stubs).

### Professor screens shared resources
- `professor/shared.ts`: `ProfessorScreenProps` type, 40+ helper functions (`examTone`, `normalizeSearch`, `tabPress`, `resolveQuestionBank`, `buildCopyCorrectionSummary`, etc.), constants (`answerSheetChoices`, `answerSheetLayouts`, `responseSheetOptions`), and shared `styles`.
- Sub-components (StudentCard, MetricBox, QuickCard) are inlined in each screen that needs them.

## Remaining Work
1. Extract 16 professor screens from `ProfessorScreens.tsx`.
2. Update `professor/index.ts` barrel to remove direct references to `ProfessorScreens.tsx` (lines 13-15).
3. Delete duplicate `ProfessorScannerScreen` from `ProfessorScreens.tsx` (lines 3862-4440).
4. Delete dead files: `AuthScreens.tsx`, `AdminScreens.tsx`.
5. Delete monolithic files: `ProfessorScreens.tsx`, `StudentScreens.tsx`, `SuperAdminScreens.tsx` after verified.
6. Run `npx tsc --noEmit` to verify no TypeScript errors.

## Relevant Files
- `src/features/correctai/screens/ProfessorScreens.tsx`: 8660 lines, 18 exports (17 screens + 1 dead), 63 helpers, 2000+ lines of styles. Target of extraction.
- `src/features/correctai/screens/professor/shared.ts`: 575 lines — types, helpers, constants, shared styles.
- `src/features/correctai/screens/super-admin/shared.ts`: New — shared types, helpers, sub-components, styles.
- `src/features/correctai/screens/student/shared.ts`: New — shared types, helpers, styles.
- `src/features/correctai/screens/AuthScreens.tsx`: Dead (82 lines, no imports).
- `src/features/correctai/screens/AdminScreens.tsx`: Dead (293 lines, no imports).
