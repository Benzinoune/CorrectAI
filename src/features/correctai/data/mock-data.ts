import type {
  Admin,
  ClassRoom,
  Establishment,
  Exam,
  ExamClassScore,
  NavItem,
  Professor,
  ReportRow,
  StatItem,
  Student,
  StudentExam,
} from '@/features/correctai/types';

export const professorStats: StatItem[] = [
  { label: 'Classes', value: '3', tone: 'primary' },
  { label: 'Exames', value: '12', tone: 'primary' },
  { label: 'Copies', value: '50', tone: 'primary' },
];

export const adminStats: StatItem[] = [
  { label: 'Professeurs', value: '24', tone: 'primary' },
  { label: 'Actifs', value: '20', tone: 'success' },
  { label: 'Suspendus', value: '4', tone: 'danger' },
];

export const superAdminUser = {
  id: 'super-admin-1',
  name: 'Super Admin',
  email: 'super@correctai.test',
  password: 'Super@123',
};

export const admins: Admin[] = [
  {
    id: 'admin-1',
    initials: 'KY',
    name: 'Karim Yelles',
    email: 'admin@ibnkhaldoun.dz',
    password: 'Admin@123',
    status: 'ACTIF',
    establishment: 'Lycee Ibn Khaldoun',
    establishmentId: 'est-1',
    createdAt: '2023-09-01T00:00:00Z',
  },
  {
    id: 'admin-2',
    initials: 'SC',
    name: 'Salima Chergui',
    email: 'admin@elfath.dz',
    password: 'Admin@123',
    status: 'ACTIF',
    establishment: 'CEM El Fath',
    establishmentId: 'est-2',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'admin-3',
    initials: 'NB',
    name: 'Nadir Bouziane',
    email: 'admin@didouche.dz',
    password: 'Admin@123',
    status: 'INACTIF',
    establishment: 'Lycee Didouche',
    establishmentId: 'est-3',
    createdAt: '2025-02-20T00:00:00Z',
  },
];

export const students: Student[] = [
  {
    id: '1',
    initials: 'AL',
    firstName: 'Aicha',
    lastName: 'Lolo',
    matricule: 'MAT:2025-001',
    email: 'aicha.lolo@correctai.test',
    password: 'Student@123',
    externalRef: 'K110',
    correctAiId: '1901',
    establishmentId: 'est-1',
    classes: ['Math', 'Francais'],
  },
  {
    id: '2',
    initials: 'IS',
    firstName: 'Ibtissam',
    lastName: 'Sa7out',
    matricule: 'K110',
    email: 'ibtissam.sa7out@correctai.test',
    password: 'Student@123',
    externalRef: 'K110',
    correctAiId: '1901',
    establishmentId: 'est-1',
    classes: ['Math', 'Francais'],
  },
  {
    id: '3',
    initials: 'YZ',
    firstName: 'Yanis',
    lastName: 'Ziani',
    matricule: 'MAT:2025-014',
    email: 'yanis.ziani@correctai.test',
    password: 'Student@123',
    externalRef: 'K114',
    correctAiId: '1944',
    establishmentId: 'est-2',
    classes: ['Informatique'],
  },
  {
    id: '4',
    initials: 'NB',
    firstName: 'Nadia',
    lastName: 'Belaid',
    matricule: 'MAT:2025-021',
    email: 'nadia.belaid@correctai.test',
    password: 'Student@123',
    externalRef: 'K121',
    correctAiId: '1951',
    establishmentId: 'est-2',
    classes: ['Gestion'],
  },
];

export const establishments: Establishment[] = [
  {
    id: 'est-1',
    name: 'Lycee Ibn Khaldoun',
    city: 'Alger',
    adminName: 'Karim Yelles',
    adminEmail: 'admin@ibnkhaldoun.dz',
    status: 'ACTIF',
    professorsCount: 42,
    studentsCount: 1250,
    createdAt: '2023-09-01T00:00:00Z',
    stats: [
      { label: 'Professeurs', value: '42', tone: 'primary' },
      { label: 'Etudiants', value: '1250', tone: 'primary' },
      { label: 'Examens/mois', value: '180', tone: 'primary' },
    ],
  },
  {
    id: 'est-2',
    name: 'CEM El Fath',
    city: 'Oran',
    adminName: 'Salima Chergui',
    adminEmail: 'admin@elfath.dz',
    status: 'ACTIF',
    professorsCount: 28,
    studentsCount: 840,
    createdAt: '2024-01-15T00:00:00Z',
    stats: [
      { label: 'Professeurs', value: '28', tone: 'primary' },
      { label: 'Etudiants', value: '840', tone: 'primary' },
      { label: 'Examens/mois', value: '95', tone: 'primary' },
    ],
  },
  {
    id: 'est-3',
    name: 'Lycee Didouche',
    city: 'Constantine',
    adminName: 'Nadir Bouziane',
    adminEmail: 'admin@didouche.dz',
    status: 'INACTIF',
    professorsCount: 0,
    studentsCount: 0,
    createdAt: '2025-02-20T00:00:00Z',
    stats: [
      { label: 'Professeurs', value: '0', tone: 'primary' },
      { label: 'Etudiants', value: '0', tone: 'primary' },
      { label: 'Examens/mois', value: '0', tone: 'primary' },
    ],
  },
];

export const classes: ClassRoom[] = [
  { id: 'dev2', name: '2 eme annee DEV', exams: 3, students: 4, establishmentId: 'est-1' },
  { id: 'gestion2', name: '2 eme annees gestion', exams: 2, students: 5, establishmentId: 'est-2' },
  { id: 'mobile2', name: '2 annee mobile', exams: 1, students: 7, establishmentId: 'est-1' },
];

export const exams: Exam[] = [
  {
    id: 'controle-1',
    name: 'controle math 1',
    subject: 'Mathematic',
    className: 'informatique',
    date: '2026-05-20',
    copies: 8,
    status: 'ACTIF',
    questions: 20,
    establishmentId: 'est-1',
  },
  {
    id: 'francais',
    name: 'francais',
    subject: 'francais',
    className: '2 eme annees gestion',
    date: '2026-05-25',
    copies: 5,
    status: 'BROUILLON',
    questions: 20,
    establishmentId: 'est-2',
  },
  {
    id: 'math-2',
    name: 'Mathematic',
    subject: 'Mathematic',
    className: 'Aucune classe',
    date: '2026-05-24',
    copies: 0,
    status: 'EN COURS',
    questions: 20,
    establishmentId: 'est-1',
  },
  {
    id: 'math-3',
    name: 'Mathematic',
    subject: 'Mathematic',
    className: '2 eme annees gestion, 1 er annee dev',
    date: '2026-05-24',
    copies: 0,
    status: 'BROUILLON',
    questions: 20,
    establishmentId: 'est-2',
  },
];

export const professors: Professor[] = [
  {
    id: 'benali',
    initials: 'MB',
    name: 'M. Benali',
    email: 'm.benali@ecole.dz',
    password: 'Professor@123',
    status: 'ACTIF',
    establishment: 'Lycee Ibn Khaldoun',
    establishmentId: 'est-1',
    stats: [
      { label: 'Classes', value: '3', tone: 'primary' },
      { label: 'Examens', value: '12', tone: 'primary' },
      { label: 'Etudiants', value: '84', tone: 'primary' },
    ],
  },
  {
    id: 'ziane',
    initials: 'HZ',
    name: 'H. Ziane',
    email: 'h.ziane@ecole.dz',
    password: 'Professor@123',
    status: 'ACTIF',
    establishment: 'Lycee Ibn Khaldoun',
    establishmentId: 'est-1',
    stats: [
      { label: 'Classes', value: '2', tone: 'primary' },
      { label: 'Examens', value: '8', tone: 'primary' },
      { label: 'Etudiants', value: '63', tone: 'primary' },
    ],
  },
  {
    id: 'amrani',
    initials: 'SA',
    name: 'S. Amrani',
    email: 's.amrani@ecole.dz',
    password: 'Professor@123',
    status: 'SUSPENDU',
    establishment: 'CEM El Fath',
    establishmentId: 'est-2',
    stats: [
      { label: 'Classes', value: '1', tone: 'primary' },
      { label: 'Examens', value: '4', tone: 'primary' },
      { label: 'Etudiants', value: '27', tone: 'primary' },
    ],
  },
  {
    id: 'meziane',
    initials: 'KM',
    name: 'K. Meziane',
    email: 'k.meziane@ecole.dz',
    password: 'Professor@123',
    status: 'INACTIF',
    establishment: 'Lycee Didouche',
    establishmentId: 'est-3',
    stats: [
      { label: 'Classes', value: '0', tone: 'primary' },
      { label: 'Examens', value: '0', tone: 'primary' },
      { label: 'Etudiants', value: '0', tone: 'primary' },
    ],
  },
];

export const studentExams: StudentExam[] = [
  { id: 'math-s2', title: 'Mathematiques S2', date: '25 mai 2025', status: 'A VENIR', tone: 'warning' },
  { id: 'pc', title: 'Physique Chimie', date: '11 mai 2025', score: '8/20', tone: 'warning' },
  { id: 'svt', title: 'SVT', date: '5 mai 2025', score: '16/20', tone: 'success' },
];

export const recentResults: StudentExam[] = [
  { id: 'math', title: 'Mathematiques', date: '15 mai 2025', score: '16/20', tone: 'success' },
  { id: 'physique', title: 'Physique', date: '10 mai 2025', score: '16/20', tone: 'danger' },
  { id: 'svt', title: 'SVT', date: '10 mai 2025', score: '16/20', tone: 'success' },
];

export const reportRows: ReportRow[] = [
  { subject: 'Maths', score: '16/20', mention: 'Bien' },
  { subject: 'Physique', score: '8/20', mention: 'Insuf' },
  { subject: 'SVT', score: '18/20', mention: 'TB' },
  { subject: 'Moyenne', score: '14.5/20', mention: '' },
];

export const examClassScores: ExamClassScore[] = [
  { examId: 'controle-1', examName: 'Controle Math 1', className: '2 eme annee DEV', averageScore: 14 },
  { examId: 'controle-1', examName: 'Controle Math 1', className: '2 eme annees gestion', averageScore: 11 },
  { examId: 'controle-1', examName: 'Controle Math 1', className: '2 annee mobile', averageScore: 8 },
  { examId: 'francais', examName: 'Francais', className: '2 eme annee DEV', averageScore: 10 },
  { examId: 'francais', examName: 'Francais', className: '2 eme annees gestion', averageScore: 15 },
  { examId: 'francais', examName: 'Francais', className: '2 annee mobile', averageScore: 12 },
  { examId: 'math-2', examName: 'Mathematic 2', className: '2 eme annee DEV', averageScore: 16 },
  { examId: 'math-2', examName: 'Mathematic 2', className: '2 eme annees gestion', averageScore: 9 },
  { examId: 'math-2', examName: 'Mathematic 2', className: '2 annee mobile', averageScore: 13 },
  { examId: 'math-3', examName: 'Mathematic 3', className: '2 eme annee DEV', averageScore: 7 },
  { examId: 'math-3', examName: 'Mathematic 3', className: '2 eme annees gestion', averageScore: 13 },
  { examId: 'math-3', examName: 'Mathematic 3', className: '2 annee mobile', averageScore: 10 },
];

export const adminTabs: NavItem[] = [
  { id: 'home', label: 'Accueil', screen: 'admin-home' },
  { id: 'professors', label: 'Profs', screen: 'admin-professors' },
];

export const superAdminTabs: NavItem[] = [
  { id: 'home', label: 'Accueil', screen: 'super-admin-home' },
  { id: 'establishments', label: 'Etablissements', screen: 'super-admin-establishments' },
  { id: 'professors', label: 'Professeurs', screen: 'super-admin-professors' },
];

export const professorTabs: NavItem[] = [
  { id: 'home', label: 'Accueil', screen: 'professor-home' },
  { id: 'classes', label: 'Classes', screen: 'professor-classes' },
  { id: 'exams', label: 'Examens', screen: 'professor-exams' },
  { id: 'students', label: 'Etudiants', screen: 'professor-students' },
  { id: 'profile', label: 'Compte', screen: 'professor-account' },
];

export const studentTabs: NavItem[] = [
  { id: 'home', label: 'Accueil', screen: 'student-home' },
  { id: 'exams', label: 'Examens', screen: 'student-exams' },
  { id: 'report', label: 'Releve', screen: 'student-report' },
  { id: 'profile', label: 'Profil', screen: 'student-profile' },
];
