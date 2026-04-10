import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  useTheme,
  useMediaQuery,
  alpha,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Message as MessageIcon,
  FileDownload as FileDownloadIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams, GridRowSelectionModel } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers';
import { financeService, schoolService } from '@/services/api';
import type { Payment, PaymentMode, PaymentWithStudent, Class, TrancheConfig, Student } from '@/types';
import { useNotification } from '@/contexts/NotificationContext';

const getModeLabel = (mode: PaymentMode) => {
  switch (mode) {
    case 'cash':
      return 'Espèces';
    case 'check':
      return 'Chèque';
    case 'transfer':
      return 'Virement';
    case 'mobile':
      return 'Mobile Money';
    default:
      return mode;
  }
};

export const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showNotification } = useNotification();
  const [paymentsList, setPaymentsList] = useState<PaymentWithStudent[]>([]);
  const [classesList, setClassesList] = useState<Class[]>([]);
  const [tranchesList, setTranchesList] = useState<TrancheConfig[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTranche, setSelectedTranche] = useState('');
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const [openDialog, setOpenDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithStudent | null>(null);
  const [openReceiptDialog, setOpenReceiptDialog] = useState(false);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuPayment, setMenuPayment] = useState<PaymentWithStudent | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentsToDelete, setPaymentsToDelete] = useState<string[]>([]);

  // New payment form state
  const [newPayment, setNewPayment] = useState({
    studentId: '',
    trancheId: '',
    amount: '',
    mode: 'cash' as PaymentMode,
    date: new Date(),
    receiptNumber: '',
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paymentsRes, classesRes, tranchesRes, studentsRes] = await Promise.all([
          financeService.getPayments(),
          schoolService.getClasses(),
          financeService.getTranches(),
          schoolService.getStudents(),
        ]);
        setPaymentsList(paymentsRes.data);
        setClassesList(classesRes.data);
        setTranchesList(tranchesRes.data);
        setStudentsList(studentsRes.data);
      } catch (error) {
        console.error('Failed to fetch payments data', error);
        showNotification('Erreur lors du chargement des données financière', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showNotification]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return paymentsList.filter((payment) => {
      const matchesSearch =
        payment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass = selectedClass
        ? studentsList.find(s => s.id === payment.studentId)?.classId === selectedClass
        : true;

      const matchesTranche = selectedTranche
        ? payment.trancheId === selectedTranche
        : true;

      return matchesSearch && matchesClass && matchesTranche;
    });
  }, [paymentsList, searchQuery, selectedClass, selectedTranche, studentsList]);

  const handleViewPayment = (payment: PaymentWithStudent) => {
    setSelectedPayment(payment);
    setOpenDialog(true);
  };

  const handleAddPayment = async () => {
    setOpenAddDialog(true);
    setActiveStep(0);
    setNewPayment({
      studentId: '',
      trancheId: '',
      amount: '',
      mode: 'cash',
      date: new Date(),
      receiptNumber: 'Chargement...',
      notes: '',
    });

    try {
      const res = await financeService.getNextReceiptNumber();
      setNewPayment(prev => ({ ...prev, receiptNumber: res.data.next_number }));
    } catch (error) {
      console.error('Failed to fetch next receipt number', error);
      setNewPayment(prev => ({ ...prev, receiptNumber: '' }));
    }
  };

  const handleSavePayment = async () => {
    try {
      const tranche = tranchesList.find(t => t.id === newPayment.trancheId);
      
      await financeService.createPayment({
        studentId: newPayment.studentId,
        trancheId: newPayment.trancheId,
        amountPaid: Number(newPayment.amount),
        amountExpected: tranche ? tranche.amount : Number(newPayment.amount),
        mode: newPayment.mode,
        date: newPayment.date.toISOString().split('T')[0],
        receiptNumber: newPayment.receiptNumber,
        notes: newPayment.notes,
      });
      showNotification('Paiement enregistré avec succès', 'success');
      setOpenAddDialog(false);
      // Refresh payments
      const paymentsRes = await financeService.getPayments();
      setPaymentsList(paymentsRes.data);
    } catch (error) {
      console.error('Failed to save payment', error);
      showNotification('Erreur lors de l\'enregistrement du paiement', 'error');
    }
  };

  const handleDeleteConfirm = (ids: string[]) => {
    setPaymentsToDelete(ids);
    setDeleteDialogOpen(true);
  };

  const handleDeletePayments = async () => {
    try {
      await Promise.all(paymentsToDelete.map(id => financeService.deletePayment(id)));
      showNotification(`${paymentsToDelete.length} paiement(s) supprimé(s)`, 'success');
      setDeleteDialogOpen(false);
      setSelectedRows({ type: 'include', ids: new Set() });
      
      // Refresh list
      const paymentsRes = await financeService.getPayments();
      setPaymentsList(paymentsRes.data);
    } catch (error) {
      console.error('Failed to delete payments', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  };

  const handleSendSMS = (payment: Payment) => {
    const student = studentsList.find(s => s.id === payment.studentId);
    if (student) {
      showNotification(`SMS envoyé à ${student.parentPhone}`, 'success');
    }
  };

  const handleBulkSMS = () => {
    showNotification(`SMS envoyé à ${selectedRows.ids.size} parents`, 'success');
    setSelectedRows({ type: 'include', ids: new Set() });
  };

  const handlePrintReceipt = (payment: PaymentWithStudent) => {
    if (!payment || !payment.id) {
      showNotification('Données de paiement invalides', 'error');
      return;
    }
    navigate(`/receipt/${payment.id}`);
  };

  const handleExport = () => {
    setOpenExportDialog(true);
  };

  const handleExportData = () => {
    const dataToExport = exportScope === 'filtered' ? filteredPayments : paymentsList;

    if (dataToExport.length === 0) {
      showNotification('Aucune donnée à exporter', 'warning');
      return;
    }

    const filename = `Export_Paiements_${new Date().toISOString().split('T')[0]}`;

    // Format data for export
    const formattedData = dataToExport.map(p => ({
      'N° Reçu': p.receiptNumber,
      'Date': new Date(p.date).toLocaleDateString('fr-FR'),
      'Élève': p.studentName,
      'Classe': p.className,
      'Tranche': p.trancheName || '-',
      'Montant (XAF)': p.amountPaid,
      'Mode': getModeLabel(p.mode),
    }));

    try {
      if (exportFormat === 'excel') {
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Paiements');
        XLSX.writeFile(wb, `${filename}.xlsx`);
      } else if (exportFormat === 'pdf') {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('RAPPORT DES PAIEMENTS - XSCHOOL', 14, 15);
        doc.setFontSize(10);
        doc.text(`Date d'export: ${new Date().toLocaleString()}`, 14, 22);
        doc.text(`Type d'export: ${exportScope === 'filtered' ? 'Données filtrées' : 'Toute la base'}`, 14, 27);

        autoTable(doc, {
          startY: 32,
          head: [['N° Reçu', 'Date', 'Élève', 'Classe', 'Montant', 'Mode']],
          body: dataToExport.map(p => [
            p.receiptNumber,
            new Date(p.date).toLocaleDateString('fr-FR'),
            p.studentName,
            p.className,
            p.amountPaid.toLocaleString() + ' XAF',
            getModeLabel(p.mode)
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [25, 118, 210] }, // primary.main color
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });
        doc.save(`${filename}.pdf`);
      } else {
        const csvRows = [
          Object.keys(formattedData[0]).join(','),
          ...formattedData.map(row => Object.values(row).join(','))
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, payment: PaymentWithStudent) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuPayment(payment);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuPayment(null);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
          Chargement des finances...
        </Typography>
      </Box>
    );
  }

  const columns: GridColDef<PaymentWithStudent>[] = [
    {
      field: 'receiptNumber',
      headerName: 'N° Reçu',
      width: 120,
      renderCell: (params: GridRenderCellParams<PaymentWithStudent>) => (
        <Typography variant="body2" fontWeight={500}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'studentName',
      headerName: 'Élève',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<PaymentWithStudent>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
            {params.value.charAt(0)}
          </Avatar>
          <Typography variant="body2" fontWeight={500}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'className',
      headerName: 'Classe',
      width: 100,
    },
    {
      field: 'trancheName',
      headerName: 'Tranche',
      width: 120,
    },
    {
      field: 'amountPaid',
      headerName: 'Montant Payé',
      width: 130,
      renderCell: (params: GridRenderCellParams<PaymentWithStudent>) => (
        <Typography variant="body2" fontWeight={500} color="success.main">
          {params.value.toLocaleString()} XAF
        </Typography>
      ),
    },
    {
      field: 'remainingBalance',
      headerName: 'Reste à payer',
      width: 130,
      renderCell: (params: GridRenderCellParams<PaymentWithStudent>) => (
        <Typography variant="body2" color={params.value > 0 ? 'warning.main' : 'success.main'} fontWeight={600}>
          {params.value.toLocaleString()} XAF
        </Typography>
      ),
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 110,
      valueFormatter: (value) => new Date(value as string).toLocaleDateString('fr-FR'),
    },
    {
      field: 'mode',
      headerName: 'Mode',
      width: 120,
      renderCell: (params: GridRenderCellParams<PaymentWithStudent>) => (
        <Chip
          size="small"
          label={getModeLabel(params.value)}
          variant="outlined"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<PaymentWithStudent>) => (
        <Box>
          <Tooltip title="Voir détails">
            <IconButton size="small" onClick={() => handleViewPayment(params.row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton size="small" color="error" onClick={() => handleDeleteConfirm([params.row.id])}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={(e) => handleMenuOpen(e, params.row)}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const getTrancheBalance = (studentId: string | number, trancheId: string | number) => {
    const tranche = tranchesList.find(t => t.id === trancheId);
    const total = tranche ? Number(tranche.amount) : 0;
    const paid = paymentsList
      .filter(p => p.studentId === studentId && p.trancheId === trancheId)
      .reduce((sum, p) => sum + Number(p.amountPaid), 0);
    return {
      total,
      paid,
      remaining: Math.max(0, total - paid)
    };
  };

  const steps = ['Sélectionner l\'élève', 'Choisir la tranche', 'Saisir le paiement'];

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
            Gestion des Paiements
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {filteredPayments.length} paiements enregistrés
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
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
            onClick={handleAddPayment}
          >
            Nouveau
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Rechercher un paiement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Classe</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedTranche(''); // Reset tranche when class changes
                  }}
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
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Tranche</InputLabel>
                <Select
                  value={selectedTranche}
                  onChange={(e) => setSelectedTranche(e.target.value)}
                  label="Tranche"
                >
                  <MenuItem value="">Toutes les tranches</MenuItem>
                  {tranchesList
                    .filter(t => !selectedClass || t.schoolClass === selectedClass)
                    .map((t) => {
                      const className = classesList.find(c => c.id === t.schoolClass)?.name;
                      return (
                        <MenuItem key={t.id} value={t.id}>
                          {t.name} {!selectedClass && className && `(${className})`}
                        </MenuItem>
                      );
                    })}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedClass('');
                  setSelectedTranche('');
                }}
              >
                Réinitialiser
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedRows.ids.size > 0 && (
        <Card 
          sx={{ 
            mb: 2, 
            borderRadius: 3, 
            bgcolor: 'primary.container',
            border: '1px solid',
            borderColor: 'primary.light',
            boxShadow: theme.shadows[2]
          }}
        >
          <CardContent 
            sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' }, 
              justifyContent: 'space-between',
              gap: 2
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {selectedRows.ids.size} paiement(s) sélectionné(s)
            </Typography>
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 1, 
                width: { xs: '100%', sm: 'auto' }, 
                flexWrap: 'wrap',
                justifyContent: { xs: 'stretch', sm: 'flex-end' } 
              }}
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<MessageIcon />}
                onClick={handleBulkSMS}
                sx={{ flex: { xs: 1, sm: 'none' } }}
              >
                SMS
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExport}
                sx={{ flex: { xs: 1, sm: 'none' } }}
              >
                Export
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => handleDeleteConfirm(Array.from(selectedRows.ids) as string[])}
                sx={{ 
                  flex: { xs: '1 1 100%', sm: 'none' },
                  mt: { xs: 0.5, sm: 0 } 
                }}
              >
                Supprimer
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <DataGrid
          rows={filteredPayments}
          columns={columns}
          autoHeight
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          columnVisibilityModel={{
            receiptNumber: !isMobile,
            className: !isMobile,
            remainingBalance: true, // Show this one also on mobile if possible, or keep it responsive elsewhere
            mode: !isMobile,
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
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Détails du Paiement
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <ReceiptIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedPayment.receiptNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(selectedPayment.date).toLocaleDateString('fr-FR')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Élève
                </Typography>
                <Typography variant="body1">
                  {selectedPayment.studentName}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Classe
                </Typography>
                <Typography variant="body1">
                  {selectedPayment.className}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Tranche
                </Typography>
                <Typography variant="body1">
                  {selectedPayment.trancheName}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Mode de Paiement
                </Typography>
                <Chip
                  size="small"
                  label={getModeLabel(selectedPayment.mode)}
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Montant Payé
                </Typography>
                <Typography variant="h6" color="success.main">
                  {selectedPayment.amountPaid.toLocaleString()} XAF
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Montant Attendu
                </Typography>
                <Typography variant="body1">
                  {selectedPayment.amountExpected.toLocaleString()} XAF
                </Typography>
              </Grid>
              {selectedPayment.notes && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body1">
                    {selectedPayment.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Fermer</Button>
          <Button
            variant="contained"
            startIcon={<ReceiptIcon />}
            onClick={() => {
              if (selectedPayment) {
                setOpenDialog(false);
                handlePrintReceipt(selectedPayment);
              }
            }}
          >
            Générer Reçu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Nouveau Paiement</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box>
              <Autocomplete
                options={studentsList}
                getOptionLabel={(option) => `${option.lastName} ${option.firstName} (${option.matricule})`}
                value={studentsList.find(s => s.id === newPayment.studentId) || null}
                onChange={(_, newValue) => {
                  setNewPayment({ ...newPayment, studentId: newValue?.id || '', trancheId: '', amount: '' });
                }}
                renderInput={(params) => <TextField {...params} label="Rechercher un élève" fullWidth />}
                renderOption={(props, option) => {
                  const sClass = classesList.find(c => c.id === option.classId);
                  return (
                    <li {...props}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1">{option.lastName} {option.firstName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.matricule} - {sClass?.name || 'Classe inconnue'}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                sx={{ mb: 2 }}
              />
              {newPayment.studentId && (
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 2 }}>
                  <Typography variant="subtitle2" color="primary">Élève Sélectionné :</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {studentsList.find(s => s.id === newPayment.studentId)?.lastName} {studentsList.find(s => s.id === newPayment.studentId)?.firstName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Classe : {classesList.find(c => c.id === studentsList.find(s => s.id === newPayment.studentId)?.classId)?.name}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Tranche de Paiement</InputLabel>
                <Select
                  value={newPayment.trancheId}
                  onChange={(e) => {
                    const balance = getTrancheBalance(newPayment.studentId, e.target.value);
                    setNewPayment({ 
                      ...newPayment, 
                      trancheId: e.target.value, 
                      amount: balance.remaining.toString() 
                    });
                  }}
                  label="Tranche de Paiement"
                >
                  {tranchesList
                    .filter(t => {
                      const student = studentsList.find(s => s.id === newPayment.studentId);
                      return student ? t.schoolClass === student.classId : true;
                    })
                    .map((t) => {
                      const balance = getTrancheBalance(newPayment.studentId, t.id);
                      const isPaid = balance.remaining <= 0;
                      return (
                        <MenuItem key={t.id} value={t.id} disabled={isPaid}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ textDecoration: isPaid ? 'line-through' : 'none' }}>
                              {t.name}
                            </Typography>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: isPaid ? 'success.main' : 'primary.main' }}>
                                {isPaid ? 'Payée' : `Reste: ${balance.remaining.toLocaleString()} XAF`}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Total: {t.amount.toLocaleString()} XAF
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      );
                    })}
                </Select>
              </FormControl>
              
              {newPayment.trancheId && (
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Récapitulatif de la tranche :</Typography>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Total à payer :</Typography>
                      <Typography variant="body2" fontWeight={600}>{getTrancheBalance(newPayment.studentId, newPayment.trancheId).total.toLocaleString()} XAF</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Déjà versé :</Typography>
                      <Typography variant="body2" fontWeight={600} color="success.main">{getTrancheBalance(newPayment.studentId, newPayment.trancheId).paid.toLocaleString()} XAF</Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                * Seules les tranches correspondant à la classe de l'élève sont affichées.
              </Typography>
            </Box>
          )}

          {activeStep === 2 && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Montant"
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  InputProps={{
                    endAdornment: <Typography variant="body2">XAF</Typography>,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Mode de Paiement</InputLabel>
                  <Select
                    value={newPayment.mode}
                    onChange={(e) => setNewPayment({ ...newPayment, mode: e.target.value as PaymentMode })}
                    label="Mode de Paiement"
                  >
                    <MenuItem value="cash">Espèces</MenuItem>
                    <MenuItem value="check">Chèque</MenuItem>
                    <MenuItem value="transfer">Virement</MenuItem>
                    <MenuItem value="mobile">Mobile Money</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker
                  label="Date de Paiement"
                  value={newPayment.date}
                  onChange={(date) => date && setNewPayment({ ...newPayment, date })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="N° Reçu"
                  value={newPayment.receiptNumber}
                  onChange={(e) => setNewPayment({ ...newPayment, receiptNumber: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Annuler</Button>
          {activeStep > 0 && (
            <Button onClick={() => setActiveStep(activeStep - 1)}>
              Précédent
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => setActiveStep(activeStep + 1)}
              disabled={
                (activeStep === 0 && !newPayment.studentId) ||
                (activeStep === 1 && !newPayment.trancheId)
              }
            >
              Suivant
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={handleSavePayment}
              disabled={!newPayment.amount}
            >
              Enregistrer
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Receipt Print Dialog */}
      <Dialog
        open={openReceiptDialog}
        onClose={() => setOpenReceiptDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 4,
            overflow: 'hidden',
            m: isMobile ? 0 : 2
          }
        }}
      >
        <DialogTitle className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white', px: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Reçu Officiel XSCHOOL</Typography>
          <ReceiptIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 4 }, bgcolor: 'white' }}>
          {selectedPayment && (
            <Box id="printable-area">
              {/* Professional Print Styles */}
              <style>
                {`
                  @media print {
                    @page {
                      margin: 0mm;
                      size: auto;
                    }
                    body {
                      background: white !important;
                      margin: 0;
                      padding: 0;
                    }
                    /* Hide everything except printable-area */
                    body > *:not(.MuiDialog-root),
                    .MuiBackdrop-root,
                    .MuiDialogTitle-root,
                    .MuiDialogActions-root,
                    .no-print {
                      display: none !important;
                    }
                    /* Reset Dialog layout for print */
                    .MuiDialog-root {
                      position: absolute !important;
                    }
                    .MuiDialog-container {
                      display: block !important;
                      height: auto !important;
                    }
                    .MuiPaper-root {
                      box-shadow: none !important;
                      margin: 0 !important;
                      overflow: visible !important;
                      width: 100% !important;
                      max-width: 100% !important;
                      background: white !important;
                    }
                    #printable-area {
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100%;
                      padding: 10mm;
                      background: white !important;
                    }
                  }
                `}
              </style>

              <Box
                id="receipt-content"
                sx={{
                  p: { xs: 2, sm: 4 },
                  border: { xs: '1px solid #333', sm: '2px solid #333' },
                  borderRadius: 1,
                  position: 'relative',
                  overflow: 'hidden',
                  bgcolor: 'white',
                  color: 'black',
                  minHeight: isMobile ? 'auto' : '600px'
                }}
              >
                {/* Watermark */}
                <Typography
                  variant="h1"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-30deg)',
                    opacity: isMobile ? 0.05 : 0.03,
                    fontWeight: 900,
                    fontSize: { xs: '3rem', sm: '6rem' },
                    pointerEvents: 'none',
                    zIndex: 0,
                    width: '100%',
                    textAlign: 'center'
                  }}
                >
                  XSCHOOL OFFICIAL
                </Typography>

                <Grid container spacing={2} sx={{ mb: 4, borderBottom: '2px solid #eee', pb: 3, position: 'relative', zIndex: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Grid size={{ xs: 12, sm: 7 }}>
                    <Typography variant="h4" fontWeight={900} color="primary.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>XSCHOOL</Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>EXCELLENCE & DISCIPLINE</Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>Bastos, Yaoundé - Cameroun</Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>Tel: +237 699 00 11 22 | Email: contact@xschool.cm</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: 2, fontSize: { xs: '1rem', sm: '1.5rem' } }}>REÇU DE PAIEMENT</Typography>
                    <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>N° {selectedPayment.receiptNumber}</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Date: {new Date(selectedPayment.date).toLocaleDateString('fr-FR')}</Typography>
                  </Grid>
                </Grid>

                <Box sx={{ mb: 4, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.03), borderRadius: 2, border: '1px solid #eee', position: 'relative', zIndex: 1 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>ÉLÈVE / STUDENT</Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>{selectedPayment.studentName}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>CLASSE / CLASS</Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>{selectedPayment.className}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>DÉTAILS DU PAIEMENT / PAYMENT DETAILS</Typography>
                  <Box sx={{ border: '1px solid #ddd', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', bgcolor: '#f9f9f9', p: { xs: 1, sm: 1.5 }, borderBottom: '1px solid #ddd', fontWeight: 700 }}>
                      <Typography sx={{ flex: 1, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>Description</Typography>
                      <Typography sx={{ width: { xs: 100, sm: 150 }, textAlign: 'right', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>Montant (XAF)</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', p: { xs: 1, sm: 1.5 }, borderBottom: '1px solid #eee' }}>
                      <Typography sx={{ flex: 1, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>Paiement : {selectedPayment.trancheName}</Typography>
                      <Typography sx={{ width: { xs: 100, sm: 150 }, textAlign: 'right', fontWeight: 600 }}>{selectedPayment.amountPaid.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, p: { xs: 1, sm: 1.5 }, bgcolor: '#fcfcfc', gap: { xs: 1, sm: 0 } }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Mode: {getModeLabel(selectedPayment.mode)}</Typography>
                        {selectedPayment.notes && (
                          <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic' }}>Notes: {selectedPayment.notes}</Typography>
                        )}
                      </Box>
                      <Box sx={{ width: { xs: '100%', sm: 150 }, textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Reste à payer</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{(selectedPayment.amountExpected - selectedPayment.amountPaid).toLocaleString()} XAF</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, position: 'relative', zIndex: 1 }}>
                  <Box sx={{ textAlign: 'right', width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 200 }, p: 2, border: '2px solid black', borderRadius: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>TOTAL PAYÉ</Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ color: 'black', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{selectedPayment.amountPaid.toLocaleString()} XAF</Typography>
                  </Box>
                </Box>

                {/* Signature Area */}
                <Grid container spacing={4} sx={{ mt: { xs: 2, sm: 6 }, position: 'relative', zIndex: 1 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="caption" fontWeight={700}>SIGNATURE PARENT / TUTEUR</Typography>
                      <Box sx={{ height: { xs: 40, sm: 60 }, borderBottom: '1px dashed #ccc', mb: 1 }} />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ textAlign: 'center', p: 1, position: 'relative' }}>
                      <Typography variant="caption" fontWeight={700}>LE COMPTABLE / CASHIER</Typography>
                      <Box sx={{ height: { xs: 40, sm: 60 }, borderBottom: '1px dashed #ccc', mb: 1 }} />

                      {/* Paid Stamp Placeholder */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: { xs: 0, sm: 20 },
                          right: { xs: 10, sm: 20 },
                          border: '2px solid #ff1744',
                          borderRadius: 1,
                          px: 1,
                          py: 0.2,
                          transform: 'rotate(-15deg)',
                          color: '#ff1744',
                          opacity: 0.8
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={900} sx={{ fontSize: '0.75rem' }}>PAYÉ</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {/* Footer */}
                <Box sx={{ mt: 5, pt: 2, borderTop: '1px solid #eee', textAlign: 'center', opacity: 0.7, position: 'relative', zIndex: 1 }}>
                  <Typography variant="caption">Merci pour votre confiance. En cas d'erreur, veuillez contacter l'administration sous 48h.</Typography>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>Généré automatiquement par XSCHOOL CMS</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="no-print" sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default', borderTop: '1px solid #eee', flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: 1 }}>
          <Button onClick={() => setOpenReceiptDialog(false)} color="inherit" fullWidth={isMobile}>Annuler</Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            fullWidth={isMobile}
            sx={{ px: 4, borderRadius: 2 }}
          >
            Imprimer le Reçu
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
            menuPayment && handleSendSMS(menuPayment);
            handleMenuClose();
          }}
        >
          <MessageIcon fontSize="small" sx={{ mr: 1 }} />
          Envoyer SMS
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuPayment) {
              handlePrintReceipt(menuPayment);
              handleMenuClose();
            }
          }}
        >
          <ReceiptIcon fontSize="small" sx={{ mr: 1 }} />
          Générer Reçu
        </MenuItem>
        <MenuItem 
          onClick={() => { 
            if (menuPayment) {
              handleDeleteConfirm([menuPayment.id]); 
              handleMenuClose(); 
            }
          }} 
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Supprimer
        </MenuItem>
      </Menu>

      {/* Confirmation Dialog for Deletion */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 4, 
            p: 1,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', pb: 0 }}>
          <Box 
            sx={{ 
              width: 64, 
              height: 64, 
              borderRadius: '50%', 
              bgcolor: alpha(theme.palette.error.main, 0.1), 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              color: 'error.main'
            }}
          >
            <WarningIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h6" fontWeight={800} gutterBottom>
            Confirmer la suppression
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
            {paymentsToDelete.length > 1 
              ? `Vous êtes sur le point de supprimer définitivement ${paymentsToDelete.length} enregistrements de paiement.`
              : 'Êtes-vous sûr de vouloir supprimer définitivement ce paiement ?'}
            <br />
            <Box component="span" sx={{ color: 'error.main', fontWeight: 600, mt: 1, display: 'block' }}>
              Cette action est irréversible.
            </Box>
          </Typography>
        </DialogContent>
        <DialogActions 
          sx={{ 
            p: 3, 
            flexDirection: { xs: 'column', sm: 'row-reverse' },
            gap: 1.5
          }}
        >
          <Button 
            onClick={handleDeletePayments} 
            color="error" 
            variant="contained"
            fullWidth={isMobile}
            sx={{ 
              borderRadius: 3,
              px: 3,
              py: 1,
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': { bgcolor: 'error.dark', boxShadow: '0 8px 16px rgba(211, 47, 47, 0.4)' }
            }}
          >
            Supprimer définitivement
          </Button>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            variant="outlined"
            color="inherit"
            fullWidth={isMobile}
            sx={{ 
              borderRadius: 3,
              px:3,
              borderColor: 'divider',
              fontWeight: 600
            }}
          >
            Annuler
          </Button>
        </DialogActions>
      </Dialog>

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
          <Typography variant="h6" fontWeight={700}>Exporter les Paiements</Typography>
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
            >
              <MenuItem value="filtered">Vue actuelle (avec filtres : {filteredPayments.length} paiements)</MenuItem>
              <MenuItem value="all">Toute la base de données ({paymentsList.length} paiements)</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px dashed #ccc' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              L'export inclura les colonnes suivantes : N° Reçu, Date, Élève, Classe, Tranche, Montant, et Mode de paiement.
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
    </Box>
  );
};
