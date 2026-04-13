import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tooltip,
  Menu,
  LinearProgress,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Message as MessageIcon,
  FileDownload as FileDownloadIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams, GridRowSelectionModel } from '@mui/x-data-grid';
import { schoolService } from '@/services/api';
import type { Student, PaymentStatus, Class } from '@/types';
import { useNotification } from '@/contexts/NotificationContext';
import { PromotionWizard } from './PromotionWizard';

export const StudentsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showNotification } = useNotification();

  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [classesList, setClassesList] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | ''>('');
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const [openDialog, setOpenDialog] = useState(false);
  const [openAddEditDialog, setOpenAddEditDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuStudent, setMenuStudent] = useState<Student | null>(null);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');
  const [exportScope, setExportScope] = useState<'filtered' | 'all' | 'selected'>('filtered');
  const [openPromotionWizard, setOpenPromotionWizard] = useState(false);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<Record<string, boolean>>({});

  // Initialize column visibility based on isMobile
  useEffect(() => {
    setColumnVisibilityModel({
      matricule: !isMobile,
      gender: !isMobile,
      parentName: !isMobile,
    });
  }, [isMobile]);

  // Form state
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    matricule: '',
    classId: '',
    gender: 'M' as 'M' | 'F',
    dateOfBirth: '',
    placeOfBirth: '',
    isRepeating: false,
    parentName: '',
    parentPhone: '',
    address: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, classesRes] = await Promise.all([
          schoolService.getStudents(),
          schoolService.getClasses(),
        ]);
        setStudentsList(studentsRes.data);
        setClassesList(classesRes.data);
      } catch (error) {
        console.error('Failed to fetch students/classes', error);
        showNotification('Erreur lors du chargement des données', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showNotification]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return studentsList.filter((student) => {
      const matchesSearch =
        student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.parentPhone.includes(searchQuery);

      const matchesClass = selectedClass ? student.classId === selectedClass : true;
      const matchesStatus = selectedStatus ? student.paymentStatus === selectedStatus : true;

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [searchQuery, selectedClass, selectedStatus, studentsList]);

  // Get student class name
  const getClassName = (classId: string) => {
    return classesList.find(c => c.id === classId)?.name || 'N/A';
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
          Chargement des élèves...
        </Typography>
      </Box>
    );
  }

  // Get payment status for student (now coming from backend row)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'unpaid':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'partial':
        return 'Partiel';
      case 'unpaid':
        return 'Non payé';
      default:
        return status;
    }
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setOpenDialog(true);
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setStudentForm({
      firstName: '',
      lastName: '',
      matricule: '',
      classId: '',
      gender: 'M',
      dateOfBirth: '',
      placeOfBirth: '',
      isRepeating: false,
      parentName: '',
      parentPhone: '',
      address: '',
    });
    setOpenAddEditDialog(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentForm({
      firstName: student.firstName,
      lastName: student.lastName,
      matricule: student.matricule,
      classId: student.classId,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      placeOfBirth: student.placeOfBirth || '',
      isRepeating: student.isRepeating || false,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      address: student.address,
    });
    setOpenAddEditDialog(true);
  };

  const handleDeleteStudent = async (student: Student) => {
    if (confirm(`Voulez-vous supprimer l'élève ${student.lastName} ${student.firstName} ?`)) {
      try {
        await schoolService.deleteStudent(student.id);
        showNotification('Élève supprimé', 'success');
        refreshData();
      } catch (error) {
        console.error('Failed to delete student', error);
        showNotification('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleSaveStudent = async () => {
    try {
      if (selectedStudent) {
        await schoolService.updateStudent(selectedStudent.id, studentForm);
        showNotification('Élève modifié avec succès', 'success');
      } else {
        await schoolService.createStudent(studentForm);
        showNotification('Élève ajouté avec succès', 'success');
      }
      setOpenAddEditDialog(false);
      refreshData();
    } catch (error) {
      console.error('Failed to save student', error);
      showNotification('Erreur lors de l\'enregistrement', 'error');
    }
  };

  const refreshData = async () => {
    try {
      const response = await schoolService.getStudents();
      setStudentsList(response.data);
    } catch (error) {
      console.error('Failed to refresh students', error);
    }
  };

  const getSelectedCount = () => {
    if (selectedRows.type === 'exclude') {
      return filteredStudents.length - selectedRows.ids.size;
    }
    return selectedRows.ids.size;
  };

  const handleSendSMS = (student: Student) => {
    showNotification(`SMS envoyé à ${student.parentPhone}`, 'success');
  };

  const handleBulkSMS = () => {
    showNotification(`SMS envoyé à ${getSelectedCount()} parents`, 'success');
    setSelectedRows({ type: 'include', ids: new Set() });
  };

  const handleExport = () => {
    if (getSelectedCount() > 0) {
      setExportScope('selected');
    } else {
      setExportScope('filtered');
    }
    setOpenExportDialog(true);
  };

  const handleExportData = () => {
    let dataToExport: Student[] = [];
    if (exportScope === 'selected') {
      dataToExport = filteredStudents.filter(s => 
        selectedRows.type === 'exclude' 
          ? !selectedRows.ids.has(s.id) 
          : selectedRows.ids.has(s.id)
      );
    } else if (exportScope === 'filtered') {
      dataToExport = filteredStudents;
    } else {
      dataToExport = studentsList;
    }

    if (dataToExport.length === 0) {
      showNotification('Aucune donnée à exporter', 'warning');
      return;
    }

    const filename = `Liste_Eleves_${new Date().toISOString().split('T')[0]}`;
    const selectedClassName = selectedClass ? getClassName(selectedClass) : 'Toutes les classes';

    // Format data for export
    const formattedData = dataToExport.map((s, index) => ({
      'Num': index + 1,
      'Matricule': s.matricule,
      'Nom et Prénom': `${s.lastName} ${s.firstName}`,
      'Classe': selectedClass ? selectedClassName : getClassName(s.classId),
      'Date et Lieu de Naissance': `${new Date(s.dateOfBirth).toLocaleDateString('fr-FR')} à ${s.placeOfBirth || 'N/A'}`,
      'Sexe': s.gender,
      'Statut': s.isRepeating ? 'Redoublant' : 'Non redoublant'
    }));

    try {
      if (exportFormat === 'excel') {
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Élèves');
        XLSX.writeFile(wb, `${filename}.xlsx`);
      } else if (exportFormat === 'pdf') {
        const doc = new jsPDF('p', 'mm', 'a4');
        doc.setFontSize(16);
        doc.text('LISTE DES ÉLÈVES - XSCHOOL', 105, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Classe : ${selectedClassName}`, 105, 22, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Date d'export: ${new Date().toLocaleString()}`, 14, 28);

        autoTable(doc, {
          startY: 34,
          head: [['Num', 'Matricule', 'Nom et Prénom', 'Date et Lieu de Naissance', 'Sexe', 'Statut']],
          body: formattedData.map(row => [
            row['Num'],
            row['Matricule'],
            row['Nom et Prénom'],
            row['Date et Lieu de Naissance'],
            row['Sexe'],
            row['Statut']
          ]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [33, 33, 33], textColor: [255, 255, 255] },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 25 },
            2: { cellWidth: 50 },
            3: { cellWidth: 60 },
            4: { cellWidth: 15 },
            5: { cellWidth: 30 }
          }
        });
        doc.save(`${filename}.pdf`);
      } else {
        const csvRows = [
          Object.keys(formattedData[0]).join(','),
          ...formattedData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
        ];
        const csvContent = "\uFEFF" + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setOpenExportDialog(false);
      showNotification('Exportation réussie !', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Erreur lors de l\'exportation', 'error');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, student: Student) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuStudent(student);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuStudent(null);
  };

  const columns: GridColDef<Student>[] = [
    {
      field: 'matricule',
      headerName: 'Matricule',
      width: 120,
      renderCell: (params: GridRenderCellParams<Student>) => (
        <Typography variant="body2" fontWeight={500}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'name',
      headerName: 'Nom',
      flex: 1,
      minWidth: 200,
      valueGetter: (_value, row) => `${row.lastName} ${row.firstName}`,
      renderCell: (params: GridRenderCellParams<Student>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
            {params.row.lastName.charAt(0)}{params.row.firstName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {params.row.lastName} {params.row.firstName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.parentPhone}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'classId',
      headerName: 'Classe',
      width: 100,
      valueGetter: (_value, row) => getClassName(row.classId),
    },
    {
      field: 'gender',
      headerName: 'Genre',
      width: 80,
      renderCell: (params: GridRenderCellParams<Student>) => (
        <Chip
          size="small"
          label={params.value === 'M' ? 'Garçon' : 'Fille'}
          color={params.value === 'M' ? 'primary' : 'secondary'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'isRepeating',
      headerName: 'Statut',
      width: 120,
      renderCell: (params: GridRenderCellParams<Student>) => (
        <Chip
          size="small"
          label={params.value ? 'Redoublant' : 'Non redoublant'}
          color={params.value ? 'warning' : 'info'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'totalPaid',
      headerName: 'Payé',
      width: 110,
      valueFormatter: (value: any) => `${(Number(value) || 0).toLocaleString()} FCFA`,
    },
    {
      field: 'totalDue',
      headerName: 'Total Dû',
      width: 110,
      valueFormatter: (value: any) => `${(Number(value) || 0).toLocaleString()} FCFA`,
    },
    {
      field: 'balance',
      headerName: 'Reste',
      width: 110,
      valueGetter: (_value, row) => (Number(row.totalDue) || 0) - (Number(row.totalPaid) || 0),
      valueFormatter: (value: any) => `${(Number(value) || 0).toLocaleString()} FCFA`,
      renderCell: (params: GridRenderCellParams<Student>) => {
        const balance = (Number(params.row.totalDue) || 0) - (Number(params.row.totalPaid) || 0);
        return (
          <Typography
            variant="body2"
            sx={{ fontWeight: 'bold', color: balance > 0 ? 'error.main' : 'success.main' }}
          >
            {balance.toLocaleString()} FCFA
          </Typography>
        );
      }
    },
    {
      field: 'paymentStatus',
      headerName: 'Statut Paiement',
      width: 130,
      renderCell: (params: GridRenderCellParams<Student>) => (
        <Chip
          size="small"
          label={getStatusLabel(params.row.paymentStatus)}
          color={getStatusColor(params.row.paymentStatus) as 'success' | 'warning' | 'error' | 'default'}
        />
      ),
    },
    {
      field: 'parentName',
      headerName: 'Parent/Tuteur',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Student>) => (
        <Box>
          <Tooltip title="Voir détails">
            <IconButton size="small" onClick={() => handleViewStudent(params.row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={(e) => handleMenuOpen(e, params.row)}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

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
            Gestion des Élèves
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {filteredStudents.length} élèves inscrits
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TrendingUpIcon />}
            onClick={() => setOpenPromotionWizard(true)}
            color="secondary"
          >
            Promotion
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
          >
            Exporter
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddStudent}
          >
            Nouveau
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Classe</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  label="Classe"
                >
                  <MenuItem value="">Toutes les classes</MenuItem>
                  {classesList.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut Paiement</InputLabel>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as PaymentStatus | '')}
                  label="Statut Paiement"
                >
                  <MenuItem value="">Tous les statuts</MenuItem>
                  <MenuItem value="paid">Payé</MenuItem>
                  <MenuItem value="partial">Partiel</MenuItem>
                  <MenuItem value="unpaid">Non payé</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedClass('');
                  setSelectedStatus('');
                }}
              >
                Réinitialiser
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {getSelectedCount() > 0 && (
        <Card sx={{ mb: 2, borderRadius: 3, bgcolor: 'primary.container' }}>
          <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2">
              <strong>{getSelectedCount()}</strong> élève(s) sélectionné(s)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<MessageIcon />}
                onClick={handleBulkSMS}
              >
                Envoyer SMS
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExport}
              >
                Exporter
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ width: '100%' }}>
          <DataGrid
            rows={filteredStudents}
            columns={columns}
            autoHeight
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={setSelectedRows}
            rowSelectionModel={selectedRows}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'action.hover',
                borderRadius: 2,
              },
              '& .MuiDataGrid-cell': {
                borderBottom: 'none',
              },
            }}
          />
        </Box>
      </Card>

      {/* Student Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Détails de l'Élève
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Nom Complet
                </Typography>
                <Typography variant="body1">
                  {selectedStudent.lastName} {selectedStudent.firstName}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Matricule
                </Typography>
                <Typography variant="body1">
                  {selectedStudent.matricule}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Classe
                </Typography>
                <Typography variant="body1">
                  {getClassName(selectedStudent.classId)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Date de Naissance
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedStudent.dateOfBirth).toLocaleDateString('fr-FR')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Lieu de Naissance
                </Typography>
                <Typography variant="body1">
                  {selectedStudent.placeOfBirth || 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Statut
                </Typography>
                <Typography variant="body1">
                  {selectedStudent.isRepeating ? 'Redoublant' : 'Non redoublant'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Parent/Tuteur
                </Typography>
                <Typography variant="body1">
                  {selectedStudent.parentName}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Téléphone Parent
                </Typography>
                <Typography variant="body1">
                  {selectedStudent.parentPhone}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Adresse
                </Typography>
                <Typography variant="body1">
                  {selectedStudent.address}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Fermer</Button>
          <Button
            variant="contained"
            onClick={() => selectedStudent && handleEditStudent(selectedStudent)}
          >
            Modifier
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Student Dialog */}
      <Dialog open={openAddEditDialog} onClose={() => setOpenAddEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedStudent ? 'Modifier l\'élève' : 'Nouvel Élève'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nom"
                value={studentForm.lastName}
                onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Prénom"
                value={studentForm.firstName}
                onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Matricule"
                value={studentForm.matricule}
                onChange={(e) => setStudentForm({ ...studentForm, matricule: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Classe</InputLabel>
                <Select
                  value={studentForm.classId}
                  onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })}
                  label="Classe"
                  required
                >
                  {classesList.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Genre</InputLabel>
                <Select
                  value={studentForm.gender}
                  onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as 'M' | 'F' })}
                  label="Genre"
                  required
                >
                  <MenuItem value="M">Garçon</MenuItem>
                  <MenuItem value="F">Fille</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Redoublant ?</InputLabel>
                <Select
                  value={String(studentForm.isRepeating)}
                  onChange={(e) => setStudentForm({ ...studentForm, isRepeating: e.target.value === 'true' })}
                  label="Redoublant ?"
                  required
                >
                  <MenuItem value="false">Non redoublant</MenuItem>
                  <MenuItem value="true">Redoublant</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Date de Naissance"
                type="date"
                value={studentForm.dateOfBirth}
                onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Lieu de Naissance"
                value={studentForm.placeOfBirth}
                onChange={(e) => setStudentForm({ ...studentForm, placeOfBirth: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Parent/Tuteur"
                value={studentForm.parentName}
                onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Téléphone Parent"
                value={studentForm.parentPhone}
                onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Adresse"
                multiline
                rows={2}
                value={studentForm.address}
                onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddEditDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSaveStudent}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            menuStudent && handleEditStudent(menuStudent);
            handleMenuClose();
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Modifier
        </MenuItem>
        <MenuItem
          onClick={() => {
            menuStudent && handleSendSMS(menuStudent);
            handleMenuClose();
          }}
        >
          <MessageIcon fontSize="small" sx={{ mr: 1 }} />
          Envoyer SMS
        </MenuItem>
        <MenuItem
          onClick={() => {
            menuStudent && handleDeleteStudent(menuStudent);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Supprimer
        </MenuItem>
      </Menu>

      {/* Professional Export Dialog */}
      <Dialog
        open={openExportDialog}
        onClose={() => setOpenExportDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 3 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'primary.main', color: 'white' }}>
          <FileDownloadIcon />
          <Typography variant="h6" fontWeight={700}>Exporter les Élèves</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight={700} color="text.secondary">
            FORMAT DE FICHIER
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {[
              { id: 'excel', label: 'Excel (.xlsx)', icon: '📊', color: '#1D6F42' },
              { id: 'pdf', label: 'Document PDF', icon: '📄', color: '#E53935' },
              { id: 'csv', label: 'Fichier CSV', icon: '📝', color: '#757575' }
            ].map((format) => (
              <Grid size={{ xs: 12, sm: 4 }} key={format.id}>
                <Card
                  variant="outlined"
                  onClick={() => setExportFormat(format.id as any)}
                  sx={{
                    cursor: 'pointer',
                    borderColor: exportFormat === format.id ? 'primary.main' : 'divider',
                    bgcolor: exportFormat === format.id ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                    borderWidth: exportFormat === format.id ? 2 : 1,
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography fontSize="2rem" sx={{ mb: 1 }}>{format.icon}</Typography>
                    <Typography variant="body2" fontWeight={600}>{format.label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Typography variant="subtitle2" gutterBottom fontWeight={700} color="text.secondary">
            PÉRIMÈTRE DES DONNÉES
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Select
              value={exportScope}
              onChange={(e) => setExportScope(e.target.value as any)}
              sx={{ borderRadius: 2 }}
              disabled={getSelectedCount() === 0 && exportScope === 'selected'}
            >
              <MenuItem value="filtered">Vue filtrée ({filteredStudents.length} élèves)</MenuItem>
              <MenuItem value="all">Tous les inscrits ({studentsList.length} élèves)</MenuItem>
              <MenuItem value="selected" disabled={getSelectedCount() === 0}>
                Éléments sélectionnés ({getSelectedCount()} élèves)
              </MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px dashed #ccc' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              L'export inclura toutes les colonnes clés : Matricule, Nom, Classe, Genre, Contact Parent, Adresse et Statut.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setOpenExportDialog(false)} color="inherit" fullWidth={isMobile}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleExportData}
            startIcon={<FileDownloadIcon />}
            fullWidth={isMobile}
            sx={{ px: 4 }}
          >
            Démarrer l'export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Promotion Wizard */}
      <PromotionWizard
        open={openPromotionWizard}
        onClose={() => setOpenPromotionWizard(false)}
        onSuccess={refreshData}
        classesList={classesList}
      />
    </Box>
  );
};
