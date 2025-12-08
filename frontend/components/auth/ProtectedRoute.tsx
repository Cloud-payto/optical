import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Auth from '../../pages/Auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();

  // Show loading while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Checking authentication...</span>
        </div>
      </div>
    );
  }

  // Show auth page if user is not authenticated
  if (!isAuthenticated || !user) {
    return <Auth />;
  }

  // User is authenticated, show protected content
  return <>{children}</>;
}

export default ProtectedRoute;