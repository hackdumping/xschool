import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { authService } from '@/services/api';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';

const ROLE_CONFIG: Record<string, { label: string; color: any }> = {
  admin: { label: 'Administrateur', color: 'error' },
  comptable: { label: 'Comptable', color: 'success' },
  secretaire: { label: 'Secrétaire', color: 'info' },
  professeur: { label: 'Professeur', color: 'warning' },
};

export const PersonnelPage: React.FC = () => {
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'professeur' as any,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await authService.getUsers();
      setUsers(data);
    } catch (error) {
      showNotification('Erreur lors du chargement de l\'équipe', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddStaff = async () => {
    if (!formData.username || !formData.password || !formData.email) {
      showNotification('Veuillez remplir les champs obligatoires', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await authService.createStaff(formData);
      showNotification('Collaborateur ajouté avec succès', 'success');
      setOpenDialog(false);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        role: 'professeur',
      });
      fetchUsers();
    } catch (error: any) {
      const detail = error.response?.data?.detail || JSON.stringify(error.response?.data) || 'Erreur inconnue';
      showNotification(`Erreur: ${detail}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (userId === currentUser?.id) {
      showNotification("Vous ne pouvez pas supprimer votre propre compte.", "warning");
      return;
    }

    if (window.confirm(`Voulez-vous vraiment supprimer l'accès de ${username} ?`)) {
      try {
        await authService.deleteUser(userId);
        showNotification('Accès supprimé', 'success');
        fetchUsers();
      } catch (error) {
        showNotification('Erreur lors de la suppression', 'error');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Gestion de l'Équipe
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez les collaborateurs de <strong>{currentUser?.establishment_info?.name}</strong>
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ borderRadius: 3, py: 1.2, px: 3, fontWeight: 700 }}
        >
          Ajouter un membre
        </Button>
      </Box>

      <Grid container spacing={3}>
        {users.map((staff) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={staff.id}>
            <Card 
              sx={{ 
                borderRadius: 4, 
                transition: 'all 0.3s', 
                '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[8] } 
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar 
                    src={staff.avatar} 
                    sx={{ width: 56, height: 56, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 800 }}
                  >
                    {staff.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={800}>
                      {staff.first_name || staff.username} {staff.last_name}
                    </Typography>
                    <Chip 
                      label={ROLE_CONFIG[staff.role]?.label || staff.role} 
                      size="small" 
                      color={ROLE_CONFIG[staff.role]?.color || 'default'}
                      variant="outlined"
                      sx={{ fontWeight: 700, mt: 0.5 }}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    <Typography variant="body2" color="text.secondary">{staff.email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BadgeIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    <Typography variant="body2" color="text.secondary">ID: {staff.username}</Typography>
                  </Box>
                </Box>

                <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Tooltip title="Modifier">
                    <IconButton size="small" color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDeleteUser(staff.id, staff.username)}
                      disabled={staff.id === currentUser?.id}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add Staff Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => !submitting && setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', pt: 3 }}>
          <GroupIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1, display: 'block', mx: 'auto' }} />
          Ajouter un Collaborateur
        </DialogTitle>
        <DialogContent sx={{ px: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
            Un nouveau membre pourra se connecter avec son identifiant et mot de passe.
          </Typography>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Prénom"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                InputProps={{ sx: { borderRadius: 3 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Nom"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                InputProps={{ sx: { borderRadius: 3 } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Nom d'utilisateur (Identifiant)"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                InputProps={{ sx: { borderRadius: 3 } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                InputProps={{ sx: { borderRadius: 3 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Rôle"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                InputProps={{ sx: { borderRadius: 3 } }}
              >
                {Object.entries(ROLE_CONFIG).map(([val, config]) => (
                  <MenuItem key={val} value={val}>{config.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Mot de passe initial"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                InputProps={{ sx: { borderRadius: 3 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit" sx={{ fontWeight: 600 }}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={handleAddStaff} 
            disabled={submitting}
            sx={{ borderRadius: 3, px: 4, fontWeight: 700 }}
          >
            {submitting ? <CircularProgress size={24} /> : 'Créer le compte'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
