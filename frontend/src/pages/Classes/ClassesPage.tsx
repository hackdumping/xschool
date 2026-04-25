import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Divider,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  useTheme,
  alpha,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useEffect } from 'react';
import { schoolService, financeService } from '@/services/api';
import { useSchool } from '@/contexts/SchoolContext';
import { useNotification } from '@/contexts/NotificationContext';
import { getCurrentAcademicYear } from '@/utils/academicYear';
import type { Class, Student, Payment } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  garderie: 'Garderie',
  primaire: 'École Primaire',
  general: 'Enseignement Général',
  technique: 'Enseignement Technique',
  formation: 'Centre de formation',
};

const LEVEL_MAPPING: Record<string, string[]> = {
  garderie: ['Petite Section', 'Moyenne Section', 'Grande Section'],
  primaire: ['SIL', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'],
  general: ['6ème', '5ème', '4ème', '3ème', '2nde A', '2nde C', '1ère A', '1ère C', '1ère D', 'Tle A', 'Tle C', 'Tle D'],
  technique: ['1ère Année', '2ème Année', '3ème Année', '4ème Année', '2nde', '1ère', 'Tle'],
  formation: ['Cycle 1', 'Cycle 2', 'Cycle 3', 'Spécialisation'],
};

interface ClassCardProps {
  classData: Class;
  students: Student[];
  payments: Payment[];
  onView: (classData: Class) => void;
  onEdit: (classData: Class) => void;
  onDelete: (classData: Class) => void;
  schoolYears: any[];
}

const ClassCard: React.FC<ClassCardProps> = ({ classData, students, payments, onView, onEdit, onDelete, schoolYears }) => {
  // Calculate class stats
  const classStudents = students.filter(s => s.classId === classData.id);
  const studentCount = classStudents.length;
  const occupancyRate = (studentCount / classData.maxSize) * 100;

  // Calculate financial recovery
  const totalExpected = (classData.tranches?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0) * studentCount;
  const classStudentIds = classStudents.map(s => s.id);
  const totalPaid = payments
    .filter(p => classStudentIds.includes(p.studentId))
    .reduce((sum: number, p: any) => sum + Number(p.amountPaid), 0);
  const recoveryRate = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;

  return (
    <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 3, flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {classData.name}
            </Typography>
            <Typography component="div" variant="body2" color="text.secondary">
              Niveau: {classData.level} | {classData.categoryDisplay}
              {classData.isExam && <Chip label="Examen" size="small" color="secondary" sx={{ ml: 1, height: 16, fontSize: '0.65rem' }} />}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <Chip
              size="small"
              label={schoolYears.find(y => y.id === classData.schoolYear)?.year || classData.schoolYear}
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<PeopleIcon sx={{ fontSize: '1rem !important' }} />}
              label={`${studentCount} élèves`}
              color={occupancyRate > 90 ? "error" : "success"}
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>

        {/* Student Count */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Effectif
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={500}>
              {studentCount} / {classData.maxSize}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={occupancyRate}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                bgcolor: occupancyRate > 90 ? 'error.main' : occupancyRate > 75 ? 'warning.main' : 'success.main',
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Recovery Rate */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Taux de Recouvrement
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={500}>
              {recoveryRate.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={recoveryRate}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                bgcolor: recoveryRate > 80 ? 'success.main' : recoveryRate > 50 ? 'warning.main' : 'error.main',
                borderRadius: 3,
              },
            }}
          />
        </Box>

      </CardContent>

      {/* Actions */}
      <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Tooltip title="Voir détails">
          <IconButton size="small" onClick={() => onView(classData)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Modifier">
          <IconButton size="small" onClick={() => onEdit(classData)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Supprimer">
          <IconButton size="small" color="error" onClick={() => onDelete(classData)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  );
};

export const ClassesPage: React.FC = () => {
  const { settings } = useSchool();
  const { showNotification } = useNotification();
  const theme = useTheme();
  const [classesList, setClassesList] = useState<Class[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [paymentsList, setPaymentsList] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'add'>('view');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Dynamic tabs based on current school settings (not static user profile)
  const allowedTypes = settings.selected_types || ['general'];
  const [categoryTab, setCategoryTab] = useState(allowedTypes[0] || 'all');
  const [schoolYears, setSchoolYears] = useState<any[]>([]);

  const filteredClasses = classesList.filter(c => 
    categoryTab === 'all' || c.category === categoryTab
  );
  
  // Calculate specific stats based on active tab
  const activeClassIDs = filteredClasses.map(c => c.id);
  const filteredStudentsCount = studentsList.filter(s => activeClassIDs.includes(s.classId)).length;
  const totalCapacity = filteredClasses.reduce((acc, c) => acc + c.maxSize, 0);
  const totalOccupancyRate = totalCapacity > 0 ? (filteredStudentsCount / totalCapacity) * 100 : 0;
  const availablePlaces = totalCapacity - filteredStudentsCount;

  const [tuitionTemplates, setTuitionTemplates] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    level: '',
    maxSize: 30,
    schoolYear: getCurrentAcademicYear(),
    category: allowedTypes[0] as any,
    tuitionTemplate: '' as string | number,
    isExam: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, studentsRes, paymentsRes, templatesRes, yearsRes] = await Promise.all([
          schoolService.getClasses(),
          schoolService.getStudents(),
          financeService.getPayments(),
          financeService.getTuitionTemplates(),
          schoolService.getSchoolYears(),
        ]);
        setClassesList(classesRes.data);
        setStudentsList(studentsRes.data);
        setPaymentsList(paymentsRes.data);
        setTuitionTemplates(templatesRes.data);
        setSchoolYears(yearsRes.data);
        
        setFormData(prev => ({ ...prev, schoolYear: getCurrentAcademicYear() }));
      } catch (error: any) {
        console.error('Failed to fetch classes data', error);
        const msg = error.response?.data?.detail || error.message || 'Erreur inconnue';
        showNotification(`Erreur lors du chargement des classes: ${msg}`, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showNotification]);

  const handleView = (classData: Class) => {
    setSelectedClass(classData);
    setDialogMode('view');
    setOpenDialog(true);
  };

  const handleEdit = (classData: Class) => {
    setSelectedClass(classData);
    setFormData({
      level: classData.level,
      maxSize: classData.maxSize,
      schoolYear: classData.schoolYear,
      category: classData.category,
      tuitionTemplate: classData.tuitionTemplate || '',
      isExam: classData.isExam,
    });
    setDialogMode('edit');
    setOpenDialog(true);
  };

  const handleDelete = (classData: Class) => {
    setClassToDelete(classData);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;
    setIsDeleting(true);
    try {
      await schoolService.deleteClass(classToDelete.id);
      showNotification('Classe supprimée avec succès', 'success');
      setDeleteDialogOpen(false);
      setClassToDelete(null);
      refreshData();
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddClass = () => {
    setSelectedClass(null);
    setFormData({
      level: '',
      maxSize: 30,
      schoolYear: getCurrentAcademicYear(),
      category: categoryTab !== 'all' ? categoryTab as any : allowedTypes[0] as any,
      tuitionTemplate: '',
      isExam: false,
    });
    setDialogMode('add');
    setOpenDialog(true);
  };

  const handleSaveClass = async () => {
    try {
      // Resolve school year ID if it's a string (happens on newly initialized forms)
      let resolvedYearId = formData.schoolYear;
      if (typeof formData.schoolYear === 'string') {
        const yearObj = schoolYears.find(y => y.year === formData.schoolYear);
        if (yearObj) {
          resolvedYearId = yearObj.id;
        } else {
          // If the year doesn't exist in DB, we should probably warn or let it fail naturally
          console.warn(`Year ${formData.schoolYear} not found in database objects.`);
        }
      }

      const payload = {
        name: formData.level, // Sync name with level for consistency
        level: formData.level,
        maxSize: formData.maxSize,
        schoolYear: typeof resolvedYearId === 'number' ? resolvedYearId : null,
        category: formData.category,
        tuitionTemplate: formData.tuitionTemplate || null,
        isExam: formData.isExam,
      };
      
      if (dialogMode === 'edit' && selectedClass) {
        await schoolService.updateClass(selectedClass.id, payload);
        showNotification('Classe mise à jour avec succès', 'success');
      } else if (dialogMode === 'add') {
        await schoolService.createClass(payload);
        showNotification('Classe créée avec succès', 'success');
      }
      setOpenDialog(false);
      refreshData();
    } catch (error: any) {
      console.error('Save class error:', error);
      const backendError = error.response?.data;
      let errorMessage = 'Erreur lors de l\'enregistrement';
      
      if (backendError) {
        if (typeof backendError === 'object') {
          // Flatten standard DRF error object
          errorMessage = Object.entries(backendError)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
          
          if (backendError.non_field_errors) {
            errorMessage = backendError.non_field_errors.join(', ');
          }
        } else if (typeof backendError === 'string') {
          errorMessage = backendError;
        }
      }
      
      showNotification(errorMessage, 'error');
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const classesRes = await schoolService.getClasses();
      setClassesList(classesRes.data);
    } catch (error) {
      showNotification('Erreur lors de l\'actualisation', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get class students
  const getClassStudents = (classId: string) => {
    return studentsList.filter(s => s.classId === classId);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
          Chargement des classes...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            Gestion des Classes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {classesList.length} classes pour l'année scolaire {getCurrentAcademicYear()}
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddClass}
          sx={{ alignSelf: { xs: 'flex-end', sm: 'auto' } }}
        >
          Nouvelle Classe
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={categoryTab} 
          onChange={(_, val) => setCategoryTab(val)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          allowScrollButtonsMobile
        >
          {allowedTypes.length > 1 && <Tab label="Toutes les classes" value="all" />}
          {allowedTypes.map(type => (
            <Tab key={type} label={CATEGORY_LABELS[type] || type} value={type} />
          ))}
        </Tabs>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {filteredClasses.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Classes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {filteredStudentsCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Élèves Inscrits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {totalOccupancyRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Taux de Remplissage
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {availablePlaces}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Places Disponibles
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Classes Grid */}
      <Grid container spacing={3}>
        {filteredClasses.map((classData) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={classData.id}>
            <ClassCard
              classData={classData}
              students={studentsList}
              payments={paymentsList}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              schoolYears={schoolYears}
            />
          </Grid>
        ))}
        {filteredClasses.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Aucune classe trouvée dans cette catégorie.
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Class Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'view' ? 'Détails de la Classe' : 'Modifier la Classe'}
        </DialogTitle>
        <DialogContent>
          {dialogMode === 'view' && selectedClass && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nom de la Classe
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedClass.name}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">
                    Capacité Maximale
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedClass.maxSize} élèves
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Année Scolaire
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {schoolYears.find(y => y.id === selectedClass.schoolYear)?.year || selectedClass.schoolYear} | {selectedClass.categoryDisplay}
                    {selectedClass.isExam && <Chip label="Classe d'Examen" color="secondary" size="small" sx={{ ml: 1 }} />}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary">
                    Effectif Actuel
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {getClassStudents(selectedClass.id).length} élèves
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 2 }}>
                Liste des Élèves
              </Typography>
              <List>
                {getClassStudents(selectedClass.id).map((student) => (
                  <ListItem key={student.id} sx={{ px: 0 }}>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {(dialogMode === 'edit' || dialogMode === 'add') && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    freeSolo
                    options={LEVEL_MAPPING[formData.category] || []}
                    value={formData.level}
                    onInputChange={(_, newValue) => {
                      setFormData({ ...formData, level: newValue });
                    }}
                    onChange={(_, newValue) => {
                      const newLevel = newValue as string;
                      // Auto-match tuition template if it exists
                      const matchingTemplate = tuitionTemplates.find(t => t.name === newLevel && t.category === formData.category);
                      setFormData({ 
                        ...formData, 
                        level: newLevel || '',
                        tuitionTemplate: matchingTemplate ? matchingTemplate.id : formData.tuitionTemplate
                      });
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Nom de la classe (ex: 6ème A, 5ème B...)" 
                        fullWidth 
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Cycle / Catégorie</InputLabel>
                    <Select
                      value={formData.category}
                      label="Cycle / Catégorie"
                      onChange={(e: any) => setFormData({ ...formData, category: e.target.value as any, level: '' })}
                    >
                      {allowedTypes.map(type => (
                        <MenuItem key={type} value={type}>{CATEGORY_LABELS[type] || type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Grille Tarifaire</InputLabel>
                    <Select
                      value={formData.tuitionTemplate}
                      label="Grille Tarifaire"
                      onChange={(e: any) => setFormData({ ...formData, tuitionTemplate: e.target.value })}
                    >
                      <MenuItem value="">Aucune (Manuel)</MenuItem>
                      {tuitionTemplates
                        .filter(t => t.category === formData.category)
                        .map(t => (
                          <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isExam}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isExam: e.target.checked })}
                      />
                    }
                    label="Classe d'Examen"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Capacité Max"
                    value={formData.maxSize}
                    onChange={(e) => setFormData({ ...formData, maxSize: parseInt(e.target.value) })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 2, border: '1px solid', borderColor: 'info.light' }}>
                     <Typography variant="subtitle2" color="info.main" fontWeight={700}>
                       Année Scolaire
                     </Typography>
                     <Typography variant="h6" color="info.main">
                       {formData.schoolYear}
                     </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          {(dialogMode === 'edit' || dialogMode === 'add') && (
            <Button variant="contained" onClick={handleSaveClass}>Enregistrer</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => !isDeleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer la classe <strong>{classToDelete?.name}</strong> ? 
            Cette action est irréversible et supprimera également sa grille tarifaire si elle n'est plus utilisée.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>Annuler</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={confirmDelete}
            loading={isDeleting}
            disabled={isDeleting}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
