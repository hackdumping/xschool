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
import type { Class, Student, Payment } from '@/types';
import { useNotification } from '@/contexts/NotificationContext';

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
  const totalExpected = (classData.tranches?.reduce((sum, t) => sum + t.amount, 0) || 0) * studentCount;
  const classStudentIds = classStudents.map(s => s.id);
  const totalPaid = payments
    .filter(p => classStudentIds.includes(p.studentId))
    .reduce((sum, p) => sum + p.amountPaid, 0);
  const recoveryRate = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;

  return (
    <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 3, flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {classData.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
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

        {/* Tranches */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Tranches de Paiement
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {classData.tranches?.map((tranche) => (
              <Chip
                key={tranche.id}
                size="small"
                label={`${tranche.name}: ${tranche.amount.toLocaleString()} XAF`}
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
          </Box>
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
  const { showNotification } = useNotification();
  const [classesList, setClassesList] = useState<Class[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [paymentsList, setPaymentsList] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'add'>('view');
  const [categoryTab, setCategoryTab] = useState('all');
  const [schoolYears, setSchoolYears] = useState<any[]>([]);

  const filteredClasses = classesList.filter(c => 
    categoryTab === 'all' || c.category === categoryTab
  );
  const [tuitionTemplates, setTuitionTemplates] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    maxSize: 30,
    schoolYear: '' as string | number,
    category: 'general' as 'general' | 'technique',
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
        
        // Default school year for new classes
        if (yearsRes.data.length > 0) {
          setFormData(prev => ({ ...prev, schoolYear: yearsRes.data[0].id }));
        }
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
      name: classData.name,
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

  const handleDelete = async (classData: Class) => {
    if (window.confirm(`Voulez-vous vraiment supprimer la classe ${classData.name} ?`)) {
      try {
        await schoolService.deleteClass(classData.id);
        showNotification('Classe supprimée avec succès', 'success');
        refreshData();
      } catch (error) {
        showNotification('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleAddClass = () => {
    setSelectedClass(null);
    setFormData({
      name: '',
      level: '',
      maxSize: 30,
      schoolYear: schoolYears.length > 0 ? schoolYears[0].id : '',
      category: 'general',
      tuitionTemplate: '',
      isExam: false,
    });
    setDialogMode('add');
    setOpenDialog(true);
  };

  const handleSaveClass = async () => {
    try {
      const payload = {
        name: formData.name,
        level: formData.level,
        maxSize: formData.maxSize,
        schoolYear: formData.schoolYear,
        category: formData.category,
        tuitionTemplate: formData.tuitionTemplate || null,
        isExam: formData.isExam,
      };
      
      if (dialogMode === 'edit' && selectedClass) {
        await schoolService.updateClass(selectedClass.id, payload);
        showNotification('Classe mise à jour', 'success');
      } else if (dialogMode === 'add') {
        await schoolService.createClass(payload);
        showNotification('Classe créée', 'success');
      }
      setOpenDialog(false);
      refreshData();
    } catch (error) {
      showNotification('Erreur lors de l\'enregistrement', 'error');
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
            {classesList.length} classes pour l'année scolaire 2024-2025
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
        >
          <Tab label="Toutes les classes" value="all" />
          <Tab label="Enseignement Général" value="general" />
          <Tab label="Enseignement Technique" value="technique" />
        </Tabs>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {classesList.length}
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
                {studentsList.length}
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
                72.5%
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
                {classesList.reduce((acc, c) => acc + c.maxSize, 0) - studentsList.length}
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
                    Niveau
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedClass.level}
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
                  <TextField
                    fullWidth
                    label="Nom de la classe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Niveau</InputLabel>
                    <Select
                      value={formData.level}
                      label="Niveau"
                      onChange={(e: any) => setFormData({ ...formData, level: e.target.value })}
                    >
                      {formData.category === 'general' ? (
                        [
                          <MenuItem key="6" value="6ème">6ème</MenuItem>,
                          <MenuItem key="5" value="5ème">5ème</MenuItem>,
                          <MenuItem key="4" value="4ème">4ème</MenuItem>,
                          <MenuItem key="3" value="3ème">3ème</MenuItem>,
                          <MenuItem key="2A" value="2nde A">2nde A</MenuItem>,
                          <MenuItem key="2C" value="2nde C">2nde C</MenuItem>,
                          <MenuItem key="1A" value="1ère A">1ère A</MenuItem>,
                          <MenuItem key="1C" value="1ère C">1ère C</MenuItem>,
                          <MenuItem key="1D" value="1ère D">1ère D</MenuItem>,
                          <MenuItem key="TA" value="Tle A">Tle A</MenuItem>,
                          <MenuItem key="TC" value="Tle C">Tle C</MenuItem>,
                          <MenuItem key="TD" value="Tle D">Tle D</MenuItem>,
                        ]
                      ) : (
                        [
                          <MenuItem key="1T" value="1ère Année">1ère Année</MenuItem>,
                          <MenuItem key="2T" value="2ème Année">2ème Année</MenuItem>,
                          <MenuItem key="3T" value="3ème Année">3ème Année</MenuItem>,
                          <MenuItem key="4T" value="4ème Année">4ème Année</MenuItem>,
                          <MenuItem key="2T" value="2nde">2nde</MenuItem>,
                          <MenuItem key="1T" value="1ère">1ère</MenuItem>,
                          <MenuItem key="TT" value="Tle">Tle</MenuItem>,
                        ]
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Catégorie</InputLabel>
                    <Select
                      value={formData.category}
                      label="Catégorie"
                      onChange={(e: any) => setFormData({ ...formData, category: e.target.value as any, level: '' })}
                    >
                      <MenuItem value="general">Enseignement Général</MenuItem>
                      <MenuItem value="technique">Enseignement Technique</MenuItem>
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
                  <FormControl fullWidth>
                    <InputLabel>Année Scolaire</InputLabel>
                    <Select
                      value={formData.schoolYear}
                      label="Année Scolaire"
                      onChange={(e: any) => setFormData({ ...formData, schoolYear: e.target.value })}
                    >
                      {schoolYears.map(y => (
                        <MenuItem key={y.id} value={y.id}>{y.year}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
    </Box>
  );
};
