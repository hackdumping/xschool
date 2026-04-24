import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  ListItemAvatar,
  Paper,
  alpha,
  useTheme,
  Grid,
  Tabs,
  Tab,
  Card,
  CardContent,
  Container,
  useMediaQuery,
  Switch,
  FormControlLabel,
  Slider,
  Divider,
} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Payment as PaymentIcon,
  Sms as SmsIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNotification } from '@/contexts/NotificationContext';
import { useSchool } from '@/contexts/SchoolContext';
import { authService, financeService } from '@/services/api';
import type { TuitionTemplate } from '@/types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress as Loader,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    id={`settings-tabpanel-${index}`}
    aria-labelledby={`settings-tab-${index}`}
    sx={{
      py: { xs: 2, md: 4 },
      animation: value === index ? 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      display: value === index ? 'block' : 'none', // Improved visibility handling
    }}
  >
    {value === index && children}
  </Box>
);

export const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const { user, logout, updateUser } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showNotification } = useNotification();
  const { settings, updateSettings } = useSchool();
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sync user profile to ensure establishment_info.owner is present
  React.useEffect(() => {
    const syncProfile = async () => {
      try {
        const freshUser = await authService.getCurrentUser();
        updateUser(freshUser);
      } catch (e) {
        console.error("Failed to sync profile", e);
      }
    };
    syncProfile();
  }, []);

  const handleTabChange = (v: number) => {
    setActiveTab(v);
    if (v === 1) fetchUsers();
    else if (v === 5) fetchTuitionTemplates();
  };

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const isOwner = React.useMemo(() => {
    if (!user) return false;
    // SuperAdmins get full access everywhere for maintenance
    if ((user as any).is_superuser || user.username === 'admin') return true;
    
    if (!(user as any).establishment_info) return false;
    return String(user.id) === String((user as any).establishment_info.owner);
  }, [user]);

  const [deleting, setDeleting] = useState(false);
  const [tuitionTemplates, setTuitionTemplates] = useState<TuitionTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<TuitionTemplate | null>(null);

  // Account deletion states
  const [openDeleteEstabDialog, setOpenDeleteEstabDialog] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [confirmName, setConfirmName] = useState('');

  const [formData, setFormData] = useState({
    name: settings.name,
    establishment_name: settings.establishment_name || settings.name,
    selected_types: settings.selected_types || [],
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
    website: settings.website,
    enable_email_alerts: settings.enable_email_alerts,
    enable_sms_alerts: settings.enable_sms_alerts,
    payment_reminder_days: settings.payment_reminder_days,
    low_grade_threshold: settings.low_grade_threshold,
    currency_symbol: settings.currency_symbol,
    currency_code: settings.currency_code,
    enable_cash_payment: settings.enable_cash_payment,
    enable_mobile_payment: settings.enable_mobile_payment,
    enable_bank_transfer: settings.enable_bank_transfer,
    bank_details: settings.bank_details,
    receipt_footer: settings.receipt_footer,
    session_timeout: settings.session_timeout,
    min_password_length: settings.min_password_length,
    max_login_attempts: settings.max_login_attempts,
    require_strong_password: settings.require_strong_password,
    maintenance_mode: settings.maintenance_mode,
    two_factor_enforcement: settings.two_factor_enforcement,
    tranche_1_deadline: settings.tranche_1_deadline || '',
    tranche_2_deadline: settings.tranche_2_deadline || '',
    tranche_3_deadline: settings.tranche_3_deadline || '',
    exam_fee_amount: settings.exam_fee_amount || 0,
    slogan: settings.slogan || '',
    english_name: (settings as any).english_name || '',
    city: (settings as any).city || '',
    country: (settings as any).country || '',
    director_title: (settings as any).director_title || '',
    postal_code: (settings as any).postal_code || '',
    certificate_reference: (settings as any).certificate_reference || '',
    article_text: (settings as any).article_text || '',
  });

  const [staffData, setStaffData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
  });

  // Update local form data when global settings load
  React.useEffect(() => {
    setFormData({
      name: settings.name,
      establishment_name: settings.establishment_name || settings.name,
      selected_types: settings.selected_types || [],
      email: settings.email,
      phone: settings.phone,
      address: settings.address,
      website: settings.website,
      enable_email_alerts: settings.enable_email_alerts,
      enable_sms_alerts: settings.enable_sms_alerts,
      payment_reminder_days: settings.payment_reminder_days,
      low_grade_threshold: settings.low_grade_threshold,
      currency_symbol: settings.currency_symbol,
      currency_code: settings.currency_code,
      enable_cash_payment: settings.enable_cash_payment,
      enable_mobile_payment: settings.enable_mobile_payment,
      enable_bank_transfer: settings.enable_bank_transfer,
      bank_details: settings.bank_details,
      receipt_footer: settings.receipt_footer,
      session_timeout: settings.session_timeout,
      min_password_length: settings.min_password_length,
      max_login_attempts: settings.max_login_attempts,
      require_strong_password: settings.require_strong_password,
      maintenance_mode: settings.maintenance_mode,
      two_factor_enforcement: settings.two_factor_enforcement,
      tranche_1_deadline: settings.tranche_1_deadline || '',
      tranche_2_deadline: settings.tranche_2_deadline || '',
      tranche_3_deadline: settings.tranche_3_deadline || '',
      exam_fee_amount: settings.exam_fee_amount || 0,
      slogan: settings.slogan || '',
      english_name: (settings as any).english_name || '',
      city: (settings as any).city || '',
      country: (settings as any).country || '',
      director_title: (settings as any).director_title || '',
      postal_code: (settings as any).postal_code || '',
      certificate_reference: (settings as any).certificate_reference || '',
      article_text: (settings as any).article_text || '',
    });
  }, [settings]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await authService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
      showNotification('Impossible de charger la liste du personnel', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await authService.deleteUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setDeleteConfirmOpen(false);
      showNotification('Membre supprimé avec succès', 'success');
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleAdmin = async (user: any) => {
    try {
      const newRole = user.role === 'admin' ? 'professeur' : 'admin';
      await authService.updateUser(user.id, { role: newRole });
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      showNotification(`Droits mis à jour pour ${user.firstName || user.username}`, 'success');
    } catch (error) {
      showNotification('Erreur lors de la mise à jour des droits', 'error');
    }
  };

  const fetchTuitionTemplates = async () => {
    try {
      const response = await financeService.getTuitionTemplates();
      setTuitionTemplates(response.data);
    } catch (error) {
      showNotification('Erreur lors du chargement des tarifs', 'error');
    }
  };

  React.useEffect(() => {
    if (activeTab === 1) {
      fetchUsers();
    } else if (activeTab === 5) {
      fetchTuitionTemplates();
    }
  }, [activeTab]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authService.createStaff({
        ...staffData,
        role: 'professeur' // Default role as requested
      });
      showNotification('Membre ajouté avec succès', 'success');
      setOpenAddDialog(false);
      fetchUsers();
      setStaffData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
      });
    } catch (error: any) {
      const backendErrors = error.response?.data;
      let message = "Erreur lors de l'ajout";
      if (backendErrors && typeof backendErrors === 'object') {
        message = Object.entries(backendErrors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(' | ');
      }
      showNotification(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async (section: string) => {
    try {
      await updateSettings(formData);
      showNotification(`${section} mis à jour avec succès`, 'success');
    } catch (error: any) {
      console.error('Save failed:', error);
      const backendErrors = error.response?.data;
      let message = `Erreur lors de la mise à jour de ${section}`;

      if (backendErrors && typeof backendErrors === 'object') {
        message = Object.entries(backendErrors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(' | ');
      }

      showNotification(message, 'error');
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      await updateSettings(formData);
      showNotification('Logo mis à jour avec succès', 'success');
    } catch (error) {
      showNotification('Erreur lors du téléchargement du logo', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTemplate = async (template: TuitionTemplate) => {
    setSubmitting(true);
    try {
      await financeService.updateTuitionTemplate(template.id, template);
      showNotification('Grille tarifaire mise à jour', 'success');
      setEditingTemplate(null);
      fetchTuitionTemplates();
    } catch (error) {
      showNotification('Erreur lors de la mise à jour', 'error');
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteEstablishment = async () => {
    if (!user) return;
    
    // SAFETY: Never allow deleting the 'admin' account from the UI
    if (user.username === 'admin') {
      const isImpersonating = !!localStorage.getItem('selectedTenantId');
      if (!isImpersonating) {
        showNotification("Le compte SuperAdmin racine ne peut pas être supprimé.", "error");
        setOpenDeleteEstabDialog(false);
        return;
      }
    }

    setDeleting(true);
    try {
      // If we're impersonating, we want to delete the OWNER of the school being watched, not the SuperAdmin
      // settings.owner_id was added to the API/Context to facilitate this
      const targetUserId = settings.owner_id || user.id;

      await authService.deleteUser(targetUserId);
      showNotification('L\'établissement et toutes ses données ont été supprimés avec succès.', 'success');
      
      // If a SuperAdmin deleted someone else's school, they shouldn't logout
      if ((user as any).is_superuser && String(targetUserId) !== String(user.id)) {
        localStorage.removeItem('selectedTenantId');
        navigate('/superadmin/dashboard');
        window.location.reload(); // Refresh to clear tenant context
      } else {
        logout();
        navigate('/register');
      }
    } catch (error: any) {
      console.error("Deletion failed:", error);
      showNotification(error.response?.data?.error || 'Erreur lors de la suppression de l\'établissement', 'error');
    } finally {
      setDeleting(false);
      setOpenDeleteEstabDialog(false);
    }
  };

  const glassStyle = {
    background: alpha(theme.palette.background.paper, 0.6),
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    borderRadius: { xs: 4, md: 6 },
    boxShadow: `0 20px 50px ${alpha(theme.palette.common.black, 0.05)}`,
    p: { xs: 2.5, sm: 3, md: 4 },
  };

  const tabStyle = {
    minHeight: { xs: 40, md: 48 },
    borderRadius: 3,
    transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    mx: 0.5,
    px: { xs: 1.5, md: 3 },
    fontSize: { xs: '0.75rem', md: '0.875rem' },
    color: 'text.secondary',
    '&.Mui-selected': {
      color: 'primary.main',
      bgcolor: alpha(theme.palette.primary.main, 0.08),
    },
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 6 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <style>
        {`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      {/* Modern Header */}
      <Box sx={{ mb: { xs: 4, md: 6 }, textAlign: 'center' }}>
        <Typography
          variant="h2"
          fontWeight={900}
          sx={{
            color: 'text.primary',
            mb: 1,
            letterSpacing: '-0.02em',
            fontSize: { xs: '1.875rem', sm: '2.5rem', md: '3.5rem' }
          }}
        >
          Configuration <Box component="span" sx={{ color: 'primary.main' }}>Globale</Box>
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 600, mx: 'auto', fontSize: { xs: '0.875rem', md: '1.125rem' } }}>
          Gérez votre établissement en toute simplicité sur tous vos appareils.
        </Typography>
      </Box>

      {/* Floating Tab Bar */}
      <Paper sx={{
        p: 0.5,
        mb: 2,
        borderRadius: { xs: 3, md: 4 },
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        position: 'sticky',
        top: { xs: 56, sm: 64, md: 64 },
        zIndex: 10,
        boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`
      }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => handleTabChange(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            minHeight: { xs: 40, md: 48 },
            '& .MuiTabs-indicator': {
              height: '100%',
              borderRadius: { xs: 2, md: 3 },
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              zIndex: -1,
            },
            '& .MuiTabs-flexContainer': { gap: 0.5 }
          }}
        >
          <Tab icon={<SchoolIcon sx={{ fontSize: { xs: 16, md: 20 } }} />} label="École" iconPosition="start" title="École" sx={tabStyle} />
          <Tab icon={<PersonIcon sx={{ fontSize: { xs: 16, md: 20 } }} />} label="Personnel" iconPosition="start" title="Personnel" sx={tabStyle} />
          <Tab icon={<NotificationsIcon sx={{ fontSize: { xs: 16, md: 20 } }} />} label="Alertes" iconPosition="start" title="Alertes" sx={tabStyle} />
          <Tab icon={<SmsIcon sx={{ fontSize: { xs: 16, md: 20 } }} />} label="SMS" iconPosition="start" title="SMS Gateway" sx={tabStyle} />
          <Tab icon={<PaymentIcon sx={{ fontSize: { xs: 16, md: 20 } }} />} label="Finance" iconPosition="start" title="Finance" sx={tabStyle} />
          <Tab icon={<SchoolIcon sx={{ fontSize: { xs: 16, md: 20 } }} />} label="Tarifs" iconPosition="start" title="Tarifs & Échéances" sx={tabStyle} />
          <Tab icon={<SecurityIcon sx={{ fontSize: { xs: 16, md: 20 } }} />} label="Sécurité" iconPosition="start" title="Sécurité" sx={tabStyle} />
          {isOwner && <Tab icon={<WarningIcon sx={{ fontSize: { xs: 16, md: 20 } }} />} label="Dangers" iconPosition="start" title="Zone de danger" sx={{ ...tabStyle, '&.Mui-selected': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08) } }} />}
        </Tabs>
      </Paper>

      <Box sx={{ minHeight: 400 }}>
        {/* TAB 0: ECOLE */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={{ xs: 2, md: 4 }}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Paper sx={glassStyle}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28 }}><SchoolIcon sx={{ fontSize: 16 }} /></Avatar>
                  Profil Établissement
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Nom de l'établissement"
                        value={formData.establishment_name}
                        onChange={(e) => setFormData({ ...formData, establishment_name: e.target.value, name: e.target.value })}
                        variant="filled"
                        InputProps={{ sx: { borderRadius: 2 } }}
                      />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Nom de l'établissement (Anglais)"
                      value={formData.english_name}
                      onChange={(e) => setFormData({ ...formData, english_name: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Slogan / Devise"
                      value={formData.slogan}
                      onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Ville"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Pays"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Boîte Postale (B.P.)"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Titre du Signataire (ex: Le Proviseur)"
                      value={formData.director_title}
                      onChange={(e) => setFormData({ ...formData, director_title: e.target.value })}
                      helperText="Apparaîtra sur les certificats et relevés"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Référence Certificat (Format)"
                      value={formData.certificate_reference}
                      onChange={(e) => setFormData({ ...formData, certificate_reference: e.target.value })}
                      helperText="Ex: MY_SCHOOL/{ANNEE}/CERT/"
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Article / Décret (Header PDF)"
                      value={formData.article_text}
                      onChange={(e) => setFormData({ ...formData, article_text: e.target.value })}
                      helperText="Saisissez l'article ou le décret qui apparaîtra dans l'en-tête de vos PDF."
                      variant="filled"
                      InputProps={{ sx: { borderRadius: 2 } }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 2, mb: 1.5 }}>Cycles d'Enseignement Actifs</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {[
                        { id: 'garderie', label: 'Garderie' },
                        { id: 'primaire', label: 'École Primaire' },
                        { id: 'general', label: 'Enseignement Général' },
                        { id: 'technique', 'label': 'Enseignement Technique' },
                        { id: 'formation', 'label': 'Centre de formation' },
                      ].map((type) => (
                        <Box
                          key={type.id}
                          onClick={() => {
                            const newTypes = formData.selected_types.includes(type.id)
                              ? formData.selected_types.filter((t: string) => t !== type.id)
                              : [...formData.selected_types, type.id];
                            setFormData({ ...formData, selected_types: newTypes });
                          }}
                          sx={{
                            px: 2,
                            py: 1,
                            borderRadius: 3,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            transition: '0.2s',
                            border: '1px solid',
                            borderColor: formData.selected_types.includes(type.id) ? 'primary.main' : alpha(theme.palette.divider, 0.1),
                            bgcolor: formData.selected_types.includes(type.id) ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                            color: formData.selected_types.includes(type.id) ? 'primary.main' : 'text.secondary',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: alpha(theme.palette.primary.main, 0.05)
                            }
                          }}
                        >
                          {type.label}
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Modifiez les cycles pour adapter dynamiquement vos menus et graphiques.
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      variant="filled"
                      InputProps={{ sx: { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Téléphone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      variant="filled"
                      InputProps={{ sx: { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Adresse"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      multiline
                      rows={2}
                      variant="filled"
                      InputProps={{ sx: { borderRadius: 2 } }}
                    />
                  </Grid>
                </Grid>
                <Button fullWidth={isMobile} variant="contained" size="large" onClick={() => handleSave('Profil École')} sx={{ mt: 3, borderRadius: 3, px: 5 }}>
                  Enregistrer les modifications
                </Button>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Paper sx={{ ...glassStyle, textAlign: 'center', p: 4 }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>Branding</Typography>
                <input
                  title="XSCHOOL"
                  type="file"
                  hidden
                  ref={logoInputRef}
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                <Avatar 
                  src={settings.logo || '/logo.png'}
                  sx={{ width: 140, height: 140, mb: 3, mx: 'auto', border: `4px solid ${alpha(theme.palette.primary.main, 0.1)}`, bgcolor: 'background.default', borderRadius: 4 }}
                >
                  {!settings.logo && <SchoolIcon sx={{ fontSize: 60, color: 'primary.main' }} />}
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Logo de l'école</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Utilisez une image carrée de haute résolution pour un meilleur rendu sur les reçus et bulletins.
                </Typography>
                <Button 
                  variant="outlined" 
                  disabled={submitting}
                  sx={{ borderRadius: 2, px: 4 }}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {submitting ? <Loader size={20} /> : (settings.logo ? "Changer le logo" : "Ajouter un logo")}
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* TAB 1: PERSONNEL */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" fontWeight={800} gutterBottom>Gestion de l'Équipe</Typography>
              <Typography variant="body2" color="text.secondary">Gérez les collaborateurs et leurs droits d'accès.</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
              sx={{ borderRadius: 3, fontWeight: 700 }}
            >
              Ajouter
            </Button>
          </Box>

          {loadingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Loader />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {users.map((staff) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={staff.id}>
                  <Paper
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      position: 'relative',
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 48 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: 'primary.main',
                          fontWeight: 800,
                          width: 36,
                          height: 36,
                          fontSize: '0.875rem',
                        }}
                      >
                        {staff.first_name ? staff.first_name[0] : (staff.username ? staff.username[0].toUpperCase() : '?')}
                      </Avatar>
                    </ListItemAvatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap sx={{ fontSize: '0.9rem' }}>
                        {staff.first_name || ''} {staff.last_name || staff.username}
                      </Typography>
                      <Typography variant="caption" noWrap display="block" color="text.secondary">
                        {staff.email || "Pas d'email"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={staff.role === 'admin'}
                            onChange={() => handleToggleAdmin(staff)}
                            disabled={staff.username === 'admin'}
                          />
                        }
                        label={<Typography variant="caption" fontWeight={700}>Admin</Typography>}
                        labelPlacement="start"
                        sx={{ m: 0 }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          if (staff.id === user?.id) {
                            showNotification("Vous ne pouvez pas supprimer votre propre compte ici. Allez dans l'onglet Dangers.", "warning");
                          } else {
                            setUserToDelete(staff);
                            setDeleteConfirmOpen(true);
                          }
                        }}
                        sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                        disabled={staff.username === 'admin'}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* TAB 2: ALERTES */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={{ xs: 2, md: 4 }}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Paper sx={glassStyle}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28 }}><NotificationsIcon sx={{ fontSize: 16 }} /></Avatar>
                  Canaux de Notification
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>Alertes Email</Typography>
                      <Typography variant="body2" color="text.secondary">Envoyer des notifications par email aux parents et au personnel.</Typography>
                    </Box>
                    <Switch
                      checked={formData.enable_email_alerts}
                      onChange={(e) => setFormData({ ...formData, enable_email_alerts: e.target.checked })}
                    />
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>Alertes SMS</Typography>
                      <Typography variant="body2" color="text.secondary">Envoyer des notifications SMS via la passerelle SMS configurée.</Typography>
                    </Box>
                    <Switch
                      checked={formData.enable_sms_alerts}
                      onChange={(e) => setFormData({ ...formData, enable_sms_alerts: e.target.checked })}
                    />
                  </Paper>
                </Box>
                <Button fullWidth={isMobile} variant="contained" size="large" onClick={() => handleSave("Système d'Alertes")} sx={{ mt: 5, borderRadius: 3, px: 5 }}>
                  Enregistrer les canaux
                </Button>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Paper sx={glassStyle}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 28, height: 28 }}><WarningIcon sx={{ fontSize: 16 }} /></Avatar>
                  Configuration des Seuils
                </Typography>

                <Grid container spacing={4}>
                  <Grid size={{ xs: 12 }}>
                    <Typography gutterBottom fontWeight={600}>Rappel de Paiement (jours avant échéance)</Typography>
                    <Box sx={{ px: 2, py: 1 }}>
                      <Slider
                        value={formData.payment_reminder_days}
                        onChange={(_, v) => setFormData({ ...formData, payment_reminder_days: v as number })}
                        valueLabelDisplay="auto"
                        step={1}
                        marks
                        min={1}
                        max={15}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">L'alerte sera envoyée {formData.payment_reminder_days} jours avant la date limite de paiement.</Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography gutterBottom fontWeight={600}>Seuil d'Alerte de Note Faible (sur 20)</Typography>
                    <Box sx={{ px: 2, py: 1 }}>
                      <Slider
                        value={formData.low_grade_threshold}
                        onChange={(_, v) => setFormData({ ...formData, low_grade_threshold: v as number })}
                        valueLabelDisplay="auto"
                        step={0.5}
                        marks
                        min={5}
                        max={15}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* TAB 3: SMS GATEWAY */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            <Grid size={{ xs: 12, md: 5, lg: 4 }}>
              <Card sx={{ ...glassStyle, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: 'white', border: 'none' }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 700, fontSize: '0.7rem' }}>Crédit Disponible</Typography>
                  <Typography variant="h3" fontWeight={900} sx={{ my: 0.5, fontSize: { xs: '2rem', md: '3rem' } }}>1,250</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9, mb: 3, display: 'block' }}>Unités SMS</Typography>
                  <Button fullWidth variant="contained" sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 800, '&:hover': { bgcolor: alpha('#fff', 0.9) } }}>RECHARGER</Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 7, lg: 8 }}>
              <Paper sx={glassStyle}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2.5 }}>Configuration API</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField fullWidth label="Clé API" type="password" size="small" defaultValue="••••••••••••" />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField fullWidth label="Sender ID" size="small" defaultValue="XSCHOOL" />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* TAB 4: FINANCE */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={{ xs: 2, md: 4 }}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Paper sx={glassStyle}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28 }}><PaymentIcon sx={{ fontSize: 16 }} /></Avatar>
                  Devise & Monnaie
                </Typography>

                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Symbole de la devise"
                      value={formData.currency_symbol}
                      onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                      placeholder="e.g. FCFA, $, €"
                      variant="filled"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Code ISO"
                      value={formData.currency_code}
                      onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
                      placeholder="e.g. XAF, USD, EUR"
                      variant="filled"
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>Personnalisation des Reçus</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Texte en bas de reçu"
                  value={formData.receipt_footer}
                  onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
                  placeholder="Ex: Les frais de scolarité ne sont pas remboursables..."
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />

                <Button fullWidth={isMobile} variant="contained" size="large" onClick={() => handleSave('Réglages Financiers')} sx={{ mt: 5, borderRadius: 3, px: 5 }}>
                  Enregistrer
                </Button>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Paper sx={glassStyle}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>Modes de Paiement Acceptés</Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { id: 'enable_cash_payment', label: 'Espèces (Cash)', desc: 'Autoriser les encaissements directs en agence.' },
                    { id: 'enable_mobile_payment', label: 'Mobile Money', desc: 'Activer les paiements via Orange Money ou MTN MoMo.' },
                    { id: 'enable_bank_transfer', label: 'Virement Bancaire', desc: 'Permettre aux parents de payer par virement.' },
                  ].map((mode) => (
                    <Paper key={mode.id} variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>{mode.label}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{mode.desc}</Typography>
                      </Box>
                      <Switch
                        checked={(formData as any)[mode.id]}
                        onChange={(e) => setFormData({ ...formData, [mode.id]: e.target.checked })}
                      />
                    </Paper>
                  ))}
                </Box>

                {formData.enable_bank_transfer && (
                  <Box sx={{ mt: 3 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Coordonnées Bancaires"
                      value={formData.bank_details}
                      onChange={(e) => setFormData({ ...formData, bank_details: e.target.value })}
                      placeholder="IBAN, SWIFT, Nom de la banque..."
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* TAB 5: TARIFS & ECHEANCES */}
        <TabPanel value={activeTab} index={5}>
          <Grid container spacing={{ xs: 2, md: 4 }}>
            <Grid size={{ xs: 12, lg: 12 }}>
              <Paper sx={glassStyle}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28 }}><SchoolIcon sx={{ fontSize: 16 }} /></Avatar>
                  Échéanciers de Paiement
                </Typography>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Date Limite Tranche 1"
                      type="date"
                      value={formData.tranche_1_deadline}
                      onChange={(e) => setFormData({ ...formData, tranche_1_deadline: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      variant="filled"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Date Limite Tranche 2"
                      type="date"
                      value={formData.tranche_2_deadline}
                      onChange={(e) => setFormData({ ...formData, tranche_2_deadline: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      variant="filled"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Date Limite Tranche 3"
                      type="date"
                      value={formData.tranche_3_deadline}
                      onChange={(e) => setFormData({ ...formData, tranche_3_deadline: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      variant="filled"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Frais de TD / Examen"
                      type="number"
                      value={formData.exam_fee_amount}
                      onChange={(e) => setFormData({ ...formData, exam_fee_amount: parseInt(e.target.value) })}
                      variant="filled"
                      helperText="Montant global des cours de soutien pour les classes d'examen"
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight={800}>Grille Tarifaire par Catégorie</Typography>
                </Box>

                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 800 }}>Classe / Zone</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: 800 }}>Inscr.</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: 800 }}>T1</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: 800 }}>T2</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: 800 }}>T3</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: 800 }}>Mat.</th>
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: 800 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tuitionTemplates.map((template) => (
                          <tr key={template.id} style={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                            <td style={{ padding: '12px' }}>
                              <Typography variant="body2" fontWeight={700}>{template.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{template.categoryDisplay}</Typography>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>{template.registrationFee.toLocaleString()}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>{template.tranche1.toLocaleString()}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>{template.tranche2.toLocaleString()}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>{template.tranche3.toLocaleString()}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>{template.materialFee.toLocaleString()}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setEditingTemplate(template)}
                              >
                                Éditer
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Paper>

                <Button fullWidth={isMobile} variant="contained" size="large" onClick={() => handleSave('Tarifs & Échéances')} sx={{ mt: 5, borderRadius: 3, px: 5 }}>
                  Enregistrer les échéances
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* TAB 6: SECURITY */}
        <TabPanel value={activeTab} index={6}>
          <Grid container spacing={{ xs: 2, md: 4 }}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper sx={glassStyle}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 28, height: 28 }}><SecurityIcon sx={{ fontSize: 16 }} /></Avatar>
                  Politique de Mot de Passe
                </Typography>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">Longueur minimale: {formData.min_password_length} caractères</Typography>
                  <Slider
                    value={formData.min_password_length}
                    min={6}
                    max={16}
                    step={1}
                    onChange={(_, val) => setFormData({ ...formData, min_password_length: val as number })}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Box>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>Exiger un mot de passe fort</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>Obliger majuscules, chiffres et caractères spéciaux.</Typography>
                  </Box>
                  <Switch
                    checked={formData.require_strong_password}
                    onChange={(e) => setFormData({ ...formData, require_strong_password: e.target.checked })}
                  />
                </Paper>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>Sécurité Avancée</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { id: 'two_factor_enforcement', label: 'Forcer la Double Authentification', desc: 'Obliger tout le personnel à configurer le 2FA.' },
                    { id: 'maintenance_mode', label: 'Mode Maintenance', desc: 'Rendre le site inaccessible aux utilisateurs non-administrateurs.' },
                  ].map((policy) => (
                    <Paper key={policy.id} variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>{policy.label}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{policy.desc}</Typography>
                      </Box>
                      <Switch
                        checked={(formData as any)[policy.id]}
                        onChange={(e) => setFormData({ ...formData, [policy.id]: e.target.checked })}
                        color={policy.id === 'maintenance_mode' ? 'warning' : 'primary'}
                      />
                    </Paper>
                  ))}
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper sx={glassStyle}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>Gestion des Sessions & Accès</Typography>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">Délai d'expiration: {formData.session_timeout} minutes</Typography>
                  <Slider
                    value={formData.session_timeout}
                    min={5}
                    max={120}
                    step={5}
                    onChange={(_, val) => setFormData({ ...formData, session_timeout: val as number })}
                    marks={[{ value: 15, label: '15m' }, { value: 30, label: '30m' }, { value: 60, label: '1h' }, { value: 120, label: '2h' }]}
                    valueLabelDisplay="auto"
                  />
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">Tentatives de connexion max: {formData.max_login_attempts}</Typography>
                  <Slider
                    value={formData.max_login_attempts}
                    min={3}
                    max={10}
                    step={1}
                    onChange={(_, val) => setFormData({ ...formData, max_login_attempts: val as number })}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Box>

                <Button fullWidth variant="contained" size="large" onClick={() => handleSave('Politiques de Sécurité')} sx={{ mt: 5, borderRadius: 3, px: 5, bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}>
                  Appliquer les restrictions
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        {/* TAB 7: DANGERS (OWNER ONLY) */}
        {isOwner && (
          <TabPanel value={activeTab} index={7}>
            <Paper sx={{ ...glassStyle, border: `2px solid ${alpha(theme.palette.error.main, 0.2)}`, bgcolor: alpha(theme.palette.error.main, 0.02) }}>
              <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'error.main', width: 48, height: 48 }}>
                  <WarningIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={900} color="error.main">Zone de Danger</Typography>
                  <Typography variant="body2" color="text.secondary">Actions irréversibles concernant l'ensemble de votre établissement.</Typography>
                </Box>
              </Box>

              <Card variant="outlined" sx={{ borderColor: alpha(theme.palette.error.main, 0.3), borderRadius: 4, bgcolor: 'transparent' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight={800} gutterBottom>Suppression de l'Établissement</Typography>
                  <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
                    La suppression de votre compte entrainera la suppression immédiate et définitive de :
                  </Typography>
                  <Box component="ul" sx={{ mb: 4, color: 'text.secondary', pl: 2 }}>
                    <li>Toutes les données élèves et classes</li>
                    <li>L'historique complet des paiements et finances</li>
                    <li>Les comptes de tous vos collaborateurs</li>
                    <li>Toutes vos configurations personnalisées</li>
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    color="error" 
                    size="large"
                    onClick={() => {
                      setDeleteStep(1);
                      setConfirmName('');
                      setOpenDeleteEstabDialog(true);
                    }}
                    sx={{ borderRadius: 3, px: 6, fontWeight: 900, py: 1.5, boxShadow: `0 8px 24px ${alpha(theme.palette.error.main, 0.3)}` }}
                  >
                    Supprimer l'Établissement Définitivement
                  </Button>
                </CardContent>
              </Card>
            </Paper>
          </TabPanel>
        )}
      </Box>

      {/* Add Staff Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 4, bgcolor: 'background.paper' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Ajouter un membre
          <IconButton onClick={() => setOpenAddDialog(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleAddStaff} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Prénom"
                  value={staffData.first_name}
                  onChange={(e) => setStaffData({ ...staffData, first_name: e.target.value })}
                  required
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Nom"
                  value={staffData.last_name}
                  onChange={(e) => setStaffData({ ...staffData, last_name: e.target.value })}
                  required
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Nom d'utilisateur"
                  value={staffData.username}
                  onChange={(e) => setStaffData({ ...staffData, username: e.target.value })}
                  required
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={staffData.email}
                  onChange={(e) => setStaffData({ ...staffData, email: e.target.value })}
                  required
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenAddDialog(false)} color="inherit">Annuler</Button>
          <Button
            variant="contained"
            onClick={handleAddStaff}
            disabled={submitting}
            sx={{ borderRadius: 2, px: 4 }}
          >
            {submitting ? <Loader size={24} /> : "Confirmer l'ajout"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Tuition Template Dialog */}
      <Dialog
        open={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Modifier les Tarifs: {editingTemplate?.name}</DialogTitle>
        <DialogContent dividers>
          {editingTemplate && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Frais d'Inscription"
                  type="number"
                  value={editingTemplate.registrationFee}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, registrationFee: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Tranche 1"
                  type="number"
                  value={editingTemplate.tranche1}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, tranche1: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Tranche 2"
                  type="number"
                  value={editingTemplate.tranche2}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, tranche2: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Tranche 3"
                  type="number"
                  value={editingTemplate.tranche3}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, tranche3: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Matières d'Œuvre"
                  type="number"
                  value={editingTemplate.materialFee}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, materialFee: parseInt(e.target.value) })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditingTemplate(null)} color="inherit">Annuler</Button>
          <Button
            variant="contained"
            onClick={() => editingTemplate && handleUpdateTemplate(editingTemplate)}
            disabled={submitting}
            sx={{ borderRadius: 2, px: 4 }}
          >
            {submitting ? <Loader size={24} /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, maxWidth: 400 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'error.main', fontWeight: 800 }}>
          <WarningIcon /> Confirmation
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Êtes-vous sûr de vouloir supprimer <strong>{userToDelete?.firstName} {userToDelete?.lastName || userToDelete?.username}</strong> ?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cette action est irréversible et supprimera toutes les informations liées à ce membre de la base de données.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.error.main, 0.05) }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Annuler</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteUser}
            disabled={deleting}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {deleting ? <Loader size={24} /> : 'Supprimer définitivement'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Establishment Multi-Step Dialog */}
      <Dialog
        open={openDeleteEstabDialog}
        onClose={() => !deleting && setOpenDeleteEstabDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: 'error.main', textAlign: 'center', pt: 3 }}>
          <WarningIcon sx={{ fontSize: 48, mb: 1, display: 'block', mx: 'auto' }} />
          Action Haute Sécurité
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {deleteStep === 1 ? (
              <>
                <Typography variant="h6" fontWeight={800} gutterBottom>Êtes-vous absolument sûr ?</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  Cette action ne peut pas être annulée. En supprimant votre compte, vous détruisez l'intégralité de l'infrastructure numérique de votre école.
                </Typography>
                <Button 
                  variant="outlined" 
                  color="error" 
                  fullWidth 
                  size="large"
                  onClick={() => setDeleteStep(2)}
                  sx={{ borderRadius: 3, fontWeight: 800 }}
                >
                  Je comprends, passer à la vérification
                </Button>
              </>
            ) : (
              <>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Veuillez saisir le nom de votre établissement pour confirmer :
                </Typography>
                <Typography variant="body2" color="primary.main" fontWeight={900} sx={{ mb: 2, fontSize: '1.1rem' }}>
                  {settings.name}
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Tapez le nom exactement ici"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  variant="outlined"
                  autoFocus
                  sx={{ mb: 3 }}
                />
                <Button 
                  variant="contained" 
                  color="error" 
                  fullWidth 
                  size="large"
                  disabled={confirmName !== settings.name || deleting}
                  onClick={handleDeleteEstablishment}
                  sx={{ borderRadius: 3, fontWeight: 900 }}
                >
                  {deleting ? <Loader size={24} color="inherit" /> : "CONFIRMER LA DESTRUCTION DU COMPTE"}
                </Button>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button onClick={() => setOpenDeleteEstabDialog(false)} color="inherit" disabled={deleting}>
            Annuler
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
