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
  Science,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Configuração do tema - apenas tema claro
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
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
  });

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      route: '/',
      active: location.pathname === '/' || location.pathname === '/dashboard',
    },
    { text: 'Testes', icon: <Science />, route: '/testes-loja-menu' },
    { text: 'Relatórios', icon: <Assessment />, route: '/relatorios' },
    { text: 'Análises', icon: <TrendingUp />, route: '/analises' },
  ];

  const dataMenuItems = [
    { text: 'Cadastro de Usuários', icon: <People />, route: '/cadastro-usuarios' },
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
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/backup/download`
      );
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
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/backup/create`,
        {
          method: 'POST',
        }
      );
      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Backup interno criado com sucesso!',
          severity: 'success',
        });
      } else {
        setSnackbar({ open: true, message: 'Erro ao criar backup interno', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao conectar com o servidor', severity: 'error' });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />

        {/* AppBar */}
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <img
                src="/images/thors-logo.svg"
                alt="THORS Logo"
                style={{
                  height: '40px',
                  marginRight: '12px',
                  objectFit: 'contain',
                }}
              />
              <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
                Gestão de Obras
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto', p: 2 }}>
            {/* Menu Principal */}
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                  <Button
                    fullWidth
                    startIcon={item.icon}
                    onClick={() => item.route && navigate(item.route)}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      borderRadius: 2,
                      py: 1.5,
                      color: item.active ? 'primary.main' : 'text.primary',
                      backgroundColor: item.active ? 'action.selected' : 'transparent',
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
            <Typography
              variant="subtitle2"
              sx={{ px: 2, mb: 1, color: 'text.secondary', fontWeight: 600 }}
            >
              Tabelas de Dados
            </Typography>
            <List>
              {dataMenuItems.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <Button
                    fullWidth
                    startIcon={item.icon}
                    onClick={() => navigate(item.route)}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      borderRadius: 2,
                      py: 1,
                      color: location.pathname === item.route ? 'primary.main' : 'text.primary',
                      backgroundColor:
                        location.pathname === item.route ? 'action.selected' : 'transparent',
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
            <Typography
              variant="subtitle2"
              sx={{ px: 2, mb: 1, color: 'text.secondary', fontWeight: 600 }}
            >
              Sistema
            </Typography>
            <Box sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
                <Backup sx={{ fontSize: 16, mr: 1 }} />
                Backup do Sistema
              </Typography>
              <Button
                fullWidth
                size="small"
                startIcon={<Download />}
                onClick={handleDownloadBackup}
                sx={{ mb: 1, textTransform: 'none' }}
                variant="outlined"
              >
                Baixar Backup
              </Button>
              <Button
                fullWidth
                size="small"
                startIcon={<Save />}
                onClick={handleCreateInternalBackup}
                sx={{ textTransform: 'none' }}
                variant="text"
              >
                Backup Interno
              </Button>
            </Box>
          </Box>
        </Drawer>

        {/* Conteúdo Principal */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          {children}
        </Box>

        {/* Snackbar para notificações */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
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
