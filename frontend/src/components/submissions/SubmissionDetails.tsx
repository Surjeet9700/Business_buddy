import { SubmissionWithDetails, WorkflowStep } from '@/types';
import { WorkflowStepper } from './WorkflowStepper';
import { DecisionPanel } from './DecisionPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, User, Calendar, Hash, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmissionDetailsProps {
  submission: SubmissionWithDetails;
  workflowSteps: WorkflowStep[];
  canApprove: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export function SubmissionDetails({
  submission,
  workflowSteps,
  canApprove,
  onApprove,
  onReject,
}: SubmissionDetailsProps) {
  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(dateObj);
  };

  const renderFieldValue = (key: string, value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">Not provided</span>;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
      const date = value instanceof Date ? value : new Date(value);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value);
  };

  const formatFieldLabel = (key: string) => {
    // Try to find the field label from form schema
    const form = submission.form as any;
    const schema = form?.schema;
    if (schema?.fields && Array.isArray(schema.fields)) {
      const field = schema.fields.find((f: any) => f.id === key || f.name === key);
      if (field?.label) {
        return field.label;
      }
    }
    // Fallback: convert key to readable format
    return key
      .replace(/^field[-_]/i, '') // Remove field prefix
      .replace(/[-_](\d+)$/, '') // Remove timestamp suffix
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim() || key;
  };

  const currentStepIndex =
    submission.workflowInstance?.currentStepIndex ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-card">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground">
              {submission.form?.name || 'Unknown Form'}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {submission.form?.description || ''}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Metadata section */}
          <section aria-labelledby="metadata-heading">
            <h3
              id="metadata-heading"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3"
            >
              Submission Details
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <dt className="text-xs text-muted-foreground">ID</dt>
              </div>
              <dd className="text-sm font-mono text-foreground">{submission.id}</dd>

              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <dt className="text-xs text-muted-foreground">Submitted by</dt>
              </div>
              <dd className="text-sm text-foreground">{submission.submitter?.name || 'Unknown User'}</dd>

              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <dt className="text-xs text-muted-foreground">Created</dt>
              </div>
              <dd className="text-sm text-foreground">
                {formatDate(submission.createdAt)}
              </dd>

              {submission.submittedAt && (
                <>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    <dt className="text-xs text-muted-foreground">Submitted</dt>
                  </div>
                  <dd className="text-sm text-foreground">
                    {formatDate(submission.submittedAt)}
                  </dd>
                </>
              )}
            </dl>
          </section>

          <Separator />

          {/* Workflow section */}
          {workflowSteps.length > 0 && (
            <section aria-labelledby="workflow-heading">
              <h3
                id="workflow-heading"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4"
              >
                Approval Workflow
              </h3>
              <WorkflowStepper
                steps={workflowSteps}
                stepInstances={submission.workflowInstance?.stepInstances}
                currentStepIndex={currentStepIndex}
                orientation="vertical"
              />
            </section>
          )}

          <Separator />

          {/* Form data section */}
          <section aria-labelledby="form-data-heading">
            <h3
              id="form-data-heading"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3"
            >
              Form Responses
            </h3>
            <div className="space-y-3">
              {Object.entries(submission.data).map(([key, value]) => (
                <div
                  key={key}
                  className={cn(
                    'rounded-md border border-border bg-muted/30 p-3'
                  )}
                >
                  <dt className="text-xs font-medium text-muted-foreground mb-1">
                    {formatFieldLabel(key)}
                  </dt>
                  <dd className="text-sm text-foreground">
                    {renderFieldValue(key, value)}
                  </dd>
                </div>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Decision panel - fixed at bottom */}
      {submission.status === 'submitted' && (
        <DecisionPanel
          canApprove={canApprove}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}
    </div>
  );
}