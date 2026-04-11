import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    InputAdornment,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '@/services/api';
import { useSchool } from '@/contexts/SchoolContext';
import { AuthLayout } from './components/AuthLayout';

const SignUpPage: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { settings } = useSchool();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        password_confirm: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (formData.password !== formData.password_confirm) {
            setError("Les mots de passe ne correspondent pas.");
            setLoading(false);
            return;
        }

        try {
            await authService.signUp(formData);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Une erreur est survenue lors de l'inscription.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title={settings.name}
            subtitle="Créez votre compte pour accéder à la plateforme"
            icon={<PersonAddIcon sx={{ fontSize: 40 }} />}
        >
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                    Compte créé avec succès ! Redirection vers la page de connexion...
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <TextField
                        fullWidth
                        label="Prénom"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        InputProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper' } }}
                    />
                    <TextField
                        fullWidth
                        label="Nom"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        InputProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper' } }}
                    />
                </Box>

                <TextField
                    fullWidth
                    label="Nom d'utilisateur"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    margin="normal"
                    required
                    InputProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper' } }}
                />

                <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    margin="normal"
                    required
                    InputProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper' } }}
                />


                <TextField
                    fullWidth
                    label="Mot de passe"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    margin="normal"
                    required
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPassword(!showPassword)}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                        sx: { borderRadius: 3, bgcolor: 'background.paper' }
                    }}
                />

                <Box sx={{ mt: -1, mb: 1, px: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                        • Minimum {settings.min_password_length} caractères.
                        {settings.require_strong_password && (
                            <>
                                <br />• Inclure majuscules, chiffres et caractères spéciaux.
                            </>
                        )}
                    </Typography>
                </Box>

                <TextField
                    fullWidth
                    label="Confirmer le mot de passe"
                    name="password_confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password_confirm}
                    onChange={handleChange}
                    margin="normal"
                    required
                    InputProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper' } }}
                />

                <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || success}
                    sx={{
                        mt: 4,
                        py: 1.8,
                        borderRadius: 3,
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '1rem',
                        boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)',
                    }}
                >
                    {loading ? <CircularProgress size={26} color="inherit" /> : "S'inscrire"}
                </Button>
            </form>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Vous avez déjà un compte ?{' '}
                    <Link
                        to="/login"
                        style={{
                            color: '#1976d2',
                            textDecoration: 'none',
                            fontWeight: 700,
                        }}
                    >
                        Se connecter
                    </Link>
                </Typography>
            </Box>
        </AuthLayout>
    );
};

export default SignUpPage;
