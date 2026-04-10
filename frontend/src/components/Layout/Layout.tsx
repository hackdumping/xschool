import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  InputBase,
  useTheme,
  useMediaQuery,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Popover,
  CircularProgress,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  alpha,
} from '@mui/material';
import type { PaletteMode } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Grade as GradeIcon,
  AccountBalance as AccountBalanceIcon,
  CalendarMonth as CalendarIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  DoneAll as DoneAllIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/contexts/SchoolContext';
import { useNotification } from '@/contexts/NotificationContext';

interface LayoutProps {
  children: React.ReactNode;
  toggleTheme: () => void;
  currentMode: PaletteMode;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: { label: string; path: string; icon: React.ReactNode }[];
}

const navItems: NavItem[] = [
  { label: 'Tableau de bord', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Élèves', icon: <PeopleIcon />, path: '/students' },
  { label: 'Classes', icon: <SchoolIcon />, path: '/classes' },
  { label: 'Notes', icon: <GradeIcon />, path: '/grades' },
  {
    label: 'Finances',
    icon: <AccountBalanceIcon />,
    children: [
      { label: 'Paiements', path: '/finances/payments', icon: <PaymentIcon /> },
      { label: 'Dépenses', path: '/finances/expenses', icon: <ReceiptIcon /> },
      { label: 'Bilan', path: '/finances/summary', icon: <AssessmentIcon /> },
    ],
  },
  { label: 'Agenda', icon: <CalendarIcon />, path: '/agenda' },
  { label: 'Paramètres', icon: <SettingsIcon />, path: '/settings' },
];

const DRAWER_WIDTH = 280;

export const Layout: React.FC<LayoutProps> = ({ children, toggleTheme, currentMode }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { settings } = useSchool();
  const { showNotification } = useNotification();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Finances']);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading: loadingNotifications
  } = useNotification();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    setAnchorEl(null);
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    logout();
    localStorage.removeItem('token');
    navigate('/login');
    showNotification('Déconnexion réussie', 'success');
    setLogoutDialogOpen(false);
  };

  const handleExpandClick = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      showNotification(`Recherche: ${searchQuery}`, 'info');
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: NavItem) => {
    if (item.path) return isActive(item.path);
    return item.children?.some(child => isActive(child.path)) || false;
  };

  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    }}>
      {/* Spacer for AppBar when clipped/under (Desktop) */}
      <Toolbar sx={{ display: { xs: 'none', md: 'flex' } }} />

      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 3,
            backgroundColor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SchoolIcon sx={{ color: 'primary.contrastText' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
          {settings.name ? settings.name.split(' ')[0] : 'XSCHOOL'}
        </Typography>
      </Box>

      <Divider sx={{ mx: 2 }} />

      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {navItems
          .filter(item => item.label !== 'Paramètres' || user?.role === 'admin')
          .map((item) => (
            <React.Fragment key={item.label}>
              {item.children ? (
                <>
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => handleExpandClick(item.label)}
                      selected={isParentActive(item)}
                      sx={{
                        borderRadius: 3,
                        '&.Mui-selected': {
                          backgroundColor: 'primary.container',
                          color: 'primary.main',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isParentActive(item) ? 'primary.main' : 'inherit',
                          minWidth: 40,
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.label} />
                      {expandedItems.includes(item.label) ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                  </ListItem>
                  {expandedItems.includes(item.label) && (
                    <List component="div" disablePadding sx={{ pl: 4 }}>
                      {item.children.map((child) => (
                        <ListItem key={child.path} disablePadding sx={{ mb: 0.5 }}>
                          <ListItemButton
                            onClick={() => {
                              navigate(child.path);
                              if (isMobile) setMobileOpen(false);
                            }}
                            selected={isActive(child.path)}
                            sx={{
                              borderRadius: 3,
                              '&.Mui-selected': {
                                backgroundColor: 'primary.container',
                                color: 'primary.main',
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>{child.icon}</ListItemIcon>
                            <ListItemText primary={child.label} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </>
              ) : (
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => {
                      navigate(item.path!);
                      if (isMobile) setMobileOpen(false);
                    }}
                    selected={isActive(item.path!)}
                    sx={{
                      borderRadius: 3,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.container',
                        color: 'primary.main',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive(item.path!) ? 'primary.main' : 'inherit',
                        minWidth: 40,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              )}
            </React.Fragment>
          ))}
      </List>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', fontWeight: 600 }}>
          {settings.name} v1.0
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
          © 2024 Tous droits réservés
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', pb: isMobile ? 8 : 0 }}>
      <AppBar
        position="fixed"
        className="no-print"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: alpha(theme.palette.background.default, 0.8),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary',
          zIndex: { md: (theme) => theme.zIndex.drawer + 1, xs: (theme) => theme.zIndex.appBar },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            {!isMobile && (
              <Box
                component="form"
                onSubmit={handleSearch}
                sx={{
                  flex: 1,
                  maxWidth: 300,
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'action.hover',
                  borderRadius: 3,
                  px: 2,
                  py: 0.5,
                }}
              >
                <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                <InputBase
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ flex: 1 }}
                />
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={currentMode === 'light' ? 'Mode sombre' : 'Mode clair'}>
              <IconButton onClick={toggleTheme} color="inherit">
                {currentMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <IconButton color="inherit" onClick={handleNotificationOpen}>
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Popover
              open={Boolean(notificationAnchor)}
              anchorEl={notificationAnchor}
              onClose={handleNotificationClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              PaperProps={{
                sx: {
                  width: { xs: '100vw', sm: 360 },
                  maxHeight: 500,
                  borderRadius: 3,
                  mt: 1.5,
                  boxShadow: theme.shadows[10],
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }
              }}
            >
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.neutral' }}>
                <Typography variant="subtitle1" fontWeight={800}>Notifications</Typography>
                {unreadCount > 0 && (
                  <Button size="small" startIcon={<DoneAllIcon />} onClick={markAllAsRead}>
                    Tout lire
                  </Button>
                )}
              </Box>
              <Divider />
              <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
                {loadingNotifications && notifications.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : notifications.length === 0 ? (
                  <Box sx={{ py: 6, px: 2, textAlign: 'center' }}>
                    <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1, opacity: 0.5 }} />
                    <Typography color="text.secondary">Aucune notification</Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {notifications.map((notification) => (
                      <ListItem
                        key={notification.id}
                        disablePadding
                        sx={{
                          bgcolor: notification.is_read ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                          '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.5) }
                        }}
                      >
                        <ListItemButton
                          onClick={() => {
                            if (!notification.is_read) markAsRead(notification.id);
                          }}
                          sx={{ py: 1.5 }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {notification.type === 'success' ? <SuccessIcon color="success" fontSize="small" /> :
                              notification.type === 'error' ? <ErrorIcon color="error" fontSize="small" /> :
                                <InfoIcon color="primary" fontSize="small" />}
                          </ListItemIcon>
                          <ListItemText
                            primary={notification.title}
                            secondary={
                              <>
                                <Typography variant="caption" display="block" color="text.primary" sx={{ mb: 0.5 }}>
                                  {notification.message}
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                  {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Typography>
                              </>
                            }
                            primaryTypographyProps={{
                              variant: 'body2',
                              fontWeight: notification.is_read ? 600 : 800,
                              sx: { color: notification.is_read ? 'text.secondary' : 'text.primary' }
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Popover>

            <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0, ml: 1 }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 32,
                  height: 32,
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {user?.username}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Mon Profil
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Déconnexion
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" className="no-print" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          className="no-print"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          className="no-print"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundImage: 'none',
              bgcolor: 'background.default',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flex: 1,
          p: { xs: 2, sm: 3 },
          pt: { xs: 10, sm: 11, md: 12 },
          backgroundColor: 'background.default',
          minHeight: '100vh',
          width: '100%',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>

      {isMobile && (
        <Paper
          className="no-print"
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar + 1
          }}
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={location.pathname}
            onChange={(_, newValue) => navigate(newValue)}
            sx={{ height: 64 }}
          >
            <BottomNavigationAction label="Stats" value="/dashboard" icon={<DashboardIcon />} />
            <BottomNavigationAction label="Élèves" value="/students" icon={<PeopleIcon />} />
            <BottomNavigationAction label="Finances" value="/finances/payments" icon={<AccountBalanceIcon />} />
            <BottomNavigationAction label="Agenda" value="/agenda" icon={<CalendarIcon />} />
          </BottomNavigation>
        </Paper>
      )}

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 1 }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', pb: 0 }}>
          <Box 
            sx={{ 
              width: 64, 
              height: 64, 
              borderRadius: '50%', 
              bgcolor: alpha(theme.palette.primary.main, 0.1), 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              color: 'primary.main'
            }}
          >
            <LogoutIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h6" fontWeight={800} gutterBottom>
            Prêt à partir ?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Souhaitez-vous vraiment vous déconnecter de votre session actuelle ?
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
            onClick={confirmLogout} 
            color="primary" 
            variant="contained"
            fullWidth={isMobile}
            sx={{ 
              borderRadius: 3,
              px: 4,
              py: 1,
              fontWeight: 700,
              boxShadow: 'none'
            }}
          >
            Se déconnecter
          </Button>
          <Button 
            onClick={() => setLogoutDialogOpen(false)} 
            variant="outlined"
            color="inherit"
            fullWidth={isMobile}
            sx={{ 
              borderRadius: 3,
              px: 3,
              borderColor: 'divider',
              fontWeight: 600
            }}
          >
            Annuler
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
