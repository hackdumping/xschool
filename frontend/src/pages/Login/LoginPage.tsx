import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  alpha,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useSchool } from '@/contexts/SchoolContext';
import { AuthLayout } from './components/AuthLayout';
import {
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined as LockIcon,
  PersonOutline as PersonIcon,
  Engineering as MaintenanceIcon
} from '@mui/icons-material';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const { settings } = useSchool();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password, rememberMe);
      showNotification(`Bienvenue sur ${settings.name} !`, 'success');
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.detail || err.response?.data?.error || 'Identifiants invalides ou erreur technique.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={settings.name}
      subtitle="Connectez-vous à votre espace gestion"
    >
      {settings.maintenance_mode && (
        <Alert
          severity="warning"
          icon={<MaintenanceIcon />}
          sx={{
            mb: 3,
            borderRadius: 3,
            bgcolor: alpha('#ed6c02', 0.1),
            border: '1px solid',
            borderColor: alpha('#ed6c02', 0.2),
            '& .MuiAlert-message': { fontWeight: 600 }
          }}
        >
          Le système est en mode maintenance. Seuls les administrateurs peuvent se connecter.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          margin="normal"
          required
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="action" />
              </InputAdornment>
            ),
            sx: { borderRadius: 3, bgcolor: 'background.paper' }
          }}
        />

        <TextField
          fullWidth
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
            sx: { borderRadius: 3, bgcolor: 'background.paper' }
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                color="primary"
              />
            }
            label={<Typography variant="body2">Se souvenir de moi</Typography>}
          />
          <Typography
            variant="body2"
            component={Link}
            to="/forgot-password"
            sx={{
              color: 'primary.main',
              textDecoration: 'none',
              fontWeight: 600,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Oublié ?
          </Typography>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            py: 1.8,
            borderRadius: 3,
            fontWeight: 700,
            fontSize: '1rem',
            textTransform: 'none',
            boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)',
          }}
        >
          {loading ? <CircularProgress size={26} color="inherit" /> : 'Se connecter'}
        </Button>
      </form>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Vous n'avez pas encore de compte ?{' '}
          <Link
            to="/register"
            style={{
              color: '#1976d2',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Créer un compte
          </Link>
        </Typography>
      </Box>

      <Box
        sx={{
          mt: 4,
          p: 2,
          bgcolor: alpha('#1976d2', 0.05),
          borderRadius: 3,
          border: '1px dashed',
          borderColor: alpha('#1976d2', 0.2)
        }}
      >
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          <strong>Accès Démo :</strong><br />
          admin / admin123 • comptable / claire123
        </Typography>
      </Box>
    </AuthLayout>
  );
};
