import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search, Download, Calendar, Filter,
  UserPlus, FileEdit, Trash2, CheckCircle, XCircle,
  LogIn, Settings, Shield, Eye, Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services/audit.service';

const actionIcons: Record<string, React.ElementType> = {
  'user.login': LogIn,
  'user.login_failed': LogIn,
  'user.create': UserPlus,
  'user.role_change': Shield,
  'form.create': FileEdit,
  'form.delete': Trash2,
  'form.publish': CheckCircle,
  'submission.approve': CheckCircle,
  'submission.reject': XCircle,
  'settings.update': Settings,
};

const severityStyles: Record<string, string> = {
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-destructive/10 text-destructive',
};

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs', searchQuery, actionFilter, severityFilter],
    queryFn: () => auditService.getAll({
      /* In a real app we'd pass filters to API here, 
         for now assuming API filtering or client side for MVP 
      */
    })
  });

  const logs = logsData?.data || [];
  const totalLogs = logsData?.meta?.total || 0;

  // Client-side filtering if API doesn't support it fully yet or for MVP responsiveness
  const filteredLogs = logs.filter((log: any) => {
    const matchesSearch =
      log.actor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.email.toLowerCase().includes(searchQuery.toLowerCase()); // Check user email too

    // Simplistic mapping if backend returns different formats
    const apiAction = log.action || '';
    const matchesAction = actionFilter === 'all' || apiAction.startsWith(actionFilter);
    const matchesSeverity = severityFilter === 'all' || (log.severity || 'info') === severityFilter;
    return matchesSearch && matchesAction && matchesSeverity;
  });

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatAction = (action: string) => {
    return action.replace('.', ' › ').replace(/_/g, ' ');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Audit Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              System activity and security event history
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="enterprise-card">
          <CardContent className="py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by actor, resource, or details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-3">
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="form">Form</SelectItem>
                    <SelectItem value="submission">Submission</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="enterprise-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Activity Log</CardTitle>
            <CardDescription>
              Showing {filteredLogs.length} events
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6 w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[180px]">Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="w-[130px]">IP Address</TableHead>
                    <TableHead className="w-[100px]">Level</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const IconComponent = actionIcons[log.action] || Eye;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm capitalize">{formatAction(log.action)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.actor}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                          {log.details}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.ip}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={severityStyles[log.severity]}>
                            {log.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination hint */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Showing 1-10 of 1,247 events</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
