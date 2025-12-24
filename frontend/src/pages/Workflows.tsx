import { Plus, MoreVertical, Edit2, Trash2, GitBranch, Users, Clock, CheckCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { workflowService } from '@/services/workflow.service';

export default function WorkflowsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowService.getAll({})
  });

  const workflows = data?.data || [];

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
            <p className="text-sm text-muted-foreground">
              Configure multi-step approval workflows for form submissions
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </div>

        {/* Loading & Error States */}
        {isLoading && (
          <div className="flex justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
        {error && (
          <div className="p-12 text-center text-destructive">
            Failed to load workflows.
          </div>
        )}

        {/* Workflow Cards */}
        {!isLoading && !error && (
          <div className="grid gap-6 lg:grid-cols-2">
            {workflows.map((workflow: any) => (
              <Card key={workflow.id} className="group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <GitBranch className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{workflow.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{workflow.description}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit Workflow
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Workflow Steps Visualization */}
                  <div className="relative">
                    <div className="absolute left-4 top-6 bottom-6 w-px bg-border" />
                    <div className="space-y-4">
                      {workflow.steps?.map((step: any, index: number) => (
                        <div key={step.id || index} className="relative flex items-start gap-4 pl-1">
                          <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 ${index === 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'
                            }`}>
                            <span className="text-xs font-medium">{index + 1}</span>
                          </div>
                          <div className="flex-1 rounded-lg border border-border bg-card p-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">{step.name}</h4>
                              {step.timeoutDays && (
                                <Badge variant="outline" className="text-[10px]">
                                  <Clock className="mr-1 h-3 w-3" />
                                  {step.timeoutDays}d timeout
                                </Badge>
                              )}
                            </div>
                            {step.description && (
                              <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                            )}
                            <div className="mt-2 flex items-center gap-3">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {step.approverRoles.map((r: string) => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <CheckCircle className="h-3 w-3" />
                                {step.requiredApprovals} approval{step.requiredApprovals > 1 ? 's' : ''} required
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant={workflow.isActive ? 'approved' : 'draft'}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {workflow.steps?.length || 0} step{(workflow.steps?.length || 0) > 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDate(workflow.updatedAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Workflow State Machine Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflow State Machine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-2 py-4">
              {['Draft', 'Submitted', 'In Review', 'Approved', 'Rejected'].map((state, index, arr) => (
                <div key={state} className="flex items-center gap-2">
                  <Badge
                    variant={
                      state === 'Draft' ? 'draft' :
                        state === 'Submitted' ? 'submitted' :
                          state === 'In Review' ? 'pending' :
                            state === 'Approved' ? 'approved' : 'rejected'
                    }
                    className="px-3 py-1"
                  >
                    {state}
                  </Badge>
                  {index < arr.length - 2 && (
                    <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                  {index === arr.length - 2 && (
                    <div className="flex flex-col gap-1">
                      <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Submissions progress through states based on approval decisions. Each transition is logged for audit purposes.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
