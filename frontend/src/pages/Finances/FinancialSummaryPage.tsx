import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addProfessionalHeader } from '@/utils/pdfHeader';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  School as SchoolIcon,
  FileDownload as FileDownloadIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useNotification } from '@/contexts/NotificationContext';
import { useSchool } from '@/contexts/SchoolContext';
import { dashboardService } from '@/services/api';

interface ClassFinancialSummary {
  classId: string;
  className: string;
  studentCount: number;
  totalExpected: number;
  totalPaid: number;
  totalRemaining: number;
  recoveryRate: number;
}

const formatAmount = (amount: number) => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const FinancialSummaryPage: React.FC = () => {
  const { showNotification } = useNotification();
  const { settings } = useSchool();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
        showNotification('Erreur lors du chargement des données financières', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [showNotification]);

  const classSummaries: ClassFinancialSummary[] = useMemo(() => {
    return stats?.classSummaries || [];
  }, [stats]);

  const globalTotals = useMemo(() => {
    if (!stats) return {
      totalExpected: 0,
      totalPaid: 0,
      totalRemaining: 0,
      totalExpenses: 0,
      recoveryRate: 0,
      balance: 0,
    };

    const expected = classSummaries.reduce((acc, curr) => acc + Number(curr.totalExpected), 0);
    const paid = stats.totalIncome || 0;

    return {
      totalExpected: expected || (paid / (stats.globalRecoveryRate / 100)) || 0,
      totalPaid: paid,
      totalRemaining: (expected - paid) > 0 ? (expected - paid) : 0,
      totalExpenses: stats.totalExpenses || 0,
      recoveryRate: stats.globalRecoveryRate || 0,
      balance: stats.generalBalance || 0,
    };
  }, [stats, classSummaries]);

  const handleExport = () => {
    setOpenExportDialog(true);
  };

  const handleExportData = () => {
    if (!stats) return;

    const filename = `Bilan_Financier_${(settings.establishment_name || settings.name).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

    // Data for Class Summary table
    const tableData = classSummaries.map(s => ({
      'Classe': s.className,
      'Effectif': s.studentCount,
      'Montant Attendu (XAF)': formatAmount(s.totalExpected),
      'Montant Payé (XAF)': formatAmount(s.totalPaid),
      'Reste (XAF)': formatAmount(s.totalRemaining),
      'Taux de Recouvrement': `${s.recoveryRate.toFixed(1)}%`
    }));

    // Data for Global Stats
    const summaryData = [
      { 'Libellé': 'Total Revenus', 'Valeur': `${formatAmount(globalTotals.totalPaid)} ${settings.currency_symbol}` },
      { 'Libellé': 'Total Dépenses', 'Valeur': `${formatAmount(globalTotals.totalExpenses)} ${settings.currency_symbol}` },
      { 'Libellé': 'Solde', 'Valeur': `${formatAmount(globalTotals.balance)} ${settings.currency_symbol}` },
      { 'Libellé': 'Montant Global Attendu', 'Valeur': `${formatAmount(globalTotals.totalExpected)} ${settings.currency_symbol}` },
      { 'Libellé': 'Taux de Recouvrement Global', 'Valeur': `${globalTotals.recoveryRate.toFixed(1)}%` }
    ];

    try {
      if (exportFormat === 'excel') {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Global Summary
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé Global');

        // Sheet 2: Class Details
        const wsDetails = XLSX.utils.json_to_sheet(tableData);
        XLSX.utils.book_append_sheet(wb, wsDetails, 'Détails par Classe');

        XLSX.writeFile(wb, `${filename}.xlsx`);
      } else if (exportFormat === 'pdf') {
        const doc = new jsPDF('p', 'mm', 'a4');
        const startY = addProfessionalHeader(doc, settings, `BILAN FINANCIER GLOBAL`);

        // Summary Block
        doc.setFontSize(14);
        doc.text('Résumé Global', 14, startY + 10);
        autoTable(doc, {
          startY: startY + 15,
          head: [['Indicateur', 'Valeur']],
          body: summaryData.map(item => [item.Libellé, item.Valeur]),
          theme: 'striped',
          headStyles: { fillColor: [25, 118, 210] }
        });

        // Details Block
        doc.text('Détails par Classe', 14, (doc as any).lastAutoTable.finalY + 15);
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [['Classe', 'Effectif', 'Attendu', 'Payé', 'Reste', 'Taux']],
          body: classSummaries.map(s => [
            s.className,
            s.studentCount,
            formatAmount(s.totalExpected),
            formatAmount(s.totalPaid),
            formatAmount(s.totalRemaining),
            `${s.recoveryRate.toFixed(1)}%`
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [25, 118, 210] }
        });

        doc.save(`${filename}.pdf`);
      } else {
        const csvContent = "\uFEFF" + [
          'CLASSE,EFFECTIF,ATTENDU,PAYE,RESTE,TAUX',
          ...classSummaries.map(s => `${s.className},${s.studentCount},${s.totalExpected},${s.totalPaid},${s.totalRemaining},${s.recoveryRate.toFixed(1)}%`)
        ].join('\n');

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
      showNotification('Export réussi !', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Erreur lors de l\'exportation', 'error');
    }
  };

  const handlePrint = () => {
    // We generate the PDF exactly like the export to ensure pixel-perfect matching with the student list,
    // avoiding native browser CSS print limitations.
    const doc = new jsPDF('p', 'mm', 'a4');
    const startY = addProfessionalHeader(doc, settings, `BILAN FINANCIER GLOBAL`);

    // Data for Global Stats
    const summaryData = [
      { 'Libellé': 'Total Revenus', 'Valeur': `${formatAmount(globalTotals.totalPaid)} ${settings.currency_symbol}` },
      { 'Libellé': 'Total Dépenses', 'Valeur': `${formatAmount(globalTotals.totalExpenses)} ${settings.currency_symbol}` },
      { 'Libellé': 'Solde', 'Valeur': `${formatAmount(globalTotals.balance)} ${settings.currency_symbol}` },
      { 'Libellé': 'Montant Global Attendu', 'Valeur': `${formatAmount(globalTotals.totalExpected)} ${settings.currency_symbol}` },
      { 'Libellé': 'Taux de Recouvrement Global', 'Valeur': `${globalTotals.recoveryRate.toFixed(1)}%` }
    ];

    // Summary Block
    doc.setFontSize(14);
    doc.text('Résumé Global', 14, startY + 10);
    autoTable(doc, {
      startY: startY + 15,
      head: [['Indicateur', 'Valeur']],
      body: summaryData.map(item => [item.Libellé, item.Valeur]),
      theme: 'striped',
      headStyles: { fillColor: [25, 118, 210] }
    });

    // Details Block
    doc.text('Détails par Classe', 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Classe', 'Effectif', 'Attendu', 'Payé', 'Reste', 'Taux']],
      body: classSummaries.map(s => [
        s.className,
        s.studentCount,
        formatAmount(s.totalExpected),
        formatAmount(s.totalPaid),
        formatAmount(s.totalRemaining),
        `${s.recoveryRate.toFixed(1)}%`
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [25, 118, 210] }
    });

    doc.autoPrint();
    window.open(URL.createObjectURL(doc.output('blob')), '_blank');
  };

  if (loading) return <LinearProgress />;

  return (
    <Box id="printable-area">
      {/* Header - Hidden in Print */}
      <Box
        className="no-print"
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
            Bilan Financier
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vue d'ensemble des finances de l'établissement
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
          <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />} onClick={handleExport}>
            Exporter
          </Button>
          <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={handlePrint}>
            Imprimer
          </Button>
        </Box>
      </Box>

      {/* We removed the JSX displayPrint block to exclusively use precise jsPDF generation for printing */}

      {/* Main Stats with specialized Print formatting */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card sx={{ borderRadius: 3, height: '100%', borderColor: 'warning.main' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <SchoolIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Montant Attendu</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'warning.main' }} className="text-warning-print">
                    {formatAmount(globalTotals.totalExpected)} {settings.currency_symbol}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card sx={{ borderRadius: 3, height: '100%', borderColor: 'success.main' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Revenus</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }} className="text-success-print">
                    {formatAmount(globalTotals.totalPaid)} {settings.currency_symbol}
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                className="no-print"
                value={globalTotals.recoveryRate}
                sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover' }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {globalTotals.recoveryRate.toFixed(1)}% du montant attendu
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card sx={{ borderRadius: 3, height: '100%', borderColor: 'error.main' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <TrendingDownIcon sx={{ fontSize: 32, color: 'error.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Dépenses</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'error.main' }} className="text-error-print">
                    {formatAmount(globalTotals.totalExpenses)} {settings.currency_symbol}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card sx={{ borderRadius: 3, height: '100%', borderColor: 'info.main' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <AccountBalanceIcon sx={{ fontSize: 32, color: 'info.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Solde</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: globalTotals.balance >= 0 ? 'success.main' : 'error.main' }} className={globalTotals.balance >= 0 ? 'text-success-print' : 'text-error-print'}>
                    {formatAmount(globalTotals.balance)} {settings.currency_symbol}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, mb: 4, overflow: 'hidden' }} elevation={0}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }} className="no-print">Récapitulatif par Classe</Typography>

          {/* Print Title - Visible only when printing */}
          <Box sx={{ display: 'none', displayPrint: 'block', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', borderBottom: '1px solid black', pb: 1 }}>
              Tableau Récapitulatif par Classe
            </Typography>
          </Box>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <TableContainer sx={{ minWidth: 700 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Classe</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Effectif</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Montant Attendu</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Montant Payé</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Reste</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Taux</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classSummaries.map((summary) => (
                    <TableRow key={summary.classId} hover>
                      <TableCell>{summary.className}</TableCell>
                      <TableCell align="center">{summary.studentCount}</TableCell>
                      <TableCell align="right">{formatAmount(summary.totalExpected)} {settings.currency_symbol}</TableCell>
                      <TableCell align="right">{formatAmount(summary.totalPaid)} {settings.currency_symbol}</TableCell>
                      <TableCell align="right">{formatAmount(summary.totalRemaining)} {settings.currency_symbol}</TableCell>
                      <TableCell align="center">
                        <Chip size="small" label={`${summary.recoveryRate.toFixed(1)}%`} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Print-only Footer */}
      <Box sx={{ display: 'none', displayPrint: 'block', mt: 6 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 6 }}>
            <Box sx={{ border: '1px solid #ddd', p: 4, height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Visa du Gestionnaire</Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#ccc' }}>Cachet et Signature</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Box sx={{ border: '1px solid #ddd', p: 4, height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Visa du Directeur</Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#ccc' }}>Cachet et Signature</Typography>
            </Box>
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 4, display: 'block', textAlign: 'center' }}>
          Document généré automatiquement par {settings.name} le {new Date().toLocaleString()}
        </Typography>
      </Box>

      {/* Export Dialog */}
      <Dialog open={openExportDialog} onClose={() => setOpenExportDialog(false)} maxWidth="xs" fullWidth className="no-print">
        <DialogTitle>Exporter le Bilan Financier</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mt: 1 }}>
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenExportDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleExportData} startIcon={<FileDownloadIcon />}>
            Exporter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            @page {
              size: portrait;
              margin: 15mm;
            }
            body {
              background-color: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            /* Hide the global application shell components during printing */
            .no-print, 
            header, 
            nav, 
            aside, 
            footer,
            .MuiAppBar-root, 
            .MuiDrawer-root, 
            .MuiBottomNavigation-root {
              display: none !important;
            }
            /* Reset the main content area for printing */
            main {
              margin: 0 !important;
              padding: 0 !important;
              display: block !important;
              width: 100% !important;
              background-color: white !important;
            }
            #printable-area {
              display: block !important;
              visibility: visible !important;
              position: relative !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            /* Remove scrollbars and ensure full table visibility */
            .MuiBox-root, .MuiTableContainer-root {
              overflow: visible !important;
              height: auto !important;
              max-height: none !important;
              width: 100% !important;
              min-width: 0 !important;
            }
            .MuiTable-root {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: auto !important;
            }
            /* Force Light Mode Elements */
            .MuiPaper-root, .MuiCard-root {
              background-color: white !important;
              color: black !important;
              border: 1px solid #eee !important;
              margin-bottom: 15px !important;
              border-radius: 4px !important;
            }
            /* Table Styling for Print */
            .MuiTable-root {
              border-collapse: collapse !important;
            }
            .MuiTableCell-root {
              border-bottom: 1px solid #ddd !important;
              color: black !important;
              padding: 8px !important;
            }
            .MuiTableCell-head {
              background-color: #f0f0f0 !important;
              border-bottom: 2px solid #000 !important;
              font-weight: bold !important;
              color: #000 !important;
            }
            /* Colors for Indicators */
            .text-success-print { color: #2e7d32 !important; font-weight: bold !important; }
            .text-error-print { color: #d32f2f !important; font-weight: bold !important; }
            .text-info-print { color: #0288d1 !important; font-weight: bold !important; }
            .text-warning-print { color: #ed6c02 !important; font-weight: bold !important; }

            /* Resetting MUI specific dark mode styles */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
        `}
      </style>
    </Box>
  );
};
