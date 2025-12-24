import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, XCircle, AlertTriangle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DecisionPanelProps {
  canApprove: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export function DecisionPanel({
  canApprove,
  onApprove,
  onReject,
}: DecisionPanelProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    await onApprove();
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setIsSubmitting(true);
    await onReject(rejectReason);
    setIsSubmitting(false);
    setShowRejectDialog(false);
    setRejectReason('');
  };

  return (
    <>
      <div
        className={cn(
          'flex-shrink-0 border-t border-border bg-card p-4',
          !canApprove && 'bg-muted/50'
        )}
        role="region"
        aria-label="Approval decision panel"
      >
        {canApprove ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Review the submission above and make a decision.
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                aria-label="Approve this submission"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={isSubmitting}
                className="flex-1"
                aria-label="Reject this submission"
              >
                <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                Reject
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Lock className="h-4 w-4" aria-hidden="true" />
            <p className="text-sm">
              You don't have permission to approve this submission.
            </p>
          </div>
        )}
      </div>

      {/* Rejection confirmation dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle>Reject Submission</DialogTitle>
                <DialogDescription className="mt-1">
                  This action cannot be undone. The submitter will be notified.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            <label
              htmlFor="reject-reason"
              className="text-sm font-medium text-foreground"
            >
              Reason for rejection
              <span className="text-destructive ml-1" aria-hidden="true">*</span>
            </label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a clear reason for rejection..."
              className="mt-2 min-h-[100px]"
              required
              aria-required="true"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              This reason will be recorded in the audit log and visible to the submitter.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || isSubmitting}
            >
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}