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

  Tooltip,
  useTheme,
  useMediaQuery,
  alpha,
  LinearProgress,
  Avatar,
  Divider,
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
} from '@mui/icons-material';
import { schoolService } from '@/services/api';
import type { Student, Class } from '@/types';
import { useNotification } from '@/contexts/NotificationContext';

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
  const [targetYearId, setTargetYearId] = useState('');
  const [schoolYears, setSchoolYears] = useState<any[]>([]);
  const [sourceStudents, setSourceStudents] = useState<Student[]>([]);
  const [decisions, setDecisions] = useState<Record<string, PromotionDecision>>({});

  const steps = ['Configuration', 'Traitement des élèves', 'Confirmation'];

  useEffect(() => {
    if (open) {
      const fetchInitialData = async () => {
        try {
          const res = await schoolService.getSchoolYears();
          setSchoolYears(res.data);
        } catch (error) {
          console.error('Failed to fetch school years', error);
        }
      };
      fetchInitialData();
    }
  }, [open]);

  // Reset state when opening/closing
  useEffect(() => {
    if (!open) {
      setActiveStep(0);
      setSourceClassId('');
      setTargetYearId('');
      setSourceStudents([]);
      setDecisions({});
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
    } catch (error) {
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
    return classesList.filter(c => c.schoolYear === targetYearId);
  }, [classesList, targetYearId]);

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
                      <MenuItem key={c.id} value={c.id}>{c.name} ({c.level})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  2. Année Scolaire de Destination
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Sélectionnez l'année vers laquelle les élèves admis seront transférés.
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Année Cible</InputLabel>
                  <Select
                    value={targetYearId}
                    onChange={(e) => setTargetYearId(e.target.value)}
                    label="Année Cible"
                  >
                    {schoolYears.map(y => (
                      <MenuItem key={y.id} value={y.id}>{y.year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
            <TableContainer component={Box} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Élève</TableCell>
                    <TableCell align="center">Décision</TableCell>
                    <TableCell>Classe de destination</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sourceStudents.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                            {s.lastName[0]}{s.firstName[0]}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>
                            {s.lastName} {s.firstName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <ToggleButtonGroup
                          value={decisions[s.id]?.status}
                          exclusive
                          onChange={(_, val) => val && updateDecision(s.id, { status: val })}
                          size="small"
                          color="primary"
                        >
                          <ToggleButton value="promoted" sx={{ borderLeft: 1, borderColor: 'divider' }}>
                            <Tooltip title="Admis / Promu">
                              <TrendingUpIcon fontSize="small" color={decisions[s.id]?.status === 'promoted' ? 'inherit' : 'success'} />
                            </Tooltip>
                          </ToggleButton>
                          <ToggleButton value="repeating">
                            <Tooltip title="Échoué / Redoublant">
                              <RepeatIcon fontSize="small" color={decisions[s.id]?.status === 'repeating' ? 'inherit' : 'warning'} />
                            </Tooltip>
                          </ToggleButton>
                          <ToggleButton value="leaving">
                            <Tooltip title="Quitté / Sorti">
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
                                <em>Choisir une classe...</em>
                              </MenuItem>
                              {targetClasses.map(tc => (
                                <MenuItem key={tc.id} value={tc.id}>{tc.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                        {decisions[s.id]?.status === 'leaving' && (
                          <Typography variant="caption" color="error" fontWeight={600}>
                            L'élève quittera l'établissement
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
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
