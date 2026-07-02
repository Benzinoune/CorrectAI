export type UserRole = 'super_admin' | 'admin' | 'professor' | 'student';

export type ExamStatus = 'ACTIF' | 'BROUILLON' | 'EN COURS' | 'A VENIR' | 'TERMINE';

export type ProfessorStatus = 'ACTIF' | 'INACTIF' | 'SUSPENDU';

export type AdminStatus = 'ACTIF' | 'INACTIF' | 'SUSPENDU';

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export type ResponseSheetId = '20' | '50' | '100';

export type ScannedCopyReviewStatus = 'PENDING' | 'DETECTED' | 'VALIDATED' | 'CORRECTED';

export type OCRExtractionResult = {
  extracted: boolean;
  name: string | null;
  matricule: string | null;
  className: string | null;
  confidence: number;
  missingFields: string[];
};

export type OMRDetectionAnswer = {
  question: number;
  answer: string | null;
  confidence: number;
};

export type OMRDetectionResult = {
  detected: boolean;
  answers: OMRDetectionAnswer[];
};

export type TabId =
  | 'home'
  | 'establishments'
  | 'professors'
  | 'classes'
  | 'exams'
  | 'students'
  | 'stats'
  | 'report'
  | 'profile';

export type AppScreen =
  | 'splash'
  | 'login'
  | 'forgot-password'
  | 'signup'
  | 'super-admin-home'
  | 'super-admin-establishments'
  | 'super-admin-establishment-detail'
  | 'super-admin-establishment-settings'
  | 'super-admin-new-establishment'
  | 'super-admin-admins'
  | 'super-admin-admin-detail'
  | 'super-admin-new-admin'
  | 'super-admin-professors'
  | 'super-admin-professor-detail'
  | 'super-admin-new-professor'
  | 'admin-home'
  | 'admin-professors'
  | 'admin-professor-detail'
  | 'admin-new-professor'
  | 'professor-home'
  | 'professor-students'
  | 'professor-student-detail'
  | 'professor-student-edit'
  | 'professor-add-student'
  | 'professor-classes'
  | 'professor-class-detail'
  | 'professor-exams'
  | 'professor-new-exam'
  | 'professor-exam-menu'
  | 'professor-answer-sheet'
  | 'professor-scanner'
  | 'professor-answer-key'
  | 'professor-review-copies'
  | 'professor-copy-detail'
  | 'professor-copy-review'
  | 'professor-answer-detail'
  | 'professor-copy-revision'
  | 'professor-scan-result'
  | 'professor-account'
  | 'student-home'
  | 'student-exams'
  | 'student-exam-result'
  | 'student-report'
  | 'student-profile';

export type StatItem = {
  label: string;
  value: string;
  tone?: Tone;
};

export type EstablishmentStatus = 'ACTIF' | 'INACTIF' | 'SUSPENDU';

export type Establishment = {
  id: string;
  name: string;
  city: string;
  adminName: string;
  adminEmail: string;
  status: EstablishmentStatus;
  professorsCount: number;
  studentsCount: number;
  createdAt: string;
  stats: StatItem[];
};

export type Professor = {
  id: string;
  initials: string;
  name: string;
  email: string;
  password: string;
  status: ProfessorStatus;
  establishment: string;
  establishmentId: string;
  stats: StatItem[];
};

export type ProfessorCreateInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  establishment: string;
  establishmentId: string;
};

export type Student = {
  id: string;
  initials: string;
  firstName: string;
  lastName: string;
  matricule: string;
  email: string;
  password: string;
  externalRef: string;
  correctAiId: string;
  establishmentId: string;
  classes: string[];
};

export type StudentCreateInput = {
  firstName: string;
  lastName: string;
  matricule: string;
  email: string;
  password: string;
  classes: string[];
};

export type Admin = {
  id: string;
  initials: string;
  name: string;
  email: string;
  password: string;
  status: AdminStatus;
  establishment: string;
  establishmentId: string;
  createdAt: string;
};

export type AdminCreateInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  establishment: string;
  establishmentId: string;
};

export type ClassRoom = {
  id: string;
  name: string;
  students: number;
  exams: number;
  establishmentId: string;
};

export type Exam = {
  id: string;
  name: string;
  subject: string;
  className: string;
  classIds?: string[];
  date: string;
  copies: number;
  status: ExamStatus;
  questions: number;
  establishmentId: string;
  responseSheetId?: ResponseSheetId;
  questionBank?: ExamQuestion[];
  scannedCopies?: ScannedCopy[];
};

export type ExamQuestion = {
  number: number;
  correctAnswers: string[];
  detectedAnswers?: string[];
  points: number;
};

export type ScannedCopy = {
  id: string;
  examId: string;
  examName: string;
  studentName: string;
  matricule: string;
  className: string;
  scannedAt: string;
  establishmentId: string;
  imageUri?: string;
  annotatedImageUri?: string;
  aiConfidence: number;
  reviewStatus: ScannedCopyReviewStatus;
  detectedAnswers: string[];
  detectedAnswersCount: number;
  calculatedScore?: string;
  ocrResult?: OCRExtractionResult;
  omrResult?: OMRDetectionResult;
  metadata?: {
    source: 'scanner';
    processedAt: string;
    reviewedAt?: string;
  };
};

export type ScannedCopyDraft = Partial<
  Pick<
    ScannedCopy,
    'studentName' | 'matricule' | 'className' | 'aiConfidence' | 'detectedAnswers' | 'detectedAnswersCount' | 'calculatedScore' | 'imageUri' | 'annotatedImageUri' | 'ocrResult' | 'omrResult'
  >
> & {
  metadata?: Partial<NonNullable<ScannedCopy['metadata']>>;
};

export type StudentExam = {
  id: string;
  title: string;
  date: string;
  score?: string;
  status?: ExamStatus;
  tone?: Tone;
};

export type ReportRow = {
  subject: string;
  score: string;
  mention: string;
};

export type ExamClassScore = {
  examId: string;
  examName: string;
  className: string;
  averageScore: number;
};

export type NavItem = {
  id: TabId;
  label: string;
  screen: AppScreen;
};
