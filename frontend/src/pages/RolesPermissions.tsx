import { useState } from 'react';
import { Shield, Users, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '@/services/role.service';
import { toast } from 'sonner';

export default function RolesPermissions() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Fetch Roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: roleService.getRoles
  });

  // Fetch Permissions
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: roleService.getPermissions
  });

  // Toggle Permission Mutation
  const toggleMutation = useMutation({
    mutationFn: ({ roleId, permissionId, action }: { roleId: string, permissionId: string, action: 'grant' | 'revoke' }) =>
      roleService.togglePermission(roleId, permissionId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Permissions updated successfully');
    },
    onError: () => {
      toast.error('Failed to update permissions');
    }
  });

  const handleTogglePermission = (roleId: string, permissionId: string, hasPermission: boolean) => {
    toggleMutation.mutate({
      roleId,
      permissionId,
      action: hasPermission ? 'revoke' : 'grant'
    });
  };

  // Group permissions by resource for better UI
  const groupedPermissions = permissions.reduce((acc: any, curr: any) => {
    if (!acc[curr.resource]) acc[curr.resource] = [];
    acc[curr.resource].push(curr);
    return acc;
  }, {});

  const isLoading = rolesLoading || permissionsLoading;

  // Helper to check if a role has a permission
  const hasPermission = (role: any, permissionId: string) => {
    return role.rolePermissions.some((rp: any) => rp.permissionId === permissionId);
  };

  // Set initial selected role when roles load
  if (!selectedRole && roles.length > 0) {
    setSelectedRole(roles[0].id);
  }

  if (isLoading) {
    return <AppLayout><div className="p-8">Loading settings...</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Access Control</h1>
          <p className="text-sm text-muted-foreground">
            Manage roles and permissions for your team
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Roles List */}
          <Card className="lg:col-span-4 h-fit">
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>Select a role to modify permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {roles.map((role: any) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${selectedRole === role.id
                      ? 'bg-primary/5 border-primary shadow-sm'
                      : 'hover:bg-accent hover:border-accent-foreground/20'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{role.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {role.usersCount} users
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {role.description}
                  </p>
                </button>
              ))}
              {/* Create Role Button Placeholder */}
              <Button variant="outline" className="w-full mt-4 border-dashed" onClick={() => toast.info("Create Role coming soon")}>
                + Create New Role
              </Button>
            </CardContent>
          </Card>

          {/* Permissions Matrix */}
          <Card className="lg:col-span-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Permissions
              </CardTitle>
              <CardDescription>
                Configure access levels for <span className="font-medium text-foreground">{roles.find((r: any) => r.id === selectedRole)?.name}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([resource, perms]: [string, any]) => (
                  <div key={resource} className="space-y-3">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                      {resource} Management
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {perms.map((permission: any) => {
                        const role = roles.find((r: any) => r.id === selectedRole);
                        const isEnabled = role ? hasPermission(role, permission.id) : false;

                        return (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="space-y-0.5">
                              <div className="font-medium text-sm">{permission.action} {permission.resource}</div>
                              <div className="text-xs text-muted-foreground">{permission.description || permission.name}</div>
                            </div>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => handleTogglePermission(role.id, permission.id, isEnabled)}
                              disabled={role?.name === 'admin'}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
