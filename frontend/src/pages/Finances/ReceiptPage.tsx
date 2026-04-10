import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Container,
    Paper,
    alpha,
    useTheme,
    Grid,
} from '@mui/material';
import {
    Print as PrintIcon,
    ArrowBack as ArrowBackIcon,
    School as SchoolIcon,
} from '@mui/icons-material';
import { financeService } from '@/services/api';
import { useNotification } from '@/contexts/NotificationContext';
import { useSchool } from '@/contexts/SchoolContext';
import type { PaymentWithStudent } from '@/types';

export const ReceiptPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const theme = useTheme();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { settings } = useSchool();
    const containerRef = useRef<HTMLDivElement>(null);

    const [payment, setPayment] = useState<PaymentWithStudent | null>(null);
    const [loading, setLoading] = useState(true);
    const [scaleFactor, setScaleFactor] = useState(1);

    useEffect(() => {
        const fetchPayment = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await financeService.getPayments();
                const found = res.data.find((p: any) => String(p.id) === id);
                if (found) {
                    setPayment(found);
                } else {
                    showNotification('Paiement non trouvé', 'error');
                    navigate('/finances/payments');
                }
            } catch (error) {
                console.error('Failed to fetch payment', error);
                showNotification('Erreur lors du chargement du paiement', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchPayment();
    }, [id, showNotification, navigate]);

    // Handle Dynamic Scaling for screen preview
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const parentWidth = window.innerWidth - 32;
                const targetWidth = 850;
                if (parentWidth < targetWidth) {
                    setScaleFactor(parentWidth / targetWidth);
                } else {
                    setScaleFactor(1);
                }
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [loading]);

    const getModeLabel = (mode: string) => {
        switch (mode) {
            case 'cash': return 'Espèces';
            case 'check': return 'Chèque';
            case 'transfer': return 'Virement';
            case 'mobile': return 'Mobile Money';
            default: return mode;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!payment) return null;

    return (
        <Container maxWidth={false} sx={{ py: 4, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box className="no-print" sx={{ mb: 3, width: '100%', maxWidth: 850, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ borderRadius: 2 }}>
                    Retour
                </Button>
                <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ borderRadius: 2 }}>
                    Imprimer
                </Button>
            </Box>

            {/* Scaling Wrapper - DISABLED IN PRINT */}
            <Box
                className="scaling-wrapper"
                ref={containerRef}
                sx={{
                    width: 850,
                    transform: `scale(${scaleFactor})`,
                    transformOrigin: 'top center',
                    mb: `${(scaleFactor - 1) * 1200}px`,
                }}
            >
                <Paper
                    id="printable-area"
                    elevation={3}
                    sx={{
                        p: { xs: 4, sm: 5 }, // Reduced padding to ensure vertical space
                        bgcolor: 'white',
                        color: 'black',
                        borderRadius: 4,
                        border: '1px solid #eee',
                        width: 850,
                        minHeight: '297mm', // A4 Height
                        maxHeight: '297mm',
                        position: 'relative',
                        overflow: 'hidden', // Prevent second page trigger
                        display: 'flex',
                        flexDirection: 'column',
                        boxSizing: 'border-box'
                    }}
                >
                    <style>
                        {`
              @media print {
                html, body { 
                  margin: 0 !important; 
                  padding: 0 !important; 
                  height: 297mm !important; 
                  overflow: hidden !important; 
                  background: white !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                
                body * { visibility: hidden; }
                
                .scaling-wrapper { 
                  transform: none !important; 
                  margin: 0 !important; 
                  padding: 0 !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  display: block !important;
                }

                #printable-area, #printable-area * { visibility: visible; }
                #printable-area { 
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  padding: 10mm 15mm !important; /* Reduced vertical padding for print */
                  margin: 0 !important;
                  box-shadow: none !important; 
                  border: none !important; 
                  transform: none !important;
                  background: white !important;
                  display: flex !important;
                  flex-direction: column !important;
                  overflow: hidden !important;
                  box-sizing: border-box !important;
                }
                .no-print { display: none !important; visibility: hidden !important; }
                @page { margin: 0; size: A4 portrait; }
              }
            `}
                    </style>

                    {/* Watermark */}
                    <Typography
                        variant="h1"
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%) rotate(-30deg)',
                            opacity: 0.03,
                            fontWeight: 900,
                            fontSize: '10rem',
                            pointerEvents: 'none',
                            zIndex: 0,
                            width: '100%',
                            textAlign: 'center',
                            color: 'black',
                            userSelect: 'none'
                        }}
                    >
                        {settings.name?.toUpperCase() || 'XSCHOOL'}
                    </Typography>

                    {/* Header - Compact Spacing */}
                    <Box sx={{ borderBottom: '4px solid #333', pb: 3, mb: 4, position: 'relative', zIndex: 1 }}>
                        <Grid container spacing={2} alignItems="center" wrap="nowrap">
                            <Grid sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                                    <Box sx={{ p: 1.5, bgcolor: 'primary.main', borderRadius: 2, display: 'flex' }}>
                                        <SchoolIcon sx={{ color: 'white', fontSize: 42 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" fontWeight={900} color="primary.main">
                                            {settings.name?.toUpperCase() || 'XSCHOOL'}
                                        </Typography>
                                        <Typography variant="subtitle2" fontWeight={700} sx={{ letterSpacing: 1.5, opacity: 0.8 }}>
                                            {settings.slogan || 'EXCELLENCE & DISCIPLINE'}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ opacity: 0.8 }}>
                                    <Typography variant="body2" fontWeight={600}>{settings.address || 'Centre Administratif, Yaoundé'}</Typography>
                                    <Typography variant="body2">Tel: {settings.phone || '+237 ...'} | Email: {settings.email || 'contact@xschool.cm'}</Typography>
                                </Box>
                            </Grid>
                            <Grid sx={{ textAlign: 'right' }}>
                                <Typography variant="h2" fontWeight={900} sx={{ letterSpacing: 2, mb: 0.5 }}>REÇU</Typography>
                                <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 800 }}>N° {payment.receiptNumber}</Typography>
                                <Typography variant="body1" fontWeight={700} sx={{ opacity: 0.7 }}>Date: {new Date(payment.date).toLocaleDateString('fr-FR')}</Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Info Section - Compact Spacing */}
                    <Box sx={{ mb: 4, p: 3, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1), position: 'relative', zIndex: 1 }}>
                        <Grid container spacing={3} wrap="nowrap">
                            <Grid sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Élève / Student</Typography>
                                <Typography variant="h5" fontWeight={800}>{payment.studentName}</Typography>
                            </Grid>
                            <Grid sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Classe / Class</Typography>
                                <Typography variant="h5" fontWeight={800}>{payment.className}</Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Operation Details */}
                    <Box sx={{ mb: 5, position: 'relative', zIndex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1.5, textTransform: 'uppercase', borderLeft: '5px solid', borderColor: 'primary.main', pl: 2, letterSpacing: 1 }}>
                            Détails de l'opération
                        </Typography>
                        <Box sx={{ border: '2px solid #333', borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ display: 'flex', bgcolor: '#333', color: 'white', p: 2, fontWeight: 800 }}>
                                <Typography sx={{ flex: 1 }}>DESCRIPTION</Typography>
                                <Typography sx={{ width: 120, textAlign: 'center' }}>MODE</Typography>
                                <Typography sx={{ width: 180, textAlign: 'right' }}>MONTANT (XAF)</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', p: 3, borderBottom: '1px solid #eee', alignItems: 'center' }}>
                                <Typography sx={{ flex: 1, fontWeight: 700, fontSize: '1.1rem' }}>Paiement : {payment.trancheName}</Typography>
                                <Typography sx={{ width: 120, textAlign: 'center', fontWeight: 600 }}>{getModeLabel(payment.mode)}</Typography>
                                <Typography sx={{ width: 180, textAlign: 'right', fontWeight: 900, fontSize: '1.5rem' }}>
                                    {payment.amountPaid.toLocaleString()}
                                </Typography>
                            </Box>
                            {payment.notes && (
                                <Box sx={{ p: 2, bgcolor: '#fcfcfc', borderBottom: '1px solid #eee' }}>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>Note: {payment.notes}</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* Totals */}
                    <Grid container spacing={4} sx={{ mb: 6, position: 'relative', zIndex: 1 }} wrap="nowrap">
                        <Grid sx={{ flex: 1 }}>
                            <Box sx={{ p: 2.5, bgcolor: alpha(theme.palette.error.main, 0.05), border: '1px dashed', borderColor: 'error.main', borderRadius: 2 }}>
                                <Typography variant="caption" fontWeight={800} color="error.main">RAPPEL DE SOLDE</Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, alignItems: 'center' }}>
                                    <Typography variant="body1" fontWeight={600}>Reste à payer :</Typography>
                                    <Typography variant="h5" fontWeight={900} color="error.main">
                                        {(payment as any).remainingBalance.toLocaleString()} XAF
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid sx={{ width: 350 }}>
                            <Box sx={{ textAlign: 'right', p: 3, bgcolor: '#222', color: 'white', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                <Typography variant="subtitle2" fontWeight={800} sx={{ opacity: 0.8, letterSpacing: 1 }}>TOTAL PAYÉ</Typography>
                                <Typography variant="h2" fontWeight={900} sx={{ my: 0.5, fontSize: '2.5rem' }}>
                                    {payment.amountPaid.toLocaleString()}
                                </Typography>
                                <Typography variant="caption" fontWeight={700}>FRANCS CFA (XAF)</Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Validation */}
                    <Box sx={{ mb: 5, position: 'relative', zIndex: 1 }}>
                        <Grid container spacing={8} wrap="nowrap">
                            <Grid sx={{ flex: 1 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 8 }}>SIGNATURE DU PARENT / TUTEUR</Typography>
                                    <Box sx={{ borderTop: '2px dashed #ccc', width: '80%', mx: 'auto' }} />
                                </Box>
                            </Grid>
                            <Grid sx={{ flex: 1 }}>
                                <Box sx={{ textAlign: 'center', position: 'relative' }}>
                                    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 8 }}>LE COMPTABLE / CASHIER</Typography>
                                    <Box sx={{ borderTop: '2px dashed #ccc', width: '80%', mx: 'auto' }} />

                                    {/* Official Stamp */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 10,
                                            right: '15%',
                                            border: '6px double #f44336',
                                            borderRadius: 2,
                                            px: 4,
                                            py: 1.5,
                                            transform: 'rotate(-15deg)',
                                            color: '#f44336',
                                            opacity: 0.9,
                                            backgroundColor: 'rgba(255,255,255,0.9)',
                                            boxShadow: '0 0 15px rgba(244, 67, 54, 0.1)'
                                        }}
                                    >
                                        <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: 3 }}>PAYÉ</Typography>
                                        <Typography variant="caption" fontWeight={900}>{settings.name?.toUpperCase() || 'OFFICIEL'}</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Footer - PUSHED TO BOTTOM */}
                    <Box sx={{ mt: 'auto', pt: 3, borderTop: '1px solid #eee', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                        <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1.5, maxWidth: '85%', mx: 'auto', fontWeight: 500 }}>
                            "{settings.receipt_footer || "Cette facture fait office de preuve de paiement. Veuillez la conserver précieusement."}"
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'success.main' }} />
                            <Typography variant="caption" fontWeight={800} sx={{ opacity: 0.6, letterSpacing: 1 }}>
                                DOCUMENT AUTHENTIQUE ET INFALSIFIABLE GÉNÉRÉ PAR {settings.name?.toUpperCase()} CMS v1.0
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};
