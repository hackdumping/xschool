import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  LinearProgress,
  useTheme,
  alpha,
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
  Chip
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  MonetizationOn as MoneyIcon,
  EmojiEvents as StudentsIcon,
  Sync as SyncIcon,
  Computer as PcIcon,
  Search as SearchIcon,
  ShowChart as GrowthIcon,
  TrendingUp as TrendingUpIcon,
  Memory as RamIcon,
  Storage as DbIcon,
  NotificationsActive as AlertIcon,
  ArrowForwardIos as ArrowRightIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as SuccessCircleIcon,
  ErrorOutline as ErrorIcon,
  OpenInNew as LaunchIcon,
  Person as PersonIcon,
  AccountBalanceWallet as WalletIcon,
  Lock as LockIcon,
  Work as WorkIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../../services/api';

const PremiumCard = ({ children, sx = {}, ...props }: any) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        border: 'none',
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : '#ffffff',
        backdropFilter: 'blur(20px)',
        boxShadow: isDark 
          ? '0 10px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 10px 40px -10px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isDark 
            ? '0 20px 40px -10px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)'
            : '0 20px 40px -10px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.05)',
        },
        ...sx
      }}
      {...props}
    >
      {children}
    </Paper>
  );
};

const DotStatus = ({ active }: { active: boolean }) => {
  const theme = useTheme();
  const color = active ? theme.palette.success.main : theme.palette.error.main;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ 
        width: 8, height: 8, borderRadius: '50%', bgcolor: color,
        boxShadow: `0 0 8px ${alpha(color, 0.6)}`
      }} />
      <Typography variant="body2" fontWeight={700} color={active ? 'text.primary' : 'text.disabled'}>
        {active ? 'Actif' : 'Inactif'}
      </Typography>
    </Box>
  );
};

const SuperDashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { tab = 'dashboard' } = useParams<{ tab?: string }>();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const fetchGlobalStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/monitor/');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching global stats', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeControl = (schoolId: string) => {
    localStorage.setItem('selectedTenantId', schoolId);
    window.location.href = '/dashboard';
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', pt: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  const kpis = data?.kpis || {};
  const schools = data?.schools || [];
  const globalUsers = data?.globalUsers || [];
  const alerts = data?.alerts || [];
  const recentActivity = data?.recentActivity || [];
  const marketShare = data?.marketShare || [];
  const health = data?.systemHealth || {};

  const PIE_COLORS = [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.info.main, theme.palette.success.main, theme.palette.warning.main];

  const kpiCards = [
    { title: 'Revenus Totaux', value: `${kpis.totalRevenue?.toLocaleString()}`, symbol: 'FCFA', color: theme.palette.primary.main, icon: <MoneyIcon />, sub: `+${kpis.growthRevenue}% (30 jours)` },
    { title: 'Caisse Journalière', value: `${(kpis.dailyPayments || 0).toLocaleString()}`, symbol: 'FCFA', color: theme.palette.secondary.main, icon: <WalletIcon />, sub: 'Transferts live (Aujourd\'hui)' },
    { title: 'Établissements', value: kpis.totalSchools, symbol: '', color: theme.palette.info.main, icon: <SchoolIcon />, sub: `${kpis.newSchools30d} nouveau(x)` },
    { title: 'Professeurs', value: kpis.totalTeachers || 0, symbol: '', color: theme.palette.primary.light, icon: <WorkIcon />, sub: 'Staff Académique' },
    { title: 'Élèves Globaux', value: kpis.totalStudents, symbol: '', color: theme.palette.warning.main, icon: <StudentsIcon />, sub: `ARPU: ${kpis.arpu} F` },
    { title: 'Comptes Actifs', value: kpis.totalUsers, symbol: '', color: theme.palette.success.main, icon: <PeopleIcon />, sub: 'Utilisateurs SaaS' },
    { title: 'Engagement (48h)', value: kpis.recentLogins || 0, symbol: '', color: theme.palette.info.light, icon: <LoginIcon />, sub: 'Connexions récentes' },
    { title: 'Menaces Bloquées', value: kpis.lockedAccounts || 0, symbol: '', color: theme.palette.error.main, icon: <LockIcon />, sub: 'Force-Brute annulée' },
  ];

  const renderHeader = (title: string, subtitle: string) => (
    <Box sx={{ 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3, mb: 6,
      pb: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
    }}>
      <Box>
        <Typography variant="h3" fontWeight={900} sx={{ 
          mb: 1, letterSpacing: '-1px',
          background: `linear-gradient(135deg, ${theme.palette.text.primary} 30%, ${alpha(theme.palette.text.primary, 0.6)} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" fontWeight={500}>
          {subtitle}
        </Typography>
      </Box>
      <Button 
        variant="contained" 
        onClick={fetchGlobalStats}
        sx={{ 
          borderRadius: 4, fontWeight: 800, px: 3, py: 1.5,
          boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
          '&:hover': { boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.4)}` }
        }}
      >
        <SyncIcon sx={{ mr: 1 }} /> Actualiser
      </Button>
    </Box>
  );

  const renderDashboardTab = () => (
    <>
      {renderHeader('Aperçu Global', 'Télémétrie en temps réel et performances multi-tenant')}
      
      {/* High-End KPI Row (Massive Matrix) */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {kpiCards.map((card, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <PremiumCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={800} textTransform="uppercase" sx={{ letterSpacing: 1 }}>
                    {card.title}
                  </Typography>
                  <Avatar sx={{ 
                    bgcolor: 'transparent',
                    color: card.color,
                    width: 38, height: 38,
                    border: `2px solid ${alpha(card.color, 0.2)}`
                  }}>
                    {card.icon}
                  </Avatar>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                  <Typography variant="h4" fontWeight={900} color="text.primary" sx={{ letterSpacing: '-1.2px' }}>
                    {card.value}
                  </Typography>
                  {card.symbol && <Typography variant="subtitle1" fontWeight={700} color="text.secondary">{card.symbol}</Typography>}
                </Box>
                <Chip size="small" label={card.sub} sx={{ bgcolor: alpha(card.color, 0.1), color: card.color, fontWeight: 800, borderRadius: 2 }} />
              </CardContent>
            </PremiumCard>
          </Grid>
        ))}
      </Grid>
      
      {/* Advanced Market Share & Feed */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 7 }}>
           <PremiumCard sx={{ p: { xs: 3, md: 4 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h6" fontWeight={900} color="text.primary">
                  Allocation du Revenu
                </Typography>
                <IconButton size="small"><MoreVertIcon /></IconButton>
              </Box>
              <Box sx={{ flexGrow: 1, minHeight: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {marketShare.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={marketShare}
                        innerRadius={90}
                        outerRadius={140}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={8}
                      >
                        {marketShare.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        formatter={(value: number) => `${value.toLocaleString()} FCFA`}
                        contentStyle={{ borderRadius: 16, border: 'none', boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.9)' : '0 10px 30px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontWeight: 800 }}
                      />
                      <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontWeight: 600, fontSize: '0.85rem' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="subtitle1" color="text.disabled" fontWeight={700}>Aucune donnée financière</Typography>
                )}
              </Box>
           </PremiumCard>
        </Grid>
        
        <Grid size={{ xs: 12, md: 5 }}>
           <PremiumCard sx={{ p: { xs: 3, md: 4 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h6" fontWeight={900} color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main', boxShadow: `0 0 10px ${theme.palette.primary.main}` }} />
                  Flux Inter-Système
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, flexGrow: 1 }}>
                {recentActivity.map((activity: any, idx: number) => (
                  <Box key={idx} sx={{ display: 'flex', position: 'relative', pb: 4, '&:hover .feed-card': { bgcolor: alpha(theme.palette.text.primary, 0.02) } }}>
                    {idx !== recentActivity.length - 1 && (
                      <Box sx={{ position: 'absolute', left: 24, top: 48, bottom: 0, width: '2px', bgcolor: alpha(theme.palette.divider, 0.5), borderRadius: 1 }} />
                    )}
                    <Avatar sx={{ 
                      bgcolor: activity.type === 'payment' ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.info.main, 0.1),
                      color: activity.type === 'payment' ? theme.palette.success.main : theme.palette.info.main,
                      width: 48, height: 48, mr: 3, zIndex: 1,
                      border: `4px solid ${isDark ? theme.palette.background.paper : '#ffffff'}`
                    }}>
                      {activity.type === 'payment' ? <MoneyIcon /> : <PersonIcon />}
                    </Avatar>
                    <Box className="feed-card" sx={{ flexGrow: 1, p: 2, borderRadius: 3, transition: 'background-color 0.2s', mt: -1 }}>
                      <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                        {activity.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1, leading: 1.4 }}>
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ display: 'block' }}>
                        {format(parseISO(activity.date), "dd MMM yyyy, HH:mm", { locale: fr })}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
           </PremiumCard>
        </Grid>
      </Grid>
    </>
  );

  const filteredUsers = globalUsers.filter((u:any) => 
    u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    u.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.school.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const renderUsersTab = () => (
    <>
      {renderHeader('Annuaire Collaboratif Global', 'Supervision croisée de tous les profils utilisateurs du réseau SaaS')}
      
      <PremiumCard sx={{ pb: 2 }}>
        <Box sx={{ p: { xs: 3, md: 4 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}>
          <TextField
            placeholder="Chercher (Nom, École, Rôle)..."
            variant="outlined"
            value={userSearchTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
             sx={{ 
                width: { xs: '100%', md: 400 },
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 8, 
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                  '& fieldset': { border: 'none' }
                } 
             }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="primary" /></InputAdornment> }}
          />
          <Box>
             <Chip icon={<LockIcon />} label={`${kpis.lockedAccounts} Verrouillages Sécurité`} color={kpis.lockedAccounts > 0 ? "error" : "success"} variant="outlined" sx={{ fontWeight: 800, borderRadius: 2 }} />
          </Box>
        </Box>

        <TableContainer sx={{ px: { xs: 1, md: 2 } }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ borderBottom: 'none', color: 'text.secondary', fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1 }}>IDENTIFIANT SAAS</TableCell>
                <TableCell sx={{ borderBottom: 'none', color: 'text.secondary', fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1 }}>RÔLE APPLICATIF</TableCell>
                <TableCell sx={{ borderBottom: 'none', color: 'text.secondary', fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1 }}>RATTACHEMENT (TENANT)</TableCell>
                <TableCell sx={{ borderBottom: 'none', color: 'text.secondary', fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1 }}>DERNIÈRE CONNEXION</TableCell>
                <TableCell sx={{ borderBottom: 'none', color: 'text.secondary', fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1 }}>SÉCURITÉ INFRA</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((u: any) => (
                <TableRow key={u.id} sx={{ 
                  '& td': { borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`, py: 2.5 },
                  '&:last-child td': { borderBottom: 'none' } 
                }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>
                        {u.username.charAt(0).toUpperCase()}
                      </Box>
                      <Box>
                         <Typography fontWeight={800} color="text.primary">{u.full_name}</Typography>
                         <Typography variant="caption" color="text.disabled" fontWeight={700}>@{u.username}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={u.role} size="small" sx={{ fontWeight: 800, borderRadius: 1.5, bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }} />
                  </TableCell>
                  <TableCell>
                     <Typography fontWeight={900} color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon fontSize="small" sx={{ color: 'text.disabled' }}/> {u.school}
                     </Typography>
                  </TableCell>
                  <TableCell>
                     <Typography fontWeight={700} color="text.secondary">{u.last_login}</Typography>
                  </TableCell>
                  <TableCell>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: u.is_locked ? 'error.main' : 'success.main' }} />
                      <Typography variant="body2" fontWeight={700} color={u.is_locked ? 'error.main' : 'success.main'}>
                        {u.is_locked ? 'Locked (Auth Failures)' : 'Approuvé'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PremiumCard>
    </>
  );

  const filteredSchools = schools.filter((s:any) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.owner.toLowerCase().includes(searchTerm.toLowerCase()));

  const renderSchoolsTab = () => (
    <>
      {renderHeader('Réseau d\'Établissements', 'Gestion de flotte, annuaire réseau et impersonnalisation profonde')}
      
      <PremiumCard sx={{ pb: 2 }}>
        <Box sx={{ p: { xs: 3, md: 4 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}>
          <TextField
            placeholder="Rechercher (Nom ou Principal)..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
             sx={{ 
                width: { xs: '100%', md: 350 },
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 8, 
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                  '& fieldset': { border: 'none' }
                } 
             }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="primary" /></InputAdornment> }}
          />
        </Box>

        <TableContainer sx={{ px: { xs: 1, md: 2 } }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ borderBottom: 'none', color: 'text.secondary', fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1 }}>SOCIÉTÉ</TableCell>
                <TableCell sx={{ borderBottom: 'none', color: 'text.secondary', fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1 }}>PROPRIÉTAIRE</TableCell>
                <TableCell sx={{ borderBottom: 'none', color: 'text.secondary', fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1 }}>VOLUME</TableCell>
                <TableCell sx={{ borderBottom: 'none', color: 'text.secondary', fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1 }}>CA GÉRÉ</TableCell>
                <TableCell sx={{ borderBottom: 'none', color: 'text.secondary', fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1 }}>ÉTAT RÉSEAU</TableCell>
                <TableCell align="right" sx={{ borderBottom: 'none', color: 'text.secondary', fontWeight: 800, fontSize: '0.75rem', letterSpacing: 1 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSchools.map((school: any) => (
                <TableRow key={school.id} sx={{ 
                  '& td': { borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`, py: 2.5 },
                  '&:last-child td': { borderBottom: 'none' } 
                }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>
                        {school.name.charAt(0)}
                      </Box>
                      <Box>
                         <Typography fontWeight={800} color="text.primary">{school.name}</Typography>
                         <Typography variant="caption" color="text.disabled" fontWeight={700}>Ins. {school.created_at}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700} color="text.secondary">{school.owner}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={800} color="text.primary">{school.students} <Typography component="span" variant="caption" color="text.disabled">apprenants</Typography></Typography>
                  </TableCell>
                  <TableCell>
                     <Typography fontWeight={900} color="text.primary">{school.revenue.toLocaleString()} <Typography component="span" variant="caption" color="text.primary">F</Typography></Typography>
                  </TableCell>
                  <TableCell>
                     <DotStatus active={school.status === 'active'} />
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      onClick={() => handleTakeControl(school.id)}
                      endIcon={<ArrowRightIcon fontSize="small" />}
                      sx={{ fontWeight: 800, borderRadius: 8, color: 'text.primary', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' } }}
                    >
                      Surveiller
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PremiumCard>
    </>
  );

  const renderPerformanceTab = () => (
    <>
      {renderHeader('Performances Financières', 'Analyse structurelle des flux et dynamique comptable annuelle')}
      
      <PremiumCard sx={{ p: { xs: 3, md: 5 }, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
          <Box>
             <Typography variant="h5" fontWeight={900} color="text.primary" sx={{ mb: 1 }}>Courbe de Liquidité (MRR)</Typography>
             <Typography variant="body2" color="text.secondary" fontWeight={600}>Consolidation sur les 12 derniers mois de fonctionnement.</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
             <Typography variant="h3" fontWeight={900} color="success.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                <TrendingUpIcon fontSize="large" /> {kpis.growthRevenue}%
             </Typography>
             <Typography variant="subtitle2" color="text.disabled" fontWeight={700}>Croissance Nette (M-1)</Typography>
          </Box>
        </Box>
        
        <Box sx={{ height: 450, width: '100%', ml: -2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.revenueHistory || []}>
              <defs>
                <linearGradient id="colorRevenueGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.6}/>
                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.disabled, fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.disabled, fontWeight: 700 }} dx={-10} />
              <ChartTooltip 
                cursor={{ stroke: alpha(theme.palette.divider, 0.5), strokeWidth: 2, strokeDasharray: '4 4' }}
                contentStyle={{ borderRadius: 16, backgroundColor: theme.palette.background.paper, border: 'none', color: theme.palette.text.primary, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}
                itemStyle={{ fontWeight: 900 }}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke={theme.palette.primary.main} 
                strokeWidth={5} 
                fillOpacity={1} 
                fill="url(#colorRevenueGlow)" 
                activeDot={{ r: 8, strokeWidth: 0, fill: theme.palette.primary.main, style: { filter: 'drop-shadow(0px 0px 8px rgba(0,0,0,0.4))' } }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </PremiumCard>

      <PremiumCard sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h5" fontWeight={900} color="text.primary" sx={{ mb: 6 }}>
          Volume Événementiel
        </Typography>
        <Box sx={{ height: 350, width: '100%', ml: -2 }}>
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.revenueHistory || []}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.disabled, fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.disabled, fontWeight: 700 }} dx={-10} />
               <ChartTooltip 
                cursor={{ fill: alpha(theme.palette.text.primary, 0.05) }}
                contentStyle={{ borderRadius: 16, backgroundColor: theme.palette.background.paper, border: 'none', color: theme.palette.text.primary, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}
                 itemStyle={{ fontWeight: 900 }}
              />
              <Bar dataKey="volume" fill={theme.palette.secondary.main} radius={[8, 8, 8, 8]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </PremiumCard>
    </>
  );

  const renderSystemTab = () => (
    <>
      {renderHeader('Moniteur d\'Infrastructure', "Télémétrie brute, audits de latence et alertes système profonds")}
      
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <PremiumCard sx={{ p: 4, height: '100%' }}>
             <Typography variant="h6" fontWeight={900} color="text.primary" sx={{ mb: 5 }}>
              Hardware Load
            </Typography>
            
            <Box sx={{ mb: 5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                 <Typography variant="subtitle2" color="text.secondary" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><PcIcon color="primary" /> CPU Central</Typography>
                 <Typography variant="h6" fontWeight={900}>{health.cpu_load}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={health.cpu_load} sx={{ height: 12, borderRadius: 6, bgcolor: alpha(theme.palette.primary.main, 0.1) }} color={health.cpu_load > 80 ? 'error' : 'primary'} />
            </Box>

            <Box sx={{ mb: 5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                 <Typography variant="subtitle2" color="text.secondary" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><RamIcon color="secondary" /> Heap Space</Typography>
                 <Typography variant="h6" fontWeight={900}>{health.ram_load}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={health.ram_load} sx={{ height: 12, borderRadius: 6, bgcolor: alpha(theme.palette.secondary.main, 0.1) }} color={health.ram_load > 80 ? 'error' : 'secondary'} />
            </Box>

            <Box sx={{ mb: 6 }}>
               <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                 <Typography variant="subtitle2" color="text.secondary" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><DbIcon color="info" /> DB Latency</Typography>
                 <Typography variant="h6" fontWeight={900}>{health.db_latency}ms</Typography>
              </Box>
              <LinearProgress variant="determinate" value={health.db_latency} sx={{ height: 12, borderRadius: 6, bgcolor: alpha(theme.palette.info.main, 0.1) }} color="info" />
            </Box>

            <Box sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SuccessCircleIcon />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="success.main">SÉCURISÉ</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>Sync. Il y a 4h</Typography>
                </Box>
            </Box>
          </PremiumCard>
        </Grid>
        
        <Grid size={{ xs: 12, md: 8 }}>
          <PremiumCard sx={{ p: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h6" color="text.primary" fontWeight={900} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AlertIcon color="warning" /> Table d'Audit ({alerts.length})
                </Typography>
                <Chip size="small" label="Live View" color="error" variant="outlined" sx={{ fontWeight: 800 }} />
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {alerts.length === 0 ? (
                <Box sx={{ py: 10, textAlign: 'center', borderRadius: 4, border: `2px dashed ${alpha(theme.palette.divider, 0.5)}` }}>
                  <SuccessCircleIcon sx={{ fontSize: 60, color: theme.palette.success.light, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h5" color="text.secondary" fontWeight={800} sx={{ opacity: 0.5 }}>
                    Réseau 100% Sain
                  </Typography>
                </Box>
              ) : alerts.map((alert: any, idx: number) => {
                const isHigh = alert.severity === 'high';
                const color = isHigh ? theme.palette.error.main : theme.palette.warning.main;
                return (
                  <Box key={idx} sx={{ 
                    p: 4, borderRadius: 4, display: 'flex', alignItems: 'flex-start', gap: 3,
                    bgcolor: isDark ? alpha(color, 0.05) : '#ffffff',
                    border: `1px solid ${alpha(color, 0.2)}`,
                    boxShadow: `0 4px 12px ${alpha(color, 0.05)}`
                  }}>
                    <Avatar sx={{ bgcolor: color, color: '#fff', width: 40, height: 40 }}>!</Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={900} color={color} sx={{ mb: 0.5 }}>
                          {alert.type.toUpperCase()}
                        </Typography>
                        <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600, mb: 1 }}>
                          {alert.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          Cible d'Audit: {alert.school_id}
                        </Typography>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </PremiumCard>
        </Grid>
      </Grid>
    </>
  )

  const renderContent = () => {
    switch (tab) {
      case 'users': return renderUsersTab();
      case 'schools': return renderSchoolsTab();
      case 'performance': return renderPerformanceTab();
      case 'system': return renderSystemTab();
      case 'dashboard': default: return renderDashboardTab();
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 5 }, width: '100%', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {renderContent()}
    </Box>
  );
};

export default SuperDashboard;
