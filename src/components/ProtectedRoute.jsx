// src/components/ProtectedRoute.jsx - Your Previous Working Version
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';

export const ProtectedRoute = ({ children, requiredRole, isPublic = false }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // If route is public, allow access regardless of authentication
  if (isPublic) {
    return children;
  }

  // For protected routes, require authentication
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};