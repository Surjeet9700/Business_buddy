# ============================================
# BUSINESS BUDDY - WORKFLOW STATE MACHINE
# Server-side enforcement rules
# ============================================

## 1. STATE DIAGRAM

```
                              ┌───────────────────────────────────────────────────────┐
                              │                WORKFLOW STATE MACHINE                  │
                              └───────────────────────────────────────────────────────┘

                                                    ┌─────────┐
                                                    │  DRAFT  │
                                                    └────┬────┘
                                                         │
                                                   submit()
                                                         │
                                                         ▼
                                                  ┌───────────┐
                              ┌───────────────────│ SUBMITTED │───────────────────┐
                              │                   └─────┬─────┘                   │
                              │                         │                         │
                         reject()                  approve()                 reject()
                              │                         │                         │
                              │                         ▼                         │
                              │                  ┌───────────┐                    │
                              │    ┌─────────────│ IN_REVIEW │─────────────┐      │
                              │    │             └─────┬─────┘             │      │
                              │    │                   │                   │      │
                              │ reject()          approve()           reject()    │
                              │    │                   │                   │      │
                              │    │     ┌─────────────┴─────────────┐     │      │
                              │    │     │                           │     │      │
                              │    │     ▼                           ▼     │      │
                              │    │  [More Steps?]──Yes──►[Next Step]     │      │
                              │    │     │                                 │      │
                              │    │     No                                │      │
                              │    │     │                                 │      │
                              │    │     ▼                                 │      │
                              │    │ ┌──────────┐                          │      │
                              │    │ │ APPROVED │                          │      │
                              │    │ └──────────┘                          │      │
                              │    │                                       │      │
                              ▼    ▼                                       ▼      ▼
                           ┌──────────┐                                ┌──────────┐
                           │ REJECTED │◄───────────────────────────────│ REJECTED │
                           └──────────┘                                └──────────┘

                              TERMINAL STATES: APPROVED, REJECTED (no further transitions)
```

---

## 2. STATE DEFINITIONS

| State | Description | Allowed Actions |
|-------|-------------|-----------------|
| `draft` | Initial state, submission not yet submitted | `submit`, `update`, `delete` |
| `submitted` | Awaiting first approval step | `approve`, `reject` |
| `in_review` | In multi-step workflow, between steps | `approve`, `reject` |
| `approved` | All steps completed successfully | None (terminal) |
| `rejected` | Rejected at any step | None (terminal) |

---

## 3. TRANSITION RULES

### Valid Transitions

```typescript
const VALID_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  draft: ['submitted'],
  submitted: ['in_review', 'approved', 'rejected'],
  in_review: ['in_review', 'approved', 'rejected'],
  approved: [],   // Terminal
  rejected: [],   // Terminal
};
```

### Transition Conditions

| From | To | Condition |
|------|-----|-----------|
| draft → submitted | Submission data valid, user is owner |
| submitted → in_review | Current step approved, more steps remain |
| submitted → approved | Current step approved, no more steps |
| submitted → rejected | Approver rejects |
| in_review → in_review | Current step approved, more steps remain |
| in_review → approved | Final step approved |
| in_review → rejected | Any approver rejects |

---

## 4. IMPLEMENTATION

```typescript
// services/workflowEngine.ts

import { prisma } from '../lib/prisma';
import { 
  WorkflowStatus, 
  WorkflowStepStatus, 
  SubmissionStatus,
  AppRole 
} from '@prisma/client';
import { ForbiddenError, ValidationError } from '../lib/errors';

interface ApprovalContext {
  userId: string;
  userRoles: AppRole[];
  comment?: string;
}

export class WorkflowEngine {
  
  /**
   * Initialize workflow instance when submission is submitted
   */
  async startWorkflow(submissionId: string, workflowId: string): Promise<void> {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { steps: { orderBy: { order: 'asc' } } }
    });

    if (!workflow || !workflow.isActive) {
      throw new ValidationError('Workflow not found or inactive');
    }

    // Create workflow instance
    const instance = await prisma.workflowInstance.create({
      data: {
        workflowId,
        submissionId,
        status: 'submitted',
        currentStepIndex: 0,
        steps: {
          create: workflow.steps.map((step, index) => ({
            stepId: step.id,
            stepOrder: index,
            status: index === 0 ? 'pending' : 'pending'
          }))
        }
      }
    });

    // Update submission status
    await prisma.submission.update({
      where: { id: submissionId },
      data: { 
        status: 'submitted',
        submittedAt: new Date()
      }
    });

    // Check for auto-approve on first step
    const firstStep = workflow.steps[0];
    if (firstStep.autoApprove) {
      await this.autoApproveStep(instance.id, 0);
    }
  }

  /**
   * Process approval action
   */
  async approve(submissionId: string, context: ApprovalContext): Promise<void> {
    const submission = await this.getSubmissionWithWorkflow(submissionId);
    
    this.validateApprovalEligibility(submission, context);

    const instance = submission.workflowInstance!;
    const currentStep = instance.steps[instance.currentStepIndex];
    const stepDef = instance.workflow.steps.find(s => s.id === currentStep.stepId)!;

    // Record approval
    await prisma.workflowApproval.create({
      data: {
        workflowStepInstanceId: currentStep.id,
        userId: context.userId,
        action: 'approve',
        comment: context.comment
      }
    });

    // Check if required approvals met
    const approvalCount = await prisma.workflowApproval.count({
      where: {
        workflowStepInstanceId: currentStep.id,
        action: 'approve'
      }
    });

    if (approvalCount >= stepDef.requiredApprovals) {
      await this.advanceWorkflow(instance.id);
    }
  }

  /**
   * Process rejection action
   */
  async reject(submissionId: string, context: ApprovalContext): Promise<void> {
    if (!context.comment || context.comment.length < 10) {
      throw new ValidationError('Rejection requires a comment (min 10 chars)');
    }

    const submission = await this.getSubmissionWithWorkflow(submissionId);
    
    this.validateApprovalEligibility(submission, context);

    const instance = submission.workflowInstance!;
    const currentStep = instance.steps[instance.currentStepIndex];

    // Record rejection
    await prisma.workflowApproval.create({
      data: {
        workflowStepInstanceId: currentStep.id,
        userId: context.userId,
        action: 'reject',
        comment: context.comment
      }
    });

    // Immediately terminate workflow
    await prisma.$transaction([
      prisma.workflowStepInstance.update({
        where: { id: currentStep.id },
        data: { 
          status: 'rejected',
          completedAt: new Date()
        }
      }),
      prisma.workflowInstance.update({
        where: { id: instance.id },
        data: {
          status: 'rejected',
          completedAt: new Date()
        }
      }),
      prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'rejected' }
      })
    ]);
  }

  /**
   * Advance to next step or complete workflow
   */
  private async advanceWorkflow(instanceId: string): Promise<void> {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        workflow: { include: { steps: { orderBy: { order: 'asc' } } } },
        steps: { orderBy: { stepOrder: 'asc' } },
        submission: true
      }
    });

    if (!instance) throw new Error('Workflow instance not found');

    const currentStep = instance.steps[instance.currentStepIndex];
    const nextStepIndex = instance.currentStepIndex + 1;
    const isLastStep = nextStepIndex >= instance.workflow.steps.length;

    // Complete current step
    await prisma.workflowStepInstance.update({
      where: { id: currentStep.id },
      data: {
        status: 'approved',
        completedAt: new Date()
      }
    });

    if (isLastStep) {
      // Workflow complete
      await prisma.$transaction([
        prisma.workflowInstance.update({
          where: { id: instanceId },
          data: {
            status: 'approved',
            completedAt: new Date()
          }
        }),
        prisma.submission.update({
          where: { id: instance.submissionId },
          data: { status: 'approved' }
        })
      ]);
    } else {
      // Advance to next step
      const nextStepInstance = instance.steps[nextStepIndex];
      const nextStepDef = instance.workflow.steps[nextStepIndex];

      await prisma.$transaction([
        prisma.workflowInstance.update({
          where: { id: instanceId },
          data: {
            status: 'in_review',
            currentStepIndex: nextStepIndex
          }
        }),
        prisma.workflowStepInstance.update({
          where: { id: nextStepInstance.id },
          data: { startedAt: new Date() }
        })
      ]);

      // Check for auto-approve
      if (nextStepDef.autoApprove) {
        await this.autoApproveStep(instanceId, nextStepIndex);
      }
    }
  }

  /**
   * Auto-approve a step (for automated workflows)
   */
  private async autoApproveStep(instanceId: string, stepIndex: number): Promise<void> {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { steps: true }
    });

    if (!instance) return;

    const stepInstance = instance.steps[stepIndex];

    await prisma.workflowApproval.create({
      data: {
        workflowStepInstanceId: stepInstance.id,
        userId: 'SYSTEM',
        action: 'approve',
        comment: 'Auto-approved by workflow configuration'
      }
    });

    await this.advanceWorkflow(instanceId);
  }

  /**
   * Validate user can perform approval/rejection
   */
  private validateApprovalEligibility(
    submission: any,
    context: ApprovalContext
  ): void {
    if (!submission.workflowInstance) {
      throw new ValidationError('No workflow attached to this submission');
    }

    const instance = submission.workflowInstance;
    
    // Check workflow is in approvable state
    if (!['submitted', 'in_review'].includes(instance.status)) {
      throw new ValidationError(`Cannot modify workflow in ${instance.status} state`);
    }

    // Check user hasn't already approved this step
    const currentStep = instance.steps[instance.currentStepIndex];
    const hasApproved = currentStep.approvals.some(
      (a: any) => a.userId === context.userId
    );

    if (hasApproved) {
      throw new ValidationError('You have already submitted your decision for this step');
    }

    // Check user has required role
    const stepDef = instance.workflow.steps.find(
      (s: any) => s.id === currentStep.stepId
    );
    
    const hasRole = context.userRoles.some(
      role => stepDef.approverRoles.includes(role)
    );

    if (!hasRole) {
      throw new ForbiddenError(
        `This step requires one of: ${stepDef.approverRoles.join(', ')}`
      );
    }
  }

  /**
   * Get submission with full workflow context
   */
  private async getSubmissionWithWorkflow(submissionId: string) {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        workflowInstance: {
          include: {
            workflow: {
              include: { steps: { orderBy: { order: 'asc' } } }
            },
            steps: {
              include: { approvals: true },
              orderBy: { stepOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!submission) {
      throw new ValidationError('Submission not found');
    }

    return submission;
  }

  /**
   * Check for timed-out steps (run via cron job)
   */
  async processTimeouts(): Promise<void> {
    const now = new Date();

    // Find pending steps that have exceeded timeout
    const timedOutSteps = await prisma.$queryRaw<any[]>`
      SELECT wsi.id, wsi.workflow_instance_id, ws.timeout_days
      FROM workflow_step_instances wsi
      JOIN workflow_instances wi ON wsi.workflow_instance_id = wi.id
      JOIN workflow_steps ws ON wsi.step_id = ws.id
      WHERE wsi.status = 'pending'
        AND wsi.started_at IS NOT NULL
        AND ws.timeout_days IS NOT NULL
        AND wsi.started_at + (ws.timeout_days || ' days')::interval < ${now}
    `;

    for (const step of timedOutSteps) {
      // Auto-reject timed out steps
      await prisma.$transaction([
        prisma.workflowStepInstance.update({
          where: { id: step.id },
          data: {
            status: 'rejected',
            completedAt: now
          }
        }),
        prisma.workflowApproval.create({
          data: {
            workflowStepInstanceId: step.id,
            userId: 'SYSTEM',
            action: 'reject',
            comment: `Auto-rejected: exceeded ${step.timeout_days} day timeout`
          }
        }),
        prisma.workflowInstance.update({
          where: { id: step.workflow_instance_id },
          data: {
            status: 'rejected',
            completedAt: now
          }
        })
      ]);

      // Update parent submission
      const instance = await prisma.workflowInstance.findUnique({
        where: { id: step.workflow_instance_id },
        select: { submissionId: true }
      });

      if (instance) {
        await prisma.submission.update({
          where: { id: instance.submissionId },
          data: { status: 'rejected' }
        });
      }
    }
  }
}

export const workflowEngine = new WorkflowEngine();
```

---

## 5. AUDIT LOGGING FOR WORKFLOW EVENTS

```typescript
// All workflow transitions are logged automatically

const workflowAuditEvents = [
  'WORKFLOW_STARTED',
  'STEP_APPROVED', 
  'STEP_REJECTED',
  'STEP_AUTO_APPROVED',
  'STEP_TIMED_OUT',
  'WORKFLOW_COMPLETED',
  'WORKFLOW_REJECTED'
];

// Example audit log entry
{
  userId: 'user-123',
  action: 'APPROVE',
  resource: 'workflow_step',
  resourceId: 'step-instance-456',
  oldValue: { status: 'pending', approvals: 0 },
  newValue: { status: 'pending', approvals: 1 },
  createdAt: '2024-12-23T10:30:00Z'
}
```

---

## 6. INTEGRATION WITH SUBMISSION LIFECYCLE

```typescript
// routes/submissions.ts (simplified)

router.post('/:id/submit', 
  requireAuth,
  requireOwnership,
  async (req, res) => {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { form: true }
    });

    if (submission.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Can only submit draft submissions' 
      });
    }

    // Validate against form schema
    await validateSubmissionData(submission.data, submission.form);

    if (submission.form.workflowId) {
      // Start workflow
      await workflowEngine.startWorkflow(
        submission.id, 
        submission.form.workflowId
      );
    } else {
      // No workflow - auto-approve
      await prisma.submission.update({
        where: { id: submission.id },
        data: { 
          status: 'approved',
          submittedAt: new Date()
        }
      });
    }

    res.json({ success: true });
  }
);

router.post('/:id/approve',
  requireAuth,
  requireWorkflowApprovalRole,
  async (req, res) => {
    await workflowEngine.approve(req.params.id, {
      userId: req.user.id,
      userRoles: req.user.roles,
      comment: req.body.comment
    });

    // Audit log created by middleware

    res.json({ success: true });
  }
);

router.post('/:id/reject',
  requireAuth,
  requireWorkflowApprovalRole,
  async (req, res) => {
    await workflowEngine.reject(req.params.id, {
      userId: req.user.id,
      userRoles: req.user.roles,
      comment: req.body.comment
    });

    res.json({ success: true });
  }
);
```

---

## 7. CRON JOBS

```typescript
// jobs/workflowTimeoutJob.ts

import cron from 'node-cron';
import { workflowEngine } from '../services/workflowEngine';

// Run every hour to check for timed-out steps
cron.schedule('0 * * * *', async () => {
  console.log('Checking for workflow timeouts...');
  try {
    await workflowEngine.processTimeouts();
  } catch (error) {
    console.error('Timeout processing failed:', error);
  }
});
```
