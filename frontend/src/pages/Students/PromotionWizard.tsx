import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stepper,
  Step,
  StepLabel,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButtonGroup,
  ToggleButton,
  Checkbox,
  Stack,
  useTheme,
  useMediaQuery,
  alpha,
  Avatar,
  LinearProgress,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Repeat as RepeatIcon,
  ExitToApp as ExitToAppIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  AutoFixHigh as BulkIcon,
} from '@mui/icons-material';
import { schoolService } from '@/services/api';
import type { Student, Class } from '@/types';
import { useNotification } from '@/contexts/NotificationContext';
import { getNextAcademicYear } from '@/utils/academicYear';

interface PromotionWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classesList: Class[];
}

interface PromotionDecision {
  status: 'promoted' | 'repeating' | 'leaving';
  targetClassId: string;
}

export const PromotionWizard: React.FC<PromotionWizardProps> = ({
  open,
  onClose,
  onSuccess,
  classesList,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { showNotification } = useNotification();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sourceClassId, setSourceClassId] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [sourceStudents, setSourceStudents] = useState<Student[]>([]);
  const [decisions, setDecisions] = useState<Record<string, PromotionDecision>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Bulk action states
  const [bulkStatus, setBulkStatus] = useState<'promoted' | 'repeating' | 'leaving' | ''>('');
  const [bulkTargetClassId, setBulkTargetClassId] = useState('');

  const steps = ['Configuration', 'Traitement des élèves', 'Confirmation'];

  useEffect(() => {
    if (open) {
      setTargetYear(getNextAcademicYear());
    } else {
      setActiveStep(0);
      setSourceClassId('');
      setSourceStudents([]);
      setDecisions({});
      setSelectedIds([]);
      setBulkStatus('');
      setBulkTargetClassId('');
    }
  }, [open]);

  const handleSourceClassChange = async (classId: string) => {
    setSourceClassId(classId);
    try {
      setLoading(true);
      const res = await schoolService.getStudents();
      const filtered = res.data.filter((s: Student) => s.classId === classId);
      setSourceStudents(filtered);
      
      // Initialize decisions
      const initialDecisions: Record<string, PromotionDecision> = {};
      filtered.forEach((s: Student) => {
        initialDecisions[s.id] = {
          status: 'promoted',
          targetClassId: '',
        };
      });
      setDecisions(initialDecisions);
    } catch (_error) {
      showNotification('Erreur lors du chargement des élèves', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !sourceClassId) {
      showNotification('Veuillez sélectionner une classe source', 'warning');
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const updateDecision = (studentId: string, updates: Partial<PromotionDecision>) => {
    setDecisions((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], ...updates },
    }));
  };

  const targetClasses = useMemo(() => {
    // Note: in a real scenario, we might need to verify the year ID from backend
    // but the request asks for automation based on current date.
    return classesList; // Listing all available classes for destination
  }, [classesList]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(sourceStudents.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const applyBulkAction = () => {
    if (!bulkStatus) {
      showNotification('Veuillez sélectionner une décision groupée', 'warning');
      return;
    }
    if (selectedIds.length === 0) {
      showNotification('Aucun élève sélectionné', 'warning');
      return;
    }

    setDecisions(prev => {
      const updated = { ...prev };
      selectedIds.forEach(id => {
        updated[id] = {
          ...updated[id],
          status: bulkStatus as 'promoted' | 'repeating' | 'leaving',
          targetClassId: bulkTargetClassId || updated[id].targetClassId
        };
      });
      return updated;
    });
    
    showNotification(`${selectedIds.length} élèves mis à jour`, 'success');
  };

  const handleFinish = async () => {
    try {
      setLoading(true);
      const payload = sourceStudents.map(s => {
        const decision = decisions[s.id];
        return {
          studentId: s.id,
          classId: decision.status === 'leaving' ? s.classId : (decision.targetClassId || s.classId),
          isRepeating: decision.status === 'repeating',
          status: decision.status === 'leaving' ? 'inactive' : 'active',
        };
      });

      await schoolService.bulkPromoteStudents(payload);
      showNotification('Passage de classe effectué avec succès', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Promotion failed', error);
      showNotification('Erreur lors du traitement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ py: 2 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  1. Sélection de la Classe Source
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Choisissez la classe d'origine dont vous souhaitez traiter les élèves.
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Classe Source</InputLabel>
                  <Select
                    value={sourceClassId}
                    onChange={(e) => handleSourceClassChange(e.target.value)}
                    label="Classe Source"
                  >
                    {classesList.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  2. Année Scolaire de Destination
                </Typography>
                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 2, border: '1px solid', borderColor: 'info.light' }}>
                   <Typography variant="h6" color="info.main" fontWeight={700}>
                     {targetYear}
                   </Typography>
                   <Typography variant="caption" color="text.secondary">
                     Calculé automatiquement (Transition en Septembre)
                   </Typography>
                </Box>
              </Grid>
            </Grid>
            {sourceClassId && (
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), border: '1px dashed', borderColor: 'primary.main' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <GroupIcon color="primary" />
                      <Typography variant="h6">
                        <strong>{sourceStudents.length}</strong> élèves identifiés dans cette classe
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        );
      case 1:
        return (
          <Box sx={{ py: 2 }}>
            {/* Bulk Actions Bar */}
            <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.secondary.main, 0.04), border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ py: '12px !important' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BulkIcon color="secondary" />
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                      Actions Groupées ({selectedIds.length})
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Décision groupée</InputLabel>
                    <Select
                      value={bulkStatus}
                      onChange={(e) => setBulkStatus(e.target.value as any)}
                      label="Décision groupée"
                    >
                      <MenuItem value="promoted">Tous Admis</MenuItem>
                      <MenuItem value="repeating">Tous Redoublants</MenuItem>
                      <MenuItem value="leaving">Tous Sortants</MenuItem>
                    </Select>
                  </FormControl>
                  {bulkStatus !== 'leaving' && (
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Classe cible groupée</InputLabel>
                      <Select
                        value={bulkTargetClassId}
                        onChange={(e) => setBulkTargetClassId(e.target.value)}
                        label="Classe cible groupée"
                      >
                        <MenuItem value=""><em>Conserver choix individuel</em></MenuItem>
                        {targetClasses.map(tc => (
                          <MenuItem key={tc.id} value={tc.id}>{tc.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    size="small"
                    onClick={applyBulkAction}
                    disabled={selectedIds.length === 0}
                    sx={{ fontWeight: 700 }}
                  >
                    Appliquer
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <TableContainer component={Box} sx={{ maxHeight: 400, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ bgcolor: 'background.neutral' }}>
                      <Checkbox
                        indeterminate={selectedIds.length > 0 && selectedIds.length < sourceStudents.length}
                        checked={sourceStudents.length > 0 && selectedIds.length === sourceStudents.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell sx={{ bgcolor: 'background.neutral', fontWeight: 700 }}>Élève</TableCell>
                    <TableCell align="center" sx={{ bgcolor: 'background.neutral', fontWeight: 700 }}>Décision</TableCell>
                    <TableCell sx={{ bgcolor: 'background.neutral', fontWeight: 700 }}>Classe de destination</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sourceStudents.map((s) => {
                    const isItemSelected = selectedIds.includes(s.id);
                    return (
                      <TableRow 
                        key={s.id} 
                        hover 
                        selected={isItemSelected}
                        sx={{ '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isItemSelected}
                            onChange={() => handleSelectOne(s.id)}
                          />
                        </TableCell>
                        <TableCell onClick={() => handleSelectOne(s.id)} sx={{ cursor: 'pointer' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: isItemSelected ? 'primary.main' : 'grey.400' }}>
                              {(s.lastName && s.lastName[0]) || ''}{(s.firstName && s.firstName[0]) || ''}
                            </Avatar>
                            <Typography variant="body2" fontWeight={isItemSelected ? 600 : 400}>
                              {s.lastName} {s.firstName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <ToggleButtonGroup
                            onChange={(_, val: 'promoted' | 'repeating' | 'leaving' | null) => val && updateDecision(s.id, { status: val })}
                            size="small"
                            color="primary"
                          >
                            <ToggleButton value="promoted">
                              <Tooltip title="Admis">
                                <TrendingUpIcon fontSize="small" color={decisions[s.id]?.status === 'promoted' ? 'inherit' : 'success'} />
                              </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="repeating">
                              <Tooltip title="Redoublant">
                                <RepeatIcon fontSize="small" color={decisions[s.id]?.status === 'repeating' ? 'inherit' : 'warning'} />
                              </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="leaving">
                              <Tooltip title="Sortant">
                                <ExitToAppIcon fontSize="small" color={decisions[s.id]?.status === 'leaving' ? 'inherit' : 'error'} />
                              </Tooltip>
                            </ToggleButton>
                          </ToggleButtonGroup>
                        </TableCell>
                        <TableCell>
                          {decisions[s.id]?.status !== 'leaving' && (
                            <FormControl fullWidth size="small">
                              <Select
                                value={decisions[s.id]?.targetClassId}
                                onChange={(e) => updateDecision(s.id, { targetClassId: e.target.value })}
                                displayEmpty
                              >
                                <MenuItem value="">
                                  <em>Choisir...</em>
                                </MenuItem>
                                {targetClasses.map(tc => (
                                  <MenuItem key={tc.id} value={tc.id}>{tc.name}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                          {decisions[s.id]?.status === 'leaving' && (
                            <Typography variant="caption" color="error" fontWeight={600}>
                              Sortie définitive
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <SchoolIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom fontWeight={700}>
              Résumé de la promotion
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Vous êtes sur le point de valider le passage de classe pour <strong>{sourceStudents.length}</strong> élèves.
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                { label: 'Admis (Promus)', count: Object.values(decisions).filter(d => d.status === 'promoted').length, color: 'success.main' },
                { label: 'Redoublants', count: Object.values(decisions).filter(d => d.status === 'repeating').length, color: 'warning.main' },
                { label: 'Sortants', count: Object.values(decisions).filter(d => d.status === 'leaving').length, color: 'error.main' },
              ].map((item, idx) => (
                <Grid size={{ xs: 12, md: 4 }} key={idx}>
                  <Card sx={{ border: '1px solid', borderColor: item.color, bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
                    <CardContent>
                      <Typography variant="h3" fontWeight={800} sx={{ color: item.color }}>{item.count}</Typography>
                      <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>{item.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ p: 2, bgcolor: 'warning.lighter', borderRadius: 2, border: '1px solid', borderColor: 'warning.light' }}>
              <Typography variant="body2" color="warning.dark" sx={{ fontStyle: 'italic' }}>
                Note : Les élèves passeront de la classe <strong>{getClassName(sourceClassId)}</strong> vers leurs nouvelles destinations listées.
                Toutes les modifications sont irréversibles après validation.
                <br /><br />
                Les informations de paiement seront automatiquement renouvelées pour la nouvelle année scolaire.
                L'historique des paiements précédents est conservé mais ne sera plus déduit du nouveau solde.
              </Typography>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  const getClassName = (id: string) => classesList.find(c => c.id === id)?.name || 'N/A';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: fullScreen ? 0 : 4, minHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ bgcolor: 'secondary.main', p: 1, borderRadius: 2, display: 'flex' }}>
          <TrendingUpIcon sx={{ color: 'white' }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
            Passage de Classe des Élèves
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Processus de clôture et de transition d'année scolaire
          </Typography>
        </Box>
      </DialogTitle>

      <Divider />

      <Box sx={{ width: '100%', px: 3, pt: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {renderStepContent(activeStep)}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Button
          onClick={onClose}
          color="inherit"
          disabled={loading}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Annuler
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {activeStep !== 0 && (
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              disabled={loading}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Retour
            </Button>
          )}
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleFinish}
              disabled={loading}
              startIcon={loading ? <LinearProgress sx={{ width: 20 }} /> : <CheckCircleIcon />}
              sx={{ borderRadius: 2, textTransform: 'none', px: 4, fontWeight: 700 }}
            >
              Valider la promotion
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNext}
              disabled={loading}
              sx={{ borderRadius: 2, textTransform: 'none', px: 4, fontWeight: 700 }}
            >
              Continuer
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};
