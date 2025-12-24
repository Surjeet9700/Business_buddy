import { cn } from '@/lib/utils';
import { SubmissionWithDetails, SubmissionStatus } from '@/types';
import { FileText, Clock, CheckCircle2, XCircle, PenLine } from 'lucide-react';

interface SubmissionListItemProps {
  submission: SubmissionWithDetails;
  isSelected: boolean;
  onClick: () => void;
}

const statusConfig: Record<
  SubmissionStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  draft: {
    label: 'Draft',
    icon: PenLine,
    className: 'text-muted-foreground',
  },
  submitted: {
    label: 'Pending',
    icon: Clock,
    className: 'text-info',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    className: 'text-success',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'text-destructive',
  },
};

export function SubmissionListItem({
  submission,
  isSelected,
  onClick,
}: SubmissionListItemProps) {
  const status = statusConfig[submission.status];
  const StatusIcon = status.icon;

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(dateObj);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 border-b border-border transition-colors',
        'hover:bg-accent/50 focus:outline-none focus:bg-accent/50',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        isSelected && 'bg-accent border-l-2 border-l-primary'
      )}
      aria-selected={isSelected}
      aria-label={`Submission ${submission.id} - ${submission.form?.name || 'Unknown Form'} - ${status.label}`}
    >
      <div className="flex items-start gap-3">
        {/* Form icon */}
        <div className="flex-shrink-0 p-1.5 rounded bg-muted">
          <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {submission.form?.name || 'Unknown Form'}
            </p>
            <StatusIcon
              className={cn('h-4 w-4 flex-shrink-0', status.className)}
              aria-hidden="true"
            />
          </div>

          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {submission.submitter?.name || 'Unknown User'}
          </p>

          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-muted-foreground font-mono">
              {submission.id.substring(0, 8)}
            </span>
            <span className="text-muted-foreground">·</span>
            <time
              dateTime={(() => {
                try { return new Date(submission.createdAt).toISOString(); }
                catch { return ''; }
              })()}
              className="text-xs text-muted-foreground"
            >
              {formatDate(submission.createdAt)}
            </time>
          </div>
        </div>
      </div>
    </button>
  );
}