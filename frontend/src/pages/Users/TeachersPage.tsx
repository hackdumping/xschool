import React, { useState, useMemo, useEffect } from 'react';
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
  Tabs,
  Tab,
  Divider,
  Paper,
  ListItemIcon,
  Alert,
  List,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Payment as PaymentIcon,
  Gavel as SanctionIcon,
  CloudDownload as DownloadIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { schoolService, financeService } from '@/services/api';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/contexts/SchoolContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FileDownload as FileDownloadIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { addProfessionalHeader } from '@/utils/pdfHeader';
import { FastTextField } from '@/components/common/FastTextField';


interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`teacher-tabpanel-${index}`}
      aria-labelledby={`teacher-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const TeachersPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const { settings: schoolSettings } = useSchool();

  const [activeTab, setActiveTab] = useState(0);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [sanctionTypes, setSanctionTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Dialogs
  const [openAddTeacher, setOpenAddTeacher] = useState(false);
  const [openAddSanctionType, setOpenAddSanctionType] = useState(false);
  const [openViewTeacher, setOpenViewTeacher] = useState(false);
  const [openPayTeacher, setOpenPayTeacher] = useState(false);
  const [openApplySanction, setOpenApplySanction] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [deleteDialogConfig, setDeleteDialogConfig] = useState<{ title: string; message: string; onConfirm: () => void }>({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [selectedSanctionType, setSelectedSanctionType] = useState<any>(null);
  const [teacherSanctions, setTeacherSanctions] = useState<any[]>([]);

  const [teacherForm, setTeacherForm] = useState({
    firstName: '',
    lastName: '',
    matricule: '',
    email: '',
    phone: '',
    baseSalary: 0,
  });

  const [sanctionTypeForm, setSanctionTypeForm] = useState({
    name: '',
    default_amount: 0,
  });

  const [appliedSanctionForm, setAppliedSanctionForm] = useState({
    sanction_type: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTeacher, setMenuTeacher] = useState<any>(null);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teachersRes, sanctionsRes] = await Promise.all([
        schoolService.getTeachers({ month: selectedMonth, year: selectedYear }),
        schoolService.getSanctionTypes(),
      ]);
      setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : []);
      setSanctionTypes(Array.isArray(sanctionsRes.data) ? sanctionsRes.data : []);
    } catch (error) {
      showNotification('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const filteredTeachers = useMemo(() => {
    if (!Array.isArray(teachers)) return [];
    return teachers.filter((t) =>
      `${t.firstName} ${t.lastName} ${t.matricule}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teachers, searchQuery]);

  // Handlers
  const handleAddTeacher = async () => {
    try {
      if (selectedTeacher) {
        await schoolService.updateTeacher(selectedTeacher.id, teacherForm);
        showNotification('Enseignant mis à jour', 'success');
      } else {
        await schoolService.createTeacher(teacherForm);
        showNotification('Enseignant ajouté avec succès', 'success');
      }
      setOpenAddTeacher(false);
      fetchData();
    } catch (error) {
      showNotification("Erreur lors de l'enregistrement", 'error');
    }
  };

  const handleAddSanctionType = async () => {
    try {
      if (selectedSanctionType) {
        await schoolService.updateSanctionType(selectedSanctionType.id, sanctionTypeForm);
      } else {
        await schoolService.createSanctionType(sanctionTypeForm);
      }
      setOpenAddSanctionType(false);
      fetchData();
      showNotification('Type de sanction enregistré', 'success');
    } catch (error) {
      showNotification("Erreur lors de l'enregistrement", 'error');
    }
  };

  const handleApplySanction = async () => {
    try {
      // Use manual formatting to avoid timezone shifts that can move the date to the previous month
      const y = selectedYear;
      const m = String(selectedMonth).padStart(2, '0');
      const sanctionDateStr = `${y}-${m}-01`;
      
      await schoolService.createTeacherSanction({
        teacher: selectedTeacher.id,
        sanction_type: appliedSanctionForm.sanction_type,
        amount: Number(appliedSanctionForm.amount),
        reason: appliedSanctionForm.reason,
        date: sanctionDateStr
      });
      
      showNotification('Sanction appliquée avec succès', 'success');
      setOpenApplySanction(false);

      // Optimistic update: Update local state immediately for a "real-time" feel
      const sanctionAmount = Number(appliedSanctionForm.amount);
      const newAmountToPay = (selectedTeacher.amountToPay || selectedTeacher.baseSalary) - sanctionAmount;
      const newSanctionsCount = (selectedTeacher.sanctionsCount || 0) + 1;

      const updatedLocalTeacher = { 
        ...selectedTeacher, 
        amountToPay: newAmountToPay,
        sanctionsCount: newSanctionsCount 
      };

      // Update both the list and the selected teacher
      setTeachers(prev => prev.map(t => t.id === selectedTeacher.id ? updatedLocalTeacher : t));
      setSelectedTeacher(updatedLocalTeacher);

      // Refresh data from server in background to ensure sync
      const teachersRes = await schoolService.getTeachers({ month: selectedMonth, year: selectedYear });
      const updatedTeachers = Array.isArray(teachersRes.data) ? teachersRes.data : [];
      setTeachers(updatedTeachers);
      
      const teacherFromService = updatedTeachers.find(t => t.id === selectedTeacher.id);
      if (teacherFromService) {
        setSelectedTeacher(teacherFromService);
      }

      const sanctions = await schoolService.getTeacherSanctions(selectedTeacher.id, { month: selectedMonth, year: selectedYear });
      setTeacherSanctions(Array.isArray(sanctions.data) ? sanctions.data : []);
    } catch (error) {
      showNotification("Erreur lors de l'application de la sanction", 'error');
    }
  };

  const handlePayTeacher = async () => {
    try {
      const now = new Date();
      const totalSanctions = Number(selectedTeacher.baseSalary) - Number(selectedTeacher.amountToPay);
      await financeService.createTeacherPayment({
        teacher: selectedTeacher.id,
        base_salary: selectedTeacher.baseSalary,
        total_sanctions: totalSanctions,
        amount_paid: selectedTeacher.amountToPay,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        recorded_by: user?.id
      });
      showNotification('Paiement enregistré avec succès', 'success');
      setIsPaymentConfirmed(true);
      fetchData();
    } catch (error) {
      showNotification("Erreur lors de l'enregistrement du paiement", 'error');
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    setDeleteDialogConfig({
      title: "Supprimer l'enseignant",
      message: "Êtes-vous sûr de vouloir supprimer cet enseignant ? Cette action est irréversible.",
      onConfirm: async () => {
        try {
          await schoolService.deleteTeacher(id);
          showNotification('Enseignant supprimé', 'success');
          fetchData();
        } catch (error) {
          showNotification('Erreur lors de la suppression', 'error');
        }
        setOpenDeleteConfirm(false);
      },
    });
    setOpenDeleteConfirm(true);
  };

  const handleViewTeacherDetails = async (teacher: any) => {
    setSelectedTeacher(teacher);
    setOpenViewTeacher(true);
    try {
      const now = new Date();
      const sanctions = await schoolService.getTeacherSanctions(teacher.id, {
        month: now.getMonth() + 1,
        year: now.getFullYear()
      });
      setTeacherSanctions(sanctions.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenPayTeacher = async (teacher: any) => {
    setSelectedTeacher(teacher);
    try {
      const now = new Date();
      const sanctions = await schoolService.getTeacherSanctions(teacher.id, {
        month: now.getMonth() + 1,
        year: now.getFullYear()
      });
      setTeacherSanctions(sanctions.data || []);
      setOpenPayTeacher(true);
    } catch (error) {
      showNotification("Erreur lors de la récupération des sanctions", 'error');
    }
  };

  const handleDeleteSanctionType = async (id: number) => {
    setDeleteDialogConfig({
      title: "Supprimer le motif",
      message: "Voulez-vous vraiment supprimer ce motif de sanction ?",
      onConfirm: async () => {
        try {
          await schoolService.deleteSanctionType(id);
          showNotification('Motif supprimé', 'success');
          fetchData();
        } catch (error) {
          showNotification('Erreur lors de la suppression', 'error');
        }
        setOpenDeleteConfirm(false);
      },
    });
    setOpenDeleteConfirm(true);
  };

  const handleDeleteTeacherSanction = async (id: number) => {
    setDeleteDialogConfig({
      title: "Supprimer la sanction",
      message: "Supprimer cette sanction de l'historique du mois ?",
      onConfirm: async () => {
        try {
          await schoolService.deleteTeacherSanction(id);
          showNotification('Sanction supprimée', 'success');
          // Refresh list and the specific selected teacher
          const teachersRes = await schoolService.getTeachers({ month: selectedMonth, year: selectedYear });
          const updatedTeachers = Array.isArray(teachersRes.data) ? teachersRes.data : [];
          setTeachers(updatedTeachers);

          const updatedTeacher = updatedTeachers.find(t => t.id === selectedTeacher.id);
          if (updatedTeacher) {
            setSelectedTeacher(updatedTeacher);
          }

          const res = await schoolService.getTeacherSanctions(selectedTeacher.id);
          setTeacherSanctions(res.data);
        } catch (error) {
          showNotification('Erreur lors de la suppression', 'error');
        }
        setOpenDeleteConfirm(false);
      },
    });
    setOpenDeleteConfirm(true);
  };

  const formatMoney = (amount: number | string) => {
    return Number(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const handleDownloadPayslip = () => {
    if (!selectedTeacher || !schoolSettings) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const now = new Date();
    const monthNames = ["JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"];
    const currentMonth = monthNames[now.getMonth()];
    const currentYear = now.getFullYear();

    // Header (Professional School Header)
    const startY = addProfessionalHeader(doc, schoolSettings, `BULLETIN DE PAIE - ${currentMonth} ${currentYear}`);

    // Employee Detail Section
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    doc.text(`Enseignant: ${(selectedTeacher.lastName || '').toUpperCase()} ${selectedTeacher.firstName || ''}`, 20, startY + 5);
    doc.text(`Matricule: ${selectedTeacher.matricule}`, 20, startY + 12);
    doc.text(`Date d'émission: ${now.toLocaleDateString()}`, pageWidth - 20, startY + 12, { align: 'right' });

    // Prepare Financial Table Data
    const tableData = [
      ['Salaire de Base', formatMoney(selectedTeacher.baseSalary), ''],
    ];

    teacherSanctions.forEach(s => {
      const label = s.reason ? `${s.sanctionTypeName} (${s.reason})` : s.sanctionTypeName;
      tableData.push([label, '', formatMoney(s.amount)]);
    });

    const totalDeductions = selectedTeacher.baseSalary - selectedTeacher.amountToPay;

    autoTable(doc, {
      startY: startY + 25,
      head: [['Désignation', 'Gains (FCFA)', 'Retenues (FCFA)']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      foot: [['TOTAUX', formatMoney(selectedTeacher.baseSalary), formatMoney(totalDeductions)]],
      footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    });

    // Final Net Pay display
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(232, 245, 233);
    doc.rect(20, finalY - 8, pageWidth - 40, 12, 'F');
    doc.setTextColor(46, 125, 50);
    doc.text(`NET À PAYER : ${formatMoney(selectedTeacher.amountToPay)} FCFA`, pageWidth / 2, finalY, { align: 'center' });
    doc.setTextColor(0);

    // Professional Footer with Signatures
    const footerY = finalY + 30;
    doc.setFontSize(10);
    doc.text(`Fait à ${schoolSettings.address?.split(',')[0] || 'Yaoundé'}, le ${now.toLocaleDateString()}`, 20, footerY);
    
    doc.text('Signature de l\'Employeur', 20, footerY + 15);
    doc.text('Bon pour décharge (Employé)', pageWidth - 20, footerY + 15, { align: 'right' });
    
    doc.setDrawColor(200);
    doc.rect(20, footerY + 20, 60, 25);
    doc.rect(pageWidth - 80, footerY + 20, 60, 25);

    doc.save(`Bulletin_Paie_${selectedTeacher.lastName}_${currentMonth}_${currentYear}.pdf`);
  };

  const handleDownloadAnnualReport = async (teacher: any) => {
    if (!teacher || !schoolSettings) return;
    
    try {
      showNotification('Génération du bilan annuel...', 'info');
      const res = await financeService.getTeacherPayments(teacher.id);
      const payments = res.data;

      if (!payments || payments.length === 0) {
        showNotification('Aucun historique de paiement pour cet enseignant', 'warning');
        return;
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      
      // Header (Standardized Professional Header)
      const startY = addProfessionalHeader(doc, schoolSettings, `BILAN ANNUEL DES PAIEMENTS - ${new Date().getFullYear()}`);
      
      doc.setFontSize(11);
      doc.setFont('times', 'normal');
      doc.text(`Enseignant: ${teacher.lastName.toUpperCase()} ${teacher.firstName}`, 20, startY + 5);
      doc.text(`Matricule: ${teacher.matricule}`, 20, startY + 12);
      doc.text(`Date de génération: ${new Date().toLocaleDateString()}`, pageWidth - 20, startY + 12, { align: 'right' });

      const tableData = payments.map((p: any) => [
        new Date(2000, p.month - 1).toLocaleString('fr-FR', { month: 'long' }).toUpperCase(),
        formatMoney(p.base_salary),
        formatMoney(p.total_sanctions),
        formatMoney(p.amount_paid),
        new Date(p.date).toLocaleDateString()
      ]);

      const totalPaid = payments.reduce((acc: number, curr: any) => acc + Number(curr.amount_paid), 0);

      autoTable(doc, {
        startY: startY + 20,
        head: [['MOIS', 'BRUT (XAF)', 'RETENUES (XAF)', 'NET PERÇU (XAF)', 'DATE PAIEMENT']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], textColor: 255 },
        foot: [['TOTAL ANNUEL', '', '', formatMoney(totalPaid), '']],
        footStyles: { fillColor: [236, 240, 241], textColor: 0, fontStyle: 'bold' }
      });

      doc.save(`Bilan_Annuel_${teacher.lastName}_${new Date().getFullYear()}.pdf`);
      showNotification('Bilan annuel généré avec succès', 'success');
    } catch (error) {
      console.error(error);
      showNotification('Erreur lors de la génération du bilan', 'error');
    }
  };

  const handleExport = () => {
    setOpenExportDialog(true);
  };

  const handleExportData = () => {
    setOpenExportDialog(false);
    const dataToExport = exportScope === 'filtered' ? filteredTeachers : teachers;

    if (dataToExport.length === 0) {
      showNotification('Aucune donnée à exporter', 'warning');
      return;
    }

    const filename = `Liste_Enseignants_${new Date().toISOString().split('T')[0]}`;
    
    // Format data for export
    const formattedData = dataToExport.map((t, index) => ({
      'Num': index + 1,
      'Matricule': t.matricule,
      'Nom Complet': `${(t.lastName || '').toUpperCase()} ${t.firstName || ''}`,
      'Email': t.email || 'N/A',
      'Téléphone': t.phone || 'N/A',
      'Salaire de Base (XAF)': t.baseSalary,
      'Net du Mois (XAF)': t.amountToPay,
      'Statut': t.is_active ? 'Actif' : 'Inactif'
    }));

    try {
      if (exportFormat === 'excel') {
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Enseignants');
        XLSX.writeFile(wb, `${filename}.xlsx`);
      } else if (exportFormat === 'pdf') {
        const doc = new jsPDF('p', 'mm', 'a4');
        const startY = addProfessionalHeader(doc, schoolSettings, `LISTE DU PERSONNEL ENSEIGNANT`);

        autoTable(doc, {
          startY: startY,
          head: [['Num', 'Matricule', 'Nom Complet', 'Email', 'Téléphone', 'Net à Payer']],
          body: dataToExport.map((t, i) => [
            i + 1,
            t.matricule,
            `${(t.lastName || '').toUpperCase()} ${t.firstName || ''}`,
            t.email || 'N/A',
            t.phone || 'N/A',
            `${formatMoney(t.amountToPay)} FCFA`
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 128, 185] }
        });
        doc.save(`${filename}.pdf`);
      } else {
        const csvRows = [
          Object.keys(formattedData[0]).join(','),
          ...formattedData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
        ];
        const blob = new Blob(["\uFEFF" + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      showNotification('Exportation réussie !', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Erreur lors de l\'exportation', 'error');
    }
  };

  const columns: GridColDef[] = React.useMemo(() => [
    { field: 'matricule', headerName: 'Matricule', width: 120, hideable: false },
    {
      field: 'name',
      headerName: 'Enseignant',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
          <Avatar sx={{ 
            bgcolor: alpha(theme.palette.secondary.main, 0.1), 
            color: 'secondary.main',
            fontWeight: 800,
            fontSize: '0.875rem'
          }}>
            {params.row.lastName?.[0] || '?'}{params.row.firstName?.[0] || '?'}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={800} noWrap>
              {(params.row.lastName || '').toUpperCase()} {params.row.firstName || ''}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {params.row.phone || params.row.email || 'Pas de contact'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'baseSalary',
      headerName: 'Salaire Base',
      width: 130,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={600}>
          {formatMoney(params.value)}
        </Typography>
      ),
    },
    {
      field: 'amountToPay',
      headerName: 'Net du Mois',
      width: 140,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography 
          variant="body2" 
          fontWeight={800} 
          color={(params.value || params.row.baseSalary) < params.row.baseSalary ? 'error.main' : 'success.main'}
        >
          {formatMoney(params.value ?? params.row.baseSalary)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      filterable: false,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <IconButton size="small" onClick={(e) => {
          setMenuAnchorEl(e.currentTarget);
          setMenuTeacher(params.row);
        }}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      ),
    },
  ], [theme]);

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2 
      }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            Gestion des Enseignants
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {teachers.length} enseignants enregistrés dans la base
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            fullWidth={isMobile}
            sx={{ borderRadius: 2 }}
          >
            Exporter
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedTeacher(null);
              setTeacherForm({ firstName: '', lastName: '', matricule: '', email: '', phone: '', baseSalary: 0 });
              setOpenAddTeacher(true);
            }}
            fullWidth={isMobile}
            sx={{ borderRadius: 2 }}
          >
            Nouveau
          </Button>
        </Box>
      </Box>

      {/* Main Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Liste Administrative" />
          <Tab label="Paramètres Sanctions" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        {/* Filters Card */}
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: theme.shadows[1] }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <FastTextField
                  fullWidth
                  placeholder="Rechercher (Nom, matricule...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                  }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Mois</InputLabel>
                  <Select
                    value={selectedMonth}
                    label="Mois"
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        {new Date(2000, i).toLocaleString('fr-FR', { month: 'long' })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Année</InputLabel>
                  <Select
                    value={selectedYear}
                    label="Année"
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {[2023, 2024, 2025, 2026, 2027].map(y => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 1, md: 1, lg: 2 }} sx={{ display: { xs: 'none', lg: 'block' } }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Tooltip title="Filtres avancés">
                    <IconButton><FilterListIcon /></IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <LinearProgress sx={{ maxWidth: 300, mx: 'auto', borderRadius: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Récupération des données...</Typography>
          </Box>
        ) : (
          <Card sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
            <DataGrid
              rows={filteredTeachers}
              columns={columns}
              autoHeight
              rowHeight={70}
              initialState={{ 
                pagination: { paginationModel: { pageSize: 15 } },
                columns: {
                  columnVisibilityModel: {
                    baseSalary: !isMobile,
                    matricule: !isMobile
                  }
                }
              }}
              disableRowSelectionOnClick
              sx={{ 
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                  borderBottom: `1px solid ${theme.palette.divider}`,
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }
              }}
            />
          </Card>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Barème des Sanctions</Typography>
            <Typography variant="body2" color="text.secondary">Configurez les types de retenues sur salaire par défaut.</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedSanctionType(null);
              setSanctionTypeForm({ name: '', default_amount: 0 });
              setOpenAddSanctionType(true);
            }}
            sx={{ borderRadius: 2 }}
          >
            Nouveau Motif
          </Button>
        </Box>

        <Grid container spacing={3}>
          {sanctionTypes.map((st) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={st.id}>
              <Card variant="outlined" sx={{ 
                borderRadius: 4, 
                transition: '0.3s',
                '&:hover': { boxShadow: theme.shadows[4], borderColor: 'primary.main' }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ p: 1, bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', borderRadius: 2 }}>
                      <SanctionIcon />
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => {
                        setSelectedSanctionType(st);
                        setSanctionTypeForm({ name: st.name, default_amount: st.default_amount });
                        setOpenAddSanctionType(true);
                      }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteSanctionType(st.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="h6" fontWeight={800} gutterBottom>{st.name}</Typography>
                  <Typography variant="h4" color="error.main" fontWeight={900}>
                    -{formatMoney(st.default_amount)} <Box component="span" sx={{ fontSize: '1rem', fontWeight: 500 }}>FCFA</Box>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Export Dialog */}
      <Dialog open={openExportDialog} onClose={() => setOpenExportDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Exporter la Liste des Enseignants</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Format d'exportation</InputLabel>
              <Select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                label="Format d'exportation"
              >
                <MenuItem value="excel">Microsoft Excel (.xlsx)</MenuItem>
                <MenuItem value="pdf">Document PDF (.pdf)</MenuItem>
                <MenuItem value="csv">Fichier CSV (.csv)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Étendue des données</InputLabel>
              <Select
                value={exportScope}
                onChange={(e) => setExportScope(e.target.value as any)}
                label="Étendue des données"
              >
                <MenuItem value="filtered">Liste filtrée actuelle ({filteredTeachers.length})</MenuItem>
                <MenuItem value="all">Tous les enseignants ({teachers.length})</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenExportDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleExportData} startIcon={<FileDownloadIcon />}>
            Exporter maintenant
          </Button>
        </DialogActions>
      </Dialog>

      {/* Teacher Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          setMenuAnchorEl(null);
          handleViewTeacherDetails(menuTeacher);
        }}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          Voir Détails
        </MenuItem>
        <MenuItem onClick={() => {
          setMenuAnchorEl(null);
          setSelectedTeacher(menuTeacher);
          setTeacherForm({
            firstName: menuTeacher.firstName,
            lastName: menuTeacher.lastName,
            matricule: menuTeacher.matricule || '',
            email: menuTeacher.email || '',
            phone: menuTeacher.phone || '',
            baseSalary: menuTeacher.baseSalary,
          });
          setOpenAddTeacher(true);
        }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          Modifier
        </MenuItem>
        <MenuItem onClick={() => {
          setMenuAnchorEl(null);
          handleOpenPayTeacher(menuTeacher);
        }}>
          <ListItemIcon><PaymentIcon fontSize="small" color="success" /></ListItemIcon>
          Enregistrer Paiement
        </MenuItem>
        <MenuItem onClick={() => {
          setMenuAnchorEl(null);
          handleDownloadAnnualReport(menuTeacher);
        }}>
          <ListItemIcon><DownloadIcon fontSize="small" color="primary" /></ListItemIcon>
          Bilan Annuel
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          setMenuAnchorEl(null);
          handleDeleteTeacher(menuTeacher.id);
        }} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          Supprimer
        </MenuItem>
      </Menu>

      {/* Add Teacher Dialog */}
      <Dialog open={openAddTeacher} onClose={() => setOpenAddTeacher(false)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedTeacher ? 'Modifier Enseignant' : 'Ajouter un Enseignant'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FastTextField fullWidth label="Prénom" value={teacherForm.firstName} onChange={(e) => setTeacherForm({ ...teacherForm, firstName: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FastTextField fullWidth label="Nom" value={teacherForm.lastName} onChange={(e) => setTeacherForm({ ...teacherForm, lastName: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 12 }}>
                <FastTextField fullWidth label="Matricule" value={teacherForm.matricule} onChange={(e) => setTeacherForm({ ...teacherForm, matricule: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FastTextField fullWidth label="Email" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FastTextField fullWidth label="Téléphone" value={teacherForm.phone} onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 12 }}>
                <FastTextField fullWidth label="Salaire de Base" type="number" value={teacherForm.baseSalary} onChange={(e) => setTeacherForm({ ...teacherForm, baseSalary: Number(e.target.value) })} />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddTeacher(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleAddTeacher}>Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {/* Sanction Type Dialog */}
      <Dialog open={openAddSanctionType} onClose={() => setOpenAddSanctionType(false)} fullWidth maxWidth="xs">
        <DialogTitle>{selectedSanctionType ? 'Modifier Sanction' : 'Nouveau Motif'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1 }}>
            <FastTextField fullWidth label="Dénomination" value={sanctionTypeForm.name} onChange={(e) => setSanctionTypeForm({ ...sanctionTypeForm, name: e.target.value })} sx={{ mb: 2 }} />
            <FastTextField fullWidth label="Montant Retenue (FCFA)" type="number" value={sanctionTypeForm.default_amount} onChange={(e) => setSanctionTypeForm({ ...sanctionTypeForm, default_amount: Number(e.target.value) })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddSanctionType(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleAddSanctionType}>Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {/* View Teacher Details + Sanctions */}
      <Dialog 
        open={openViewTeacher} 
        onClose={() => setOpenViewTeacher(false)} 
        fullWidth 
        maxWidth="md"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2 }}>
          <Typography variant="h6" component="span" fontWeight={800}>
            Profil de l'Enseignant
          </Typography>
          <IconButton onClick={() => setOpenViewTeacher(false)} size="small">
            <MoreVertIcon sx={{ rotate: '90deg' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedTeacher && (
            <Box>
              {/* Top Profile Header */}
              <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid size="auto">
                    <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32, fontWeight: 700 }}>
                      {selectedTeacher.lastName?.[0]}{selectedTeacher.firstName?.[0]}
                    </Avatar>
                  </Grid>
                  <Grid size="grow">
                    <Typography variant="h5" fontWeight={800}>{selectedTeacher.lastName} {selectedTeacher.firstName}</Typography>
                    <Typography color="text.secondary" variant="body2">{selectedTeacher.matricule} • {selectedTeacher.phone || 'Pas de contact'}</Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Chip label="ACTIF" color="success" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
                      <Chip label="DÉPARTEMENT ENSEIGNEMENT" variant="outlined" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 'auto' }}>
                    <Stack direction="row" spacing={1}>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        startIcon={<DownloadIcon />} 
                        onClick={() => handleDownloadAnnualReport(selectedTeacher)}
                        sx={{ borderRadius: 2 }}
                      >
                        Bilan Annuel
                      </Button>
                      <Button 
                        variant="contained" 
                        color="error" 
                        startIcon={<SanctionIcon />} 
                        onClick={() => setOpenApplySanction(true)} 
                        sx={{ borderRadius: 2, px: 3 }}
                      >
                        Sanctionner
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Typography variant="overline" color="text.secondary" fontWeight={800}>Résumé Financier</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">Salaire de Base</Typography>
                        <Typography fontWeight={700}>{formatMoney(selectedTeacher.baseSalary)} FCFA</Typography>
                      </Box>
                      <Divider sx={{ my: 1.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Net du Mois</Typography>
                        <Typography fontWeight={800} color="primary.main">{formatMoney(selectedTeacher.amountToPay)} FCFA</Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 7 }}>
                    <Typography variant="overline" color="text.secondary" fontWeight={800}>Sanctions du Mois</Typography>
                    {(!teacherSanctions || teacherSanctions.length === 0) ? (
                      <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 2, mt: 1 }}>
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">Aucune sanction enregistrée</Typography>
                      </Box>
                    ) : (
                      <List sx={{ mt: 1, p: 0 }}>
                        {teacherSanctions.map((s) => (
                          <Paper key={s.id} variant="outlined" sx={{ mb: 1, p: 1.5, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ width: 4, height: 24, bgcolor: 'error.main', borderRadius: 1 }} />
                              <Box>
                                <Typography variant="body2" fontWeight={700}>{s.sanctionTypeName}</Typography>
                                <Typography variant="caption" color="text.secondary">{new Date(s.date).toLocaleDateString()} — {s.reason}</Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography color="error.main" fontWeight={800} variant="body2">-{formatMoney(s.amount)}</Typography>
                              <IconButton size="small" onClick={() => handleDeleteTeacherSanction(s.id)} color="error" sx={{ opacity: 0.6 }}>
                                <DeleteIcon fontSize="inherit" />
                              </IconButton>
                            </Box>
                          </Paper>
                        ))}
                      </List>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenViewTeacher(false)} color="inherit" sx={{ fontWeight: 700 }}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openApplySanction} onClose={() => setOpenApplySanction(false)} fullWidth maxWidth="xs">
        <DialogTitle>Appliquer une Sanction</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel>Type de Sanction</InputLabel>
                  <Select
                    value={appliedSanctionForm.sanction_type}
                    label="Type de Sanction"
                    onChange={(e) => {
                      const st = sanctionTypes.find(t => t.id === e.target.value);
                      setAppliedSanctionForm({
                        ...appliedSanctionForm,
                        sanction_type: e.target.value as string,
                        amount: st?.default_amount || 0
                      });
                    }}
                  >
                    {sanctionTypes.map(st => (
                      <MenuItem key={st.id} value={st.id}>{st.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="Montant Retenue" type="number" value={appliedSanctionForm.amount} onChange={(e) => setAppliedSanctionForm({ ...appliedSanctionForm, amount: Number(e.target.value) })} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="Motif / Observations" multiline rows={2} value={appliedSanctionForm.reason} onChange={(e) => setAppliedSanctionForm({ ...appliedSanctionForm, reason: e.target.value })} />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApplySanction(false)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleApplySanction}>Confirmer la sanction</Button>
        </DialogActions>
      </Dialog>

      {/* Pay Teacher Dialog */}
      <Dialog 
        open={openPayTeacher} 
        onClose={() => {
          setOpenPayTeacher(false);
          setIsPaymentConfirmed(false);
        }} 
        fullWidth 
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', py: 2 }}>
          <Typography variant="h6" component="span" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon color="primary" /> Validation du Paiement
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedTeacher && (
            <Box>
              <Box sx={{ p: 3, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="overline" color="text.secondary" fontWeight={700}>BÉNÉFICIAIRE</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', fontWeight: 800 }}>{selectedTeacher.lastName?.[0]}</Avatar>
                  <Box>
                    <Typography fontWeight={800}>{selectedTeacher.lastName} {selectedTeacher.firstName}</Typography>
                    <Typography variant="caption" color="text.secondary">{selectedTeacher.matricule}</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" fontWeight={800}>DÉTAILS DU CALCUL</Typography>
                    <Paper variant="outlined" sx={{ p: 0, mt: 1, borderRadius: 2, overflow: 'hidden' }}>
                      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="body2">Salaire de Base Brut</Typography>
                        <Typography variant="body2" fontWeight={800}>{formatMoney(selectedTeacher.baseSalary)} FCFA</Typography>
                      </Box>
                      
                      <Box sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.02) }}>
                        <Typography variant="caption" fontWeight={800} color="error.main" sx={{ display: 'block', mb: 1 }}>RETENUES & SANCTIONS ({teacherSanctions?.length || 0})</Typography>
                        {(!teacherSanctions || teacherSanctions.length === 0) ? (
                          <Typography variant="caption" color="text.secondary" fontStyle="italic">Aucune retenue</Typography>
                        ) : (
                          <Stack spacing={1}>
                            {teacherSanctions.map(s => (
                              <Box key={s.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption">{s.sanctionTypeName}</Typography>
                                <Typography variant="caption" fontWeight={700} color="error.main">-{formatMoney(s.amount)}</Typography>
                              </Box>
                            ))}
                          </Stack>
                        )}
                      </Box>

                      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <Typography variant="body1" fontWeight={800}>NET À VERSER</Typography>
                        <Typography variant="h6" fontWeight={900} color="primary.main">{formatMoney(selectedTeacher.amountToPay)} FCFA</Typography>
                      </Box>
                    </Paper>
                  </Box>

                  {!isPaymentConfirmed && (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      <Typography variant="caption" fontWeight={500} sx={{ display: 'block' }}>
                        Cette action est définitive pour le mois en cours. Assurez-vous des montants avant de confirmer.
                      </Typography>
                    </Alert>
                  )}
                </Stack>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          {!isPaymentConfirmed ? (
            <Box sx={{ display: 'flex', gap: 2, width: '100%', flexDirection: isMobile ? 'column' : 'row' }}>
              <Button onClick={() => setOpenPayTeacher(false)} variant="outlined" fullWidth sx={{ borderRadius: 2 }}>Annuler</Button>
              <Button 
                variant="contained" 
                color="success" 
                fullWidth 
                onClick={handlePayTeacher} 
                startIcon={<PaymentIcon />}
                sx={{ borderRadius: 2, py: 1.5, fontWeight: 700 }}
              >
                Confirmer le Paiement
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', width: '100%', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
              <Button fullWidth variant="outlined" color="inherit" onClick={() => { setOpenPayTeacher(false); setIsPaymentConfirmed(false); }} sx={{ borderRadius: 2 }}>Fermer</Button>
              <Button fullWidth variant="contained" color="primary" startIcon={<DownloadIcon />} onClick={handleDownloadPayslip} sx={{ borderRadius: 2 }}>Bulletin PDF</Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{deleteDialogConfig.title}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', width: 60, height: 60, mb: 2 }}>
              <DeleteIcon sx={{ fontSize: 35 }} />
            </Avatar>
            <Typography variant="body1" textAlign="center">
              {deleteDialogConfig.message}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpenDeleteConfirm(false)} fullWidth variant="outlined">Annuler</Button>
          <Button onClick={deleteDialogConfig.onConfirm} fullWidth variant="contained" color="error">Confirmer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
