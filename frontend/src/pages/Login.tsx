import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowRight, LayoutDashboard } from 'lucide-react';

export default function LoginPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const queryClient = useQueryClient();

    const loginMutation = useMutation({
        mutationFn: authService.login,
        onSuccess: async (data) => {
            toast.success('Welcome back!', {
                description: `Logged in as ${data.user.name}`,
            });
            // Store tokens
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);

            // Invalidate queries to ensure fresh data
            await queryClient.invalidateQueries({ queryKey: ['currentUser'] });

            navigate('/dashboard');
        },
        onError: (error: any) => {
            toast.error('Login failed', {
                description: error.response?.data?.message || 'Invalid credentials. Please try again.',
            });
        },
    });

    const guestLoginMutation = useMutation({
        mutationFn: async () => {
            const guestCreds = { email: 'guest@businessbuddy.com', password: 'GuestPassword123!' };
            try {
                // Try login first
                return await authService.login(guestCreds);
            } catch (error: any) {
                // If login fails (401/404), try registering
                if (error.response?.status === 401 || error.response?.status === 404) {
                    await authService.register({
                        name: 'Guest User',
                        ...guestCreds,
                        confirmPassword: guestCreds.password
                    } as any);
                    return await authService.login(guestCreds);
                }
                throw error;
            }
        },
        onSuccess: (data) => {
            toast.success('Welcome Guest!', { description: 'Logged in with demo account.' });
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            navigate('/');
        },
        onError: (error) => {
            console.error("Guest Login Error:", error);
            toast.error('Guest login failed');
        }
    });

    const handleGuestLogin = () => {
        guestLoginMutation.mutate();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loginMutation.mutate(formData);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-primary font-bold text-2xl mb-6">
                        <LayoutDashboard className="h-8 w-8" />
                        <span>Business Buddy</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your credentials to access your dashboard
                    </p>
                </div>

                <Card className="border-border shadow-lg">
                    <CardHeader>
                        <CardTitle>Sign In</CardTitle>
                        <CardDescription>
                            Don't have an account? <Link to="/register" className="text-primary hover:underline">Create one</Link>
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    required
                                    disabled={loginMutation.isPending || guestLoginMutation.isPending}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        to="#"
                                        className="text-xs text-muted-foreground hover:text-primary"
                                        onClick={() => toast.info('Forgot password feature coming soon!')}
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    disabled={loginMutation.isPending || guestLoginMutation.isPending}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loginMutation.isPending || guestLoginMutation.isPending}
                            >
                                {loginMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>

                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={handleGuestLogin}
                                disabled={loginMutation.isPending || guestLoginMutation.isPending}
                            >
                                {guestLoginMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                )}
                                Guest Access
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
                <p className="px-8 text-center text-sm text-muted-foreground">
                    By clicking continue, you agree to our{' '}
                    <Link to="#" className="underline underline-offset-4 hover:text-primary">
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="#" className="underline underline-offset-4 hover:text-primary">
                        Privacy Policy
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}

