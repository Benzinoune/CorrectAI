import { useEffect, useMemo, useState } from 'react';

import {
  AdminHomeScreen,
  AdminNewProfessorScreen,
  AdminProfessorDetailScreen,
  AdminProfessorsScreen,
} from '@/features/correctai/screens/admin';
import {
  ForgotPasswordScreen,
  LoginScreen,
  SignupScreen,
  SplashScreen,
} from '@/features/correctai/screens/auth';
import {
  SuperAdminAdminDetailScreen,
  SuperAdminAdminsScreen,
  SuperAdminEstablishmentDetailScreen,
  SuperAdminEstablishmentsScreen,
  SuperAdminEstablishmentSettingsScreen,
  SuperAdminHomeScreen,
  SuperAdminNewAdminScreen,
  SuperAdminNewEstablishmentScreen,
  SuperAdminNewProfessorScreen,
  SuperAdminProfessorDetailScreen,
  SuperAdminProfessorsScreen,
} from '@/features/correctai/screens/super-admin';
import {
  ProfessorAccountScreen,
  ProfessorAddStudentScreen,
  ProfessorQuestionDetailScreen,
  ProfessorAnswerKeyScreen,
  ProfessorAnswerSheetScreen,
  ProfessorClassDetailScreen,
  ProfessorClassesScreen,
  ProfessorScannedCopyCorrectionScreen,
  ProfessorExamMenuScreen,
  ProfessorExamsScreen,
  ProfessorHomeScreen,
  ProfessorNewExamScreen,
  ProfessorScannedCopyDetailScreen,
  ProfessorScanValidationScreen,
  ProfessorScanResultScreen,
  ProfessorScannerScreen,
  ProfessorScannedCopiesListScreen,
  ProfessorStudentDetailScreen,
  ProfessorStudentEditScreen,
  ProfessorStudentsScreen,
} from '@/features/correctai/screens/professor';
import {
  StudentExamResultScreen,
  StudentExamsScreen,
  StudentHomeScreen,
  StudentProfileScreen,
  StudentReportScreen,
} from '@/features/correctai/screens/student';
import {
  admins as initialAdmins,
  classes as initialClasses,
  establishments as initialEstablishments,
  exams as initialExams,
  professors as initialProfessors,
  students as initialStudents,
} from '@/features/correctai/data/mock-data';
import type {
  Admin,
  AdminCreateInput,
  AppScreen,
  ClassRoom,
  Establishment,
  Exam,
  ExamQuestion,
  Professor,
  ProfessorCreateInput,
  ScannedCopy,
  ScannedCopyDraft,
  Student,
  StudentCreateInput,
  TabId,
  UserRole,
} from '@/features/correctai/types';

const homeScreens: Record<UserRole, AppScreen> = {
  super_admin: 'super-admin-home',
  admin: 'admin-home',
  professor: 'professor-home',
  student: 'student-home',
};

const activeTabs: Partial<Record<AppScreen, TabId>> = {
  'super-admin-home': 'home',
  'super-admin-establishments': 'establishments',
  'super-admin-establishment-detail': 'establishments',
  'super-admin-establishment-settings': 'establishments',
  'super-admin-new-establishment': 'establishments',
  'super-admin-admins': 'establishments',
  'super-admin-admin-detail': 'establishments',
  'super-admin-new-admin': 'establishments',
  'super-admin-professors': 'professors',
  'super-admin-professor-detail': 'professors',
  'super-admin-new-professor': 'professors',
  'admin-home': 'home',
  'admin-professors': 'professors',
  'professor-home': 'home',
  'professor-classes': 'classes',
  'professor-exams': 'exams',
  'professor-students': 'students',
  'professor-account': 'profile',
  'student-home': 'home',
  'student-exams': 'exams',
  'student-report': 'report',
  'student-profile': 'profile',
};

function cloneStudent(student: Student): Student {
  return {
    ...student,
    classes: [...student.classes],
  };
}

function cloneEstablishment(establishment: Establishment): Establishment {
  return {
    ...establishment,
    stats: establishment.stats.map((stat) => ({ ...stat })),
  };
}

function cloneProfessor(professor: Professor): Professor {
  return {
    ...professor,
    stats: professor.stats.map((stat) => ({ ...stat })),
  };
}

function cloneClass(classItem: ClassRoom): ClassRoom {
  return { ...classItem };
}

function cloneExam(exam: Exam): Exam {
  const questionBank = exam.questionBank?.map((question) => ({
    ...question,
    correctAnswers: [...question.correctAnswers],
    detectedAnswers: question.detectedAnswers ? [...question.detectedAnswers] : undefined,
  }));
  const scannedCopies = exam.scannedCopies?.map(cloneScannedCopy);

  return {
    ...exam,
    classIds: exam.classIds ? [...exam.classIds] : undefined,
    questionBank: questionBank ?? buildDefaultQuestionBank(exam.questions),
    scannedCopies,
  };
}

function cloneScannedCopy(copy: ScannedCopy): ScannedCopy {
  return {
    ...copy,
    detectedAnswers: [...copy.detectedAnswers],
    ocrResult: copy.ocrResult
      ? {
          ...copy.ocrResult,
          missingFields: [...copy.ocrResult.missingFields],
        }
      : undefined,
    omrResult: copy.omrResult
      ? {
          ...copy.omrResult,
          answers: copy.omrResult.answers.map((answer) => ({ ...answer })),
        }
      : undefined,
    metadata: copy.metadata ? { ...copy.metadata } : undefined,
  };
}

function buildDefaultQuestionBank(questionCount: number, defaultPoints = 1): ExamQuestion[] {
  return Array.from({ length: questionCount }, (_, index) => ({
    number: index + 1,
    correctAnswers: [],
    detectedAnswers: [],
    points: defaultPoints,
  }));
}

function buildMockDetectedAnswers(questionCount: number) {
  const patterns: string[][] = [
    ['A'],
    ['B'],
    ['C'],
    ['D'],
    ['E'],
    ['A', 'B'],
    ['A', 'C'],
    ['B', 'D'],
    ['C', 'E'],
    ['A', 'D'],
  ];

  return Array.from({ length: questionCount }, (_, index) => patterns[index % patterns.length]);
}

function buildMockScannedCopies(exam: Exam): ScannedCopy[] {
  const names = [
    'Non identifié',
    'Khawla Lali',
    'Aicha Zeraodi',
    'Halima Fouti',
    'Yanis Ziani',
    'Nadia Belaid',
    'Ibtissam Sa7out',
    'Aicha Lolo',
  ];
  const matricules = ['0', '14365', '33624', '10390', '1944', '1951', 'K110', 'MAT:2025-001'];
  const confidenceLevels = [28, 94, 91, 61, 83, 74, 68, 88];
  const statuses = ['PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING'] as const;
  const questionPattern = buildMockDetectedAnswers(exam.questions).map((answers) => answers.join('+'));
  const copyCount = Math.max(exam.copies, 0);

  return Array.from({ length: copyCount }, (_, index) => ({
    id: `copy-${exam.id}-${index + 1}`,
    examId: exam.id,
    examName: exam.name,
    studentName: names[index % names.length],
    matricule: matricules[index % matricules.length],
    className: exam.className,
    scannedAt: new Date(Date.UTC(2026, 4, 20, 8, 30 + index * 4)).toISOString(),
    establishmentId: exam.establishmentId ?? '',
    aiConfidence: confidenceLevels[index % confidenceLevels.length],
    reviewStatus: statuses[index % statuses.length],
    detectedAnswers: questionPattern,
    detectedAnswersCount: questionPattern.length,
    calculatedScore: index === 0 ? `0/${exam.questions}` : undefined,
    ocrResult: {
      extracted: true,
      name: index === 0 ? null : names[index % names.length],
      matricule: matricules[index % matricules.length] === '0' ? null : matricules[index % matricules.length],
      className: exam.className,
      confidence: confidenceLevels[index % confidenceLevels.length],
      missingFields: [],
    },
    omrResult: {
      detected: true,
      answers: questionPattern.map((answer, questionIndex) => ({
        question: questionIndex + 1,
        answer: answer || null,
        confidence: answer ? 82 : 0,
      })),
    },
    metadata: {
      source: 'scanner',
      processedAt: new Date(Date.UTC(2026, 4, 20, 8, 45 + index * 4)).toISOString(),
    },
  }));
}

function seedExamScannedCopies(exam: Exam): Exam {
  const scannedCopies = exam.scannedCopies?.length ? exam.scannedCopies : buildMockScannedCopies(exam);

  return {
    ...exam,
    scannedCopies,
    copies: scannedCopies.length,
  };
}

function classNamesFromIds(classIds: string[] | undefined, classList: ClassRoom[]) {
  if (!classIds?.length) {
    return [];
  }

  return classIds.map((classId) => classList.find((classItem) => classItem.id === classId)?.name ?? classId);
}

function normalizeClassValue(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
}

function matchesClassReference(value: string, classItem: Pick<ClassRoom, 'id' | 'name'>) {
  const normalizedValue = normalizeClassValue(value);
  return (
    value === classItem.id ||
    normalizedValue === normalizeClassValue(classItem.id) ||
    normalizedValue === normalizeClassValue(classItem.name)
  );
}

function rewriteDelimitedClassText(value: string, classItem: ClassRoom, nextName?: string) {
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const updatedParts = parts
    .map((part) => (matchesClassReference(part, classItem) ? nextName ?? '' : part))
    .filter(Boolean);

  return updatedParts.length > 0 ? updatedParts.join(', ') : 'Aucune classe';
}

function rewriteStudentClassRefs(values: string[], classItem: ClassRoom, nextName?: string) {
  return values
    .map((value) => (matchesClassReference(value, classItem) ? nextName ?? '' : value))
    .filter(Boolean);
}

function rewriteScannedCopyClassRefs(copy: ScannedCopy, classItem: ClassRoom, nextName?: string) {
  return {
    ...copy,
    className: rewriteDelimitedClassText(copy.className, classItem, nextName),
  };
}

function studentBelongsToClass(student: Student, classItem: ClassRoom) {
  return student.classes.some((value) => matchesClassReference(value, classItem));
}

function examBelongsToClass(exam: Exam, classItem: ClassRoom) {
  if (exam.classIds?.some((classId) => classId === classItem.id)) {
    return true;
  }

  if (matchesClassReference(exam.className, classItem)) {
    return true;
  }

  return exam.className
    .split(/[,/|]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .some((part) => matchesClassReference(part, classItem));
}

function buildClassesWithCounts(classItems: ClassRoom[], studentItems: Student[], examItems: Exam[]) {
  return classItems.map((classItem) => ({
    ...classItem,
    students: studentItems.filter((student) => studentBelongsToClass(student, classItem)).length,
    exams: examItems.filter((exam) => examBelongsToClass(exam, classItem)).length,
  }));
}

function buildStudentInitials(firstName: string, lastName: string) {
  const first = firstName.trim().charAt(0);
  const last = lastName.trim().charAt(0);
  const initials = `${first}${last}`.trim();

  return initials ? initials.toUpperCase() : 'ST';
}

function buildProfessorInitials(firstName: string, lastName: string) {
  const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`;

  return initials ? initials.toUpperCase() : 'PR';
}

function buildCorrectAiId() {
  return `CA-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function CorrectAiApp() {
  const [screen, setScreen] = useState<AppScreen>(() => 'splash');
  const [establishmentsData, setEstablishmentsData] = useState<Establishment[]>(() =>
    initialEstablishments.map(cloneEstablishment),
  );
  const [professorsData, setProfessorsData] = useState<Professor[]>(() => initialProfessors.map(cloneProfessor));
  const [studentsData, setStudentsData] = useState<Student[]>(() => initialStudents.map(cloneStudent));
  const [classesData, setClassesData] = useState<ClassRoom[]>(() => initialClasses.map(cloneClass));
  const [examsData, setExamsData] = useState<Exam[]>(() =>
    initialExams.map((exam) => cloneExam(seedExamScannedCopies(exam))),
  );
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(() =>
    initialStudents[0] ? cloneStudent(initialStudents[0]) : null,
  );
  const [adminsData, setAdminsData] = useState<Admin[]>(() => initialAdmins.map((a) => ({ ...a })));
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(() =>
    initialEstablishments[0] ? cloneEstablishment(initialEstablishments[0]) : null,
  );
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(() =>
    initialProfessors[0] ? cloneProfessor(initialProfessors[0]) : null,
  );
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(() =>
    initialClasses[0] ? cloneClass(initialClasses[0]) : null,
  );
  const [selectedExam, setSelectedExam] = useState<Exam | null>(() =>
    initialExams[0] ? cloneExam(seedExamScannedCopies(initialExams[0])) : null,
  );
  const [selectedScannedCopy, setSelectedScannedCopy] = useState<ScannedCopy | null>(() => {
    const firstExam = initialExams[0];
    const seededExam = firstExam ? seedExamScannedCopies(firstExam) : null;

    return seededExam?.scannedCopies?.[0] ? cloneScannedCopy(seededExam.scannedCopies[0]) : null;
  });
  const [selectedQuestionNumber, setSelectedQuestionNumber] = useState<number | null>(null);
  const [scannerMode, setScannerMode] = useState<'copies' | 'key'>('copies');
  const activeTab = useMemo(() => activeTabs[screen] ?? 'home', [screen]);
  const classesWithCounts = useMemo(
    () => buildClassesWithCounts(classesData, studentsData, examsData),
    [classesData, examsData, studentsData],
  );
  const selectedClassForRender = useMemo(
    () => (selectedClass ? classesWithCounts.find((classItem) => classItem.id === selectedClass.id) ?? selectedClass : null),
    [classesWithCounts, selectedClass],
  );
  const selectedStudentForRender = useMemo(
    () => (selectedStudent ? studentsData.find((student) => student.id === selectedStudent.id) ?? selectedStudent : null),
    [selectedStudent, studentsData],
  );
  const selectedEstablishmentForRender = useMemo(
    () =>
      selectedEstablishment
        ? establishmentsData.find((est) => est.id === selectedEstablishment.id) ?? selectedEstablishment
        : null,
    [establishmentsData, selectedEstablishment],
  );
  const selectedProfessorForRender = useMemo(
    () =>
      selectedProfessor
        ? professorsData.find((professor) => professor.id === selectedProfessor.id) ?? selectedProfessor
        : null,
    [professorsData, selectedProfessor],
  );
  const selectedExamForRender = useMemo(
    () => (selectedExam ? examsData.find((exam) => exam.id === selectedExam.id) ?? selectedExam : null),
    [examsData, selectedExam],
  );
  const totalCopies = useMemo(
    () => examsData.reduce((sum, exam) => sum + (exam.scannedCopies?.length ?? exam.copies), 0),
    [examsData],
  );

  const selectedScannedCopyForRender = useMemo(() => {
    if (!selectedExamForRender?.scannedCopies?.length) {
      return null;
    }

    return (
      selectedExamForRender.scannedCopies.find((copy) => copy.id === selectedScannedCopy?.id) ??
      selectedExamForRender.scannedCopies[selectedExamForRender.scannedCopies.length - 1] ??
      null
    );
  }, [selectedExamForRender, selectedScannedCopy]);

  useEffect(() => {
    if (!selectedExamForRender) {
      return;
    }

    console.log(
      '[App] render state: screen=%s examId=%s copyCount=%d selectedCopyId=%s',
      screen,
      selectedExamForRender.id,
      selectedExamForRender.scannedCopies?.length ?? 0,
      selectedScannedCopyForRender?.id ?? 'none',
    );
  }, [screen, selectedExamForRender, selectedScannedCopyForRender]);

  const navigate = (nextScreen: AppScreen) => {
    setScreen(nextScreen);
  };

  const [adminEstablishmentId, setAdminEstablishmentId] = useState<string | undefined>(undefined);

  const login = (nextRole: UserRole, establishmentId?: string) => {
    setAdminEstablishmentId(establishmentId);
    setScreen(homeScreens[nextRole]);
  };

  const createAdmin = (draft: AdminCreateInput) => {
    const firstName = draft.firstName.trim();
    const lastName = draft.lastName.trim();
    const nextAdmin: Admin = {
      id: `admin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
      name: `${firstName} ${lastName}`.trim(),
      email: draft.email.trim().toLowerCase(),
      password: draft.password,
      status: 'ACTIF',
      establishment: draft.establishment,
      establishmentId: draft.establishmentId,
      createdAt: new Date().toISOString(),
    };
    setAdminsData((current) => [nextAdmin, ...current]);
    setSelectedAdmin(nextAdmin);
  };

  const updateAdmin = (updated: Admin) => {
    setAdminsData((current) => current.map((a) => (a.id === updated.id ? { ...updated } : a)));
    setSelectedAdmin(updated);
  };

  const deleteAdmin = (adminId: string) => {
    setAdminsData((current) => current.filter((a) => a.id !== adminId));
    setSelectedAdmin((current) => (current?.id === adminId ? null : current));
  };

  const updateProfessor = (updated: Professor) => {
    setProfessorsData((current) => current.map((p) => (p.id === updated.id ? cloneProfessor(updated) : p)));
    setSelectedProfessor(updated);
  };

  const deleteProfessor = (professorId: string) => {
    setProfessorsData((current) => {
      const next = current.filter((p) => p.id !== professorId);
      setSelectedProfessor((currentProf) =>
        currentProf?.id === professorId ? (next[0] ? cloneProfessor(next[0]) : null) : currentProf,
      );
      return next;
    });
  };

  const adminInitials = (name: string) =>
    name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AD';

  const createEstablishment = (draft: {
    name: string;
    city: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) => {
    const estId = `est-${Date.now().toString(36)}`;
    const nextEstablishment = {
      id: estId,
      name: draft.name,
      city: draft.city,
      adminName: draft.adminName,
      adminEmail: draft.adminEmail,
      status: 'ACTIF' as const,
      professorsCount: 0,
      studentsCount: 0,
      createdAt: new Date().toISOString(),
      stats: [
        { label: 'Professeurs', value: '0', tone: 'primary' as const },
        { label: 'Etudiants', value: '0', tone: 'primary' as const },
        { label: 'Examens/mois', value: '0', tone: 'primary' as const },
      ],
    };
    setEstablishmentsData((current) => [nextEstablishment, ...current]);
    setSelectedEstablishment(nextEstablishment);
    setAdminsData((current) => [
      {
        id: `admin-${Date.now().toString(36)}`,
        initials: adminInitials(draft.adminName),
        name: draft.adminName,
        email: draft.adminEmail.toLowerCase(),
        password: draft.adminPassword,
        status: 'ACTIF' as const,
        establishment: draft.name,
        establishmentId: estId,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
  };

  const updateEstablishment = (updated: Establishment) => {
    setEstablishmentsData((current) => current.map((e) => (e.id === updated.id ? cloneEstablishment(updated) : e)));
    setSelectedEstablishment(updated);
  };

  const deleteEstablishment = (establishmentId: string) => {
    setEstablishmentsData((current) => {
      const next = current.filter((e) => e.id !== establishmentId);
      setSelectedEstablishment((currentEst) =>
        currentEst?.id === establishmentId ? (next[0] ? cloneEstablishment(next[0]) : null) : currentEst,
      );
      return next;
    });
  };

  const createProfessor = (professorDraft: ProfessorCreateInput) => {
    const firstName = professorDraft.firstName.trim();
    const lastName = professorDraft.lastName.trim();
    const email = professorDraft.email.trim().toLowerCase();
    const establishmentName = professorDraft.establishment.trim() || 'Etablissement';
    const establishmentId = professorDraft.establishmentId || adminEstablishmentId || '';
    const nextProfessor = cloneProfessor({
      id: `professor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      initials: buildProfessorInitials(firstName, lastName),
      name: `${firstName || 'Nouveau'} ${lastName || 'Professeur'}`.trim(),
      email,
      password: professorDraft.password,
      status: 'ACTIF',
      establishment: establishmentName,
      establishmentId,
      stats: [
        { label: 'Classes', value: '0', tone: 'primary' },
        { label: 'Examens', value: '0', tone: 'primary' },
        { label: 'Etudiants', value: '0', tone: 'primary' },
      ],
    });

    setProfessorsData((currentProfessors) => [nextProfessor, ...currentProfessors]);
    setSelectedProfessor(nextProfessor);
    setEstablishmentsData((current) =>
      current.map((est) => {
        if (est.name !== establishmentName && est.id !== establishmentId) return est;
        const newCount = est.professorsCount + 1;
        return {
          ...est,
          professorsCount: newCount,
          stats: est.stats.map((s) =>
            s.label.toLowerCase().includes('prof') ? { ...s, value: String(newCount) } : s,
          ),
        };
      }),
    );
  };

  const updateStudent = (updatedStudent: Student) => {
    const nextStudent = cloneStudent({
      ...updatedStudent,
      classes: [...updatedStudent.classes],
      email: updatedStudent.email.trim().toLowerCase(),
    });

    setStudentsData((currentStudents) =>
      currentStudents.map((student) => (student.id === nextStudent.id ? nextStudent : student)),
    );
    setSelectedStudent(nextStudent);
  };

  const createStudent = (studentDraft: StudentCreateInput) => {
    const firstName = studentDraft.firstName.trim();
    const lastName = studentDraft.lastName.trim();
    const matricule = studentDraft.matricule.trim();
    const email = studentDraft.email.trim().toLowerCase();
    const nextStudent = cloneStudent({
      id: `student-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      initials: buildStudentInitials(firstName, lastName),
      firstName: firstName || 'Prenom',
      lastName: lastName || 'Nom',
      matricule: matricule || `MAT-${Date.now().toString(36).slice(-4)}`,
      email,
      password: studentDraft.password,
      externalRef: matricule || `MAT-${Date.now().toString(36).slice(-4)}`,
      correctAiId: buildCorrectAiId(),
      establishmentId: '',
      classes: [...studentDraft.classes],
    });

    setStudentsData((currentStudents) => [nextStudent, ...currentStudents]);
    setSelectedStudent(nextStudent);
  };

  const deleteStudent = (studentId: string) => {
    setStudentsData((currentStudents) => {
      const nextStudents = currentStudents.filter((student) => student.id !== studentId);

      setSelectedStudent((currentStudent) =>
        currentStudent?.id === studentId ? (nextStudents[0] ? cloneStudent(nextStudents[0]) : null) : currentStudent,
      );

      return nextStudents.map(cloneStudent);
    });
  };

  const createExam = (examDraft: Omit<Exam, 'id'>) => {
    const nextExam = cloneExam({
      ...examDraft,
      id: `exam-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      classIds: examDraft.classIds ? [...examDraft.classIds] : undefined,
      questionBank: examDraft.questionBank?.map((question) => ({
        ...question,
        correctAnswers: [...question.correctAnswers],
        detectedAnswers: question.detectedAnswers ? [...question.detectedAnswers] : undefined,
      })) ?? buildDefaultQuestionBank(examDraft.questions),
      scannedCopies: [],
    });

    setExamsData((currentExams) => [nextExam, ...currentExams]);
    setSelectedExam(nextExam);
  };

  const updateExam = (updatedExam: Exam) => {
    const nextExam = cloneExam({
      ...updatedExam,
      copies: updatedExam.scannedCopies?.length ?? updatedExam.copies,
      classIds: updatedExam.classIds ? [...updatedExam.classIds] : undefined,
      questionBank:
        updatedExam.questionBank?.map((question) => ({
          ...question,
          correctAnswers: [...question.correctAnswers],
          detectedAnswers: question.detectedAnswers ? [...question.detectedAnswers] : undefined,
        })) ?? buildDefaultQuestionBank(updatedExam.questions),
    });

    setExamsData((currentExams) => currentExams.map((exam) => (exam.id === nextExam.id ? nextExam : exam)));
    setSelectedExam(nextExam);
    setSelectedScannedCopy((currentCopy) => {
      if (!nextExam.scannedCopies?.length) {
        return null;
      }

      if (currentCopy) {
        const currentSelection = nextExam.scannedCopies.find((copy) => copy.id === currentCopy.id);

        if (currentSelection) {
          return currentSelection;
        }
      }

      return nextExam.scannedCopies[0] ?? null;
    });
  };

  const deleteExam = (examId: string) => {
    setExamsData((currentExams) => currentExams.filter((exam) => exam.id !== examId));
    setSelectedExam((currentExam) => (currentExam?.id === examId ? null : currentExam));
    setSelectedScannedCopy(null);
  };

  const registerExamScan = (draft?: ScannedCopyDraft) => {
    if (!selectedExam) {
      return null;
    }

    console.log(
      '[App] registerExamScan: examId=%s existingCopies=%d',
      selectedExam.id,
      selectedExam.scannedCopies?.length ?? 0,
    );

    const existingCopies = selectedExam.scannedCopies ?? [];
    const nextCopyNumber = existingCopies.length + 1;
    const detectedAnswers =
      draft?.detectedAnswers ??
      draft?.omrResult?.answers?.map((answer) => answer.answer ?? '') ??
      buildMockDetectedAnswers(selectedExam.questions).map((answers) => answers.join('+'));
    const confidenceLevels = [28, 94, 91, 61, 83, 74, 68, 88];
    const names = ['Non identifié', 'Khawla Lali', 'Aicha Zeraodi', 'Halima Fouti', 'Yanis Ziani', 'Nadia Belaid'];
    const matricules = ['0', '14365', '33624', '10390', '1944', '1951'];
    const nextCopy: ScannedCopy = cloneScannedCopy({
      id: `copy-${selectedExam.id}-${Date.now().toString(36)}-${nextCopyNumber}`,
      examId: selectedExam.id,
      examName: selectedExam.name,
      studentName: draft?.ocrResult?.name?.trim() || draft?.studentName?.trim() || 'À extraire plus tard',
      matricule: draft?.ocrResult?.matricule?.trim() || draft?.matricule?.trim() || 'À extraire plus tard',
      className: selectedExam.classIds?.length
        ? classNamesFromIds(selectedExam.classIds, classesWithCounts).join(', ')
        : draft?.ocrResult?.className?.trim() || draft?.className?.trim() || selectedExam.className,
      scannedAt: new Date().toISOString(),
      establishmentId: selectedExam.establishmentId ?? '',
      imageUri: draft?.imageUri,
      annotatedImageUri: draft?.annotatedImageUri,
      aiConfidence: draft?.aiConfidence ?? confidenceLevels[(nextCopyNumber - 1) % confidenceLevels.length],
      reviewStatus: 'DETECTED',
      detectedAnswers,
      detectedAnswersCount: draft?.detectedAnswersCount ?? detectedAnswers.length,
      calculatedScore: draft?.calculatedScore ?? '--',
      ocrResult: draft?.ocrResult
        ? {
            ...draft.ocrResult,
            missingFields: [...draft.ocrResult.missingFields],
          }
        : {
            extracted: true,
            name: draft?.studentName?.trim() || 'À extraire plus tard',
            matricule: draft?.matricule?.trim() || 'À extraire plus tard',
            className: draft?.className?.trim() || selectedExam.className,
            confidence: draft?.aiConfidence ?? confidenceLevels[(nextCopyNumber - 1) % confidenceLevels.length],
            missingFields: [],
          },
      omrResult: draft?.omrResult
        ? {
            ...draft.omrResult,
            answers: draft.omrResult.answers.map((answer) => ({ ...answer })),
          }
        : {
            detected: detectedAnswers.length > 0,
            answers: detectedAnswers.map((answer, index) => ({
              question: index + 1,
              answer: answer || null,
              confidence: answer ? 82 : 0,
            })),
          },
      metadata: {
        source: 'scanner',
        processedAt: new Date().toISOString(),
        ...(draft?.metadata ?? {}),
      },
    });
    const nextScannedCopies = [...existingCopies, nextCopy];
    const nextExam = cloneExam({
      ...selectedExam,
      copies: nextScannedCopies.length,
      scannedCopies: nextScannedCopies,
    });
    const persistedCopy = nextExam.scannedCopies?.[nextExam.scannedCopies.length - 1] ?? nextCopy;

    setExamsData((currentExams) => currentExams.map((exam) => (exam.id === nextExam.id ? nextExam : exam)));
    setSelectedExam(nextExam);
    setSelectedScannedCopy(persistedCopy);

    console.log(
      '[App] registerExamScan: persistedCopyId=%s totalCopies=%d student=%s matricule=%s status=%s',
      persistedCopy.id,
      nextExam.scannedCopies?.length ?? 0,
      persistedCopy.studentName,
      persistedCopy.matricule,
      persistedCopy.reviewStatus,
    );

    return persistedCopy;
  };

  const registerAnswerKeyScan = () => {
    if (!selectedExam) {
      return;
    }

    const detectedAnswers = buildMockDetectedAnswers(selectedExam.questions);
    const currentQuestionBank = selectedExam.questionBank ?? buildDefaultQuestionBank(selectedExam.questions);
    const nextExam = cloneExam({
      ...selectedExam,
      questionBank: currentQuestionBank.map((question, index) => ({
        ...question,
        correctAnswers: detectedAnswers[index] ? [...detectedAnswers[index]] : [],
        detectedAnswers: detectedAnswers[index] ? [...detectedAnswers[index]] : [],
      })),
    });

    setExamsData((currentExams) => currentExams.map((exam) => (exam.id === nextExam.id ? nextExam : exam)));
    setSelectedExam(nextExam);
  };

  const createClass = (className: string) => {
    const nextName = className.trim();
    if (!nextName) {
      return;
    }

    const nextClass: ClassRoom = {
      id: `class-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: nextName,
      exams: 0,
      students: 0,
      establishmentId: '',
    };

    setClassesData((currentClasses) => [...currentClasses, nextClass]);
  };

  const updateClass = (updatedClass: ClassRoom) => {
    const nextClass = cloneClass(updatedClass);
    const previousClass = classesData.find((classItem) => classItem.id === nextClass.id);
    const nextClasses = classesData.map((classItem) => (classItem.id === nextClass.id ? nextClass : classItem));

    setClassesData(nextClasses.map(cloneClass));
    setSelectedClass((currentClass) => (currentClass?.id === nextClass.id ? nextClass : currentClass));

    if (!previousClass) {
      return;
    }

    if (previousClass.name !== nextClass.name) {
      setExamsData((currentExams) =>
        currentExams.map((exam) => ({
          ...exam,
          classIds: exam.classIds ? [...exam.classIds] : exam.classIds,
          className: exam.classIds?.length
            ? classNamesFromIds(exam.classIds, nextClasses).join(', ')
            : rewriteDelimitedClassText(exam.className, previousClass, nextClass.name),
          scannedCopies: exam.scannedCopies?.map((copy) => rewriteScannedCopyClassRefs(copy, previousClass, nextClass.name)),
        })),
      );
      setStudentsData((currentStudents) =>
        currentStudents.map((student) => ({
          ...student,
          classes: rewriteStudentClassRefs(student.classes, previousClass, nextClass.name),
        })),
      );
      setSelectedStudent((currentStudent) =>
        currentStudent
          ? {
              ...currentStudent,
              classes: rewriteStudentClassRefs(currentStudent.classes, previousClass, nextClass.name),
            }
          : currentStudent,
      );
      setSelectedExam((currentExam) =>
        currentExam
          ? {
              ...currentExam,
              classIds: currentExam.classIds ? [...currentExam.classIds] : currentExam.classIds,
              className: currentExam.classIds?.length
                ? classNamesFromIds(currentExam.classIds, nextClasses).join(', ')
                : rewriteDelimitedClassText(currentExam.className, previousClass, nextClass.name),
              scannedCopies: currentExam.scannedCopies?.map((copy) => rewriteScannedCopyClassRefs(copy, previousClass, nextClass.name)),
            }
          : currentExam,
      );
      setSelectedScannedCopy((currentCopy) =>
        currentCopy ? rewriteScannedCopyClassRefs(currentCopy, previousClass, nextClass.name) : currentCopy,
      );
    }
  };

  const deleteClass = (classId: string) => {
    const previousClass = classesData.find((classItem) => classItem.id === classId);
    if (!previousClass) {
      return;
    }

    const nextClasses = classesData.filter((classItem) => classItem.id !== classId);

    setClassesData(nextClasses.map(cloneClass));
    setSelectedClass((currentClass) =>
      currentClass?.id === classId ? (nextClasses[0] ? cloneClass(nextClasses[0]) : null) : currentClass,
    );
    setExamsData((currentExams) =>
      currentExams.map((exam) => {
        const nextClassIds = exam.classIds?.filter((value) => value !== classId);

        return {
          ...exam,
          classIds: nextClassIds?.length ? nextClassIds : undefined,
          className: nextClassIds?.length
            ? classNamesFromIds(nextClassIds, nextClasses).join(', ')
            : rewriteDelimitedClassText(exam.className, previousClass),
          scannedCopies: exam.scannedCopies?.map((copy) => rewriteScannedCopyClassRefs(copy, previousClass)),
        };
      }),
    );
    setStudentsData((currentStudents) =>
      currentStudents.map((student) => ({
        ...student,
        classes: rewriteStudentClassRefs(student.classes, previousClass),
      })),
    );
    setSelectedStudent((currentStudent) =>
      currentStudent
        ? {
            ...currentStudent,
            classes: rewriteStudentClassRefs(currentStudent.classes, previousClass),
          }
        : currentStudent,
    );
    setSelectedExam((currentExam) =>
      currentExam
        ? {
            ...currentExam,
            classIds: currentExam.classIds?.filter((value) => value !== classId) || undefined,
            className:
              currentExam.classIds?.filter((value) => value !== classId)?.length
                ? classNamesFromIds(currentExam.classIds.filter((value) => value !== classId), nextClasses).join(', ')
                : rewriteDelimitedClassText(currentExam.className, previousClass),
            scannedCopies: currentExam.scannedCopies?.map((copy) => rewriteScannedCopyClassRefs(copy, previousClass)),
          }
        : currentExam,
    );
    setSelectedScannedCopy((currentCopy) =>
      currentCopy ? rewriteScannedCopyClassRefs(currentCopy, previousClass) : currentCopy,
    );
  };

  switch (screen) {
    case 'splash':
      return <SplashScreen onLogin={login} onNavigate={navigate} />;
    case 'forgot-password':
      return <ForgotPasswordScreen onLogin={login} onNavigate={navigate} />;
    case 'signup':
      return <SignupScreen onLogin={login} onNavigate={navigate} />;
    case 'super-admin-home':
      return (
        <SuperAdminHomeScreen
          activeTab={activeTab}
          adminsData={adminsData}
          classesCount={classesWithCounts.length}
          copiesCount={totalCopies}
          establishmentsData={establishmentsData}
          examsCount={examsData.length}
          onNavigate={navigate}
          onSelectEstablishment={setSelectedEstablishment}
          professorsData={professorsData}
          studentsCount={studentsData.length}
        />
      );
    case 'super-admin-establishments':
      return (
        <SuperAdminEstablishmentsScreen
          activeTab={activeTab}
          establishmentsData={establishmentsData}
          onNavigate={navigate}
          onSelectEstablishment={setSelectedEstablishment}
        />
      );
    case 'super-admin-establishment-detail':
      return (
        <SuperAdminEstablishmentDetailScreen
          activeTab={activeTab}
          adminsData={adminsData}
          establishmentsData={establishmentsData}
          onDeleteEstablishment={deleteEstablishment}
          onNavigate={navigate}
          selectedEstablishment={selectedEstablishmentForRender}
        />
      );
    case 'super-admin-establishment-settings':
      return (
        <SuperAdminEstablishmentSettingsScreen
          activeTab={activeTab}
          establishmentsData={establishmentsData}
          onNavigate={navigate}
          onUpdateEstablishment={updateEstablishment}
          selectedEstablishment={selectedEstablishmentForRender}
        />
      );
    case 'super-admin-new-establishment':
      return (
        <SuperAdminNewEstablishmentScreen
          activeTab={activeTab}
          establishmentsData={establishmentsData}
          onNavigate={navigate}
          onCreateEstablishment={createEstablishment}
        />
      );
    case 'super-admin-admins':
      return (
        <SuperAdminAdminsScreen
          activeTab={activeTab}
          adminsData={adminsData}
          establishmentsData={establishmentsData}
          onNavigate={navigate}
          onSelectAdmin={setSelectedAdmin}
          selectedEstablishment={selectedEstablishmentForRender}
        />
      );
    case 'super-admin-admin-detail':
      return (
        <SuperAdminAdminDetailScreen
          activeTab={activeTab}
          establishmentsData={establishmentsData}
          onNavigate={navigate}
          onUpdateAdmin={updateAdmin}
          onDeleteAdmin={deleteAdmin}
          selectedAdmin={selectedAdmin}
        />
      );
    case 'super-admin-new-admin':
      return (
        <SuperAdminNewAdminScreen
          activeTab={activeTab}
          establishmentsData={establishmentsData}
          onNavigate={navigate}
          onCreateAdmin={createAdmin}
        />
      );
    case 'super-admin-professors':
      return (
        <SuperAdminProfessorsScreen
          activeTab={activeTab}
          establishmentsData={establishmentsData}
          onNavigate={navigate}
          onSelectProfessor={setSelectedProfessor}
          professorsData={professorsData}
        />
      );
    case 'super-admin-professor-detail':
      return (
        <SuperAdminProfessorDetailScreen
          activeTab={activeTab}
          establishmentsData={establishmentsData}
          onNavigate={navigate}
          onUpdateProfessor={updateProfessor}
          onDeleteProfessor={deleteProfessor}
          selectedProfessor={selectedProfessorForRender}
        />
      );
    case 'super-admin-new-professor':
      return (
        <SuperAdminNewProfessorScreen
          activeTab={activeTab}
          establishmentsData={establishmentsData}
          onCreateProfessor={createProfessor}
          onNavigate={navigate}
        />
      );
    case 'admin-home':
      return (
        <AdminHomeScreen
          activeTab={activeTab}
          adminEstablishmentId={adminEstablishmentId}
          onNavigate={navigate}
          onSelectProfessor={setSelectedProfessor}
          professorsData={professorsData}
        />
      );
    case 'admin-professors':
      return (
        <AdminProfessorsScreen
          activeTab={activeTab}
          adminEstablishmentId={adminEstablishmentId}
          onNavigate={navigate}
          onSelectProfessor={setSelectedProfessor}
          professorsData={professorsData}
        />
      );
    case 'admin-professor-detail':
      return (
        <AdminProfessorDetailScreen
          activeTab={activeTab}
          adminEstablishmentId={adminEstablishmentId}
          onDeleteProfessor={deleteProfessor}
          onNavigate={navigate}
          onUpdateProfessor={updateProfessor}
          selectedProfessor={selectedProfessorForRender}
        />
      );
    case 'admin-new-professor':
      return (
        <AdminNewProfessorScreen
          activeTab={activeTab}
          adminEstablishmentId={adminEstablishmentId}
          onCreateProfessor={createProfessor}
          onNavigate={navigate}
        />
      );
    case 'professor-home':
      return (
        <ProfessorHomeScreen
          activeTab={activeTab}
          classesData={classesWithCounts}
          examsData={examsData}
          onNavigate={navigate}
          studentsData={studentsData}
        />
      );
    case 'professor-students':
      return (
        <ProfessorStudentsScreen
          activeTab={activeTab}
          onNavigate={navigate}
          classesData={classesWithCounts}
          onSelectStudent={setSelectedStudent}
          studentsData={studentsData}
        />
      );
    case 'professor-student-detail':
      return (
        <ProfessorStudentDetailScreen
          activeTab={activeTab}
          classesData={classesWithCounts}
          onDeleteStudent={deleteStudent}
          onNavigate={navigate}
          selectedStudent={selectedStudentForRender}
          studentsData={studentsData}
        />
      );
    case 'professor-student-edit':
      return (
        <ProfessorStudentEditScreen
          activeTab={activeTab}
          onNavigate={navigate}
          selectedStudent={selectedStudentForRender}
          classesData={classesWithCounts}
          onUpdateStudent={updateStudent}
          onDeleteStudent={deleteStudent}
          studentsData={studentsData}
        />
      );
    case 'professor-add-student':
      return (
        <ProfessorAddStudentScreen
          activeTab={activeTab}
          classesData={classesWithCounts}
          onCreateStudent={createStudent}
          onNavigate={navigate}
        />
      );
    case 'professor-classes':
      return (
        <ProfessorClassesScreen
          activeTab={activeTab}
          classesData={classesWithCounts}
          onCreateClass={createClass}
          onNavigate={navigate}
          onSelectClass={setSelectedClass}
        />
      );
    case 'professor-class-detail':
      return (
        <ProfessorClassDetailScreen
          activeTab={activeTab}
          classesData={classesWithCounts}
          examsData={examsData}
          onDeleteClass={deleteClass}
          onNavigate={navigate}
          onSelectExam={setSelectedExam}
          onUpdateClass={updateClass}
          selectedClass={selectedClassForRender}
          studentsData={studentsData}
        />
      );
    case 'professor-exams':
      return (
        <ProfessorExamsScreen
          activeTab={activeTab}
          examsData={examsData}
          onNavigate={navigate}
          onSelectExam={setSelectedExam}
        />
      );
    case 'professor-new-exam':
      return (
        <ProfessorNewExamScreen
          activeTab={activeTab}
          classesData={classesWithCounts}
          onCreateExam={createExam}
          onNavigate={navigate}
        />
      );
    case 'professor-exam-menu':
      return (
        <ProfessorExamMenuScreen
          activeTab={activeTab}
          examsData={examsData}
          classesData={classesWithCounts}
          onNavigate={navigate}
          onSetScannerMode={setScannerMode}
          selectedExam={selectedExamForRender}
          onSelectExam={setSelectedExam}
          onDeleteExam={deleteExam}
        />
      );
    case 'professor-answer-sheet':
      return (
        <ProfessorAnswerSheetScreen
          activeTab={activeTab}
          classesData={classesWithCounts}
          onNavigate={navigate}
          selectedExam={selectedExamForRender}
        />
      );
    case 'professor-scanner':
      return (
        <ProfessorScannerScreen
          activeTab={activeTab}
          onNavigate={navigate}
          onRegisterAnswerKeyScan={registerAnswerKeyScan}
          onRegisterExamScan={registerExamScan}
          scannerMode={scannerMode}
          selectedExam={selectedExamForRender}
        />
      );
    case 'professor-scan-result':
      return (
        <ProfessorScanResultScreen
          onNavigate={navigate}
          onScanReset={() => {
            setSelectedScannedCopy(null);
          }}
          selectedExam={selectedExamForRender}
          selectedScannedCopy={selectedScannedCopyForRender}
        />
      );
    case 'professor-review-copies':
      return (
        <ProfessorScannedCopiesListScreen
          activeTab={activeTab}
          classesData={classesWithCounts}
          onNavigate={navigate}
          onSelectScannedCopy={setSelectedScannedCopy}
          onUpdateExam={updateExam}
          selectedExam={selectedExamForRender}
          selectedScannedCopy={selectedScannedCopyForRender}
        />
      );
    case 'professor-copy-detail':
      return (
        <ProfessorScannedCopyDetailScreen
          activeTab={activeTab}
          classesData={classesWithCounts}
          onNavigate={navigate}
          onSelectScannedCopy={setSelectedScannedCopy}
          onUpdateExam={updateExam}
          selectedExam={selectedExamForRender}
          selectedScannedCopy={selectedScannedCopyForRender}
        />
      );
    case 'professor-copy-review':
      return (
        <ProfessorScanValidationScreen
          activeTab={activeTab}
          classesData={classesWithCounts}
          onNavigate={navigate}
          onSelectScannedCopy={setSelectedScannedCopy}
          onUpdateExam={updateExam}
          selectedExam={selectedExamForRender}
          selectedScannedCopy={selectedScannedCopyForRender}
        />
      );
    case 'professor-copy-revision':
      return (
        <ProfessorScannedCopyCorrectionScreen
          classesData={classesWithCounts}
          onNavigate={navigate}
          onSelectScannedCopy={setSelectedScannedCopy}
          onUpdateExam={updateExam}
          selectedExam={selectedExamForRender}
          selectedScannedCopy={selectedScannedCopyForRender}
        />
      );
    case 'professor-answer-key':
      return (
        <ProfessorAnswerKeyScreen
          activeTab={activeTab}
          onNavigate={navigate}
          onSelectQuestion={setSelectedQuestionNumber}
          onUpdateExam={updateExam}
          onSetScannerMode={setScannerMode}
          selectedExam={selectedExamForRender}
          selectedQuestionNumber={selectedQuestionNumber}
        />
      );
    case 'professor-answer-detail':
      return (
        <ProfessorQuestionDetailScreen
          activeTab={activeTab}
          onNavigate={navigate}
          onUpdateExam={updateExam}
          selectedExam={selectedExamForRender}
          selectedQuestionNumber={selectedQuestionNumber}
        />
      );
    case 'professor-account':
      return (
        <ProfessorAccountScreen
          activeTab={activeTab}
          classesData={classesWithCounts}
          examsData={examsData}
          onLogin={login}
          onNavigate={navigate}
          onUpdateProfessor={updateProfessor}
          professorsData={professorsData}
          selectedProfessor={selectedProfessorForRender}
          studentsData={studentsData}
        />
      );
    case 'student-home':
      return <StudentHomeScreen activeTab={activeTab} examsData={examsData} onNavigate={navigate} selectedStudent={selectedStudentForRender} studentsData={studentsData} />;
    case 'student-exams':
      return <StudentExamsScreen activeTab={activeTab} examsData={examsData} onNavigate={navigate} selectedStudent={selectedStudentForRender} studentsData={studentsData} />;
    case 'student-exam-result':
      return <StudentExamResultScreen activeTab={activeTab} examsData={examsData} onNavigate={navigate} selectedStudent={selectedStudentForRender} studentsData={studentsData} />;
    case 'student-report':
      return <StudentReportScreen activeTab={activeTab} examsData={examsData} onNavigate={navigate} selectedStudent={selectedStudentForRender} studentsData={studentsData} />;
    case 'student-profile':
      return <StudentProfileScreen activeTab={activeTab} examsData={examsData} onNavigate={navigate} onUpdateStudent={updateStudent} selectedStudent={selectedStudentForRender} studentsData={studentsData} />;
    case 'login':
    default:
      return <LoginScreen onLogin={login} onNavigate={navigate} />;
  }
}
