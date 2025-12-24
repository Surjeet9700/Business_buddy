import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SubmissionStatus } from '@/types';

interface SubmissionFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: SubmissionStatus | 'all';
  onStatusChange: (value: SubmissionStatus | 'all') => void;
  formFilter: string;
  onFormChange: (value: string) => void;
  formOptions: { id: string; name: string }[];
}

export function SubmissionFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  formFilter,
  onFormChange,
  formOptions,
}: SubmissionFiltersProps) {
  return (
    <div className="space-y-3 p-3 border-b border-border bg-card">
      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search submissions..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm bg-background"
          aria-label="Search submissions"
        />
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2">
        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusChange(v as SubmissionStatus | 'all')}
        >
          <SelectTrigger className="h-8 text-xs flex-1" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={formFilter} onValueChange={onFormChange}>
          <SelectTrigger className="h-8 text-xs flex-1" aria-label="Filter by form">
            <SelectValue placeholder="Form" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All forms</SelectItem>
            {formOptions.map((form) => (
              <SelectItem key={form.id} value={form.id}>
                {form.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground"
          onClick={() => {
            onSearchChange('');
            onStatusChange('all');
            onFormChange('all');
          }}
          aria-label="Clear all filters"
        >
          <Filter className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Clear
        </Button>
      </div>
    </div>
  );
}