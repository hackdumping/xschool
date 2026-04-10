import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // For demo purposes, we'll auto-authenticate
  // In production, this would check actual auth state
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuth, setIsAuth] = React.useState(false);

  React.useEffect(() => {
    // Check if user is already logged in (from localStorage or session)
    const checkAuth = () => {
      const storedUser = localStorage.getItem('xschool_user');
      if (storedUser) {
        setIsAuth(true);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // For demo, auto-authenticate with comptable role
  if (!isAuthenticated && !isAuth) {
    // Auto-login for demo
    localStorage.setItem('xschool_user', JSON.stringify({ role: 'comptable' }));
    return <>{children}</>;
  }

  return <>{children}</>;
};
