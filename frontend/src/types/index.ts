// User roles
export type UserRole = 'admin' | 'comptable' | 'secretaire' | 'professeur';

export interface User {
  id: string | number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  avatar?: string;
  is_superuser?: boolean;
  establishment_info?: {
    id: number;
    name: string;
    slug: string;
    logo?: string;
  };
}

export interface SchoolSettings {
    name: string;
    establishment_name?: string;
    english_name?: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
    country?: string;
    postal_code?: string;
    director_title?: string;
    certificate_reference?: string;
    article_text?: string;
    website: string;
    slogan: string;
    logo: string | null;
    enable_email_alerts: boolean;
    enable_sms_alerts: boolean;
    payment_reminder_days: number;
    low_grade_threshold: number;
    currency_symbol: string;
    currency_code: string;
    tranche_1_deadline: string;
    tranche_2_deadline: string;
    tranche_3_deadline: string;
    exam_fee_amount: number;
    enable_cash_payment: boolean;
    enable_mobile_payment: boolean;
    enable_bank_transfer: boolean;
    bank_details: string;
    receipt_footer: string;
    session_timeout: number;
    min_password_length: number;
    max_login_attempts: number;
    require_strong_password: boolean;
    maintenance_mode: boolean;
    two_factor_enforcement: boolean;
    selected_types: string[];
    owner_id?: number | null;
}

// Class types
export interface Class {
  id: string;
  name: string;
  level: string;
  category: 'general' | 'technique';
  isExam: boolean;
  maxSize: number;
  currentSize: number;
  schoolYear: string;
  categoryDisplay?: string;
  tranches?: TrancheConfig[];
  tuitionTemplate?: string | number;
}

export interface TrancheConfig {
  id: string;
  schoolClass?: string;
  name: string;
  amount: number;
  dueDate: string;
}

export interface TuitionTemplate {
  id: number;
  name: string;
  category: 'general' | 'technique';
  categoryDisplay: string;
  registrationFee: number;
  tranche1: number;
  tranche2: number;
  tranche3: number;
  materialFee: number;
}

// Student types
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  isRepeating: boolean;
  gender: 'M' | 'F';
  address: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  classId: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'suspended';
  paymentStatus: PaymentStatus;
  totalPaid: number;
  totalDue: number;
}

export interface StudentWithClass extends Student {
  className: string;
}

// Payment types
export type PaymentMode = 'cash' | 'check' | 'transfer' | 'mobile';

export interface Payment {
  id: string;
  studentId: string;
  trancheId: string;
  trancheName: string;
  amountPaid: number;
  amountExpected: number;
  date: string;
  mode: PaymentMode;
  receiptNumber: string;
  notes?: string;
  recordedBy: string;
}

export interface PaymentWithStudent extends Payment {
  studentName: string;
  className: string;
}

export interface StudentPaymentSummary {
  studentId: string;
  studentName: string;
  className: string;
  tranches: {
    trancheId: string;
    trancheName: string;
    expected: number;
    paid: number;
    remaining: number;
    status: PaymentStatus;
    dueDate: string;
  }[];
  totalExpected: number;
  totalPaid: number;
  totalRemaining: number;
}

// Grade types
export interface Subject {
  id: string;
  name: string;
  coefficient: number;
}

export interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  periodId: string;
  value: number;
  maxValue: number;
  date: string;
  teacherId?: string;
}

export interface GradeWithDetails extends Grade {
  studentName: string;
  subjectName: string;
  periodName: string;
}

// Event types
export type EventType = 'exam' | 'meeting' | 'holiday' | 'activity' | 'other';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  type: EventType;
  classIds?: string[];
  allDay: boolean;
}

// Expense types
export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  recordedBy: string;
  receiptUrl?: string;
}

// Dashboard types
export interface DashboardKPI {
  totalStudents: number;
  totalClasses: number;
  globalRecoveryRate: number;
  generalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  activeAlerts: number;
  pendingPayments: number;
}

export interface RecentOperation {
  id: string;
  type: 'payment' | 'expense' | 'enrollment' | 'grade';
  description: string;
  amount?: number;
  date: string;
  user: string;
}

export interface Alert {
  id: string;
  type: 'payment_due' | 'payment_overdue' | 'event_upcoming' | 'low_balance';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  date: string;
  relatedId?: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

// SMS types
export interface SMSMessage {
  id: string;
  recipientPhone: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  creditsUsed: number;
}

// Bulk action types
export interface BulkAction {
  type: 'sms' | 'export' | 'move_class' | 'payment';
  selectedIds: string[];
  params?: Record<string, unknown>;
}

// Filter types
export interface StudentFilter {
  search?: string;
  classId?: string;
  status?: PaymentStatus;
  trancheId?: string;
}

export interface PaymentFilter {
  search?: string;
  classId?: string;
  trancheId?: string;
  mode?: PaymentMode;
  dateFrom?: string;
  dateTo?: string;
}
