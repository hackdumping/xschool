import React, { useState } from 'react';
import {
    Box,
    Card,
    Typography,
    TextField,
    Button,
    Avatar,
    IconButton,
    Divider,
    Paper,
    Grid,
    InputAdornment,
} from '@mui/material';
import {
    PhotoCamera as PhotoCameraIcon,
    Save as SaveIcon,
    Person as PersonIcon,
    Security as SecurityIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/api';
import { useNotification } from '@/contexts/NotificationContext';

export const ProfilePage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { showNotification } = useNotification();

    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        username: user?.username || '',
    });

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `https://${window.location.host}${user.avatar}`) : null
    );

    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        password_confirm: '',
    });
    const [submittingPassword, setSubmittingPassword] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('firstName', formData.firstName);
            data.append('lastName', formData.lastName);
            data.append('email', formData.email);
            if (avatarFile) {
                data.append('avatar', avatarFile);
            }

            const response = await authService.updateProfile(data);
            updateUser(response.data);
            showNotification('Profil mis à jour avec succès', 'success');
        } catch (error) {
            console.error('Failed to update profile', error);
            showNotification('Erreur lors de la mise à jour du profil', 'error');
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.password_confirm) {
            showNotification('Les nouveaux mots de passe ne correspondent pas', 'error');
            return;
        }
        setSubmittingPassword(true);
        try {
            await authService.changePassword(passwordData);
            showNotification('Mot de passe modifié avec succès', 'success');
            setPasswordData({ old_password: '', new_password: '', password_confirm: '' });
        } catch (error: any) {
            console.error('Failed to change password', error);
            const backendErrors = error.response?.data;
            let message = 'Erreur lors du changement de mot de passe';
            if (backendErrors && typeof backendErrors === 'object') {
                message = Object.entries(backendErrors)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join(' | ');
            }
            showNotification(message, 'error');
        } finally {
            setSubmittingPassword(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
                Mon Compte
            </Typography>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 3, textAlign: 'center', p: 4 }}>
                        <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                            <Avatar
                                src={avatarPreview || undefined}
                                sx={{ width: 150, height: 150, mx: 'auto', bgcolor: 'primary.main', fontSize: '4rem' }}
                            >
                                {!avatarPreview && (user?.username?.charAt(0).toUpperCase() || <PersonIcon fontSize="large" />)}
                            </Avatar>
                            <IconButton
                                color="primary"
                                component="label"
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    bgcolor: 'background.paper',
                                    boxShadow: 2,
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                <input hidden accept="image/*" type="file" onChange={handleAvatarChange} />
                                <PhotoCameraIcon />
                            </IconButton>
                        </Box>
                        <Typography variant="h6" fontWeight={600}>
                            {user?.firstName} {user?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {user?.role?.toUpperCase()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Membre depuis 2024
                        </Typography>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 4, borderRadius: 3, mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon color="primary" /> Informations Personnelles
                        </Typography>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Prénom"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Nom"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        type="email"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Nom d'utilisateur"
                                        name="username"
                                        value={formData.username}
                                        disabled
                                        variant="outlined"
                                        helperText="Le nom d'utilisateur ne peut pas être modifié."
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            startIcon={<SaveIcon />}
                                            size="large"
                                            sx={{ px: 4, borderRadius: 2 }}
                                        >
                                            Mettre à jour le profil
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>

                    <Paper sx={{ p: 4, borderRadius: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SecurityIcon color="primary" /> Sécurité
                        </Typography>
                        <form onSubmit={handlePasswordChange}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Ancien mot de passe"
                                        type={showOldPassword ? 'text' : 'password'}
                                        value={passwordData.old_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                                        required
                                        variant="outlined"
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowOldPassword(!showOldPassword)}
                                                        edge="end"
                                                    >
                                                        {showOldPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Nouveau mot de passe"
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        required
                                        variant="outlined"
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        edge="end"
                                                    >
                                                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Confirmer le nouveau mot de passe"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={passwordData.password_confirm}
                                        onChange={(e) => setPasswordData({ ...passwordData, password_confirm: e.target.value })}
                                        required
                                        variant="outlined"
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        edge="end"
                                                    >
                                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            color="secondary"
                                            startIcon={<LockIcon />}
                                            size="large"
                                            disabled={submittingPassword}
                                            sx={{ px: 4, borderRadius: 2 }}
                                        >
                                            Changer le mot de passe
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
