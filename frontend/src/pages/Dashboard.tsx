import { FileText, ClipboardList, GitBranch, TrendingUp, Clock, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import { submissionService } from '@/services/submission.service';

export default function Dashboard() {
  const { data: dashboardData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsService.getDashboardStats
  });

  const { data: submissionsData, isLoading: submissionsLoading } = useQuery({
    queryKey: ['recent-submissions'],
    queryFn: () => submissionService.getAll({ limit: 4 })
  });

  const stats = dashboardData?.data?.stats || {
    activeForms: 0,
    pendingApprovals: 0,
    approvalRate: '0%',
    activeWorkflows: 0
  };

  const trends = dashboardData?.data?.workflowPerformance || [];
  const formUsage = dashboardData?.data?.formUsage || [];
  const recentSubmissions = submissionsData?.data || [];

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Overview of your forms, submissions, and workflows
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/submissions">View All Submissions</Link>
            </Button>
            <Button asChild>
              <Link to="/forms/builder">Create Form</Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Forms</p>
                  <p className="text-2xl font-semibold">{statsLoading ? '-' : stats.activeForms}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-success">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>{dashboardData?.data?.stats?.trends?.activeForms || '0 new this month'}</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approvals</p>
                  <p className="text-2xl font-semibold text-info">{statsLoading ? '-' : stats.pendingApprovals}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{dashboardData?.data?.stats?.trends?.pendingApprovals || 'All caught up'}</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                  <ClipboardList className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-semibold text-success">{statsLoading ? '-' : stats.approvalRate}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-success">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>{dashboardData?.data?.stats?.trends?.approvalRate || '0% change'}</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Workflows</p>
                  <p className="text-2xl font-semibold">{statsLoading ? '-' : stats.activeWorkflows}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <GitBranch className="h-3 w-3" />
                    <span>{dashboardData?.data?.stats?.trends?.activeWorkflows || 'No active workflows'}</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <GitBranch className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Submission Trends */}
          <Card className="lg:col-span-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Submission Trends</CardTitle>
                <Badge variant="secondary" className="text-xs">Last 6 months</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {statsLoading ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Loading trends...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis
                        dataKey="month"
                        className="text-xs fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        className="text-xs fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="approved" name="Approved" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="rejected" name="Rejected" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Usage */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Form Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statsLoading ? (
                  <div className="text-center p-8 text-muted-foreground">Loading usage...</div>
                ) : (
                  formUsage.map((form: any, index: number) => (
                    <div key={form.name || index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{form.name}</span>
                        <span className="text-muted-foreground">{form.submissions}</span>
                      </div>
                      <Progress
                        value={(form.submissions / 250) * 100}
                        className="h-2"
                      />
                    </div>
                  ))
                )}
                {!statsLoading && formUsage.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Submissions */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Submissions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/submissions">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submissionsLoading ? (
                <div className="text-center p-4 text-muted-foreground">Loading submissions...</div>
              ) : (
                recentSubmissions.map((submission: any) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${submission.status === 'approved' ? 'bg-success/10' :
                        submission.status === 'rejected' ? 'bg-destructive/10' :
                          submission.status === 'submitted' ? 'bg-info/10' : 'bg-muted'
                        }`}>
                        {submission.status === 'approved' ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : submission.status === 'rejected' ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <Clock className="h-4 w-4 text-info" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{submission.form?.name || 'Unknown Form'}</p>
                        <p className="text-xs text-muted-foreground">
                          by {submission.submitter?.name || 'Unknown User'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          submission.status === 'approved' ? 'approved' :
                            submission.status === 'rejected' ? 'rejected' :
                              submission.status === 'submitted' ? 'submitted' : 'draft'
                        }
                      >
                        {submission.status === 'submitted' ? 'Pending' :
                          submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(submission.submittedAt || submission.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {!submissionsLoading && recentSubmissions.length === 0 && (
                <div className="text-center text-muted-foreground p-4">No recent submissions</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
