import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SubmissionFilters } from '@/components/submissions/SubmissionFilters';
import { SubmissionListItem } from '@/components/submissions/SubmissionListItem';
import { SubmissionDetails } from '@/components/submissions/SubmissionDetails';
import { EmptyState } from '@/components/submissions/EmptyState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionService } from '@/services/submission.service';
import { formService } from '@/services/form.service';

// Mock current user permissions - in production, this comes from auth context
const currentUserCanApprove = true;

export default function SubmissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get selected ID from URL for persistence
  const selectedId = searchParams.get('id');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formFilter, setFormFilter] = useState<string>('all');

  // Fetch submissions
  const { data: submissionsData, isLoading } = useQuery({
    queryKey: ['submissions', searchQuery, statusFilter, formFilter],
    queryFn: async () => {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (formFilter !== 'all') params.formId = formFilter;
      return submissionService.getAll(params);
    }
  });

  const submissions = submissionsData?.data || [];

  // Fetch submitted forms filter options (all forms)
  const { data: formsData } = useQuery({
    queryKey: ['forms'],
    queryFn: () => formService.getAll()
  });

  const forms = formsData?.data || [];

  // Selected submission details
  const { data: selectedSubmission } = useQuery({
    queryKey: ['submission', selectedId],
    queryFn: () => submissionService.getById(selectedId!),
    enabled: !!selectedId
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string, comment?: string }) =>
      submissionService.approve(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission', selectedId] });
      toast({
        title: 'Submission Approved',
        description: `Submission ${selectedId} has been approved and moved to the next step.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to approve submission',
        variant: 'destructive',
      });
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string, reason?: string }) =>
      submissionService.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submission', selectedId] });
      toast({
        title: 'Submission Rejected',
        description: `Submission ${selectedId} has been rejected.`,
        variant: 'destructive',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to reject submission',
        variant: 'destructive',
      });
    }
  });


  // Auto-select first if none selected or selection not in filtered list
  useEffect(() => {
    if (!isLoading && submissions.length > 0) {
      if (!selectedId) {
        setSearchParams({ id: submissions[0].id });
      } else {
        // If selected ID is not in the current list (e.g. after filter change), 
        // we might want to keep it if strictly viewing details, or select filtered.
        // For now, let's keep logic simple: if data loaded and no selection, select first.
      }
    } else if (!isLoading && submissions.length === 0) {
      setSearchParams({});
    }
  }, [submissions, isLoading, selectedId, setSearchParams]);

  // Form options for filter
  const formOptions = useMemo(() => {
    return forms.map((f: any) => ({ id: f.id, name: f.name }));
  }, [forms]);

  const handleSelectSubmission = (submission: any) => {
    setSearchParams({ id: submission.id });
  };

  const handleApprove = (comment?: string) => {
    if (selectedId) {
      approveMutation.mutate({ id: selectedId, comment });
    }
  };

  const handleReject = (reason: string) => {
    if (selectedId) {
      rejectMutation.mutate({ id: selectedId, reason });
    }
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-5rem)]">
        {/* Page header */}
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-foreground">Submissions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review and manage form submissions
          </p>
        </div>

        {/* Split view container */}
        <div className="flex h-[calc(100%-4rem)] rounded-lg border border-border overflow-hidden bg-card shadow-sm">
          {/* Left pane - Submissions list */}
          <div className="w-96 flex-shrink-0 border-r border-border flex flex-col bg-background">
            <SubmissionFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter as any}
              onStatusChange={setStatusFilter}
              formFilter={formFilter}
              onFormChange={setFormFilter}
              formOptions={formOptions}
            />

            {/* Submissions list */}
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : submissions.length === 0 ? (
              <EmptyState
                type={submissions.length === 0 ? 'no-submissions' : 'no-results'}
              />
            ) : (
              <ScrollArea className="flex-1">
                <div role="listbox" aria-label="Submissions list">
                  {submissions.map((submission: any) => (
                    <SubmissionListItem
                      key={submission.id}
                      submission={submission}
                      isSelected={submission.id === selectedId}
                      onClick={() => handleSelectSubmission(submission)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* List footer - count */}
            <div className="flex-shrink-0 px-3 py-2 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                {submissions.length} results
              </p>
            </div>
          </div>

          {/* Right pane - Submission details */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedSubmission ? (
              <SubmissionDetails
                submission={selectedSubmission}
                workflowSteps={selectedSubmission?.workflow?.steps || []}
                canApprove={currentUserCanApprove}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ) : (
              <EmptyState type="no-selection" />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}