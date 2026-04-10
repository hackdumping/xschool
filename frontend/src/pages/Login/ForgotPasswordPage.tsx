import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { authService } from '@/services/api';
import { AuthLayout } from './components/AuthLayout';
import {
    Email as EmailIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await authService.resetPassword({ email });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || "Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="MOT DE PASSE"
            subtitle="Récupérez l'accès à votre compte"
            icon={<EmailIcon sx={{ fontSize: 40 }} />}
        >
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {success ? (
                <Box sx={{ textAlign: 'center' }}>
                    <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                        Si un compte existe pour cet email, vous recevrez des instructions pour réinitialiser votre mot de passe.
                    </Alert>
                    <Button
                        component={Link}
                        to="/login"
                        variant="contained"
                        startIcon={<ArrowBackIcon />}
                        sx={{
                            mt: 2,
                            py: 1.5,
                            px: 4,
                            borderRadius: 3,
                            fontWeight: 700,
                            textTransform: 'none'
                        }}
                    >
                        Retour à la connexion
                    </Button>
                </Box>
            ) : (
                <form onSubmit={handleSubmit}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center', px: 2 }}>
                        Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                    </Typography>

                    <TextField
                        fullWidth
                        label="Adresse Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        margin="normal"
                        required
                        autoFocus
                        InputProps={{
                            sx: { borderRadius: 3, bgcolor: 'background.paper' }
                        }}
                    />

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
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
                        {loading ? <CircularProgress size={26} color="inherit" /> : "Envoyer le lien"}
                    </Button>

                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Link
                            to="/login"
                            style={{
                                color: '#1976d2',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: 700,
                            }}
                        >
                            <ArrowBackIcon fontSize="small" />
                            Retour à la connexion
                        </Link>
                    </Box>
                </form>
            )}
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
