# ============================================
# BUSINESS BUDDY - RBAC & SECURITY SPECIFICATION
# ============================================

## 1. ROLE HIERARCHY

```
admin (highest)
  └── manager
        └── contributor
              └── viewer (lowest)
```

Higher roles inherit all permissions of lower roles.

---

## 2. PERMISSION MATRIX

| Resource      | Action  | viewer | contributor | manager | admin |
|---------------|---------|--------|-------------|---------|-------|
| **forms**     | read    | ✓*     | ✓*          | ✓*      | ✓     |
| **forms**     | create  | ✗      | ✗           | ✓       | ✓     |
| **forms**     | update  | ✗      | ✗           | ✓       | ✓     |
| **forms**     | delete  | ✗      | ✗           | ✗       | ✓     |
| **submissions** | read  | own    | own+assign  | ✓       | ✓     |
| **submissions** | create| ✓*     | ✓*          | ✓*      | ✓     |
| **submissions** | update| own    | own         | ✓       | ✓     |
| **submissions** | approve| ✗     | ✓*          | ✓*      | ✓     |
| **workflows** | read    | ✗      | ✗           | ✓       | ✓     |
| **workflows** | create  | ✗      | ✗           | ✗       | ✓     |
| **workflows** | update  | ✗      | ✗           | ✗       | ✓     |
| **workflows** | delete  | ✗      | ✗           | ✗       | ✓     |
| **users**     | read    | ✗      | ✗           | ✓       | ✓     |
| **users**     | create  | ✗      | ✗           | ✗       | ✓     |
| **users**     | update  | self   | self        | self    | ✓     |
| **users**     | delete  | ✗      | ✗           | ✗       | ✓     |
| **analytics** | read    | ✗      | ✗           | ✓       | ✓     |
| **audit**     | read    | ✗      | ✗           | ✗       | ✓     |

`*` = Subject to form-level permissions (canView, canSubmit, canApprove)

---

## 3. RBAC MIDDLEWARE IMPLEMENTATION

```typescript
// middleware/rbac.ts

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppRole, PermissionAction } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    roles: AppRole[];
    permissions: string[];
  };
}

/**
 * Permission string format: "resource:action"
 * Examples: "forms:create", "submissions:approve", "users:update"
 */
export function requirePermission(resource: string, action: PermissionAction) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const permissionKey = `${resource}:${action}`;
    
    // Check if user has the required permission
    if (!req.user.permissions.includes(permissionKey)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Missing permission: ${permissionKey}`
        }
      });
    }
    
    next();
  };
}

/**
 * Require specific roles (any of the listed roles)
 */
export function requireRoles(...allowedRoles: AppRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient role privileges'
        }
      });
    }
    
    next();
  };
}

/**
 * Check form-level permissions
 */
export function requireFormPermission(permissionType: 'canView' | 'canSubmit' | 'canApprove') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const formId = req.params.formId || req.params.id || req.body.formId;
    
    if (!formId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Form ID required' }
      });
    }
    
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: { permissions: true }
    });
    
    if (!form) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Form not found' }
      });
    }
    
    const permissions = form.permissions as { canView: AppRole[]; canSubmit: AppRole[]; canApprove: AppRole[] };
    const allowedRoles = permissions[permissionType];
    
    // Admin always has access
    if (req.user.roles.includes('admin')) {
      return next();
    }
    
    const hasPermission = req.user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `You don't have ${permissionType} permission for this form`
        }
      });
    }
    
    next();
  };
}

/**
 * Ensure user can only access their own resources (or admin override)
 */
export function requireOwnershipOrAdmin(userIdField: string = 'submittedBy') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Admin bypasses ownership check
    if (req.user.roles.includes('admin')) {
      return next();
    }
    
    const resourceId = req.params.id;
    const resource = await prisma.submission.findUnique({
      where: { id: resourceId },
      select: { [userIdField]: true }
    });
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found' }
      });
    }
    
    if (resource[userIdField] !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only access your own resources'
        }
      });
    }
    
    next();
  };
}

/**
 * Check workflow step approval permission
 */
export function requireWorkflowApprovalRole() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const submissionId = req.params.id;
    
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        workflowInstance: {
          include: {
            workflow: {
              include: {
                steps: true
              }
            }
          }
        }
      }
    });
    
    if (!submission?.workflowInstance) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'No workflow attached to this submission' }
      });
    }
    
    const currentStepIndex = submission.workflowInstance.currentStepIndex;
    const currentStep = submission.workflowInstance.workflow.steps.find(
      s => s.order === currentStepIndex + 1
    );
    
    if (!currentStep) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Workflow already completed' }
      });
    }
    
    const canApprove = req.user.roles.some(role => 
      currentStep.approverRoles.includes(role)
    );
    
    if (!canApprove) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `This step requires one of these roles: ${currentStep.approverRoles.join(', ')}`
        }
      });
    }
    
    // Attach step info to request for handler use
    (req as any).workflowStep = currentStep;
    next();
  };
}
```

---

## 4. ROLE-PERMISSION SEED DATA

```typescript
// prisma/seed.ts

const permissions = [
  // Forms
  { name: 'forms:read', resource: 'forms', action: 'read' },
  { name: 'forms:create', resource: 'forms', action: 'create' },
  { name: 'forms:update', resource: 'forms', action: 'update' },
  { name: 'forms:delete', resource: 'forms', action: 'delete' },
  // Submissions
  { name: 'submissions:read', resource: 'submissions', action: 'read' },
  { name: 'submissions:create', resource: 'submissions', action: 'create' },
  { name: 'submissions:update', resource: 'submissions', action: 'update' },
  { name: 'submissions:approve', resource: 'submissions', action: 'approve' },
  // Workflows
  { name: 'workflows:read', resource: 'workflows', action: 'read' },
  { name: 'workflows:create', resource: 'workflows', action: 'create' },
  { name: 'workflows:update', resource: 'workflows', action: 'update' },
  { name: 'workflows:delete', resource: 'workflows', action: 'delete' },
  // Users
  { name: 'users:read', resource: 'users', action: 'read' },
  { name: 'users:create', resource: 'users', action: 'create' },
  { name: 'users:update', resource: 'users', action: 'update' },
  { name: 'users:delete', resource: 'users', action: 'delete' },
  // Analytics & Audit
  { name: 'analytics:read', resource: 'analytics', action: 'read' },
  { name: 'audit:read', resource: 'audit', action: 'read' },
];

const rolePermissions = {
  admin: [
    'forms:read', 'forms:create', 'forms:update', 'forms:delete',
    'submissions:read', 'submissions:create', 'submissions:update', 'submissions:approve',
    'workflows:read', 'workflows:create', 'workflows:update', 'workflows:delete',
    'users:read', 'users:create', 'users:update', 'users:delete',
    'analytics:read', 'audit:read'
  ],
  manager: [
    'forms:read', 'forms:create', 'forms:update',
    'submissions:read', 'submissions:create', 'submissions:update', 'submissions:approve',
    'workflows:read',
    'users:read',
    'analytics:read'
  ],
  contributor: [
    'forms:read',
    'submissions:read', 'submissions:create', 'submissions:update', 'submissions:approve'
  ],
  viewer: [
    'forms:read',
    'submissions:read', 'submissions:create'
  ]
};
```

---

## 5. AUTHENTICATION FLOW

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                          │
└─────────────────────────────────────────────────────────────────────┘

1. LOGIN REQUEST
   ┌────────┐     POST /auth/login      ┌────────┐
   │ Client │ ────────────────────────► │ Server │
   └────────┘   { email, password }     └────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │ Validate creds  │
                                    │ Check rate limit│
                                    │ Verify password │
                                    └─────────────────┘
                                              │
                                              ▼
   ┌────────┐     { accessToken,        ┌────────┐
   │ Client │ ◄──────refreshToken }──── │ Server │
   └────────┘                           └────────┘

2. AUTHENTICATED REQUEST
   ┌────────┐  Authorization: Bearer    ┌────────┐
   │ Client │ ───────{accessToken}────► │ Server │
   └────────┘                           └────────┘
                                              │
                                    ┌─────────▼─────────┐
                                    │ Verify JWT        │
                                    │ Extract user ID   │
                                    │ Load permissions  │
                                    │ Check RBAC        │
                                    └───────────────────┘
                                              │
   ┌────────┐       { data }          ┌───────▼──┐
   │ Client │ ◄────────────────────── │  Server  │
   └────────┘                         └──────────┘

3. TOKEN REFRESH
   ┌────────┐  POST /auth/refresh       ┌────────┐
   │ Client │ ──────────────────────► │ Server │
   └────────┘   { refreshToken }        └────────┘
                                              │
                                    ┌─────────▼─────────┐
                                    │ Validate token    │
                                    │ Check not revoked │
                                    │ Check expiry      │
                                    └───────────────────┘
                                              │
   ┌────────┐   { newAccessToken }    ┌───────▼──┐
   │ Client │ ◄────────────────────── │  Server  │
   └────────┘                         └──────────┘
```

---

## 6. JWT STRUCTURE

```typescript
// Access Token Payload (15 min expiry)
interface AccessTokenPayload {
  sub: string;           // User ID
  email: string;
  roles: AppRole[];
  iat: number;           // Issued at
  exp: number;           // Expiry
  type: 'access';
}

// Token Generation
import jwt from 'jsonwebtoken';

function generateAccessToken(user: User & { roles: AppRole[] }): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      type: 'access'
    },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}
```

---

## 7. SECURITY CHECKLIST

### Authentication
- [x] Passwords hashed with bcrypt (cost factor 12)
- [x] JWT access tokens with 15-minute expiry
- [x] Opaque refresh tokens stored in database
- [x] Refresh token rotation on use
- [x] Refresh tokens revocable
- [x] Rate limiting on login (5 attempts / 15 min)
- [x] Account lockout after 10 failed attempts

### Authorization
- [x] All routes require authentication except /auth/*
- [x] RBAC middleware on all protected routes
- [x] Resource-level permission checks
- [x] Ownership verification for user resources
- [x] Admin cannot delete themselves
- [x] Roles cannot be changed without audit log

### Input Validation
- [x] Zod schema validation on all endpoints
- [x] Email format validation
- [x] Password complexity requirements
- [x] String length limits on all text fields
- [x] JSON schema validation for form data
- [x] UUID format validation on IDs

### HTTP Security
- [x] Helmet.js for secure headers
- [x] CORS whitelist configuration
- [x] CSRF tokens for state-changing requests
- [x] Rate limiting on all endpoints
- [x] Request body size limits (1MB max)

### Data Protection
- [x] SQL injection prevention (Prisma parameterized queries)
- [x] XSS prevention (output encoding)
- [x] Sensitive data never logged
- [x] Audit logging for critical actions
- [x] Soft deletes for user data

### Infrastructure
- [x] Environment variables for secrets
- [x] Database connection pooling
- [x] HTTPS only in production
- [x] Secure cookie flags (HttpOnly, Secure, SameSite)

---

## 8. VALIDATION SCHEMAS (ZOD)

```typescript
// validation/schemas.ts

import { z } from 'zod';

// Auth
export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128)
});

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  name: z.string().min(2).max(100)
});

// Forms
export const formFieldSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['text', 'number', 'email', 'dropdown', 'date', 'textarea', 'checkbox']),
  label: z.string().min(1).max(200),
  name: z.string().min(1).max(100).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  placeholder: z.string().max(200).optional(),
  helpText: z.string().max(500).optional(),
  options: z.array(z.object({
    label: z.string().min(1).max(100),
    value: z.string().min(1).max(100)
  })).optional(),
  validation: z.array(z.object({
    type: z.enum(['required', 'min', 'max', 'pattern', 'email', 'minLength', 'maxLength']),
    value: z.union([z.string(), z.number()]).optional(),
    message: z.string().max(200)
  })),
  order: z.number().int().positive()
});

export const createFormSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  schema: z.object({
    fields: z.array(formFieldSchema)
  }),
  permissions: z.object({
    canView: z.array(z.enum(['admin', 'manager', 'contributor', 'viewer'])),
    canSubmit: z.array(z.enum(['admin', 'manager', 'contributor', 'viewer'])),
    canApprove: z.array(z.enum(['admin', 'manager', 'contributor', 'viewer']))
  }),
  workflowId: z.string().uuid().optional()
});

// Workflows
export const workflowStepSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  approverRoles: z.array(z.enum(['admin', 'manager', 'contributor', 'viewer'])).min(1),
  requiredApprovals: z.number().int().min(1).max(10).default(1),
  autoApprove: z.boolean().default(false),
  timeoutDays: z.number().int().min(1).max(30).optional()
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  steps: z.array(workflowStepSchema).min(1).max(10)
});

// Submissions
export const createSubmissionSchema = z.object({
  formId: z.string().uuid(),
  data: z.record(z.unknown()),
  submitNow: z.boolean().default(false)
});

export const approvalSchema = z.object({
  comment: z.string().max(500).optional()
});

export const rejectionSchema = z.object({
  comment: z.string().min(10).max(500)
});

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});
```

---

## 9. DATABASE INDEXES

```sql
-- Performance-critical indexes (beyond what Prisma creates)

-- User lookups
CREATE INDEX idx_users_email_active ON users(email) WHERE is_active = true;

-- Submission queries (common filters)
CREATE INDEX idx_submissions_form_status ON submissions(form_id, status);
CREATE INDEX idx_submissions_user_status ON submissions(submitted_by, status);
CREATE INDEX idx_submissions_date_range ON submissions(created_at DESC);

-- Workflow instance lookups
CREATE INDEX idx_workflow_instances_status ON workflow_instances(status) WHERE status IN ('submitted', 'in_review');

-- Audit log queries
CREATE INDEX idx_audit_logs_user_date ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id, created_at DESC);

-- Composite for form permission checks
CREATE INDEX idx_forms_active_workflow ON forms(is_active, workflow_id) WHERE is_active = true;
```

---

## 10. RATE LIMITING CONFIGURATION

```typescript
// middleware/rateLimit.ts

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,                 // 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests' }
  }
});

// Strict auth rate limit
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 attempts
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again in 15 minutes.' }
  }
});

// Password reset limit
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many password reset attempts' }
  }
});
```
