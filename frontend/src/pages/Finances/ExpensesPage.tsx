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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tooltip,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Receipt as ReceiptIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers';
import { financeService } from '@/services/api';
import type { Expense } from '@/types';
import { useNotification } from '@/contexts/NotificationContext';
import { useSchool } from '@/contexts/SchoolContext';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatAmount = (amount: number) => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const expenseCategories = [
  'Salaires',
  'Fournitures',
  'Maintenance',
  'Services publics',
  'Transport',
  'Équipement',
  'Services bancaires',
  'Autres',
];

export const ExpensesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showNotification } = useNotification();
  const { settings } = useSchool();
  const [expensesList, setExpensesList] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDateFrom, setSelectedDateFrom] = useState<Date | null>(null);
  const [selectedDateTo, setSelectedDateTo] = useState<Date | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');

  // New expense form state
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date(),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await financeService.getExpenses();
        setExpensesList(response.data);
      } catch (error) {
        console.error('Failed to fetch expenses', error);
        showNotification('Erreur lors du chargement des dépenses', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showNotification]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expensesList.filter((expense) => {
      const matchesSearch =
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory ? expense.category === selectedCategory : true;

      const expenseDate = new Date(expense.date);
      const matchesDateFrom = selectedDateFrom ? expenseDate >= selectedDateFrom : true;
      const matchesDateTo = selectedDateTo ? expenseDate <= selectedDateTo : true;

      return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
    });
  }, [expensesList, searchQuery, selectedCategory, selectedDateFrom, selectedDateTo]);

  // Calculate totals
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const expensesByCategory = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    filteredExpenses.forEach((expense) => {
      grouped[expense.category] = (grouped[expense.category] || 0) + expense.amount;
    });
    return Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setOpenDialog(true);
  };

  const handleAddExpense = () => {
    setOpenAddDialog(true);
  };

  const handleSaveExpense = async () => {
    try {
      await financeService.createExpense({
        description: newExpense.description,
        amount: Number(newExpense.amount),
        category: newExpense.category,
        date: newExpense.date.toISOString().split('T')[0],
      });
      showNotification('Dépense enregistrée avec succès', 'success');
      setOpenAddDialog(false);
      // Refresh
      const response = await financeService.getExpenses();
      setExpensesList(response.data);
    } catch (error) {
      console.error('Failed to save expense', error);
      showNotification('Erreur lors de l\'enregistrement de la dépense', 'error');
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (confirm(`Voulez-vous supprimer la dépense "${expense.description}" ?`)) {
      try {
        await financeService.deleteExpense(expense.id);
        showNotification('Dépense supprimée', 'success');
        // Refresh
        const response = await financeService.getExpenses();
        setExpensesList(response.data);
      } catch (error) {
        console.error('Failed to delete expense', error);
        showNotification('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleExport = () => {
    setOpenExportDialog(true);
  };

  const handleExportData = () => {
    setOpenExportDialog(false);
    showNotification('Préparation de l\'exportation...', 'info');

    const tableData = filteredExpenses.map(e => ({
      'Date': new Date(e.date).toLocaleDateString('fr-FR'),
      'Description': e.description,
      'Catégorie': e.category,
      'Montant (XAF)': formatAmount(e.amount),
      'Enregistré par': e.recordedBy || 'N/A'
    }));

    try {
      if (exportFormat === 'excel') {
        const ws = XLSX.utils.json_to_sheet(tableData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Dépenses');
        XLSX.writeFile(wb, `depenses_xschool_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else if (exportFormat === 'pdf') {
        const doc = new jsPDF();
        doc.text('RAPPORT DES DÉPENSES - XSCHOOL', 14, 15);
        doc.setFontSize(10);
        doc.text(`Généré le : ${new Date().toLocaleString()}`, 14, 22);
        doc.text(`Total des dépenses : ${formatAmount(totalExpenses)} ${settings.currency_symbol}`, 14, 29);

        autoTable(doc, {
          startY: 35,
          head: [['Date', 'Description', 'Catégorie', 'Montant (XAF)', 'Enregistré par']],
          body: filteredExpenses.map(e => [
            new Date(e.date).toLocaleDateString('fr-FR'),
            e.description,
            e.category,
            formatAmount(e.amount),
            e.recordedBy || 'N/A'
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [211, 47, 47] } // Red for expenses
        });
        doc.save(`depenses_xschool_${new Date().toISOString().split('T')[0]}.pdf`);
      } else {
        const csvContent = [
          ['Date', 'Description', 'Catégorie', 'Montant (XAF)', 'Enregistre par'],
          ...filteredExpenses.map(e => [
            new Date(e.date).toLocaleDateString('fr-FR'),
            e.description,
            e.category,
            formatAmount(e.amount),
            e.recordedBy || 'N/A'
          ])
        ].map(e => e.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `depenses_xschool_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      showNotification('Exportation réussie', 'success');
    } catch (error) {
      console.error('Export failed', error);
      showNotification('Erreur lors de l\'exportation', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
          Chargement des dépenses...
        </Typography>
      </Box>
    );
  }

  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      width: 110,
      valueFormatter: (value) => new Date(value as string).toLocaleDateString('fr-FR'),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={500}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'category',
      headerName: 'Catégorie',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          size="small"
          label={params.value}
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'amount',
      headerName: 'Montant',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={500} color="error.main">
          -{formatAmount(params.value)} {settings.currency_symbol}
        </Typography>
      ),
    },
    {
      field: 'recordedBy',
      headerName: 'Enregistré par',
      width: 130,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Voir détails">
            <IconButton size="small" onClick={() => handleViewExpense(params.row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteExpense(params.row)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
            Gestion des Dépenses
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {filteredExpenses.length} dépenses enregistrées
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
            onClick={handleAddExpense}
          >
            Nouvelle
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingDownIcon sx={{ fontSize: 40, color: 'error.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total des Dépenses
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main' }}>
                    {formatAmount(totalExpenses)} {settings.currency_symbol}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Répartition par Catégorie
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {expensesByCategory.slice(0, 3).map(({ category, amount }) => (
                  <Chip
                    key={category}
                    size="small"
                    label={`${category}: ${formatAmount(amount)} ${settings.currency_symbol}`}
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                placeholder="Rechercher une dépense..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Catégorie</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Catégorie"
                >
                  <MenuItem value="">Toutes</MenuItem>
                  {expenseCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="Date de début"
                value={selectedDateFrom}
                onChange={setSelectedDateFrom}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="Date de fin"
                value={selectedDateTo}
                onChange={setSelectedDateTo}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 1 }}>
              <IconButton
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  setSelectedDateFrom(null);
                  setSelectedDateTo(null);
                }}
              >
                <FilterListIcon />
              </IconButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <DataGrid
          rows={filteredExpenses}
          columns={columns}
          autoHeight
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          columnVisibilityModel={{
            recordedBy: !isMobile,
            category: !isMobile,
          }}
          pageSizeOptions={[5, 10, 25, 50]}
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

      {/* Expense Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Détails de la Dépense</DialogTitle>
        <DialogContent>
          {selectedExpense && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <ReceiptIcon sx={{ fontSize: 40, color: 'error.main' }} />
                  <Box>
                    <Typography variant="h6">{selectedExpense.description}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(selectedExpense.date).toLocaleDateString('fr-FR')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Catégorie
                </Typography>
                <Chip
                  size="small"
                  label={selectedExpense.category}
                  color="primary"
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Montant
                </Typography>
                <Typography variant="h6" color="error.main">
                  -{formatAmount(selectedExpense.amount)} {settings.currency_symbol}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Enregistré par
                </Typography>
                <Typography variant="body1">
                  {selectedExpense.recordedBy}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nouvelle Dépense</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Montant"
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                InputProps={{
                  endAdornment: <Typography variant="body2">{settings.currency_symbol}</Typography>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Catégorie</InputLabel>
                <Select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  label="Catégorie"
                >
                  {expenseCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <DatePicker
                label="Date"
                value={newExpense.date}
                onChange={(date) => date && setNewExpense({ ...newExpense, date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveExpense}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={openExportDialog} onClose={() => setOpenExportDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Exporter les Dépenses</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Format d'exportation</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              label="Format d'exportation"
            >
              <MenuItem value="excel">Excel (.xlsx)</MenuItem>
              <MenuItem value="pdf">PDF (.pdf)</MenuItem>
              <MenuItem value="csv">CSV (.csv)</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            L'exportation inclura les données filtrées affichées dans le tableau.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExportDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleExportData} startIcon={<FileDownloadIcon />}>
            Exporter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
