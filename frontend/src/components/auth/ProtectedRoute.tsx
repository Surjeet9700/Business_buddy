import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const location = useLocation();
    // Simple check for token existence. 
    // In a real app, you might want to decode the token to check expiry 
    // or rely on a global auth context that validates it.
    const token = localStorage.getItem('accessToken');

    if (!token) {
        // Redirect to login page, but save the current location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
