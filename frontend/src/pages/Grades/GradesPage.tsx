import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Save as SaveIcon,
  Print as PrintIcon,
  Calculate as CalculateIcon,
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { useEffect } from 'react';
import { schoolService } from '@/services/api';
import type { Class, Student, Subject, Period, Grade } from '@/types';
import { LinearProgress } from '@mui/material';
import { useNotification } from '@/contexts/NotificationContext';
import { useSchool } from '@/contexts/SchoolContext';
import * as XLSX from 'xlsx';

interface GradeEntry {
  studentId: string;
  studentName: string;
  grades: { [subjectId: string]: number | null };
  average: number;
}

export const GradesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showNotification } = useNotification();
  const { settings: schoolSettings } = useSchool();
  const [classesList, setClassesList] = useState<Class[]>([]);
  const [periodsList, setPeriodsList] = useState<Period[]>([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [gradesList, setGradesList] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [editedGrades, setEditedGrades] = useState<{ [key: string]: number | null }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, periodsRes, subjectsRes, studentsRes, gradesRes] = await Promise.all([
          schoolService.getClasses(),
          schoolService.getPeriods(),
          schoolService.getSubjects(),
          schoolService.getStudents(),
          schoolService.getGrades(),
        ]);
        setClassesList(classesRes.data);
        setPeriodsList(periodsRes.data);
        setSubjectsList(subjectsRes.data);
        setStudentsList(studentsRes.data);
        setGradesList(gradesRes.data);
      } catch (error) {
        console.error('Failed to fetch grades data', error);
        showNotification('Erreur lors du chargement des données', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showNotification]);

  // Get filtered students
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return studentsList.filter(s => s.classId === selectedClass);
  }, [selectedClass, studentsList]);

  // Get grade entries
  const gradeEntries: GradeEntry[] = useMemo(() => {
    return classStudents.map(student => {
      const studentGrades = gradesList.filter(
        g => g.studentId === student.id && g.periodId === selectedPeriod
      );

      const gradeMap: { [subjectId: string]: number | null } = {};
      subjectsList.forEach(subject => {
        const grade = studentGrades.find(g => g.subjectId === subject.id);
        gradeMap[subject.id] = grade ? grade.value : null;
      });

      // Calculate weighted average
      let totalPoints = 0;
      let totalCoeff = 0;
      subjectsList.forEach(subject => {
        const grade = gradeMap[subject.id];
        if (grade !== null) {
          totalPoints += grade * subject.coefficient;
          totalCoeff += subject.coefficient;
        }
      });
      const average = totalCoeff > 0 ? totalPoints / totalCoeff : 0;

      return {
        studentId: student.id,
        studentName: `${student.lastName} ${student.firstName}`,
        grades: gradeMap,
        average,
      };
    });
  }, [classStudents, selectedPeriod, gradesList, subjectsList]);

  const handleGradeChange = (studentId: string, subjectId: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    const key = `${studentId}-${subjectId}`;
    setEditedGrades(prev => ({
      ...prev,
      [key]: numValue,
    }));
  };

  const getGradeValue = (studentId: string, subjectId: string): string => {
    const key = `${studentId}-${subjectId}`;
    if (editedGrades[key] !== undefined) {
      return editedGrades[key] === null ? '' : editedGrades[key]!.toString();
    }
    const entry = gradeEntries.find(e => e.studentId === studentId);
    const grade = entry?.grades[subjectId];
    return grade === null || grade === undefined ? '' : grade.toString();
  };

  const handleSave = async () => {
    try {
      const payload = Object.entries(editedGrades).map(([key, value]) => {
        const [studentId, subjectId] = key.split('-');
        return {
          student: studentId,
          subject: subjectId,
          period: selectedPeriod,
          value: value,
        };
      });

      if (payload.length === 0) return;

      await schoolService.bulkCreateGrades(payload);
      showNotification(`${payload.length} notes enregistrées avec succès`, 'success');
      setEditedGrades({});
      // Refresh
      const gradesRes = await schoolService.getGrades();
      setGradesList(gradesRes.data);
    } catch (error) {
      console.error('Failed to save grades', error);
      showNotification('Erreur lors de l\'enregistrement des notes', 'error');
    }
  };

  const handleCalculate = () => {
    // Averages are already calculated via useMemo (gradeEntries)
    // We can just trigger a visual feedback or re-fetch
    showNotification('Les moyennes ont été actualisées en fonction des notes saisies.', 'success');
  };

  const handlePrint = (studentId?: string) => {
    if (studentId) {
      // Print individual report card
      handleViewReport(studentId);
      setTimeout(() => {
        window.print();
      }, 500);
      return;
    }
    // Print current table view
    window.print();
  };

  const handleExport = () => {
    if (!selectedClass || !selectedPeriod) {
      showNotification('Veuillez sélectionner une classe et une période', 'warning');
      return;
    }

    const className = classesList.find(c => c.id === selectedClass)?.name || '';
    const periodName = periodsList.find(p => p.id === selectedPeriod)?.name || '';
    const filename = `Notes_${className}_${periodName}_${new Date().toISOString().split('T')[0]}`;

    // Format data for export
    const formattedData = gradeEntries.map(entry => {
      const row: any = {
        'Élève': entry.studentName,
      };
      subjectsList.forEach(s => {
        row[s.name] = entry.grades[s.id] ?? '';
      });
      row['Moyenne'] = entry.average.toFixed(2);
      row['Appréciation'] = getAppreciation(entry.average);
      return row;
    });

    try {
      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Notes');

      // Add title row if needed, or just download
      XLSX.writeFile(wb, `${filename}.xlsx`);
      showNotification('Export Excel réussi !', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Erreur lors de l\'exportation', 'error');
    }
  };

  const handleViewReport = (studentId: string) => {
    setSelectedStudent(studentId);
    setOpenReportDialog(true);
  };

  const getSelectedStudentData = () => {
    if (!selectedStudent) return null;
    const student = studentsList.find(s => s.id === selectedStudent);
    const studentClass = classesList.find(c => c.id === student?.classId);
    const entry = gradeEntries.find(e => e.studentId === selectedStudent);
    return { student, studentClass, entry };
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
          Chargement des notes...
        </Typography>
      </Box>
    );
  }

  const getAppreciation = (average: number): string => {
    if (average >= 16) return 'Très Bien';
    if (average >= 14) return 'Bien';
    if (average >= 12) return 'Assez Bien';
    if (average >= 10) return 'Passable';
    return 'Insuffisant';
  };

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
            Gestion des Notes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Saisie et calcul des moyennes
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' }, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
          >
            Exporter
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon />}
            onClick={() => handlePrint()}
          >
            Imprimer
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={Object.keys(editedGrades).length === 0}
          >
            Enregistrer
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <FormControl fullWidth>
                <InputLabel>Classe</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  label="Classe"
                >
                  <MenuItem value="">Sélectionner une classe</MenuItem>
                  {classesList.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <FormControl fullWidth>
                <InputLabel>Période</InputLabel>
                <Select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  label="Période"
                >
                  <MenuItem value="">Sélectionner une période</MenuItem>
                  {periodsList.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CalculateIcon />}
                onClick={handleCalculate}
              >
                Calculer
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {/* Grades Table */}
      {selectedClass && selectedPeriod ? (
        <Box>
          {!isMobile ? (
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ width: '100%', overflowX: 'auto' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Élève</TableCell>
                        {subjectsList.map((subject) => (
                          <TableCell
                            key={subject.id}
                            align="center"
                            sx={{ fontWeight: 600, minWidth: 100 }}
                          >
                            <Tooltip title={`Coefficient: ${subject.coefficient}`}>
                              <span>{subject.name}</span>
                            </Tooltip>
                          </TableCell>
                        ))}
                        <TableCell align="center" sx={{ fontWeight: 600, minWidth: 100 }}>
                          Moyenne
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gradeEntries.map((entry) => (
                        <TableRow key={entry.studentId} hover>
                          <TableCell>{entry.studentName}</TableCell>
                          {subjectsList.map((subject) => (
                            <TableCell key={subject.id} align="center">
                              <TextField
                                type="number"
                                size="small"
                                value={getGradeValue(entry.studentId, subject.id)}
                                onChange={(e) =>
                                  handleGradeChange(entry.studentId, subject.id, e.target.value)
                                }
                                slotProps={{
                                  htmlInput: {
                                    min: 0,
                                    max: 20,
                                    step: 0.5,
                                    style: { textAlign: 'center' },
                                  }
                                }}
                                sx={{ width: 70 }}
                              />
                            </TableCell>
                          ))}
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={entry.average.toFixed(2)}
                              color={
                                entry.average >= 10
                                  ? entry.average >= 14
                                    ? 'success'
                                    : 'warning'
                                  : 'error'
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Voir bulletin">
                              <IconButton
                                size="small"
                                onClick={() => handleViewReport(entry.studentId)}
                                color="primary"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Imprimer">
                              <IconButton
                                size="small"
                                onClick={() => handlePrint(entry.studentId)}
                              >
                                <PrintIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {gradeEntries.map((entry) => (
                <Grid size={{ xs: 12 }} key={entry.studentId}>
                  <Card sx={{ borderRadius: 3, borderLeft: 6, borderColor: entry.average >= 10 ? 'success.main' : 'error.main' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {entry.studentName}
                        </Typography>
                        <Box>
                          <IconButton size="small" onClick={() => handleViewReport(entry.studentId)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handlePrint(entry.studentId)}>
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      <Grid container spacing={1}>
                        {subjectsList.map((subject) => (
                          <Grid size={{ xs: 6, sm: 4 }} key={subject.id}>
                            <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                {subject.name}
                              </Typography>
                              <TextField
                                fullWidth
                                variant="standard"
                                type="number"
                                size="small"
                                value={getGradeValue(entry.studentId, subject.id)}
                                onChange={(e) => handleGradeChange(entry.studentId, subject.id, e.target.value)}
                                slotProps={{ htmlInput: { style: { fontSize: '0.875rem' } } }}
                              />
                            </Box>
                          </Grid>
                        ))}
                      </Grid>

                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Moyenne</Typography>
                        <Chip
                          label={entry.average.toFixed(2)}
                          size="small"
                          color={entry.average >= 10 ? (entry.average >= 14 ? 'success' : 'warning') : 'error'}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      ) : (
        <Card sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Sélectionnez une classe et une période
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choisissez une classe et une période pour afficher et saisir les notes
          </Typography>
        </Card>
      )}

      {/* Report Card Dialog */}
      <Dialog
        open={openReportDialog}
        onClose={() => setOpenReportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Bulletin de Notes</DialogTitle>
        <DialogContent>
          {(() => {
            const data = getSelectedStudentData();
            if (!data || !data.student || !data.entry) return null;

            return (
              <Box id="report-card-content" sx={{ mt: 2 }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {(schoolSettings.establishment_name || schoolSettings.name || 'SESSION SCOLAIRE').toUpperCase()}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Bulletin de Notes - {periodsList.find(p => p.id === selectedPeriod)?.name}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Année Scolaire 2024-2025
                  </Typography>
                </Box>

                {/* Student Info */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nom: <strong>{data.student.lastName} {data.student.firstName}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Matricule: <strong>{data.student.matricule}</strong>
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Classe: <strong>{data.studentClass?.name}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Né(e) le: <strong>{new Date(data.student.dateOfBirth).toLocaleDateString('fr-FR')}</strong>{data.student.placeOfBirth && <> à <strong>{data.student.placeOfBirth}</strong></>}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Grades Table */}
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Matière</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Coefficient</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Note</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Note x Coef</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Appréciation</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subjectsList.map((subject) => {
                        const grade = data.entry!.grades[subject.id];
                        const weightedGrade = grade !== null ? grade * subject.coefficient : 0;

                        return (
                          <TableRow key={subject.id}>
                            <TableCell>{subject.name}</TableCell>
                            <TableCell align="center">{subject.coefficient}</TableCell>
                            <TableCell align="center">
                              {grade !== null ? grade.toFixed(2) : '-'}
                            </TableCell>
                            <TableCell align="center">
                              {grade !== null ? weightedGrade.toFixed(2) : '-'}
                            </TableCell>
                            <TableCell>
                              {grade !== null ? getAppreciation(grade) : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow sx={{ backgroundColor: 'action.hover' }}>
                        <TableCell colSpan={2} sx={{ fontWeight: 600 }}>
                          TOTAL
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                          {data.entry.average.toFixed(2)}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                          {subjectsList.reduce((sum, s) => sum + s.coefficient, 0)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {getAppreciation(data.entry.average)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Summary */}
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Typography variant="h6">
                    Moyenne Générale: <strong>{data.entry.average.toFixed(2)}/20</strong>
                  </Typography>
                  <Chip
                    label={getAppreciation(data.entry.average)}
                    color={
                      data.entry.average >= 10
                        ? data.entry.average >= 14
                          ? 'success'
                          : 'warning'
                        : 'error'
                    }
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReportDialog(false)}>Fermer</Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => handlePrint()}>
            Imprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
};
