import { useState } from 'react';
import { Plus, MoreVertical, Eye, Edit2, Copy, Trash2, FileText, Search, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formService } from '@/services/form.service';
import { toast } from 'sonner';

export default function FormsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active'); // Default to active forms only

  // Fetch forms using React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['forms', searchQuery, statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active';
      return formService.getAll(params);
    }
  });

  const forms = data?.data || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (formId: string) => formService.delete(formId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Form deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete form');
    }
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: (formId: string) => formService.duplicate(formId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Form duplicated successfully');
    },
    onError: () => {
      toast.error('Failed to duplicate form');
    }
  });

  const handleDelete = (formId: string, formName: string) => {
    // Directly delete - window.confirm can be blocked by browsers
    deleteMutation.mutate(formId);
  };

  const handleDuplicate = (formId: string) => {
    duplicateMutation.mutate(formId);
  };

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
            <h1 className="text-2xl font-semibold tracking-tight">Forms</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage dynamic forms with configurable fields and validation
            </p>
          </div>
          <Button asChild>
            <Link to="/forms/builder">
              <Plus className="h-4 w-4" />
              Create Form
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-12 text-center text-destructive">
            Failed to load forms. Please try again later.
          </div>
        )}

        {/* Forms Grid */}
        {!isLoading && !error && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form: any) => (
              <Card key={form.id} className="group transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium leading-tight">{form.name}</h3>
                        <p className="text-xs text-muted-foreground">v{form.currentVersion}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/forms/${form.id}/submit`)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Fill Form
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/forms/${form.id}/submit`, '_blank')}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/forms/${form.id}/edit`)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(form.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={(e) => {
                            e.preventDefault();
                            handleDelete(form.id, form.name);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                    {form.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant={form.isActive ? 'approved' : 'draft'}>
                      {form.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDate(form.updatedAt)}
                    </span>
                  </div>

                  {form.workflowId && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-success" />
                      Workflow attached
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !error && forms.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No forms found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery ? 'Try adjusting your search or filters' : 'Create your first form to get started'}
              </p>
              {!searchQuery && (
                <Button className="mt-4" asChild>
                  <Link to="/forms/builder">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Form
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
