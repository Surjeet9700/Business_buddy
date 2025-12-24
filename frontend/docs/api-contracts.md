# ============================================
# BUSINESS BUDDY - REST API CONTRACTS
# Express.js + TypeScript
# ============================================

## Base Configuration

```
Base URL: /api/v1
Content-Type: application/json
Authentication: Bearer JWT in Authorization header
```

## Standard Response Envelope

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>; // Field-level validation errors
  };
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

# AUTHENTICATION ENDPOINTS

## POST /api/v1/auth/register

Create new user account.

**Auth Required:** No

**Request Body:**
```typescript
{
  email: string;      // Valid email, max 255 chars
  password: string;   // Min 8 chars, 1 uppercase, 1 number, 1 special
  name: string;       // 2-100 chars
}
```

**Response 201:**
```typescript
{
  success: true,
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      createdAt: string; // ISO 8601
    },
    message: "Account created. Please verify your email."
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` - Invalid input
- `409 CONFLICT` - Email already registered

---

## POST /api/v1/auth/login

Authenticate user and receive tokens.

**Auth Required:** No

**Rate Limit:** 5 attempts per 15 minutes per IP

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response 200:**
```typescript
{
  success: true,
  data: {
    accessToken: string;  // JWT, expires in 15 minutes
    refreshToken: string; // Opaque token, expires in 7 days
    expiresIn: 900;       // Seconds
    user: {
      id: string;
      email: string;
      name: string;
      roles: AppRole[];
    }
  }
}
```

**Errors:**
- `401 UNAUTHORIZED` - Invalid credentials
- `403 FORBIDDEN` - Account disabled
- `429 RATE_LIMITED` - Too many attempts

---

## POST /api/v1/auth/refresh

Refresh access token.

**Auth Required:** No (uses refresh token)

**Request Body:**
```typescript
{
  refreshToken: string;
}
```

**Response 200:**
```typescript
{
  success: true,
  data: {
    accessToken: string;
    expiresIn: 900;
  }
}
```

---

## POST /api/v1/auth/logout

Revoke refresh token.

**Auth Required:** Yes

**Request Body:**
```typescript
{
  refreshToken: string;
}
```

**Response 200:**
```typescript
{
  success: true,
  data: { message: "Logged out successfully" }
}
```

---

## GET /api/v1/auth/me

Get current authenticated user.

**Auth Required:** Yes

**Response 200:**
```typescript
{
  success: true,
  data: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    roles: AppRole[];
    permissions: string[]; // ["forms:create", "submissions:approve", ...]
    createdAt: string;
  }
}
```

---

# USER MANAGEMENT ENDPOINTS

## GET /api/v1/users

List all users (admin only).

**Auth Required:** Yes  
**Permissions:** `users:read`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Items per page (max 100) |
| search | string | - | Search by name/email |
| role | AppRole | - | Filter by role |
| isActive | boolean | - | Filter by status |
| sortBy | string | createdAt | Sort field |
| sortOrder | asc\|desc | desc | Sort direction |

**Response 200:**
```typescript
{
  success: true,
  data: User[],
  meta: { page, pageSize, total, totalPages }
}
```

---

## GET /api/v1/users/:id

Get user by ID.

**Auth Required:** Yes  
**Permissions:** `users:read` or own user

**Response 200:**
```typescript
{
  success: true,
  data: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    roles: AppRole[];
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
  }
}
```

---

## POST /api/v1/users

Create user (admin only).

**Auth Required:** Yes  
**Permissions:** `users:create`

**Request Body:**
```typescript
{
  email: string;
  password: string;
  name: string;
  roles: AppRole[]; // At least one role required
}
```

**Response 201:** User object

---

## PATCH /api/v1/users/:id

Update user.

**Auth Required:** Yes  
**Permissions:** `users:update` or own user (limited fields)

**Request Body:**
```typescript
{
  name?: string;
  avatar?: string;
  isActive?: boolean;     // Admin only
}
```

---

## PATCH /api/v1/users/:id/roles

Update user roles (admin only).

**Auth Required:** Yes  
**Permissions:** `users:update`

**Request Body:**
```typescript
{
  roles: AppRole[]; // Complete role list (replaces existing)
}
```

**Response 200:** Updated user with roles

**Audit:** Logs role change with before/after values

---

## POST /api/v1/users/:id/reset-password

Reset user password (admin) or request reset (self).

**Auth Required:** Yes  
**Permissions:** `users:update` for others

---

# FORMS ENDPOINTS

## GET /api/v1/forms

List forms user can access.

**Auth Required:** Yes  
**Permissions:** Filtered by `canView` permissions

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 20 | Items per page |
| search | string | - | Search by name |
| isActive | boolean | - | Filter by status |
| hasWorkflow | boolean | - | Filter by workflow attachment |

**Response 200:**
```typescript
{
  success: true,
  data: Form[],
  meta: { page, pageSize, total, totalPages }
}
```

---

## GET /api/v1/forms/:id

Get form by ID with current version schema.

**Auth Required:** Yes  
**Permissions:** Must have `canView` for this form

**Response 200:**
```typescript
{
  success: true,
  data: {
    id: string;
    name: string;
    description: string | null;
    currentVersion: number;
    schema: FormSchema;      // Current version fields
    permissions: FormPermissions;
    workflow: Workflow | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }
}
```

---

## POST /api/v1/forms

Create new form.

**Auth Required:** Yes  
**Permissions:** `forms:create`

**Request Body:**
```typescript
{
  name: string;           // 1-200 chars
  description?: string;   // Max 1000 chars
  schema: {
    fields: FormField[];
  };
  permissions: {
    canView: AppRole[];
    canSubmit: AppRole[];
    canApprove: AppRole[];
  };
  workflowId?: string;
}
```

**Response 201:** Created form object

**Behavior:**
- Creates form with version 1
- Stores schema in FormVersion table

---

## PUT /api/v1/forms/:id

Update form (creates new version).

**Auth Required:** Yes  
**Permissions:** `forms:update`

**Request Body:**
```typescript
{
  name?: string;
  description?: string;
  schema?: {
    fields: FormField[];
  };
  permissions?: FormPermissions;
  workflowId?: string | null;
  isActive?: boolean;
  changelog?: string;      // Description of changes
}
```

**Behavior:**
- If `schema` is provided, increments version and creates new FormVersion
- Old submissions retain their original form version

---

## GET /api/v1/forms/:id/versions

List all versions of a form.

**Auth Required:** Yes  
**Permissions:** `forms:read`

**Response 200:**
```typescript
{
  success: true,
  data: FormVersion[]
}
```

---

## DELETE /api/v1/forms/:id

Soft-delete form (set isActive=false).

**Auth Required:** Yes  
**Permissions:** `forms:delete`

**Response 200:**
```typescript
{
  success: true,
  data: { message: "Form deactivated" }
}
```

**Note:** Forms with submissions cannot be hard-deleted.

---

# SUBMISSIONS ENDPOINTS

## GET /api/v1/submissions

List submissions.

**Auth Required:** Yes  
**Permissions:** 
- Admin/Manager: See all
- Contributor: Own submissions + forms they can approve
- Viewer: Own submissions only

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| formId | string | Filter by form |
| status | SubmissionStatus | Filter by status |
| submittedBy | string | Filter by submitter (admin only) |
| dateFrom | ISO date | Created after |
| dateTo | ISO date | Created before |

**Response 200:** Paginated submission list with form and submitter details

---

## GET /api/v1/submissions/:id

Get submission details.

**Auth Required:** Yes  
**Permissions:** Owner, approver role, or admin

**Response 200:**
```typescript
{
  success: true,
  data: {
    id: string;
    form: Form;
    formVersion: number;
    data: Record<string, unknown>;
    status: SubmissionStatus;
    submitter: User;
    submittedAt: string | null;
    workflowInstance: WorkflowInstance | null;
    createdAt: string;
    updatedAt: string;
  }
}
```

---

## POST /api/v1/submissions

Create new submission.

**Auth Required:** Yes  
**Permissions:** Must have `canSubmit` for the form

**Request Body:**
```typescript
{
  formId: string;
  data: Record<string, unknown>;
  submitNow?: boolean;    // If true, immediately submit (not draft)
}
```

**Response 201:** Created submission

**Behavior:**
- Validates data against form schema
- If `submitNow=true` and form has workflow, creates WorkflowInstance
- Status = draft if submitNow=false, else submitted

---

## PATCH /api/v1/submissions/:id

Update draft submission.

**Auth Required:** Yes  
**Permissions:** Owner only, status must be `draft`

**Request Body:**
```typescript
{
  data?: Record<string, unknown>;
}
```

---

## POST /api/v1/submissions/:id/submit

Submit a draft submission.

**Auth Required:** Yes  
**Permissions:** Owner only, status must be `draft`

**Response 200:** Updated submission with status=submitted

**Behavior:**
- Sets submittedAt timestamp
- Creates WorkflowInstance if form has workflow
- Cannot be undone

---

## POST /api/v1/submissions/:id/approve

Approve submission at current workflow step.

**Auth Required:** Yes  
**Permissions:** User role must be in step's `approverRoles`

**Request Body:**
```typescript
{
  comment?: string;  // Max 500 chars
}
```

**Response 200:** Updated submission and workflow state

**Behavior:**
- Creates WorkflowApproval record
- If required approvals met, advances to next step
- If final step completed, sets submission status=approved

---

## POST /api/v1/submissions/:id/reject

Reject submission.

**Auth Required:** Yes  
**Permissions:** User role must be in current step's `approverRoles`

**Request Body:**
```typescript
{
  comment: string;   // Required, 10-500 chars
}
```

**Response 200:** Updated submission with status=rejected

**Behavior:**
- Immediately terminates workflow
- Sets completedAt on WorkflowInstance

---

# WORKFLOW ENDPOINTS

## GET /api/v1/workflows

List workflows.

**Auth Required:** Yes  
**Permissions:** `workflows:read`

**Response 200:** Paginated workflow list

---

## GET /api/v1/workflows/:id

Get workflow with steps.

**Auth Required:** Yes  
**Permissions:** `workflows:read`

**Response 200:**
```typescript
{
  success: true,
  data: {
    id: string;
    name: string;
    description: string | null;
    steps: WorkflowStep[];
    isActive: boolean;
    formsCount: number;  // Number of forms using this workflow
    createdAt: string;
  }
}
```

---

## POST /api/v1/workflows

Create workflow.

**Auth Required:** Yes  
**Permissions:** `workflows:create`

**Request Body:**
```typescript
{
  name: string;          // 1-200 chars
  description?: string;
  steps: {
    name: string;
    description?: string;
    approverRoles: AppRole[];
    requiredApprovals?: number;   // Default 1
    autoApprove?: boolean;        // Default false
    timeoutDays?: number;
  }[];
}
```

**Validation:**
- At least 1 step required
- Steps must have at least 1 approverRole
- Order is determined by array index

---

## PUT /api/v1/workflows/:id

Update workflow.

**Auth Required:** Yes  
**Permissions:** `workflows:update`

**Request Body:** Same as create

**Warning:** Changes only affect new workflow instances, not in-progress ones.

---

## DELETE /api/v1/workflows/:id

Deactivate workflow.

**Auth Required:** Yes  
**Permissions:** `workflows:delete`

**Behavior:** Cannot delete if forms are attached.

---

# ANALYTICS ENDPOINTS

## GET /api/v1/analytics/dashboard

Get dashboard statistics.

**Auth Required:** Yes  
**Permissions:** Any authenticated user (scoped to their access)

**Response 200:**
```typescript
{
  success: true,
  data: {
    forms: {
      total: number;
      active: number;
    };
    submissions: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      thisMonth: number;
    };
    workflows: {
      active: number;
      avgCompletionDays: number;
    };
  }
}
```

---

## GET /api/v1/analytics/submissions

Get submission trends.

**Auth Required:** Yes  
**Permissions:** `analytics:read`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| period | day\|week\|month | month | Aggregation period |
| dateFrom | ISO date | -6 months | Start date |
| dateTo | ISO date | now | End date |
| formId | string | - | Filter by form |

**Response 200:**
```typescript
{
  success: true,
  data: {
    period: string;
    submitted: number;
    approved: number;
    rejected: number;
  }[]
}
```

---

# AUDIT ENDPOINTS

## GET /api/v1/audit-logs

List audit logs (admin only).

**Auth Required:** Yes  
**Permissions:** `audit:read`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| userId | string | Filter by user |
| action | AuditAction | Filter by action type |
| resource | string | Filter by resource type |
| resourceId | string | Filter by specific resource |
| dateFrom | ISO date | Start date |
| dateTo | ISO date | End date |

**Response 200:** Paginated audit log entries

---

# HEALTHCHECK

## GET /api/v1/health

**Auth Required:** No

**Response 200:**
```typescript
{
  status: "healthy",
  timestamp: string,
  version: string,
  database: "connected" | "disconnected"
}
```
