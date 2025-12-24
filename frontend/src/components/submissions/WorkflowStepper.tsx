import { cn } from '@/lib/utils';
import { Check, Circle, X, Clock } from 'lucide-react';
import { WorkflowStep, WorkflowStepInstance } from '@/types';

interface WorkflowStepperProps {
  steps: WorkflowStep[];
  stepInstances?: WorkflowStepInstance[];
  currentStepIndex: number;
  orientation?: 'horizontal' | 'vertical';
}

type StepStatus = 'completed' | 'current' | 'pending' | 'rejected' | 'skipped';

interface StepDisplayData {
  step: WorkflowStep;
  status: StepStatus;
  actor?: string;
  timestamp?: Date;
  comment?: string;
}

export function WorkflowStepper({
  steps,
  stepInstances = [],
  currentStepIndex,
  orientation = 'horizontal',
}: WorkflowStepperProps) {
  const getStepDisplayData = (step: WorkflowStep, index: number): StepDisplayData => {
    const instance = stepInstances.find((si) => si.stepId === step.id);
    
    let status: StepStatus = 'pending';
    if (instance) {
      if (instance.status === 'approved') status = 'completed';
      else if (instance.status === 'rejected') status = 'rejected';
      else if (instance.status === 'skipped') status = 'skipped';
      else if (index === currentStepIndex) status = 'current';
    } else if (index < currentStepIndex) {
      status = 'completed';
    } else if (index === currentStepIndex) {
      status = 'current';
    }

    const lastApproval = instance?.approvals?.[instance.approvals.length - 1];

    return {
      step,
      status,
      actor: lastApproval ? 'System User' : undefined,
      timestamp: instance?.completedAt || instance?.startedAt,
      comment: lastApproval?.comment,
    };
  };

  const stepData = steps.map((step, index) => getStepDisplayData(step, index));

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <Check className="h-3.5 w-3.5" aria-hidden="true" />;
      case 'rejected':
        return <X className="h-3.5 w-3.5" aria-hidden="true" />;
      case 'current':
        return <Clock className="h-3.5 w-3.5" aria-hidden="true" />;
      default:
        return <Circle className="h-2.5 w-2.5" aria-hidden="true" />;
    }
  };

  const getStatusStyles = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'rejected':
        return 'bg-destructive text-destructive-foreground';
      case 'current':
        return 'bg-primary text-primary-foreground';
      case 'skipped':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getConnectorStyles = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'rejected':
        return 'bg-destructive';
      default:
        return 'bg-border';
    }
  };

  const formatTimestamp = (date?: Date) => {
    if (!date) return null;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  if (orientation === 'vertical') {
    return (
      <nav aria-label="Workflow progress" className="w-full">
        <ol className="relative space-y-0" role="list">
          {stepData.map((data, index) => (
            <li
              key={data.step.id}
              className="relative pb-6 last:pb-0"
              aria-current={data.status === 'current' ? 'step' : undefined}
            >
              {/* Connector line */}
              {index < stepData.length - 1 && (
                <div
                  className={cn(
                    'absolute left-[11px] top-6 h-[calc(100%-12px)] w-0.5',
                    getConnectorStyles(data.status)
                  )}
                  aria-hidden="true"
                />
              )}

              <div className="flex items-start gap-3">
                {/* Step indicator */}
                <div
                  className={cn(
                    'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                    getStatusStyles(data.status)
                  )}
                  aria-hidden="true"
                >
                  {getStatusIcon(data.status)}
                </div>

                {/* Step content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        data.status === 'current'
                          ? 'text-foreground'
                          : data.status === 'pending'
                          ? 'text-muted-foreground'
                          : 'text-foreground'
                      )}
                    >
                      {data.step.name}
                    </p>
                    {data.timestamp && (
                      <time
                        dateTime={data.timestamp.toISOString()}
                        className="text-xs text-muted-foreground tabular-nums"
                      >
                        {formatTimestamp(data.timestamp)}
                      </time>
                    )}
                  </div>

                  {data.step.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {data.step.description}
                    </p>
                  )}

                  {data.actor && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium">{data.actor}</span>
                    </p>
                  )}

                  {data.comment && (
                    <p className="mt-1.5 text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                      "{data.comment}"
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  // Horizontal orientation
  return (
    <nav aria-label="Workflow progress" className="w-full">
      <ol className="flex items-start" role="list">
        {stepData.map((data, index) => (
          <li
            key={data.step.id}
            className={cn('relative', index < stepData.length - 1 && 'flex-1')}
            aria-current={data.status === 'current' ? 'step' : undefined}
          >
            <div className="flex items-center">
              {/* Step indicator */}
              <div
                className={cn(
                  'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  getStatusStyles(data.status)
                )}
                aria-hidden="true"
              >
                {getStatusIcon(data.status)}
              </div>

              {/* Connector line */}
              {index < stepData.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2',
                    getConnectorStyles(data.status)
                  )}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Step content */}
            <div className="mt-2 pr-4">
              <p
                className={cn(
                  'text-xs font-medium',
                  data.status === 'current'
                    ? 'text-foreground'
                    : data.status === 'pending'
                    ? 'text-muted-foreground'
                    : 'text-foreground'
                )}
              >
                {data.step.name}
              </p>
              {data.timestamp && (
                <time
                  dateTime={data.timestamp.toISOString()}
                  className="text-xs text-muted-foreground tabular-nums"
                >
                  {formatTimestamp(data.timestamp)}
                </time>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}