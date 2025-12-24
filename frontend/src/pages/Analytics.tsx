import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle,
  FileText, Users, Download, Calendar
} from 'lucide-react';

const kpiData = [
  {
    title: 'Total Submissions',
    value: '2,847',
    change: '+12.5%',
    trend: 'up',
    icon: FileText,
    description: 'Last 30 days'
  },
  {
    title: 'Approval Rate',
    value: '78.3%',
    change: '+3.2%',
    trend: 'up',
    icon: CheckCircle2,
    description: 'vs previous period'
  },
  {
    title: 'Avg. Approval Time',
    value: '2.4 days',
    change: '-0.8 days',
    trend: 'up',
    icon: Clock,
    description: 'Time to resolution'
  },
  {
    title: 'Pending Reviews',
    value: '156',
    change: '+23',
    trend: 'down',
    icon: Users,
    description: 'Awaiting action'
  },
];

const workflowPerformance = [
  { month: 'Jan', approved: 245, rejected: 32, pending: 18 },
  { month: 'Feb', approved: 289, rejected: 28, pending: 22 },
  { month: 'Mar', approved: 312, rejected: 41, pending: 15 },
  { month: 'Apr', approved: 278, rejected: 35, pending: 28 },
  { month: 'May', approved: 356, rejected: 29, pending: 19 },
  { month: 'Jun', approved: 398, rejected: 38, pending: 24 },
];

const formUsageData = [
  { name: 'Employee Onboarding', submissions: 892, fill: 'hsl(var(--primary))' },
  { name: 'Travel Request', submissions: 654, fill: 'hsl(var(--info))' },
  { name: 'Equipment Request', submissions: 423, fill: 'hsl(var(--success))' },
  { name: 'Leave Application', submissions: 387, fill: 'hsl(var(--warning))' },
  { name: 'Expense Report', submissions: 291, fill: 'hsl(var(--muted-foreground))' },
];

const approvalTimeData = [
  { week: 'W1', time: 3.2 },
  { week: 'W2', time: 2.8 },
  { week: 'W3', time: 2.5 },
  { week: 'W4', time: 2.9 },
  { week: 'W5', time: 2.1 },
  { week: 'W6', time: 2.4 },
  { week: 'W7', time: 1.9 },
  { week: 'W8', time: 2.2 },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedForm, setSelectedForm] = useState('all');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', dateRange, selectedForm],
    queryFn: () => analyticsService.getDashboardStats(),
  });

  const stats = analyticsData?.data?.stats || {
    totalSubmissions: 0,
    approvalRate: '0%',
    avgApprovalTime: '0 days',
    pendingApprovals: 0,
    trends: {
      submissions: '0%',
      approvalRate: '0%',
      avgTime: '0 days'
    }
  };

  const getTrendDirection = (trendStr: string) => {
    // Simple heuristic: if it starts with '+' or is positive number, it's 'up'
    if (!trendStr) return 'up';
    if (trendStr.startsWith('+')) return 'up';
    if (trendStr.startsWith('-')) return 'down';
    return 'up';
  };

  const kpiData = [
    {
      title: 'Total Submissions',
      value: stats.totalSubmissions.toLocaleString(),
      change: stats.trends?.submissions || '0%',
      trend: getTrendDirection(stats.trends?.submissions),
      icon: FileText,
      description: 'Last 30 days'
    },
    {
      title: 'Approval Rate',
      value: stats.approvalRate,
      change: stats.trends?.approvalRate || '0%',
      trend: getTrendDirection(stats.trends?.approvalRate),
      icon: CheckCircle2,
      description: 'vs previous period'
    },
    {
      title: 'Avg. Approval Time',
      value: stats.avgApprovalTime,
      change: stats.trends?.avgTime || '0 days',
      trend: 'down', // For time, down is usually good (faster), but kept simple for now
      icon: Clock,
      description: 'Time to resolution'
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingApprovals.toLocaleString(),
      change: 'Active',
      trend: 'neutral',
      icon: Users,
      description: 'Awaiting action'
    },
  ];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">Loading analytics...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Workflow performance and submission insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedForm} onValueChange={setSelectedForm}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Forms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                <SelectItem value="onboarding">Employee Onboarding</SelectItem>
                <SelectItem value="travel">Travel Request</SelectItem>
                <SelectItem value="equipment">Equipment Request</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi) => (
            <Card key={kpi.title} className="enterprise-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{kpi.value}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className={kpi.trend === 'up' ? 'text-success' : 'text-destructive'}
                  >
                    {kpi.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {kpi.change}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{kpi.description}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Workflow Performance */}
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-base">Workflow Performance</CardTitle>
              <CardDescription>Monthly submission outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData?.data?.workflowPerformance || []} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="approved" name="Approved" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rejected" name="Rejected" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" name="Pending" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Approval Time Trend */}
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-base">Approval Time Trend</CardTitle>
              <CardDescription>Average days to approval by week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData?.data?.approvalTimeData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                      formatter={(value) => [`${value} days`, 'Avg. Time']}
                    />
                    <Line
                      type="monotone"
                      dataKey="time"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Usage */}
        <Card className="enterprise-card">
          <CardHeader>
            <CardTitle className="text-base">Form Usage Distribution</CardTitle>
            <CardDescription>Submissions by form type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData?.data?.formUsage || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="submissions"
                    >
                      {(analyticsData?.data?.formUsage || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill || 'hsl(var(--primary))'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {(analyticsData?.data?.formUsage || []).map((form: any) => (
                  <div key={form.name} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: form.fill || 'hsl(var(--primary))' }}
                      />
                      <span className="text-sm font-medium">{form.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{form.submissions.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
