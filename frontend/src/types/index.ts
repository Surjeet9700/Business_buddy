// ============================================
// BUSINESS BUDDY - SHARED TYPES
// Export-ready TypeScript definitions
// ============================================

// ============ USER & AUTH TYPES ============

export type AppRole = 'admin' | 'manager' | 'contributor' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface UserWithRoles extends User {
  roles: AppRole[];
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'approve';
}

export interface Session {
  user: UserWithRoles;
  accessToken: string;
  expiresAt: Date;
}

// ============ FORM BUILDER TYPES ============

export type FieldType = 'text' | 'number' | 'email' | 'dropdown' | 'date' | 'textarea' | 'checkbox';

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'minLength' | 'maxLength';
  value?: string | number;
  message: string;
}

export interface FieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  name: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | number | boolean;
  options?: FieldOption[]; // For dropdown
  validation: ValidationRule[];
  order: number;
}

export interface FormSchema {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPublished: boolean;
}

export interface FormVersion {
  id: string;
  formId: string;
  version: number;
  schema: FormSchema;
  createdAt: Date;
  createdBy: string;
  changelog?: string;
}

export interface FormPermissions {
  canView: AppRole[];
  canSubmit: AppRole[];
  canApprove: AppRole[];
}

export interface Form {
  id: string;
  name: string;
  description?: string;
  currentVersion: number;
  permissions: FormPermissions;
  workflowId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
}

// ============ SUBMISSION TYPES ============

export type SubmissionStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  formId: string;
  formVersion: number;
  data: Record<string, unknown>;
  status: SubmissionStatus;
  submittedBy: string;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmissionWithDetails extends Submission {
  form: Form;
  submitter: User;
  workflowInstance?: WorkflowInstance;
}

// ============ WORKFLOW TYPES ============

export type WorkflowStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected';

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  order: number;
  approverRoles: AppRole[];
  requiredApprovals: number;
  autoApprove?: boolean;
  timeoutDays?: number;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WorkflowStepInstance {
  stepId: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  approvals: WorkflowApproval[];
  startedAt?: Date;
  completedAt?: Date;
}

export interface WorkflowApproval {
  id: string;
  userId: string;
  action: 'approve' | 'reject';
  comment?: string;
  createdAt: Date;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  submissionId: string;
  currentStepIndex: number;
  status: WorkflowStatus;
  stepInstances: WorkflowStepInstance[];
  startedAt: Date;
  completedAt?: Date;
}

// ============ AUDIT TYPES ============

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ============ API TYPES ============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  [key: string]: unknown;
}
