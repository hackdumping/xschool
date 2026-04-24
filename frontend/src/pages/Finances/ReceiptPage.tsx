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
            const container = containerRef.current;
            if (container) {
                // The actual paper width is 297mm ~= 1122px
                const actualPaperWidth = 297 * 3.78; 
                const availableWidth = window.innerWidth - 32;
                
                // On small screens, we scale down everything to fit the width
                setScaleFactor(Math.min(1, availableWidth / actualPaperWidth));
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        // Delay slightly for accurate initial calculation
        setTimeout(handleResize, 100);
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
        <Container maxWidth={false} sx={{ py: 4, px: { xs: 1, sm: 2 }, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
            <Box className="no-print" sx={{ mb: 3, width: '100%', maxWidth: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ borderRadius: 2, fontWeight: 700 }}>
                    Retour
                </Button>
                <Typography variant="h6" fontWeight={800} color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                    Aperçu des Reçus (2 par page A4)
                </Typography>
                <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}>
                    Imprimer
                </Button>
            </Box>

            {/* Main Preview Area */}
            <Box
                className="scaling-wrapper"
                ref={containerRef}
                sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    transform: `scale(${scaleFactor})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s ease',
                    height: `${210 * 3.78 * scaleFactor}px`,
                    mb: 8,
                    overflow: 'visible'
                }}
            >
                <Paper
                    id="printable-area"
                    elevation={10}
                    sx={{
                        p: 0,
                        bgcolor: 'white',
                        color: 'black',
                        borderRadius: 0,
                        border: '1px solid #000',
                        width: '297mm',
                        height: '210mm',
                        minWidth: '297mm',
                        minHeight: '210mm',
                        maxWidth: '297mm',
                        maxHeight: '210mm',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'row',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
                    }}
                >
                    <style>
                        {`
              @media print {
                @page { 
                    size: A4 landscape;
                    margin: 0 !important;
                }
                html, body { 
                  margin: 0 !important; 
                  padding: 0 !important; 
                  width: 297mm !important;
                  height: 210mm !important; 
                  overflow: hidden !important; 
                  background: white !important;
                  print-color-adjust: exact !important;
                  -webkit-print-color-adjust: exact !important;
                }
                
                body * { visibility: hidden; }
                
                .scaling-wrapper { 
                  transform: none !important; 
                  margin: 0 !important; 
                  padding: 0 !important;
                  width: 297mm !important;
                  height: 210mm !important;
                  display: block !important;
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  visibility: visible !important;
                }

                #printable-area, #printable-area * { visibility: visible !important; }
                #printable-area { 
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 297mm !important;
                  height: 210mm !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  box-shadow: none !important; 
                  border: none !important; 
                  transform: none !important;
                  display: flex !important;
                  flex-direction: row !important;
                  overflow: hidden !important;
                  box-sizing: border-box !important;
                }
                .no-print { display: none !important; }
              }
            `}
                    </style>

                    {/* Side-by-Side Layout (Partie Gauche et Partie Droite) */}
                    {[1, 2].map((i) => (
                        <Box key={i} sx={{ 
                            flex: 1, 
                            p: 4, // FIXED PADDING
                            position: 'relative', 
                            borderRight: i === 1 ? '1.5px dashed #ccc' : 'none', // FIXED BORDER
                            display: 'flex',
                            flexDirection: 'column',
                            height: '210mm', // FIXED HEIGHT
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            bgcolor: 'white'
                        }}>
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
                                    fontSize: { xs: '4rem', md: '5rem' },
                                    pointerEvents: 'none',
                                    zIndex: 0,
                                    width: '100%',
                                    textAlign: 'center',
                                    color: 'black',
                                    userSelect: 'none'
                                }}
                            >
                                {(settings.establishment_name || settings.name || 'XSCHOOL').toUpperCase()}
                            </Typography>

                            {/* Header */}
                            <Box sx={{ borderBottom: '2px solid #333', pb: 2, mb: 2, position: 'relative', zIndex: 1 }}>
                                <Grid container spacing={1} alignItems="center" wrap="nowrap">
                                    <Grid item sx={{ mr: 2 }}>
                                        {settings.logo ? (
                                            <Box 
                                                component="img" 
                                                src={settings.logo} 
                                                alt="Logo"
                                                sx={{ 
                                                    height: 55, // STATIC HEIGHT
                                                    maxWidth: 120,
                                                    objectFit: 'contain',
                                                    display: 'block'
                                                }} 
                                            />
                                        ) : (
                                            <SchoolIcon sx={{ color: 'primary.main', fontSize: 45 }} /> // STATIC SIZE
                                        )}
                                    </Grid>
                                    <Grid item sx={{ flex: 1 }}>
                                        <Typography variant="h6" fontWeight={900} color="primary.main" sx={{ fontSize: '1.25rem', lineHeight: 1.1, textTransform: 'uppercase' }}>
                                            {(settings.establishment_name || settings.name || 'XSCHOOL')}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', display: 'block', mb: 0.2, color: 'text.secondary' }}>
                                            {settings.slogan || 'EXCELLENCE & DISCIPLINE'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.8, display: 'block', fontWeight: 600 }}>
                                            {settings.address || 'Yaoundé'} | Tel: {settings.phone || '+237 ...'}
                                        </Typography>
                                    </Grid>
                                    <Grid item sx={{ textAlign: 'right' }}>
                                        <Typography variant="h5" fontWeight={900} sx={{ mt: -0.5, fontSize: '2rem', color: '#000' }}>REÇU</Typography>
                                        <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 900, fontSize: '1rem' }}>N° {payment.receiptNumber}</Typography>
                                        <Typography variant="caption" fontWeight={700}>Émis le: {new Date().toLocaleDateString('fr-FR')}</Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Student/Payment info section */}
                            <Box sx={{ mb: 2.5, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1), position: 'relative', zIndex: 1 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>ÉLÈVE / STUDENT</Typography>
                                        <Typography variant="subtitle1" fontWeight={900} sx={{ lineHeight: 1.2 }}>{payment.studentName}</Typography>
                                        <Typography variant="caption" fontWeight={800} sx={{ color: 'black', display: 'block', mt: 0.2 }}>CLASSE: {payment.className?.toUpperCase()}</Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Details Table */}
                            <Box sx={{ mb: 2, position: 'relative', zIndex: 1 }}>
                                <Box sx={{ border: '1.5px solid #333', borderRadius: 1.5, overflow: 'hidden' }}>
                                    <Box sx={{ display: 'flex', bgcolor: '#333', color: 'white', p: 1, fontWeight: 900, fontSize: '0.7rem' }}>
                                        <Typography variant="inherit" sx={{ flex: 1 }}>OBJET DU PAIEMENT</Typography>
                                        <Typography variant="inherit" sx={{ width: 90, textAlign: 'right' }}>XAF</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', p: 1.5, borderBottom: '1px solid #eee', alignItems: 'center' }}>
                                        <Typography variant="caption" sx={{ flex: 1, fontWeight: 800, fontSize: '0.75rem' }}>{payment.trancheName}</Typography>
                                        <Typography variant="subtitle1" sx={{ width: 90, textAlign: 'right', fontWeight: 900 }}>
                                            {payment.amountPaid.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography variant="caption" sx={{ mt: 1, display: 'block', fontStyle: 'italic', fontWeight: 600 }}>
                                    Mode de règlement : {getModeLabel(payment.mode)}
                                </Typography>
                            </Box>

                            {/* Financial Summary - Row Layout (Left: Balance, Right: Total) */}
                            <Box sx={{ 
                                mb: 3, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                position: 'relative', 
                                zIndex: 1,
                                gap: 2
                            }}>
                                <Box sx={{ 
                                    p: 1.5, 
                                    border: '1.5px solid', 
                                    borderColor: alpha(theme.palette.error.main, 0.3), 
                                    borderRadius: 1.5,
                                    bgcolor: alpha(theme.palette.error.main, 0.02)
                                }}>
                                    <Typography variant="caption" fontWeight={900} color="error.main" sx={{ fontSize: '0.6rem', textTransform: 'uppercase', display: 'block' }}>
                                        SOLDE RESTANT / BALANCE
                                    </Typography>
                                    <Typography variant="h6" fontWeight={900} color="error.main">
                                        {(payment as any).remainingBalance.toLocaleString()} <Typography variant="inherit" component="span" sx={{ fontSize: '0.7rem' }}>XAF</Typography>
                                    </Typography>
                                </Box>

                                <Box sx={{ 
                                    p: 1.5, 
                                    bgcolor: '#000', 
                                    color: '#fff', 
                                    borderRadius: 1.5, 
                                    minWidth: 160, 
                                    textAlign: 'right',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                }}>
                                    <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.8, fontWeight: 800, display: 'block', textTransform: 'uppercase' }}>
                                        TOTAL PAYÉ / TOTAL PAID
                                    </Typography>
                                    <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1 }}>
                                        {payment.amountPaid.toLocaleString()} <Typography variant="inherit" component="span" sx={{ fontSize: '0.8rem', opacity: 0.7 }}>XAF</Typography>
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Signatures */}
                            <Box sx={{ mt: 'auto', mb: 3 }}>
                                <Grid container justifyContent="space-between">
                                    <Grid item>
                                        <Typography variant="caption" fontWeight={900} sx={{ mb: 6, display: 'block', fontSize: '0.65rem', textAlign: 'left' }}>
                                            LE PARENT / TUTEUR
                                        </Typography>
                                        <Box sx={{ borderTop: '1px dashed #bbb', width: 140 }} />
                                    </Grid>
                                    <Grid item sx={{ textAlign: 'right' }}>
                                        <Typography variant="caption" fontWeight={900} sx={{ mb: 6, display: 'block', fontSize: '0.65rem', textAlign: 'right' }}>
                                            LA COMPTABILITÉ
                                        </Typography>
                                        <Box sx={{ borderTop: '1px dashed #bbb', width: 140, ml: 'auto' }} />
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Footer */}
                            <Box sx={{ pt: 1, borderTop: '1px solid #eee', textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ fontSize: '0.55rem', fontStyle: 'italic', display: 'block', mb: 0.5 }}>
                                    "{settings.receipt_footer || "Tout paiement est définitif et non remboursable."}"
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: '0.5rem', fontWeight: 900, opacity: 0.5, letterSpacing: 0.5 }}>
                                    CMS {settings.name?.toUpperCase() || 'XSCHOOL'} - GÉNÉRÉ LE {new Date().toLocaleString()}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                </Paper>
            </Box>
        </Container>
    );
};
