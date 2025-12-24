import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed] = useState(false);

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics', 'sidebar'], // simpler key for global layout fetch
    queryFn: () => analyticsService.getDashboardStats(),
    staleTime: 60000, // cache for 1 minute to avoid spamming
  });

  const pendingApprovals = analyticsData?.stats?.pendingApprovals || 0;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar pendingApprovals={pendingApprovals} />
      <div
        className={cn(
          'flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <Header sidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
