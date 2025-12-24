import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User, Mail, Shield, Key, Save, Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { useToast } from '@/components/ui/use-toast';

export default function ProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user data
  const { data: userResponse, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
  });

  const currentUser = userResponse;

  // Local state for form fields
  const [name, setName] = useState('');

  // Sync local state when data is loaded
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
    }
  }, [currentUser]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      userService.update(currentUser!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
        variant: "default", // success
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.response?.data?.message || "Could not update profile.",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    if (!currentUser) return;
    updateMutation.mutate({ name });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!currentUser) {
    return (
      <AppLayout>
        <div className="p-6 text-center text-red-500">
          Failed to load user profile.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Profile & Preferences</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Card */}
        <Card className="enterprise-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </CardTitle>
            <CardDescription>Your account details and role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-xl font-semibold text-primary">
                  {currentUser.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                </div>
              </div>
              <div>
                <h3 className="font-semibold">{currentUser.name}</h3>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {(currentUser as any).roles && (currentUser as any).roles.map((role: string) => (
                    <Badge key={role} variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      <Shield className="h-3 w-3 mr-1" />
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Form Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" value={currentUser.email} className="pl-9" disabled />
                </div>
              </div>
            </div>

            {/* Read-only Info */}
            <div className="grid gap-4 md:grid-cols-2 p-4 rounded-lg bg-muted/30">
              <div>
                <p className="text-xs text-muted-foreground">ID</p>
                <p className="text-sm font-medium font-mono truncate">{currentUser.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm font-medium">
                  {new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security / Preferences Placeholders */}
        <Card className="enterprise-card opacity-75">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4" />
              Security (Coming Soon)
            </CardTitle>
            <CardDescription>Password and authentication settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/10">
              <div>
                <p className="font-medium text-sm">Password</p>
                <p className="text-xs text-muted-foreground">Managed by system administrator</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
