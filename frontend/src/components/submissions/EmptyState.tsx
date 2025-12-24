import { Inbox, FileSearch } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-submissions' | 'no-selection' | 'no-results';
}

export function EmptyState({ type }: EmptyStateProps) {
  const config = {
    'no-submissions': {
      icon: Inbox,
      title: 'No submissions yet',
      description: 'Submissions will appear here once forms are filled out.',
    },
    'no-selection': {
      icon: FileSearch,
      title: 'Select a submission',
      description: 'Choose a submission from the list to view its details.',
    },
    'no-results': {
      icon: FileSearch,
      title: 'No matching submissions',
      description: 'Try adjusting your search or filter criteria.',
    },
  };

  const { icon: Icon, title, description } = config[type];

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
    </div>
  );
}