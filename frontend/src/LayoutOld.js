import React from 'react';
import {
  Box,
  CssBaseline,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
  TableChart,
  Assessment,
  TrendingUp,
  Menu as MenuIcon,
  Logout,
  Science,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f4f5fa',
      paper: '#ffffff',
    },
  },
});

const ThorsLogo = () => (
  <svg width="120" height="40" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="thorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#1976d2' }} />
        <stop offset="100%" style={{ stopColor: '#2196f3' }} />
      </linearGradient>
    </defs>

    <g stroke="url(#thorGrad)" strokeWidth="1" fill="none" opacity="0.3">
      <line x1="10" y1="15" x2="25" y2="15" />
      <line x1="15" y1="10" x2="15" y2="20" />
      <circle cx="20" cy="15" r="3" />
      <line x1="25" y1="15" x2="30" y2="15" />
    </g>

    <text
      x="37"
      y="25"
      fontFamily="Arial, sans-serif"
      fontSize="18"
      fontWeight="bold"
      fill="url(#thorGrad)"
    >
      THORS
    </text>

    <g stroke="url(#thorGrad)" strokeWidth="1" fill="none" opacity="0.3">
      <line x1="95" y1="25" x2="110" y2="25" />
      <line x1="105" y1="20" x2="105" y2="30" />
      <circle cx="100" cy="25" r="3" />
      <line x1="85" y1="25" x2="95" y2="25" />
    </g>
  </svg>
);

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Testes', icon: <Science />, path: '/testes-loja-menu' },
];

const dataTables = [
  { text: 'Cadastro de Usuários', path: '/cadastro-usuarios' },
  { text: 'Clientes', path: '/clientes' },
  { text: 'Contratos', path: '/contratos' },
  { text: 'Despesas', path: '/despesas' },
  { text: 'Fornecedores', path: '/fornecedores' },
  { text: 'Orçamento de Obra', path: '/orcamento-obra' },
  { text: 'Resumo Mensal', path: '/resumo-mensal' },
  { text: 'Valor Materiais', path: '/valor-materiais' },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <ThorsLogo />
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, ml: 2 }}>
              Sistema de Gestão de Obras
            </Typography>
            <Button color="inherit" onClick={() => navigate('/login')} startIcon={<Logout />}>
              Sair
            </Button>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: 'border-box',
              bgcolor: '#ffffff',
              borderRight: '1px solid #e0e0e0',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {menuItems.map((item) => (
                <ListItem
                  button
                  key={item.text}
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: '#e3f2fd',
                      '&:hover': {
                        backgroundColor: '#e3f2fd',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: '#1976d2' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Typography
              variant="subtitle2"
              sx={{ pl: 2, pt: 1, color: '#666', fontWeight: 'bold' }}
            >
              Dados
            </Typography>
            <List>
              {dataTables.map((item) => (
                <ListItem
                  button
                  key={item.text}
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: '#e3f2fd',
                      '&:hover': {
                        backgroundColor: '#e3f2fd',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: '#1976d2' }}>
                    <TableChart />
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, bgcolor: '#f4f5fa', p: 3, minHeight: '100vh' }}>
          <Toolbar />
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
