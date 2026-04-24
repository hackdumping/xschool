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
    School as SchoolIcon,
    ChildCare as ChildCareIcon,
    AutoStories as AutoStoriesIcon,
    Engineering as EngineeringIcon,
    WorkspacePremium as TrainingIcon,
    ArrowForward as ArrowForwardIcon,
    ArrowBack as ArrowBackIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '@/services/api';
import { AuthLayout } from './components/AuthLayout';
import { Card, CardActionArea, Grid, useTheme, alpha } from '@mui/material';

const SignUpPage: React.FC = () => {
    const theme = useTheme();
    const [step, setStep] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        password_confirm: '',
        establishment_name: '',
        establishment_types: [] as string[],
    });

    const establishmentTypes = [
        { id: 'garderie', label: 'Garderie', icon: <ChildCareIcon />, description: 'Petite enfance et pré-scolaire' },
        { id: 'primaire', label: 'École Primaire', icon: <SchoolIcon />, description: 'De la SIL au CM2' },
        { id: 'general', label: 'Enseignement Général', icon: <AutoStoriesIcon />, description: 'Collège et Lycée Classique' },
        { id: 'technique', label: 'Enseignement Technique', icon: <EngineeringIcon />, description: 'Lycée Technique et Professionnel' },
        { id: 'formation', label: 'Centre de formation', icon: <TrainingIcon />, description: 'Formation continue et spéciale' },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const toggleType = (id: string) => {
        setFormData(prev => ({
            ...prev,
            establishment_types: prev.establishment_types.includes(id)
                ? prev.establishment_types.filter(t => t !== id)
                : [...prev.establishment_types, id]
        }));
    };

    const nextStep = () => {
        if (step === 0) {
            if (!formData.first_name || !formData.last_name || !formData.email || !formData.username || !formData.password) {
                setError("Veuillez remplir tous les champs personnels.");
                return;
            }
            if (formData.password !== formData.password_confirm) {
                setError("Les mots de passe ne correspondent pas.");
                return;
            }
        }
        if (step === 1) {
            if (!formData.establishment_name) {
                setError("Veuillez entrer le nom de votre établissement.");
                return;
            }
        }
        setError(null);
        setStep(step + 1);
    };

    const prevStep = () => {
        setError(null);
        setStep(step - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.establishment_types.length === 0) {
            setError("Veuillez choisir au moins un type d'enseignement.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await authService.signUp({
                ...formData,
                establishment_types: formData.establishment_types
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Une erreur est survenue lors de l'inscription.");
            // If error is related to user/account, go back to step 0
            if (err.response?.status === 400 && !err.response?.data?.establishment_name) {
                setStep(0);
            }
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 0:
                return (
                    <Box component="div">
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
                            variant="contained"
                            size="large"
                            onClick={nextStep}
                            endIcon={<ArrowForwardIcon />}
                            sx={{ mt: 3, py: 1.5, borderRadius: 3, fontWeight: 700 }}
                        >
                            Continuer
                        </Button>
                    </Box>
                );
            case 1:
                return (
                    <Box component="div">
                        <Typography variant="body1" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
                            Commençons par le nom de votre établissement
                        </Typography>
                        <TextField
                            fullWidth
                            label="Nom de l'établissement"
                            name="establishment_name"
                            value={formData.establishment_name}
                            onChange={handleChange}
                            placeholder="Ex: École Bilingue St. Joseph"
                            required
                            autoFocus
                            InputProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper', fontSize: '1.2rem' } }}
                        />
                        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={prevStep}
                                startIcon={<ArrowBackIcon />}
                                sx={{ py: 1.5, borderRadius: 3, fontWeight: 600 }}
                            >
                                Retour
                            </Button>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={nextStep}
                                endIcon={<ArrowForwardIcon />}
                                sx={{ py: 1.5, borderRadius: 3, fontWeight: 700 }}
                            >
                                Suivant
                            </Button>
                        </Box>
                    </Box>
                );
            case 2:
                return (
                    <Box component="div">
                        <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
                            Quels cycles gérez-vous ?
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3, textAlign: 'center' }}>
                            Vous pouvez choisir plusieurs options
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 4 }}>
                            {establishmentTypes.map((type) => (
                                <Grid size={true} key={type.id}>
                                    <Card 
                                        sx={{ 
                                            borderRadius: 3,
                                            border: `2px solid ${formData.establishment_types.includes(type.id) ? theme.palette.primary.main : 'transparent'}`,
                                            bgcolor: formData.establishment_types.includes(type.id) ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
                                            transition: 'all 0.2s',
                                            height: '100%'
                                        }}
                                    >
                                        <CardActionArea onClick={() => toggleType(type.id)} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                            <Box sx={{ 
                                                p: 1, 
                                                borderRadius: '50%', 
                                                bgcolor: formData.establishment_types.includes(type.id) ? 'primary.main' : 'action.hover',
                                                color: formData.establishment_types.includes(type.id) ? 'white' : 'text.secondary',
                                                mb: 1
                                            }}>
                                                {formData.establishment_types.includes(type.id) ? <CheckCircleIcon /> : type.icon}
                                            </Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{type.label}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{type.description}</Typography>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={prevStep}
                                startIcon={<ArrowBackIcon />}
                                sx={{ py: 1.5, borderRadius: 3, fontWeight: 600 }}
                            >
                                Retour
                            </Button>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={loading || formData.establishment_types.length === 0}
                                sx={{ py: 1.5, borderRadius: 3, fontWeight: 700 }}
                            >
                                {loading ? <CircularProgress size={26} color="inherit" /> : "Terminer"}
                            </Button>
                        </Box>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <AuthLayout
            title={step === 0 ? "Créer un compte" : formData.establishment_name || "Votre École"}
            subtitle={
                step === 0 ? "Rejoignez la révolution de la gestion scolaire" :
                step === 1 ? "Configurez votre établissement" :
                "Personnalisez vos programmes"
            }
            icon={step === 0 ? <PersonAddIcon sx={{ fontSize: 40 }} /> : <SchoolIcon sx={{ fontSize: 40 }} />}
        >
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', gap: 1 }}>
                {[0, 1, 2].map((i) => (
                    <Box 
                        key={i}
                        sx={{ 
                            width: 30, 
                            height: 6, 
                            borderRadius: 3, 
                            bgcolor: i <= step ? 'primary.main' : 'action.hover',
                            transition: 'all 0.3s'
                        }} 
                    />
                ))}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                    Compte et Établissement créés avec succès ! Redirection...
                </Alert>
            )}

            {renderStepContent()}

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
