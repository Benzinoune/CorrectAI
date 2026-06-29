# Diagramme de Classes UML — CorrectAI

> Généré à partir des types TypeScript existants (`src/features/correctai/types.ts` et `ProfessorScreens.tsx`).
> Compatible Mermaid (GitHub, Mermaid Live Editor, Draw.io, Overleaf).

---

```mermaid
classDiagram
    %% ======================== ÉNUMÉRATIONS ========================

    class UserRole {
        <<enumeration>>
        + super_admin
        + admin
        + professor
        + student
    }

    class ExamStatus {
        <<enumeration>>
        + ACTIF
        + BROUILLON
        + EN COURS
        + A VENIR
        + TERMINE
    }

    class ProfessorStatus {
        <<enumeration>>
        + ACTIF
        + INACTIF
        + SUSPENDU
    }

    class AdminStatus {
        <<enumeration>>
        + ACTIF
        + INACTIF
        + SUSPENDU
    }

    class EstablishmentStatus {
        <<enumeration>>
        + ACTIF
        + INACTIF
        + SUSPENDU
    }

    class ScannedCopyReviewStatus {
        <<enumeration>>
        + PENDING
        + VALIDATED
        + CORRECTED
    }

    class ResponseSheetId {
        <<enumeration>>
        + 20
        + 50
        + 100
    }

    class Tone {
        <<enumeration>>
        + primary
        + success
        + warning
        + danger
        + neutral
        + info
    }

    class ScannedCopySource {
        <<enumeration>>
        + scanner
    }

    %% ======================== ENTITÉS PRINCIPALES ========================

    class Establishment {
        + id: string
        + name: string
        + city: string
        + adminName: string
        + adminEmail: string
        + status: EstablishmentStatus
        + professorsCount: number
        + studentsCount: number
        + createdAt: string
        + stats: StatItem[]
    }

    class Admin {
        + id: string
        + initials: string
        + name: string
        + email: string
        + password: string
        + status: AdminStatus
        + establishment: string
        + establishmentId: string
        + createdAt: string
    }

    class Professor {
        + id: string
        + initials: string
        + name: string
        + email: string
        + password: string
        + status: ProfessorStatus
        + establishment: string
        + establishmentId: string
        + stats: StatItem[]
    }

    class Student {
        + id: string
        + initials: string
        + firstName: string
        + lastName: string
        + matricule: string
        + email: string
        + password: string
        + externalRef: string
        + correctAiId: string
        + establishmentId: string
        + classes: string[]
    }

    class ClassRoom {
        + id: string
        + name: string
        + students: number
        + exams: number
        + establishmentId: string
    }

    class Exam {
        + id: string
        + name: string
        + subject: string
        + className: string
        + classIds: string[]
        + date: string
        + copies: number
        + status: ExamStatus
        + questions: number
        + establishmentId: string
        + responseSheetId: ResponseSheetId
        + questionBank: ExamQuestion[]
        + scannedCopies: ScannedCopy[]
    }

    class ExamQuestion {
        + number: number
        + correctAnswers: string[]
        + detectedAnswers: string[]
        + points: number
    }

    class ScannedCopy {
        + id: string
        + examId: string
        + examName: string
        + studentName: string
        + matricule: string
        + className: string
        + scannedAt: string
        + establishmentId: string
        + imageUri: string
        + aiConfidence: number
        + reviewStatus: ScannedCopyReviewStatus
        + detectedAnswers: string[]
        + detectedAnswersCount: number
        + calculatedScore: string
        + metadata: ScannedCopyMetadata
    }

    class ScannedCopyMetadata {
        + source: ScannedCopySource
        + processedAt: string
        + reviewedAt: string
    }

    class ScannedCopyDraft {
        + studentName: string
        + matricule: string
        + className: string
        + aiConfidence: number
        + detectedAnswers: string[]
        + detectedAnswersCount: number
        + calculatedScore: string
        + imageUri: string
        + metadata: ScannedCopyMetadata
    }

    class CopyCorrectionRow {
        + number: number
        + correctAnswer: string
        + studentAnswer: string
        + pointsEarned: number
        + points: number
    }

    class CopyCorrectionSummary {
        + rows: CopyCorrectionRow[]
        + totalPoints: number
        + maxPoints: number
        + percentage: number
        + reviewedAt: string
    }

    class StudentExam {
        + id: string
        + title: string
        + date: string
        + score: string
        + status: ExamStatus
        + tone: Tone
    }

    class ExamClassScore {
        + examId: string
        + examName: string
        + className: string
        + averageScore: number
    }

    class ReportRow {
        + subject: string
        + score: string
        + mention: string
    }

    class StatItem {
        + label: string
        + value: string
        + tone: Tone
    }

    class NavItem {
        + id: TabId
        + label: string
        + screen: AppScreen
    }

    class AdminCreateInput {
        + firstName: string
        + lastName: string
        + email: string
        + password: string
        + establishment: string
        + establishmentId: string
    }

    class ProfessorCreateInput {
        + firstName: string
        + lastName: string
        + email: string
        + password: string
        + establishment: string
        + establishmentId: string
    }

    class StudentCreateInput {
        + firstName: string
        + lastName: string
        + matricule: string
        + email: string
        + password: string
        + classes: string[]
    }

    class ExamFormErrors {
        + name: string
        + subject: string
        + classes: string
    }

    %% ======================== RELATIONS ========================

    Establishment "1" --> "*" Admin : contient
    Establishment "1" --> "*" Professor : emploie
    Establishment "1" --> "*" ClassRoom : organise
    Establishment "1" --> "*" Student : inscrit
    Establishment "1" --> "*" Exam : référence

    Admin "*" --> "1" Establishment : gère
    Admin --> AdminStatus

    Professor "*" --> "1" Establishment : appartient
    Professor --> ProfessorStatus
    Professor "1" --> "*" Exam : crée
    Professor "1" --> "*" ClassRoom : enseigne

    ClassRoom "*" --> "1" Establishment : dépend
    ClassRoom "1" --> "*" Student : contient (logique)
    ClassRoom "1" --> "*" Exam : programme

    Student "*" --> "1" Establishment : appartient
    Student "*" --> "1" ClassRoom : suit (via classes[])
    Student --> UserRole

    Exam "*" --> "1" Establishment : appartient
    Exam "*" --> "1" Professor : créé par
    Exam "1" --> "1" ResponseSheetId : format
    Exam --> ExamStatus
    Exam "1" --> "1..*" ExamQuestion : contient
    Exam "1" --> "*" ScannedCopy : possède

    ExamQuestion "1..*" --> "1" Exam : appartient à

    ScannedCopy "*" --> "1" Exam : associée à
    ScannedCopy --> ScannedCopyReviewStatus
    ScannedCopy "1" --> "1" ScannedCopyMetadata : a
    ScannedCopyDraft ..> ScannedCopy : basé sur

    CopyCorrectionSummary "1" --> "*" CopyCorrectionRow : contient
    CopyCorrectionSummary ..> ExamQuestion : dérivé de
    CopyCorrectionSummary ..> ScannedCopy : calculé pour

    Student '*' --> '*' StudentExam : possède
    StudentExam --> ExamStatus
    StudentExam --> Tone

    StatItem --> Tone

    AdminCreateInput ..> Admin : input pour
    ProfessorCreateInput ..> Professor : input pour
    StudentCreateInput ..> Student : input pour
```

---

## Liste de tous les types avec attributs

| Type | Attributs |
|------|-----------|
| `Establishment` | id, name, city, adminName, adminEmail, status, professorsCount, studentsCount, createdAt, stats |
| `Admin` | id, initials, name, email, password, status, establishment, establishmentId, createdAt |
| `Professor` | id, initials, name, email, password, status, establishment, establishmentId, stats |
| `Student` | id, initials, firstName, lastName, matricule, email, password, externalRef, correctAiId, establishmentId, classes |
| `ClassRoom` | id, name, students (count), exams (count), establishmentId |
| `Exam` | id, name, subject, className, classIds, date, copies, status, questions, establishmentId, responseSheetId, questionBank, scannedCopies |
| `ExamQuestion` | number, correctAnswers[], detectedAnswers[], points |
| `ScannedCopy` | id, examId, examName, studentName, matricule, className, scannedAt, establishmentId, imageUri, aiConfidence, reviewStatus, detectedAnswers[], detectedAnswersCount, calculatedScore, metadata |
| `ScannedCopyMetadata` | source ('scanner'), processedAt, reviewedAt |
| `ScannedCopyDraft` | Partial de ScannedCopy (studentName, matricule, className, aiConfidence, detectedAnswers, detectedAnswersCount, calculatedScore, imageUri) + metadata partiel |
| `StudentExam` | id, title, date, score, status, tone |
| `ExamClassScore` | examId, examName, className, averageScore |
| `ReportRow` | subject, score, mention |
| `StatItem` | label, value, tone |
| `NavItem` | id (TabId), label, screen (AppScreen) |
| `CopyCorrectionRow` | number, correctAnswer, studentAnswer, pointsEarned, points |
| `CopyCorrectionSummary` | rows[], totalPoints, maxPoints, percentage, reviewedAt |
| `AdminCreateInput` | firstName, lastName, email, password, establishment, establishmentId |
| `ProfessorCreateInput` | firstName, lastName, email, password, establishment, establishmentId |
| `StudentCreateInput` | firstName, lastName, matricule, email, password, classes[] |
| `ExamFormErrors` | name?, subject?, classes? |

**Énumérations :** UserRole, ExamStatus, ProfessorStatus, AdminStatus, EstablishmentStatus, ScannedCopyReviewStatus, ResponseSheetId, Tone, ScannedCopySource

---

## Relations clés

| Relation | Cardinalité | Description |
|----------|------------|-------------|
| Establishment → Admin | 1 → * | Un établissement contient plusieurs admins |
| Establishment → Professor | 1 → * | Un établissement emploie plusieurs professeurs |
| Establishment → ClassRoom | 1 → * | Un établissement organise plusieurs classes |
| Professor → Exam | 1 → * | Un professeur crée plusieurs examens |
| ClassRoom → Student | 1 → * | Une classe regroupe plusieurs étudiants |
| Exam → ExamQuestion | 1 → 1..* | Un examen contient au moins une question |
| Exam → ScannedCopy | 1 → * | Un examen possède plusieurs copies scannées |
| ScannedCopy → ScannedCopyMetadata | 1 → 1 | Chaque copie a des métadonnées |
| CopyCorrectionSummary → CopyCorrectionRow | 1 → * | Un summary contient plusieurs lignes de correction |
