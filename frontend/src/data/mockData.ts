import type {
  User,
  Class,
  Student,
  Payment,
  Subject,
  Period,
  Grade,
  CalendarEvent,
  Expense,
  DashboardKPI,
  RecentOperation,
  Alert,
  StudentPaymentSummary,
} from '@/types';

// Current user
export const currentUser: User = {
  id: 'u1',
  username: 'claire',
  firstName: 'Claire',
  lastName: 'Admin',
  email: 'claire@xschool.com',
  name: 'Mme. Claire',
  role: 'comptable',
  avatar: undefined,
};

// Classes
export const classes: Class[] = [
  {
    id: 'c1',
    name: '6ème A',
    level: '6ème',
    maxSize: 40,
    currentSize: 35,
    schoolYear: '2024-2025',
    category: 'general',
    isExam: false,
    tranches: [
      { id: 't1-1', name: 'Inscription', amount: 50000, dueDate: '2024-09-01' },
      { id: 't1-2', name: 'Tranche 1', amount: 75000, dueDate: '2024-10-15' },
      { id: 't1-3', name: 'Tranche 2', amount: 75000, dueDate: '2024-12-15' },
      { id: 't1-4', name: 'Tranche 3', amount: 50000, dueDate: '2025-02-15' },
    ],
  },
  {
    id: 'c2',
    name: '6ème B',
    level: '6ème',
    maxSize: 40,
    currentSize: 38,
    schoolYear: '2024-2025',
    category: 'general',
    isExam: false,
    tranches: [
      { id: 't2-1', name: 'Inscription', amount: 50000, dueDate: '2024-09-01' },
      { id: 't2-2', name: 'Tranche 1', amount: 75000, dueDate: '2024-10-15' },
      { id: 't2-3', name: 'Tranche 2', amount: 75000, dueDate: '2024-12-15' },
      { id: 't2-4', name: 'Tranche 3', amount: 50000, dueDate: '2025-02-15' },
    ],
  },
  {
    id: 'c3',
    name: '5ème A',
    level: '5ème',
    maxSize: 40,
    currentSize: 32,
    schoolYear: '2024-2025',
    category: 'general',
    isExam: false,
    tranches: [
      { id: 't3-1', name: 'Inscription', amount: 55000, dueDate: '2024-09-01' },
      { id: 't3-2', name: 'Tranche 1', amount: 80000, dueDate: '2024-10-15' },
      { id: 't3-3', name: 'Tranche 2', amount: 80000, dueDate: '2024-12-15' },
      { id: 't3-4', name: 'Tranche 3', amount: 55000, dueDate: '2025-02-15' },
    ],
  },
  {
    id: 'c4',
    name: '5ème B',
    level: '5ème',
    maxSize: 40,
    currentSize: 36,
    schoolYear: '2024-2025',
    category: 'general',
    isExam: false,
    tranches: [
      { id: 't4-1', name: 'Inscription', amount: 55000, dueDate: '2024-09-01' },
      { id: 't4-2', name: 'Tranche 1', amount: 80000, dueDate: '2024-10-15' },
      { id: 't4-3', name: 'Tranche 2', amount: 80000, dueDate: '2024-12-15' },
      { id: 't4-4', name: 'Tranche 3', amount: 55000, dueDate: '2025-02-15' },
    ],
  },
  {
    id: 'c5',
    name: '4ème A',
    level: '4ème',
    maxSize: 40,
    currentSize: 30,
    schoolYear: '2024-2025',
    category: 'general',
    isExam: false,
    tranches: [
      { id: 't5-1', name: 'Inscription', amount: 60000, dueDate: '2024-09-01' },
      { id: 't5-2', name: 'Tranche 1', amount: 85000, dueDate: '2024-10-15' },
      { id: 't5-3', name: 'Tranche 2', amount: 85000, dueDate: '2024-12-15' },
      { id: 't5-4', name: 'Tranche 3', amount: 60000, dueDate: '2025-02-15' },
    ],
  },
  {
    id: 'c6',
    name: '3ème A',
    level: '3ème',
    maxSize: 40,
    currentSize: 28,
    schoolYear: '2024-2025',
    category: 'general',
    isExam: false,
    tranches: [
      { id: 't6-1', name: 'Inscription', amount: 65000, dueDate: '2024-09-01' },
      { id: 't6-2', name: 'Tranche 1', amount: 90000, dueDate: '2024-10-15' },
      { id: 't6-3', name: 'Tranche 2', amount: 90000, dueDate: '2024-12-15' },
      { id: 't6-4', name: 'Tranche 3', amount: 65000, dueDate: '2025-02-15' },
    ],
  },
];

// Students
export const students: Student[] = [
  {
    id: 's1',
    firstName: 'Emma',
    lastName: 'Kouam',
    matricule: 'XS2024001',
    dateOfBirth: '2012-03-15',
    gender: 'F',
    address: 'Rue 123, Yaoundé',
    parentName: 'M. Kouam Jean',
    parentPhone: '+237 6XX XXX XXX',
    parentEmail: 'jean.kouam@email.com',
    classId: 'c1',
    enrollmentDate: '2024-09-01',
    status: 'active', isRepeating: false, paymentStatus: 'unpaid', totalPaid: 0, totalDue: 0,
  },
  {
    id: 's2',
    firstName: 'Lucas',
    lastName: 'Ngom',
    matricule: 'XS2024002',
    dateOfBirth: '2011-07-22',
    gender: 'M',
    address: 'Avenue 456, Douala',
    parentName: 'Mme. Ngom Marie',
    parentPhone: '+237 6XX XXX XXX',
    classId: 'c1',
    enrollmentDate: '2024-09-01',
    status: 'active', isRepeating: false, paymentStatus: 'unpaid', totalPaid: 0, totalDue: 0,
  },
  {
    id: 's3',
    firstName: 'Sophie',
    lastName: 'Fotso',
    matricule: 'XS2024003',
    dateOfBirth: '2012-01-10',
    gender: 'F',
    address: 'Boulevard 789, Yaoundé',
    parentName: 'M. Fotso Paul',
    parentPhone: '+237 6XX XXX XXX',
    classId: 'c2',
    enrollmentDate: '2024-09-01',
    status: 'active', isRepeating: false, paymentStatus: 'unpaid', totalPaid: 0, totalDue: 0,
  },
  {
    id: 's4',
    firstName: 'Thomas',
    lastName: 'Mba',
    matricule: 'XS2024004',
    dateOfBirth: '2011-11-05',
    gender: 'M',
    address: 'Rue 321, Bafoussam',
    parentName: 'Mme. Mba Rose',
    parentPhone: '+237 6XX XXX XXX',
    classId: 'c2',
    enrollmentDate: '2024-09-01',
    status: 'active', isRepeating: false, paymentStatus: 'unpaid', totalPaid: 0, totalDue: 0,
  },
  {
    id: 's5',
    firstName: 'Amina',
    lastName: 'Bello',
    matricule: 'XS2024005',
    dateOfBirth: '2010-05-18',
    gender: 'F',
    address: 'Avenue 654, Garoua',
    parentName: 'M. Bello Ibrahim',
    parentPhone: '+237 6XX XXX XXX',
    classId: 'c3',
    enrollmentDate: '2024-09-01',
    status: 'active', isRepeating: false, paymentStatus: 'unpaid', totalPaid: 0, totalDue: 0,
  },
  {
    id: 's6',
    firstName: 'Kofi',
    lastName: 'Asong',
    matricule: 'XS2024006',
    dateOfBirth: '2010-09-30',
    gender: 'M',
    address: 'Rue 987, Bamenda',
    parentName: 'Mme. Asong Grace',
    parentPhone: '+237 6XX XXX XXX',
    classId: 'c3',
    enrollmentDate: '2024-09-01',
    status: 'active', isRepeating: false, paymentStatus: 'unpaid', totalPaid: 0, totalDue: 0,
  },
  {
    id: 's7',
    firstName: 'Zara',
    lastName: 'Eko',
    matricule: 'XS2024007',
    dateOfBirth: '2010-12-12',
    gender: 'F',
    address: 'Boulevard 147, Yaoundé',
    parentName: 'M. Eko Samuel',
    parentPhone: '+237 6XX XXX XXX',
    classId: 'c4',
    enrollmentDate: '2024-09-01',
    status: 'active', isRepeating: false, paymentStatus: 'unpaid', totalPaid: 0, totalDue: 0,
  },
  {
    id: 's8',
    firstName: 'Marc',
    lastName: 'Tchuente',
    matricule: 'XS2024008',
    dateOfBirth: '2009-04-25',
    gender: 'M',
    address: 'Rue 258, Douala',
    parentName: 'Mme. Tchuente Anne',
    parentPhone: '+237 6XX XXX XXX',
    classId: 'c4',
    enrollmentDate: '2024-09-01',
    status: 'active', isRepeating: false, paymentStatus: 'unpaid', totalPaid: 0, totalDue: 0,
  },
  {
    id: 's9',
    firstName: 'Léa',
    lastName: 'Nana',
    matricule: 'XS2024009',
    dateOfBirth: '2009-08-08',
    gender: 'F',
    address: 'Avenue 369, Yaoundé',
    parentName: 'M. Nana Pierre',
    parentPhone: '+237 6XX XXX XXX',
    classId: 'c5',
    enrollmentDate: '2024-09-01',
    status: 'active', isRepeating: false, paymentStatus: 'unpaid', totalPaid: 0, totalDue: 0,
  },
  {
    id: 's10',
    firstName: 'David',
    lastName: 'Kamga',
    matricule: 'XS2024010',
    dateOfBirth: '2008-02-14',
    gender: 'M',
    address: 'Rue 741, Bafoussam',
    parentName: 'Mme. Kamga Lucie',
    parentPhone: '+237 6XX XXX XXX',
    classId: 'c5',
    enrollmentDate: '2024-09-01',
    status: 'active', isRepeating: false, paymentStatus: 'unpaid', totalPaid: 0, totalDue: 0,
  },
  {
    id: 's11',
    firstName: 'Grace',
    lastName: 'Mekongo',
    matricule: 'XS2024011',
    dateOfBirth: '2008-06-20',
    gender: 'F',
    address: 'Boulevard 852, Douala',
    parentName: 'M. Mekongo Robert',
    parentPhone: '+237 6XX XXX XXX',
    classId: 'c6',
    enrollmentDate: '2024-09-01',
    status: 'active', isRepeating: false, paymentStatus: 'unpaid', totalPaid: 0, totalDue: 0,
  },
  {
    id: 's12',
    firstName: 'Paul',
    lastName: 'Oben',
    matricule: 'XS2024012',
    dateOfBirth: '2008-10-03',
    gender: 'M',
    address: 'Rue 963, Yaoundé',
    parentName: 'Mme. Oben Marthe',
    parentPhone: '+237 6XX XXX XXX',
    classId: 'c6',
    enrollmentDate: '2024-09-01',
    status: 'active', isRepeating: false, paymentStatus: 'unpaid', totalPaid: 0, totalDue: 0,
  },
];

// Payments
export const payments: Payment[] = [
  // Emma Kouam - 6ème A
  { id: 'p1', studentId: 's1', trancheId: 't1-1', trancheName: 'Inscription', amountPaid: 50000, amountExpected: 50000, date: '2024-09-01', mode: 'cash', receiptNumber: 'REC-001', recordedBy: 'Mme. Claire' },
  { id: 'p2', studentId: 's1', trancheId: 't1-2', trancheName: 'Tranche 1', amountPaid: 75000, amountExpected: 75000, date: '2024-10-10', mode: 'transfer', receiptNumber: 'REC-045', recordedBy: 'Mme. Claire' },
  { id: 'p3', studentId: 's1', trancheId: 't1-3', trancheName: 'Tranche 2', amountPaid: 50000, amountExpected: 75000, date: '2024-12-20', mode: 'transfer', receiptNumber: 'REC-089', recordedBy: 'Mme. Claire' },
  
  // Lucas Ngom - 6ème A
  { id: 'p4', studentId: 's2', trancheId: 't1-1', trancheName: 'Inscription', amountPaid: 50000, amountExpected: 50000, date: '2024-09-02', mode: 'cash', receiptNumber: 'REC-002', recordedBy: 'Mme. Claire' },
  { id: 'p5', studentId: 's2', trancheId: 't1-2', trancheName: 'Tranche 1', amountPaid: 75000, amountExpected: 75000, date: '2024-10-12', mode: 'check', receiptNumber: 'REC-046', recordedBy: 'Mme. Claire' },
  { id: 'p6', studentId: 's2', trancheId: 't1-3', trancheName: 'Tranche 2', amountPaid: 75000, amountExpected: 75000, date: '2024-12-10', mode: 'transfer', receiptNumber: 'REC-090', recordedBy: 'Mme. Claire' },
  
  // Sophie Fotso - 6ème B
  { id: 'p7', studentId: 's3', trancheId: 't2-1', trancheName: 'Inscription', amountPaid: 50000, amountExpected: 50000, date: '2024-09-01', mode: 'cash', receiptNumber: 'REC-003', recordedBy: 'Mme. Claire' },
  { id: 'p8', studentId: 's3', trancheId: 't2-2', trancheName: 'Tranche 1', amountPaid: 50000, amountExpected: 75000, date: '2024-10-15', mode: 'cash', receiptNumber: 'REC-047', recordedBy: 'Mme. Claire' },
  
  // Thomas Mba - 6ème B
  { id: 'p9', studentId: 's4', trancheId: 't2-1', trancheName: 'Inscription', amountPaid: 50000, amountExpected: 50000, date: '2024-09-03', mode: 'transfer', receiptNumber: 'REC-004', recordedBy: 'Mme. Claire' },
  { id: 'p10', studentId: 's4', trancheId: 't2-2', trancheName: 'Tranche 1', amountPaid: 75000, amountExpected: 75000, date: '2024-10-14', mode: 'transfer', receiptNumber: 'REC-048', recordedBy: 'Mme. Claire' },
  { id: 'p11', studentId: 's4', trancheId: 't2-3', trancheName: 'Tranche 2', amountPaid: 75000, amountExpected: 75000, date: '2024-12-12', mode: 'transfer', receiptNumber: 'REC-091', recordedBy: 'Mme. Claire' },
  
  // Amina Bello - 5ème A
  { id: 'p12', studentId: 's5', trancheId: 't3-1', trancheName: 'Inscription', amountPaid: 55000, amountExpected: 55000, date: '2024-09-01', mode: 'cash', receiptNumber: 'REC-005', recordedBy: 'Mme. Claire' },
  { id: 'p13', studentId: 's5', trancheId: 't3-2', trancheName: 'Tranche 1', amountPaid: 80000, amountExpected: 80000, date: '2024-10-10', mode: 'check', receiptNumber: 'REC-049', recordedBy: 'Mme. Claire' },
  
  // Kofi Asong - 5ème A
  { id: 'p14', studentId: 's6', trancheId: 't3-1', trancheName: 'Inscription', amountPaid: 55000, amountExpected: 55000, date: '2024-09-05', mode: 'mobile', receiptNumber: 'REC-006', recordedBy: 'Mme. Claire' },
  { id: 'p15', studentId: 's6', trancheId: 't3-2', trancheName: 'Tranche 1', amountPaid: 80000, amountExpected: 80000, date: '2024-10-08', mode: 'mobile', receiptNumber: 'REC-050', recordedBy: 'Mme. Claire' },
  { id: 'p16', studentId: 's6', trancheId: 't3-3', trancheName: 'Tranche 2', amountPaid: 80000, amountExpected: 80000, date: '2024-12-15', mode: 'mobile', receiptNumber: 'REC-092', recordedBy: 'Mme. Claire' },
  
  // Zara Eko - 5ème B
  { id: 'p17', studentId: 's7', trancheId: 't4-1', trancheName: 'Inscription', amountPaid: 55000, amountExpected: 55000, date: '2024-09-01', mode: 'cash', receiptNumber: 'REC-007', recordedBy: 'Mme. Claire' },
  
  // Marc Tchuente - 5ème B
  { id: 'p18', studentId: 's8', trancheId: 't4-1', trancheName: 'Inscription', amountPaid: 55000, amountExpected: 55000, date: '2024-09-02', mode: 'transfer', receiptNumber: 'REC-008', recordedBy: 'Mme. Claire' },
  { id: 'p19', studentId: 's8', trancheId: 't4-2', trancheName: 'Tranche 1', amountPaid: 80000, amountExpected: 80000, date: '2024-10-15', mode: 'transfer', receiptNumber: 'REC-051', recordedBy: 'Mme. Claire' },
  { id: 'p20', studentId: 's8', trancheId: 't4-3', trancheName: 'Tranche 2', amountPaid: 80000, amountExpected: 80000, date: '2024-12-14', mode: 'transfer', receiptNumber: 'REC-093', recordedBy: 'Mme. Claire' },
  
  // Léa Nana - 4ème A
  { id: 'p21', studentId: 's9', trancheId: 't5-1', trancheName: 'Inscription', amountPaid: 60000, amountExpected: 60000, date: '2024-09-01', mode: 'cash', receiptNumber: 'REC-009', recordedBy: 'Mme. Claire' },
  { id: 'p22', studentId: 's9', trancheId: 't5-2', trancheName: 'Tranche 1', amountPaid: 85000, amountExpected: 85000, date: '2024-10-11', mode: 'check', receiptNumber: 'REC-052', recordedBy: 'Mme. Claire' },
  { id: 'p23', studentId: 's9', trancheId: 't5-3', trancheName: 'Tranche 2', amountPaid: 85000, amountExpected: 85000, date: '2024-12-10', mode: 'check', receiptNumber: 'REC-094', recordedBy: 'Mme. Claire' },
  
  // David Kamga - 4ème A
  { id: 'p24', studentId: 's10', trancheId: 't5-1', trancheName: 'Inscription', amountPaid: 60000, amountExpected: 60000, date: '2024-09-03', mode: 'transfer', receiptNumber: 'REC-010', recordedBy: 'Mme. Claire' },
  { id: 'p25', studentId: 's10', trancheId: 't5-2', trancheName: 'Tranche 1', amountPaid: 50000, amountExpected: 85000, date: '2024-10-20', mode: 'transfer', receiptNumber: 'REC-053', recordedBy: 'Mme. Claire' },
  
  // Grace Mekongo - 3ème A
  { id: 'p26', studentId: 's11', trancheId: 't6-1', trancheName: 'Inscription', amountPaid: 65000, amountExpected: 65000, date: '2024-09-01', mode: 'cash', receiptNumber: 'REC-011', recordedBy: 'Mme. Claire' },
  { id: 'p27', studentId: 's11', trancheId: 't6-2', trancheName: 'Tranche 1', amountPaid: 90000, amountExpected: 90000, date: '2024-10-09', mode: 'cash', receiptNumber: 'REC-054', recordedBy: 'Mme. Claire' },
  
  // Paul Oben - 3ème A
  { id: 'p28', studentId: 's12', trancheId: 't6-1', trancheName: 'Inscription', amountPaid: 65000, amountExpected: 65000, date: '2024-09-04', mode: 'mobile', receiptNumber: 'REC-012', recordedBy: 'Mme. Claire' },
  { id: 'p29', studentId: 's12', trancheId: 't6-2', trancheName: 'Tranche 1', amountPaid: 90000, amountExpected: 90000, date: '2024-10-12', mode: 'mobile', receiptNumber: 'REC-055', recordedBy: 'Mme. Claire' },
  { id: 'p30', studentId: 's12', trancheId: 't6-3', trancheName: 'Tranche 2', amountPaid: 90000, amountExpected: 90000, date: '2024-12-11', mode: 'mobile', receiptNumber: 'REC-095', recordedBy: 'Mme. Claire' },
];

// Subjects
export const subjects: Subject[] = [
  { id: 'sub1', name: 'Mathématiques', coefficient: 4 },
  { id: 'sub2', name: 'Français', coefficient: 3 },
  { id: 'sub3', name: 'Anglais', coefficient: 2 },
  { id: 'sub4', name: 'Sciences Physiques', coefficient: 3 },
  { id: 'sub5', name: 'SVT', coefficient: 2 },
  { id: 'sub6', name: 'Histoire-Géographie', coefficient: 2 },
  { id: 'sub7', name: 'EPS', coefficient: 1 },
  { id: 'sub8', name: 'Informatique', coefficient: 1 },
];

// Periods
export const periods: Period[] = [
  { id: 'per1', name: 'Premier Trimestre', startDate: '2024-09-01', endDate: '2024-11-30' },
  { id: 'per2', name: 'Deuxième Trimestre', startDate: '2024-12-01', endDate: '2025-02-28' },
  { id: 'per3', name: 'Troisième Trimestre', startDate: '2025-03-01', endDate: '2025-05-31' },
];

// Grades
export const grades: Grade[] = [
  // Emma Kouam - 6ème A - Trimestre 1
  { id: 'g1', studentId: 's1', subjectId: 'sub1', periodId: 'per1', value: 15.5, maxValue: 20, date: '2024-10-15' },
  { id: 'g2', studentId: 's1', subjectId: 'sub2', periodId: 'per1', value: 14, maxValue: 20, date: '2024-10-16' },
  { id: 'g3', studentId: 's1', subjectId: 'sub3', periodId: 'per1', value: 16, maxValue: 20, date: '2024-10-17' },
  { id: 'g4', studentId: 's1', subjectId: 'sub4', periodId: 'per1', value: 13.5, maxValue: 20, date: '2024-10-18' },
  
  // Lucas Ngom - 6ème A - Trimestre 1
  { id: 'g5', studentId: 's2', subjectId: 'sub1', periodId: 'per1', value: 12, maxValue: 20, date: '2024-10-15' },
  { id: 'g6', studentId: 's2', subjectId: 'sub2', periodId: 'per1', value: 13.5, maxValue: 20, date: '2024-10-16' },
  { id: 'g7', studentId: 's2', subjectId: 'sub3', periodId: 'per1', value: 11, maxValue: 20, date: '2024-10-17' },
  { id: 'g8', studentId: 's2', subjectId: 'sub4', periodId: 'per1', value: 14, maxValue: 20, date: '2024-10-18' },
];

// Calendar Events
export const events: CalendarEvent[] = [
  { id: 'e1', title: 'Rentrée Scolaire', description: 'Début de l\'année scolaire 2024-2025', startDate: '2024-09-02', endDate: '2024-09-02', type: 'other', allDay: true },
  { id: 'e2', title: 'Conseil de Classe - 6ème', description: 'Réunion des professeurs de 6ème', startDate: '2024-10-25T14:00:00', endDate: '2024-10-25T16:00:00', type: 'meeting', classIds: ['c1', 'c2'], allDay: false },
  { id: 'e3', title: 'Examens Blancs', description: 'Première session d\'examens blancs', startDate: '2024-11-15', endDate: '2024-11-22', type: 'exam', allDay: true },
  { id: 'e4', title: 'Vacances de Noël', description: 'Congés de fin d\'année', startDate: '2024-12-23', endDate: '2025-01-05', type: 'holiday', allDay: true },
  { id: 'e5', title: 'Journée Sportive', description: 'Compétitions inter-classes', startDate: '2025-02-14T08:00:00', endDate: '2025-02-14T17:00:00', type: 'activity', allDay: false },
  { id: 'e6', title: 'Conseil de Classe - 3ème', description: 'Réunion des professeurs de 3ème', startDate: '2025-03-10T14:00:00', endDate: '2025-03-10T16:00:00', type: 'meeting', classIds: ['c6'], allDay: false },
  { id: 'e7', title: 'Examens Officiels', description: 'Examens de fin d\'année', startDate: '2025-05-26', endDate: '2025-06-06', type: 'exam', allDay: true },
  { id: 'e8', title: 'Fête de l\'École', description: 'Cérémonie de clôture', startDate: '2025-06-20T10:00:00', endDate: '2025-06-20T14:00:00', type: 'activity', allDay: false },
];

// Expenses
export const expenses: Expense[] = [
  { id: 'exp1', description: 'Achat de fournitures scolaires', amount: 250000, date: '2024-09-05', category: 'Fournitures', recordedBy: 'Mme. Claire' },
  { id: 'exp2', description: 'Réparation climatisation salle informatique', amount: 180000, date: '2024-09-12', category: 'Maintenance', recordedBy: 'Mme. Claire' },
  { id: 'exp3', description: 'Salaire professeurs - Septembre', amount: 3500000, date: '2024-09-30', category: 'Salaires', recordedBy: 'Mme. Claire' },
  { id: 'exp4', description: 'Facture électricité - Octobre', amount: 320000, date: '2024-10-15', category: 'Services publics', recordedBy: 'Mme. Claire' },
  { id: 'exp5', description: 'Achat livres bibliothèque', amount: 450000, date: '2024-10-20', category: 'Fournitures', recordedBy: 'Mme. Claire' },
  { id: 'exp6', description: 'Salaire personnel - Octobre', amount: 3500000, date: '2024-10-31', category: 'Salaires', recordedBy: 'Mme. Claire' },
  { id: 'exp7', description: 'Frais de transport sortie scolaire', amount: 150000, date: '2024-11-10', category: 'Transport', recordedBy: 'Mme. Claire' },
  { id: 'exp8', description: 'Achat matériel sportif', amount: 280000, date: '2024-11-25', category: 'Équipement', recordedBy: 'Mme. Claire' },
  { id: 'exp9', description: 'Salaire personnel - Novembre', amount: 3500000, date: '2024-11-30', category: 'Salaires', recordedBy: 'Mme. Claire' },
  { id: 'exp10', description: 'Frais bancaires - Décembre', amount: 45000, date: '2024-12-05', category: 'Services bancaires', recordedBy: 'Mme. Claire' },
];

// Dashboard KPI
export const dashboardKPI: DashboardKPI = {
  totalStudents: 207,
  totalClasses: 6,
  globalRecoveryRate: 72.5,
  generalBalance: 8450000,
  totalIncome: 15250000,
  totalExpenses: 6800000,
  activeAlerts: 8,
  pendingPayments: 45,
};

// Recent Operations
export const recentOperations: RecentOperation[] = [
  { id: 'ro1', type: 'payment', description: 'Paiement Tranche 2 - Emma Kouam', amount: 50000, date: '2024-12-20T10:30:00', user: 'Mme. Claire' },
  { id: 'ro2', type: 'payment', description: 'Paiement Tranche 2 - Lucas Ngom', amount: 75000, date: '2024-12-20T11:15:00', user: 'Mme. Claire' },
  { id: 'ro3', type: 'expense', description: 'Frais bancaires - Décembre', amount: 45000, date: '2024-12-20T14:00:00', user: 'Mme. Claire' },
  { id: 'ro4', type: 'payment', description: 'Paiement Inscription - Nouvel élève', amount: 50000, date: '2024-12-19T09:45:00', user: 'Mme. Claire' },
  { id: 'ro5', type: 'enrollment', description: 'Inscription - Jean Dupont (6ème A)', date: '2024-12-19T09:30:00', user: 'Mme. Claire' },
  { id: 'ro6', type: 'grade', description: 'Saisie notes - Mathématiques 6ème A', date: '2024-12-18T15:20:00', user: 'M. Laurent' },
  { id: 'ro7', type: 'payment', description: 'Paiement Tranche 1 - Marc Tchuente', amount: 80000, date: '2024-12-18T10:00:00', user: 'Mme. Claire' },
  { id: 'ro8', type: 'payment', description: 'Paiement Tranche 2 - Thomas Mba', amount: 75000, date: '2024-12-17T14:30:00', user: 'Mme. Claire' },
];

// Alerts
export const alerts: Alert[] = [
  { id: 'a1', type: 'payment_due', title: 'Échéance proche', description: 'Tranche 2 due dans 7 jours pour 12 élèves', severity: 'medium', date: '2024-12-22', relatedId: 't1-3' },
  { id: 'a2', type: 'payment_overdue', title: 'Paiement en retard', description: 'Tranche 1 non payée pour 5 élèves de 6ème B', severity: 'high', date: '2024-12-15', relatedId: 't2-2' },
  { id: 'a3', type: 'event_upcoming', title: 'Événement à venir', description: 'Vacances de Noël dans 5 jours', severity: 'low', date: '2024-12-23', relatedId: 'e4' },
  { id: 'a4', type: 'payment_due', title: 'Échéance proche', description: 'Tranche 2 due dans 7 jours pour 8 élèves de 5ème', severity: 'medium', date: '2024-12-22', relatedId: 't3-3' },
  { id: 'a5', type: 'payment_overdue', title: 'Paiement en retard', description: 'Inscription non payée pour 2 élèves de 3ème', severity: 'high', date: '2024-12-01', relatedId: 't6-1' },
  { id: 'a6', type: 'low_balance', title: 'Solde faible', description: 'Le solde du compte est inférieur à 10M XAF', severity: 'medium', date: '2024-12-20' },
  { id: 'a7', type: 'payment_due', title: 'Échéance proche', description: 'Tranche 3 due dans 30 jours pour toutes les classes', severity: 'low', date: '2025-01-15', relatedId: 't1-4' },
  { id: 'a8', type: 'event_upcoming', title: 'Conseil de classe', description: 'Conseil de classe 3ème dans 10 jours', severity: 'low', date: '2025-03-10', relatedId: 'e6' },
];

// Helper function to get student payment summary
export const getStudentPaymentSummary = (studentId: string): StudentPaymentSummary | null => {
  const student = students.find(s => s.id === studentId);
  if (!student) return null;
  
  const studentClass = classes.find(c => c.id === student.classId);
  if (!studentClass) return null;
  
  const studentPayments = payments.filter(p => p.studentId === studentId);
  
  const tranches = studentClass.tranches?.map(tranche => {
    const tranchePayments = studentPayments.filter(p => p.trancheId === tranche.id);
    const paid = tranchePayments.reduce((sum, p) => sum + p.amountPaid, 0);
    const expected = tranche.amount;
    const remaining = expected - paid;
    
    let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    if (paid >= expected) status = 'paid';
    else if (paid > 0) status = 'partial';
    
    return {
      trancheId: tranche.id,
      trancheName: tranche.name,
      expected,
      paid,
      remaining,
      status,
      dueDate: tranche.dueDate,
    };
  });
  
  const totalExpected = tranches?.reduce((sum, t) => sum + t.expected, 0) || 0;
  const totalPaid = tranches?.reduce((sum, t) => sum + t.paid, 0) || 0;
  const totalRemaining = totalExpected - totalPaid;
  
  return {
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    className: studentClass.name,
    tranches: tranches || [],
    totalExpected,
    totalPaid,
    totalRemaining,
  };
};

// Helper function to get all students with class names
export const getStudentsWithClass = () => {
  return students.map(student => {
    const studentClass = classes.find(c => c.id === student.classId);
    return {
      ...student,
      className: studentClass?.name || 'N/A',
    };
  });
};

// Helper function to get payments with student names
export const getPaymentsWithStudents = () => {
  return payments.map(payment => {
    const student = students.find(s => s.id === payment.studentId);
    const studentClass = classes.find(c => c.id === student?.classId);
    return {
      ...payment,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'N/A',
      className: studentClass?.name || 'N/A',
    };
  });
};
