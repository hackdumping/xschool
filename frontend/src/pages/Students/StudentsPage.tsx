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
  Paper,
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
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams, GridRowSelectionModel } from '@mui/x-data-grid';
import html2canvas from 'html2canvas';
import { schoolService } from '@/services/api';
import type { Student, PaymentStatus, Class } from '@/types';
import { useNotification } from '@/contexts/NotificationContext';
import { useSchool } from '@/contexts/SchoolContext';
import { PromotionWizard } from './PromotionWizard';
import { addProfessionalHeader } from '@/utils/pdfHeader';

// CSS for print-only area
const printStyles = `
  @media print {
    @page {
      size: A4;
      margin: 0 !important;
    }
    
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      height: auto !important;
      width: 210mm !important;
      overflow: visible !important;
    }

    /* Target all elements and hide them */
    body * {
      visibility: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Specifically show the printable certificate and its children */
    #printable-certificate, #printable-certificate * {
      visibility: visible !important;
    }

    /* Position the certificate container naturally to allow the browser to manage pages */
    #printable-certificate {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 210mm !important;
      display: block !important;
      visibility: visible !important;
      background: white !important;
      z-index: 999999 !important;
    }

    #printable-certificate > div {
      width: 210mm !important;
      height: 297mm !important;
      page-break-after: always !important;
      break-after: page !important;
      display: block !important;
      position: relative !important;
      visibility: visible !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }

    /* Target the Paper specifically to fill the A4 */
    .MuiPaper-root {
      box-shadow: none !important;
      border: none !important;
      width: 210mm !important;
      height: 297mm !important;
      padding: 1.5cm !important;
      visibility: visible !important;
      margin: 0 !important;
      border-radius: 0 !important;
    }

    /* Hide everything except the printable container and its parents */
    body > :not(.MuiDialog-root),
    .MuiBackdrop-root,
    .MuiDialog-container > :not(.MuiPaper-root),
    .MuiDialogActions-root,
    .MuiDialogTitle-root {
      display: none !important;
    }

    .MuiDialog-root, .MuiDialog-container, .MuiDialogContent-root {
      position: static !important;
      display: block !important;
      overflow: visible !important;
      background: none !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      width: 100% !important;
      max-width: none !important;
    }
    
    .no-print {
      display: none !important;
    }
  }
`;

export const StudentsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showNotification } = useNotification();
  const { settings: schoolSettings } = useSchool();

  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [classesList, setClassesList] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | ''>('');
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
  const [bulkDeleteStep, setBulkDeleteStep] = useState(1);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openAddEditDialog, setOpenAddEditDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuStudent, setMenuStudent] = useState<Student | null>(null);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');
  const [exportScope, setExportScope] = useState<'filtered' | 'all' | 'selected'>('filtered');
  const [openPromotionWizard, setOpenPromotionWizard] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [openCertificateDialog, setOpenCertificateDialog] = useState(false);
  const [certificateStudents, setCertificateStudents] = useState<Student[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<Record<string, boolean>>({});

  // Initialize column visibility based on isMobile
  useEffect(() => {
    setColumnVisibilityModel({
      matricule: !isMobile,
      gender: !isMobile,
      parentName: !isMobile,
    });
  }, [isMobile]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const [studentsRes, classesRes] = await Promise.all([
        schoolService.getStudents(),
        schoolService.getClasses(),
      ]);
      setStudentsList(Array.isArray(studentsRes.data) ? studentsRes.data : []);
      setClassesList(Array.isArray(classesRes.data) ? classesRes.data : []);
    } catch (err) {
      console.error('Failed to fetch students/classes', err);
      showNotification('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    try {
      setIsImporting(true);
      const res = await schoolService.importStudents(importFile);
      showNotification(res.data.message || 'Importation réussie', 'success');
      if (res.data.errors && res.data.errors.length > 0) {
        console.warn('Import errors:', res.data.errors);
        showNotification(`${res.data.errors.length} erreurs lors de l'importation. Vérifiez la console.`, 'warning');
      }
      setOpenImportDialog(false);
      setImportFile(null);
      fetchStudents();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Erreur lors de l importation', 'error');
    } finally {
      setIsImporting(false);
    }
  };

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
    fetchStudents();
  }, []);

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
        await schoolService.deleteStudent(Number(Number(student.id)));
        showNotification('Élève supprimé', 'success');
        refreshData();
      } catch (error) {
        console.error('Failed to delete student', error);
        showNotification('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleSaveStudent = async () => {
    // Validation
    if (!studentForm.lastName || !studentForm.firstName || !studentForm.matricule || !studentForm.classId || !studentForm.dateOfBirth || !studentForm.address) {
      showNotification('Veuillez remplir tous les champs obligatoires (Nom, Prénom, Matricule, Classe, Date de N., Adresse)', 'warning');
      return;
    }

    try {
      if (selectedStudent) {
        await schoolService.updateStudent(Number(selectedStudent.id), studentForm);
        showNotification('Élève modifié avec succès', 'success');
      } else {
        await schoolService.createStudent(studentForm);
        showNotification('Élève ajouté avec succès', 'success');
      }
      setOpenAddEditDialog(false);
      refreshData();
    } catch (error: any) {
      console.error('Failed to save student', error);
      
      // Attempt to extract structured error from backend
      let errorMessage = 'Erreur lors de l\'enregistrement';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'object') {
          // Flatten nested DRF errors (e.g., { "matricule": ["This field is required"] })
          const fields = Object.keys(data);
          if (fields.length > 0) {
            const firstField = fields[0];
            const detail = Array.isArray(data[firstField]) ? data[firstField][0] : data[firstField];
            errorMessage = `${firstField}: ${detail}`;
          }
        }
      }
      
      showNotification(errorMessage, 'error');
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
    return selectedRows.length;
  };

  const getSelectedIds = (): string[] => {
    return selectedRows.map((id: string | number) => String(id));
  };

  const handleSendSMS = (student: Student) => {
    showNotification(`SMS envoyé à ${student.parentPhone}`, 'success');
  };

  const handleBulkSMS = () => {
    showNotification(`SMS envoyé à ${getSelectedCount()} parents`, 'success');
    setSelectedRows([]);
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
      const selectedIds = getSelectedIds();
      dataToExport = studentsList.filter(s => selectedIds.includes(s.id));
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
        const startY = addProfessionalHeader(doc, schoolSettings, `LISTE DES ÉLÈVES ${selectedClass ? `(${selectedClassName})` : ''}`);

        autoTable(doc, {
          startY: startY,
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

  const handleDownloadPDF = async () => {
    try {
      showNotification('Génération du PDF haute fidélité...', 'info');
      const doc = new jsPDF('p', 'mm', 'a4');
      const container = document.getElementById('printable-certificate');
      
      if (!container) {
        showNotification('Erreur : Certificat introuvable', 'error');
        return;
      }

      // Temporarily expand container for capture
      const originalOverflow = container.style.overflow;
      container.style.overflow = 'visible';

      const certificateElements = Array.from(container.children);
      
      for (let i = 0; i < certificateElements.length; i++) {
        if (i > 0) doc.addPage();
        
        const canvas = await html2canvas(certificateElements[i] as HTMLElement, {
          scale: 3, // High resolution
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      container.style.overflow = originalOverflow;
      doc.save(`Certificats_${new Date().getTime()}.pdf`);
      showNotification('Téléchargement terminé', 'success');
    } catch (error) {
      console.error('PDF Generation failed:', error);
      showNotification('Erreur lors de la génération du PDF', 'error');
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
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
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
          <Tooltip title="Importer des élèves">
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => setOpenImportDialog(true)}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                fontWeight: 600,
                minWidth: isMobile ? 'auto' : undefined,
                px: isMobile ? 1.5 : 2
              }}
            >
              {!isMobile && "Importer"}
            </Button>
          </Tooltip>
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

      <Typography variant="caption" color="error" sx={{ display: 'none' }}>DEBUG: Selection count = {getSelectedCount()}</Typography>
      

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
        <Card sx={{ 
          mb: 2, 
          borderRadius: 3, 
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          overflow: 'hidden'
        }}>
          <CardContent sx={{ 
            p: { xs: 1.5, sm: 2 }, 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' }, 
            justifyContent: 'space-between',
            gap: 2
          }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', textAlign: { xs: 'center', sm: 'left' } }}>
              {getSelectedCount()} élève(s) sélectionné(s)
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', sm: 'flex-end' } 
            }}>
              <Button
                size={isMobile ? "small" : "medium"}
                variant="contained"
                startIcon={<VisibilityIcon />}
                onClick={() => {
                  const selectedIds = getSelectedIds();
                  const selectedItems = studentsList.filter(s => selectedIds.includes(s.id));
                  setCertificateStudents(selectedItems);
                  setOpenCertificateDialog(true);
                }}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Certificats
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<MessageIcon />}
                onClick={handleBulkSMS}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                {isMobile ? "SMS" : "Envoyer SMS"}
              </Button>
               <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  setBulkDeleteStep(1);
                  setDeleteConfirmationText('');
                  setOpenBulkDeleteDialog(true);
                }}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Supprimer
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExport}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                {isMobile ? "Export" : "Exporter"}
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
            if (menuStudent) {
              setCertificateStudents([menuStudent]);
              setOpenCertificateDialog(true);
            }
            handleMenuClose();
          }}
        >
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          Certificat de scolarité
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
          <Typography component="span" variant="h6" fontWeight={700}>Exporter les Élèves</Typography>
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
      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={openBulkDeleteDialog}
        onClose={() => setOpenBulkDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 1 }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
          <Box sx={{ 
            width: 56, height: 56, borderRadius: '50%', 
            bgcolor: alpha(theme.palette.error.main, 0.1), 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2, color: 'error.main'
          }}>
            <WarningIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h6" fontWeight={800}>
            {bulkDeleteStep === 1 ? "Attention : Action Irréversible" : "Confirmation de sécurité"}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          {bulkDeleteStep === 1 ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Vous êtes sur le point de supprimer définitivement 
                <Box component="span" sx={{ color: 'error.main', fontWeight: 800, mx: 0.5 }}>
                  {getSelectedCount()} élève(s)
                </Box>
                sélectionné(s).
              </Typography>
              <Box sx={{ 
                p: 2, bgcolor: alpha(theme.palette.error.main, 0.05), 
                borderRadius: 2, textAlign: 'left', mb: 2,
                border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`
              }}>
                <Typography variant="caption" color="error.main" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                  CONSÉQUENCES DE LA SUPPRESSION :
                </Typography>
                <Typography variant="caption" component="div" sx={{ color: 'text.secondary', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  • Suppression de tous les dossiers scolaires<br/>
                  • Suppression historique complet des paiements<br/>
                  • Cette action ne peut pas être annulée
                </Typography>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 3 }}>
                Pour confirmer la suppression de <strong>{getSelectedCount()} élèves</strong>,<br/>
                veuillez saisir <strong>SUPPRIMER</strong> ci-dessous :
              </Typography>
              <TextField
                fullWidth
                size="small"
                autoFocus
                placeholder="Saisissez SUPPRIMER"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value.toUpperCase())}
                sx={{ 
                  '& .MuiOutlinedInput-root': { borderRadius: 2 },
                  '& input': { textAlign: 'center', fontWeight: 700, letterSpacing: 2 }
                }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            fullWidth 
            onClick={() => setOpenBulkDeleteDialog(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Annuler
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="error"
            disabled={bulkDeleteStep === 2 && deleteConfirmationText !== 'SUPPRIMER'}
            onClick={() => {
              if (bulkDeleteStep === 1) {
                setBulkDeleteStep(2);
              } else {
                showNotification(`${getSelectedCount()} élèves ont été supprimés avec succès`, 'success');
                setSelectedRows({ type: 'include', ids: new Set() } as any);
                setOpenBulkDeleteDialog(false);
                // Here you would call schoolService.deleteStudents(getSelectedIds())
              }
            }}
            sx={{ borderRadius: 2, textTransform: 'none', px: 4 }}
          >
            {bulkDeleteStep === 1 ? "Continuer" : "Confirmer la suppression"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Students Dialog */}
      <Dialog open={openImportDialog} onClose={() => !isImporting && setOpenImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Importer des Élèves</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" paragraph>
            Veuillez préparer votre fichier (Excel ou CSV) en suivant scrupuleusement ces règles pour garantir le succès de l'importation :
          </Typography>
          
          <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2, mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Ordre recommandé des colonnes (G à D) :</Typography>
            <Grid container spacing={1}>
              {['Matricule', 'Nom', 'Prenom', 'Sexe (M/F)', 'Date_Naissance', 'Lieu_Naissance', 'Adresse', 'Parent_Nom', 'Parent_Tel', 'Classe'].map((col) => {
                const isMandatory = ['Nom', 'Prenom', 'Sexe (M/F)', 'Date_Naissance', 'Classe'].includes(col);
                return (
                  <Grid size={{ xs: 12 }} key={col}>
                    <Chip 
                      label={col} 
                      size="small" 
                      color={isMandatory ? "primary" : "default"} 
                      variant={isMandatory ? "filled" : "outlined"}
                      sx={{ fontWeight: 600 }} 
                    />
                  </Grid>
                );
              })}
            </Grid>
            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
              • Les colonnes en <strong>bleu</strong> sont obligatoires.<br/>
              • La <strong>Classe</strong> doit correspondre exactement au nom d'une classe existante.<br/>
              • Format Date : <strong>AAAA-MM-JJ</strong> ou <strong>JJ/MM/AAAA</strong>.
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center', py: 2 }}>
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              style={{ display: 'none' }}
              id="import-file-input"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="import-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                sx={{ mb: 1 }}
              >
                {importFile ? 'Changer de fichier' : 'Sélectionner le fichier'}
              </Button>
            </label>
            {importFile && (
              <Typography variant="body2" fontWeight={700} color="primary">
                Fichier sélectionné : {importFile.name}
              </Typography>
            )}
          </Box>

          {isImporting && <LinearProgress sx={{ mt: 2 }} />}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenImportDialog(false)} disabled={isImporting}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={handleImport} 
            disabled={!importFile || isImporting}
            startIcon={isImporting ? null : <CloudUploadIcon />}
          >
            {isImporting ? 'Importation en cours...' : 'Lancer l\'importation'}
          </Button>
        </DialogActions>
      </Dialog>
      <style>{printStyles}</style>
      <Dialog 
        open={openCertificateDialog} 
        onClose={() => setOpenCertificateDialog(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Aperçu des Certificats ({certificateStudents.length} sélectionné{certificateStudents.length > 1 ? 's' : ''})
          <IconButton onClick={() => setOpenCertificateDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: 'grey.100', p: isMobile ? 0.5 : 4, overflowX: 'auto' }}>
          <Box id="printable-certificate" sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: isMobile ? 4 : 0, // No gap when printing multiple, CSS handles breaks
            width: isMobile ? '21cm' : '100%',
            mx: 'auto'
          }}>
            {certificateStudents.map((student, idx) => (
              <Box 
                key={Number(student.id)} 
                sx={{ 
                  width: '21cm', 
                  mx: 'auto',
                  transform: isMobile ? `scale(${(window.innerWidth - 40) / 794})` : 'none',
                  transformOrigin: 'top center',
                  mb: isMobile ? `-${(29.7 * (1 - (window.innerWidth - 40) / 794))}cm` : 2
                }}
              >
                <Paper 
                  elevation={3} 
                  sx={{ 
                    width: '21cm', 
                    minHeight: '29.7cm', 
                    p: '1.5cm', 
                    bgcolor: 'white', 
                    position: 'relative',
                    pageBreakAfter: 'always',
                    fontFamily: '"Times New Roman", Times, serif',
                    color: 'black',
                    lineHeight: 1.4,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Header Section */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, borderBottom: '1px solid #eee', pb: 2 }}>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: 'black' }}>REPUBLIQUE DU CAMEROUN</Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'black' }}>Paix - Travail - Patrie</Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 800, color: 'black' }}>
                        {(schoolSettings.establishment_name || schoolSettings.name || '').toUpperCase()}
                      </Typography>
                      {schoolSettings.slogan && (
                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', fontStyle: 'italic', mb: 1, color: 'black' }}>
                          {schoolSettings.slogan}
                        </Typography>
                      )}
                      {(schoolSettings as any).article_text && (
                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.6rem', color: 'black', maxWidth: '180px', mx: 'auto', lineHeight: 1.1, mb: 1 }}>
                          {(schoolSettings as any).article_text}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ display: 'block', color: 'black' }}>Tél : {schoolSettings.phone}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'black' }}>B.P. {(schoolSettings as any).postal_code} {(schoolSettings as any).city}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'black' }}>Email : {schoolSettings.email}</Typography>
                    </Box>
                    
                    <Box sx={{ px: 2, display: 'flex', alignItems: 'center' }}>
                      <img 
                        src={schoolSettings.logo || '/logo.png'} 
                        alt="Logo" 
                        style={{ height: '80px', objectFit: 'contain' }} 
                      />
                    </Box>

                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: 'black' }}>REPUBLIC OF CAMEROON</Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'black' }}>Peace - Work - Fatherland</Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 800, color: 'black' }}>
                        {((schoolSettings as any).english_name || schoolSettings.establishment_name || schoolSettings.name || '').toUpperCase()}
                      </Typography>
                      {schoolSettings.slogan && (
                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', fontStyle: 'italic', mb: 1, color: 'black' }}>
                          {schoolSettings.slogan}
                        </Typography>
                      )}
                      {(schoolSettings as any).article_text && (
                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.6rem', color: 'black', maxWidth: '180px', mx: 'auto', lineHeight: 1.1, mb: 1 }}>
                          {(schoolSettings as any).article_text}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ display: 'block', color: 'black' }}>Phone : {schoolSettings.phone}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'black' }}>PO.BOX {(schoolSettings as any).postal_code} {(schoolSettings as any).city}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'black' }}>Email : {schoolSettings.email}</Typography>
                    </Box>
                  </Box>

                  {/* Main Title */}
                  <Box sx={{ textAlign: 'center', mb: 6 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'black', display: 'block' }}>
                      Réf. : {(schoolSettings as any).certificate_reference?.replace('{ANNEE}', new Date().getFullYear().toString()) || ''}{student.matricule}/{idx + 1}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, textDecoration: 'underline', mt: 2, color: 'black' }}>
                      CERTIFICAT DE SCOLARITÉ / SCHOOL ATTESTATION
                    </Typography>
                  </Box>

                  {/* Body Content */}
                  <Box sx={{ px: 4, flex: 1 }}>
                    <Typography variant="body1" paragraph sx={{ color: 'black' }}>
                      Je soussigné(e), certifie que / I, the undersigned, certify that
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 2, '& .MuiTypography-root': { fontSize: '1.1rem', color: 'black' } }}>
                      <Typography sx={{ fontWeight: 700 }}>Matricule / Registration N° :</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{student.matricule}</Typography>

                      <Typography sx={{ fontWeight: 700 }}>Nom et Prénom(s) / Full Name :</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{student.lastName.toUpperCase()} {student.firstName}</Typography>

                      <Typography sx={{ fontWeight: 700 }}>Date de naissance / Date of Birth :</Typography>
                      <Typography>{new Date(student.dateOfBirth).toLocaleDateString()}</Typography>

                      <Typography sx={{ fontWeight: 700 }}>Lieu de naissance / Place of Birth :</Typography>
                      <Typography>{student.placeOfBirth || '-'}</Typography>

                      <Typography sx={{ fontWeight: 700 }}>Classe / Level :</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{(student as any).className}</Typography>

                      <Typography sx={{ fontWeight: 700 }}>Parent / Tuteur :</Typography>
                      <Typography>{student.parentName}</Typography>

                      <Typography sx={{ fontWeight: 700 }}>Téléphone Parent :</Typography>
                      <Typography>{student.parentPhone}</Typography>

                      <Typography sx={{ fontWeight: 700 }}>Établissement / Institution :</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{(schoolSettings.establishment_name || schoolSettings.name)}</Typography>

                      <Typography sx={{ fontWeight: 700 }}>Année académique :</Typography>
                      <Typography fontWeight={800}>{new Date().getFullYear() - 1} / {new Date().getFullYear()}</Typography>
                    </Box>

                    <Typography variant="body1" sx={{ mt: 6, fontStyle: 'italic', color: 'black' }}>
                      En foi de quoi le présent certificat lui est délivré pour servir et valoir ce que de droit.
                      <br/>
                      <small>This certificate is consequently issued to serve all legal purposes.</small>
                    </Typography>

                    {/* Signatures */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 8 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'black' }}>Fait à {(schoolSettings as any).city} le :</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, mt: 1, color: 'black' }}>{new Date().toLocaleDateString()}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', minWidth: '250px' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'black' }}>{(schoolSettings as any).director_title}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'black' }}>The Principal / Director</Typography>
                        <Box sx={{ mt: 8, borderTop: '1px dashed #ccc', pt: 1 }}>
                          <Typography variant="caption" color="text.secondary">Cachet et Signature / Stamp and Signature</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Footer NB */}
                  <Box sx={{ mt: 'auto', borderTop: '1px solid #eee', pt: 2 }}>
                    <Typography sx={{ fontSize: '0.75rem', color: 'black', textAlign: 'justify' }}>
                      N.B. : Il n'est délivré qu'un seul certificat de scolarité. L'étudiant(e) pourra en faire établir autant de copies certifiées conformes qu'il le voudra. / Only one school attestation is issued — it is in the interest of the owner to make as many certified true copies as he/she may desire.
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenCertificateDialog(false)}>Annuler</Button>
          <Button 
            variant="outlined" 
            startIcon={<FileDownloadIcon />}
            onClick={handleDownloadPDF}
          >
            Télécharger (.pdf)
          </Button>
          <Button 
            variant="contained" 
            startIcon={<VisibilityIcon />}
            onClick={() => window.print()}
          >
            Imprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

