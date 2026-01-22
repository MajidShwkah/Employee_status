import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

/**
 * ProtectedRoute - Guards routes that require authentication
 */
const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, isAdmin, loading, initialized, profile } = useAuth();
  const location = useLocation();
  const [showTimeout, setShowTimeout] = useState(false);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!initialized) {
        console.warn('⚠️ Auth initialization timeout');
        setShowTimeout(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [initialized]);

  // If timeout occurred and still not initialized, redirect to login
  if (showTimeout && !initialized) {
    console.log('⏰ Timeout - redirecting to login');
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Show loading while auth is initializing
  if (!initialized || loading) {
    return <LoadingScreen message="Verifying session..." />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !profile) {
    console.log('🚫 Not authenticated, redirecting to login');
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Require admin but user is not admin
  if (requireAdmin && !isAdmin) {
    console.log('🚫 Admin required but user is not admin');
    return <Navigate to="/dashboard" replace />;
  }

  // All checks passed
  return children;
};

/**
 * PublicRoute - For routes that should redirect authenticated users
 */
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading, initialized } = useAuth();
  const location = useLocation();
  const [showContent, setShowContent] = useState(false);

  // Small delay to prevent flash of login page when already authenticated
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Brief loading while checking
  if (!initialized && !showContent) {
    return <LoadingScreen message="Loading..." />;
  }

  // If still loading but past initial check, show content
  if (loading && showContent) {
    return children;
  }

  // If authenticated, redirect to appropriate dashboard
  if (initialized && isAuthenticated) {
    const from = location.state?.from?.pathname || (isAdmin ? '/admin' : '/dashboard');
    console.log('✅ Already authenticated, redirecting to:', from);
    return <Navigate to={from} replace />;
  }

  return children;
};

export default ProtectedRoute;
