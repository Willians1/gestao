import React, { useState } from 'react';
import {
  Box,
  CssBaseline,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  Button,
  Divider,
  IconButton,
  ThemeProvider,
  createTheme,
  Alert,
  Snackbar,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People,
  Business,
  Assignment,
  AttachMoney,
  Store,
  Construction,
  CalendarMonth,
  Inventory,
  Backup,
  Download,
  Save,
  Menu as MenuIcon,
  Assessment,
  TrendingUp,
  AdminPanelSettings,
  Science
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { API_BASE } from './api';
import ApiStatusBadge from './components/ApiStatusBadge';

const drawerWidth = 280;

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Para detectar mobile/tablet
  const isDesktop = useMediaQuery('(min-width:900px)');
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Configuração do tema - apenas tema claro
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2', // Azul mais empresarial
      },
      background: {
        default: '#f8fafc',
        paper: '#ffffff',
      },
      text: {
        primary: '#1e293b',
        secondary: '#64748b',
      },
    },
    components: {
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            color: '#1e293b',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            borderBottom: '1px solid #e2e8f0',
          },
        },
      },
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
  });

  const { isAdmin, hasPermission } = useAuth();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, route: '/', active: location.pathname === '/' || location.pathname === '/dashboard' },
    { text: 'Financeiro', icon: <AttachMoney />, route: '/financeiro' },
    { text: 'Testes', icon: <Science />, route: '/testes-loja-menu' },
    { text: 'Relatórios', icon: <Assessment />, route: '/relatorios' },
    { text: 'Análises', icon: <TrendingUp />, route: '/analises' },
    { text: 'Administração', icon: <AdminPanelSettings />, route: '/admin', requiresAdmin: true },
  ];

  const dataMenuItems = [
    { text: 'Cadastro de Usuários', icon: <People />, route: '/cadastro-usuarios' },
    { text: 'Grupos de Usuários', icon: <AdminPanelSettings />, route: '/grupos-usuarios' },
    { text: 'Clientes', icon: <Business />, route: '/clientes' },
    { text: 'Contratos', icon: <Assignment />, route: '/contratos' },
    { text: 'Despesas', icon: <AttachMoney />, route: '/despesas' },
    { text: 'Fornecedores', icon: <Store />, route: '/fornecedores' },
    { text: 'Orçamento de Obra', icon: <Construction />, route: '/orcamento-obra' },
    { text: 'Resumo Mensal', icon: <CalendarMonth />, route: '/resumo-mensal' },
    { text: 'Valor Materiais', icon: <Inventory />, route: '/valor-materiais' },
  ];

  const handleDownloadBackup = async () => {
    try {
      const response = await fetch(`${API_BASE}/backup/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'backup_sistema.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        setSnackbar({ open: true, message: 'Backup baixado com sucesso!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Erro ao baixar backup', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao conectar com o servidor', severity: 'error' });
    }
  };

  const handleCreateInternalBackup = async () => {
    try {
      const response = await fetch(`${API_BASE}/backup/create`, {
        method: 'POST'
      });
      if (response.ok) {
        setSnackbar({ open: true, message: 'Backup interno criado com sucesso!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Erro ao criar backup interno', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao conectar com o servidor', severity: 'error' });
    }
  };

  const handleNavigation = (route) => {
    navigate(route);
    if (!isDesktop) {
      setMobileOpen(false);
    }
  };

  // Destacar item ativo: trata '/' como match exato e os demais por prefixo
  const isRouteActive = (itemRoute) => {
    if (itemRoute === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === itemRoute || location.pathname.startsWith(itemRoute + '/');
  };

  const DrawerContent = () => (
    <>
      <Toolbar />
      <Box sx={{ overflow: 'auto', p: { xs: 1, sm: 2 } }}>
        {/* Menu Principal */}
        <List>
    {menuItems.filter(i => !i.requiresAdmin || isAdmin?.()).map((item) => (
            <ListItem
              key={item.text}
              disablePadding
              sx={{ mb: 1 }}
            >
              <Button
                fullWidth
                startIcon={item.icon}
                onClick={() => item.route && handleNavigation(item.route)}
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  borderRadius: 2,
                  py: { xs: 1, sm: 1.5 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
      color: isRouteActive(item.route) ? 'primary.main' : 'text.primary',
      backgroundColor: isRouteActive(item.route) ? 'action.selected' : 'transparent',
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                {item.text}
              </Button>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Seção de Dados */}
        <Typography variant="subtitle2" sx={{ px: 2, mb: 1, color: 'text.secondary', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          Tabelas de Dados
        </Typography>
        <List>
    {dataMenuItems.filter(i => !i.requiresPermission || hasPermission?.(i.route)).map((item) => (
            <ListItem
              key={item.text}
              disablePadding
              sx={{ mb: 0.5 }}
            >
              <Button
                fullWidth
                startIcon={item.icon}
                onClick={() => handleNavigation(item.route)}
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  borderRadius: 2,
                  py: { xs: 0.75, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
      color: isRouteActive(item.route) ? 'primary.main' : 'text.primary',
      backgroundColor: isRouteActive(item.route) ? 'action.selected' : 'transparent',
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                {item.text}
              </Button>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Seção de Backup */}
        <Typography variant="subtitle2" sx={{ px: 2, mb: 1, color: 'text.secondary', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          Sistema
        </Typography>
        <Box sx={{ p: { xs: 1.5, sm: 2 }, backgroundColor: 'action.hover', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            <Backup sx={{ fontSize: { xs: 14, sm: 16 }, mr: 1 }} />
            Backup do Sistema
          </Typography>
          <Button
            fullWidth
            size="small"
            startIcon={<Download />}
            onClick={handleDownloadBackup}
            sx={{ 
              mb: 1, 
              textTransform: 'none',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              py: { xs: 0.5, sm: 0.75 }
            }}
            variant="outlined"
          >
            Baixar Backup
          </Button>
          <Button
            fullWidth
            size="small"
            startIcon={<Save />}
            onClick={handleCreateInternalBackup}
            sx={{ 
              textTransform: 'none',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              py: { xs: 0.5, sm: 0.75 }
            }}
            variant="text"
          >
            Backup Interno
          </Button>
        </Box>
      </Box>
    </>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        
        {/* AppBar Responsivo */}
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: theme.zIndex.drawer + 1,
            width: { sm: `calc(100% - ${isDesktop ? drawerWidth : 0}px)` },
            ml: { sm: isDesktop ? `${drawerWidth}px` : 0 }
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: isDesktop ? 'none' : 'block' } }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <img 
                src="/images/thors-logo.svg" 
                alt="THORS Logo" 
                style={{ 
                  height: '40px', 
                  marginRight: '12px',
                  objectFit: 'contain'
                }} 
              />
              <Typography variant="h6" noWrap component="div" sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}>
                Gestão de Obras
              </Typography>
            </Box>
              {/* Status da API na AppBar */}
              <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
                <ApiStatusBadge compact={true} />
              </Box>
          </Toolbar>
        </AppBar>

        {/* Drawer Responsivo */}
        <Box
          component="nav"
          sx={{ width: { md: isDesktop ? drawerWidth : 0 }, flexShrink: { md: 0 } }}
        >
          {/* Mobile/Tablet drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', md: isDesktop ? 'none' : 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: { xs: '85vw', sm: drawerWidth },
                maxWidth: drawerWidth
              },
            }}
          >
            <DrawerContent />
          </Drawer>
          
          {/* Desktop drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: isDesktop ? 'block' : 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            <DrawerContent />
          </Drawer>
        </Box>

        {/* Conteúdo Principal Responsivo */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 1, sm: 2, md: 3 },
            width: { sm: `calc(100% - ${isDesktop ? drawerWidth : 0}px)` },
            ml: { sm: isDesktop ? `${drawerWidth}px` : 0 },
            minHeight: '100vh'
          }}
        >
          <Toolbar />
          {children}
        </Box>

        {/* Snackbar para notificações */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
