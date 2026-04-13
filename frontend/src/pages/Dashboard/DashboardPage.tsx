import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  IconButton,
  Tooltip,
  Fab,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon,
  Payment as PaymentIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon,
  TrendingDown as TrendingDownIcon,
  Grade as GradeIcon,
  PersonAdd as PersonAddIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '@/contexts/NotificationContext';
import { useSchool } from '@/contexts/SchoolContext';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; isPositive: boolean };
  trendTextColor?: string;
  progress?: number;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, color, trend, trendTextColor, progress }) => (
  <Card sx={{ 
    height: '100%', 
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      '& .kpi-icon-bg': {
        transform: 'scale(1.2) rotate(10deg)',
        opacity: 0.15,
      }
    }
  }}>
    <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500, opacity: 0.8 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            fontSize: { xs: '1.75rem', sm: '2.25rem' },
            letterSpacing: '-0.02em'
          }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar 
          sx={{ 
            bgcolor: `${color}15`, 
            color: color,
            width: 56, 
            height: 56,
            borderRadius: 3,
            border: `1px solid ${color}30`
          }}
        >
          {icon}
        </Avatar>
      </Box>

      {progress !== undefined && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: color }}>
              {progress}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Recouvrement
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: `${color}15`,
              '& .MuiLinearProgress-bar': {
                bgcolor: color,
                borderRadius: 3,
              },
            }}
          />
        </Box>
      )}

      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 0.5 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: trend.isPositive ? 'success.light' : 'error.light',
            color: trendTextColor || (trend.isPositive ? 'success.main' : 'error.main'),
            px: 1,
            py: 0.5,
            borderRadius: 1.5,
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            {trend.isPositive ? (
              <TrendingUpIcon sx={{ fontSize: 14, mr: 0.5 }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 14, mr: 0.5 }} />
            )}
            {trend.isPositive ? '+' : ''}{trend.value}%
          </Box>
          <Typography variant="caption" color="text.secondary">
            vs mois précédent
          </Typography>
        </Box>
      )}
    </CardContent>
    <Box 
      className="kpi-icon-bg"
      sx={{ 
        position: 'absolute',
        right: -20,
        bottom: -20,
        fontSize: '120px',
        color: color,
        opacity: 0.05,
        transition: 'all 0.4s ease',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    >
      {icon}
    </Box>
  </Card>
);

const getOperationIcon = (type: string) => {
  switch (type) {
    case 'payment':
      return <PaymentIcon />;
    case 'expense':
      return <ReceiptIcon />;
    case 'enrollment':
      return <PersonAddIcon />;
    case 'grade':
      return <GradeIcon />;
    default:
      return <ReceiptIcon />;
  }
};

const getOperationColor = (type: string) => {
  switch (type) {
    case 'payment':
      return 'success';
    case 'expense':
      return 'error';
    case 'enrollment':
      return 'info';
    case 'grade':
      return 'warning';
    default:
      return 'default';
  }
};

const getAlertColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'default';
  }
};

import { useEffect, useState, useMemo } from 'react';
import { dashboardService, schoolService } from '@/services/api';
import type { Student, Class } from '@/types';

export const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { showNotification, fetchNotifications } = useNotification();
  const { settings } = useSchool();
  const [stats, setStats] = useState<any>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, classesRes, studentsRes] = await Promise.all([
          dashboardService.getStats(),
          schoolService.getClasses(),
          schoolService.getStudents()
        ]);
        setStats(statsRes.data);
        setClasses(classesRes.data);
        setStudents(studentsRes.data);
        
        // Refresh notifications to pick up synced alerts
        fetchNotifications();
      } catch (error) {
        console.error('Failed to fetch stats', error);
        showNotification('Erreur lors du chargement des statistiques', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [showNotification]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    const getStudentsPerClass = (category: string) => {
      return classes
        .filter(c => c.category === category)
        .map(c => ({
          name: c.name,
          students: students.filter(s => s.classId === c.id).length,
          capacity: c.maxSize
        }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    };

    return {
      general: getStudentsPerClass('general'),
      technique: getStudentsPerClass('technique')
    };
  }, [classes, students]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'payment':
        navigate('/finances/payments');
        showNotification('Redirection vers les paiements', 'info');
        break;
      case 'student':
        navigate('/students');
        showNotification('Redirection vers les élèves', 'info');
        break;
      case 'expense':
        navigate('/finances/expenses');
        showNotification('Redirection vers les dépenses', 'info');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  const kpi = stats || {
    totalStudents: 0,
    totalClasses: 0,
    globalRecoveryRate: 0,
    generalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    activeAlerts: 0,
    pendingPayments: 0
  };
  const operations = stats?.recentOperations || [];
  const alerts = stats?.alerts || [];
  const genderStats = stats?.genderStats || { boys: 0, girls: 0 };

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
            Tableau de bord
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vue d'ensemble de l'établissement
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignSelf: { xs: 'flex-start', sm: 'auto' }, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
          <Button
            variant="contained"
            color="info"
            size="medium"
            startIcon={<AssessmentIcon />}
            onClick={() => navigate('/finances/summary')}
            sx={{ 
              borderRadius: 3, 
              textTransform: 'none', 
              fontWeight: 700,
              boxShadow: 'none',
              px: { xs: 2, sm: 3 },
            }}
          >
            {isMobile ? 'Bilan' : 'Consulter Bilan'}
          </Button>
          <Tooltip title="Nouveau paiement">
            <Fab
              size="small"
              color="primary"
              onClick={() => handleQuickAction('payment')}
            >
              <PaymentIcon />
            </Fab>
          </Tooltip>
          <Tooltip title="Nouvel élève">
            <Fab
              size="small"
              color="secondary"
              onClick={() => handleQuickAction('student')}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {/* 1. Total à Recouvrir (Amount + Progress Bar) */}
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <KPICard
            title="Total à Recouvrir"
            value={`${(kpi.totalExpected || 0).toLocaleString()} ${settings.currency_symbol}`}
            subtitle="Montant total attendu"
            icon={<AccountBalanceIcon />}
            color="#2196F3"
            progress={kpi.globalRecoveryRate || 0}
          />
        </Grid>

        {/* 2. Total Recouvré */}
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <KPICard
            title="Total Recouvré"
            value={`${(kpi.totalIncome || 0).toLocaleString()} ${settings.currency_symbol}`}
            subtitle="Paiements effectués"
            icon={<TrendingUpIcon />}
            color="#4CAF50"
            trend={{ value: 12.5, isPositive: true }}
            trendTextColor="common.black"
          />
        </Grid>

        {/* 3. Reste à Recouvrir */}
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <KPICard
            title="Reste à Recouvrir"
            value={`${(kpi.totalRemaining || 0).toLocaleString()} ${settings.currency_symbol}`}
            subtitle="Solde en attente"
            icon={<TrendingDownIcon />}
            color="#FF9800"
          />
        </Grid>

        {/* 4. Dépenses Totales */}
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <KPICard
            title="Dépenses Totales"
            value={`${(kpi.totalExpenses || 0).toLocaleString()} ${settings.currency_symbol}`}
            subtitle="Dépenses effectuées"
            icon={<ReceiptIcon />}
            color="#F44336"
          />
        </Grid>

        {/* 5. Total Élève */}
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <KPICard
            title="Total Élèves"
            value={kpi.totalStudents}
            subtitle={`${kpi.totalClasses} classes actives`}
            icon={<PeopleIcon />}
            color="#00BCD4"
            trend={{ value: 5.2, isPositive: true }}
            trendTextColor="common.black"
          />
        </Grid>

        {/* 6. Alerte Active */}
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <KPICard
            title="Alertes Actives"
            value={kpi.activeAlerts}
            subtitle={`${kpi.pendingPayments} paiements en attente`}
            icon={<WarningIcon />}
            color="#9C27B0"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* 7. Alerts */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Alertes
              </Typography>

              <List sx={{ p: 0 }}>
                {alerts.slice(0, 5).map((alert: any) => (
                  <ListItem
                    key={alert.id}
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: 2,
                      mb: 1,
                      backgroundColor: 'action.hover',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, width: '100%' }}>
                      <Chip
                        size="small"
                        label={alert.severity.toUpperCase()}
                        color={getAlertColor(alert.severity) as 'error' | 'warning' | 'info' | 'default'}
                        sx={{ fontSize: '0.625rem', height: 20 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(alert.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {alert.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {alert.description}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 8. Recent Operations */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Opérations Récentes
                </Typography>
                <IconButton size="small">
                  <NotificationsIcon />
                </IconButton>
              </Box>

              <List>
                {operations.map((op: any) => (
                  <ListItem
                    key={op.id}
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: 2,
                      mb: 1,
                      backgroundColor: 'action.hover',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${getOperationColor(op.type)}.light`, color: `${getOperationColor(op.type)}.dark` }}>
                        {getOperationIcon(op.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={op.description}
                      secondary={new Date(op.date).toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    />
                    {op.amount && (
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: op.type === 'payment' ? 'success.main' : 'error.main',
                        }}
                      >
                        {op.type === 'payment' ? '+' : '-'}{op.amount.toLocaleString()} {settings.currency_symbol}
                      </Typography>
                    )}
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Répartition par Genre
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 2 }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {genderStats.boys}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Garçons
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                    {genderStats.girls}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Filles
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Revenus Totaux
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary', mt: 2 }}>
                {(kpi.totalIncome || 0).toLocaleString()} {settings.currency_symbol}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cumulative
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Dépenses Totales
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main', mt: 2 }}>
                {(kpi.totalExpenses || 0).toLocaleString()} {settings.currency_symbol}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cumulative
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Education Distribution Charts */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Effectifs - Enseignement Général
              </Typography>
              <Box sx={{ height: 350, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.general} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        borderRadius: 12, 
                        border: 'none', 
                        boxShadow: theme.shadows[3],
                        backgroundColor: theme.palette.background.paper
                      }}
                    />
                    <Bar dataKey="students" name="Nombre d'élèves" radius={[4, 4, 0, 0]}>
                      {chartData.general.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={theme.palette.primary.main} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Effectifs - Enseignement Technique
              </Typography>
              <Box sx={{ height: 350, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.technique} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        borderRadius: 12, 
                        border: 'none', 
                        boxShadow: theme.shadows[3],
                        backgroundColor: theme.palette.background.paper
                      }}
                    />
                    <Bar dataKey="students" name="Nombre d'élèves" radius={[4, 4, 0, 0]}>
                      {chartData.technique.map((_entry, index) => (
                        <Cell key={`cell-tech-${index}`} fill="#E91E63" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
