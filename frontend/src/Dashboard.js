import React, { useState, useEffect } from 'react';
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
  Divider,
  Button,
  Grid,
  Paper,
  IconButton,
  Alert,
  Snackbar,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  ThemeProvider,
  createTheme,
  useMediaQuery
} from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
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
  Schedule,
  AccountBalance,
  Science
} from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import TestesModal from './components/TestesModal';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const drawerWidth = 280;

// Dados de exemplo para os gráficos
const activityData = [
  { name: '1 Mar', value: 45 },
  { name: '8 Mar', value: 68 },
  { name: '15 Mar', value: 52 },
  { name: '22 Mar', value: 89 },
  { name: '29 Mar', value: 45 },
];

const workData = [
  { name: 'Camille', value: 20, color: '#ff6b6b' },
  { name: 'Daniel', value: 15, color: '#4ecdc4' },
  { name: 'Jason', value: 10, color: '#45b7d1' },
  { name: 'Raissa', value: 5, color: '#f9ca24' },
  { name: 'William', value: 4, color: '#a55eea' },
];

const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#a55eea'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [mobileOpen, setMobileOpen] = useState(false);
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  // Opcional: usar helper centralizado quando disponível
  // import { API_BASE } from './api';
  // const API = API_BASE;
  // Testes de Loja (Gerador/AR) + Clientes
  const [clientes, setClientes] = useState([]);
  const [testesList, setTestesList] = useState([]); // Gerador
  const [testesArList, setTestesArList] = useState([]); // Ar Condicionado
  const [testesCount, setTestesCount] = useState(0);
  const [testesOkCount, setTestesOkCount] = useState(0);
  const [testesOffCount, setTestesOffCount] = useState(0);
  const [testesUrgent, setTestesUrgent] = useState(false);
  const [openTestesModal, setOpenTestesModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [openTestDetail, setOpenTestDetail] = useState(false);

  // Para detectar mobile/tablet
  const isDesktop = useMediaQuery('(min-width:900px)');
  const isMobile = useMediaQuery('(max-width:600px)');
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

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

  // Utilidades Testes
  const daysSince = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  };
  const getLatestBy = (list, predicate) => {
    if (!Array.isArray(list)) return null;
    const candidates = list.filter(predicate);
    if (!candidates.length) return null;
    candidates.sort((a, b) => new Date(b.data_teste || b.data || b.created_at || 0) - new Date(a.data_teste || a.data || a.created_at || 0));
    return candidates[0];
  };
  const getClienteNomeById = (id) => {
    const c = clientes.find((x) => Number(x.id) === Number(id));
    return c ? c.nome : `PEREQUE LOJA ${String(id || '').toString().padStart(2, '0')}`;
  };

  // Carregar clientes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API}/clientes/`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setClientes(Array.isArray(data) ? data : []);
      } catch { if (mounted) setClientes([]); }
    })();
    return () => { mounted = false; };
  }, [API]);

  // Carregar testes (Gerador e AR)
  const fetchBothTestes = React.useCallback(async () => {
    try {
      const [resGer, resAr] = await Promise.all([
        fetch(`${API}/testes-loja/`),
        fetch(`${API}/testes-ar-condicionado/`)
      ]);
      const [dataGer, dataAr] = await Promise.all([
        resGer.ok ? resGer.json() : Promise.resolve([]),
        resAr.ok ? resAr.json() : Promise.resolve([])
      ]);
      const listGer = Array.isArray(dataGer) ? dataGer : [];
      const listAr = Array.isArray(dataAr) ? dataAr : [];
  const countGer = listGer.length;
  const countAr = listAr.length;
  // Somatório simples: Gerador + AR (pode haver duplicidade dependendo do backend)
  const total = countGer + countAr;
  const offGer = listGer.filter(t => (t.status || '').toString().toUpperCase() === 'OFF').length;
  const offAr = listAr.filter(t => (t.status || '').toString().toUpperCase() === 'OFF').length;
  const off = offGer + offAr;
  const ok = Math.max(0, total - off);
  setTestesList(listGer);
  setTestesArList(listAr);
  setTestesCount(total);
  setTestesOffCount(off);
  setTestesOkCount(ok);
  setTestesUrgent(off > 0);
    } catch {
      setTestesList([]);
      setTestesArList([]);
      setTestesCount(0);
      setTestesOffCount(0);
      setTestesOkCount(0);
      setTestesUrgent(false);
    }
  }, [API]);

  useEffect(() => { fetchBothTestes(); }, [fetchBothTestes]);
  useEffect(() => { if (openTestesModal) fetchBothTestes(); }, [openTestesModal, fetchBothTestes]);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, route: '/', active: true },
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
  const response = await fetch(`${API}/backup/download`);
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
  const response = await fetch(`${API}/backup/create`, {
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

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        
        {/* AppBar responsiva */}
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: theme.zIndex.drawer + 1,
            width: { sm: isDesktop ? `calc(100% - ${drawerWidth}px)` : '100%' },
            ml: { sm: isDesktop ? `${drawerWidth}px` : 0 },
          }}
        >
          <Toolbar sx={{ 
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1, sm: 2, md: 3 }
          }}>
            {/* Menu button para mobile */}
            {!isDesktop && (
              <IconButton 
                edge="start" 
                color="inherit" 
                aria-label="menu" 
                sx={{ mr: 2 }}
                onClick={handleDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
            )}
            
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
              <Typography 
                variant="h6" 
                noWrap 
                component="div" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                {isMobile ? "Gestão Obras" : "Gestão de Obras"}
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Sidebar responsiva */}
        <Drawer
          variant={isDesktop ? "permanent" : "temporary"}
          open={isDesktop ? true : mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { 
              width: drawerWidth, 
              boxSizing: 'border-box',
              border: 'none'
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto', p: { xs: 1, sm: 2 } }}>
            {/* Menu Principal */}
            <List>
              {menuItems.map((item) => (
                <ListItem
                  key={item.text}
                  disablePadding
                  sx={{ mb: 1 }}
                >
                  <Button
                    fullWidth
                    startIcon={item.icon}
                    onClick={() => {
                      if (item.route) navigate(item.route);
                      if (!isDesktop) setMobileOpen(false);
                    }}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      borderRadius: 2,
                      py: { xs: 1, sm: 1.5 },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
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
              sx={{ 
                px: 2, 
                mb: 1, 
                color: 'text.secondary', 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              Tabelas de Dados
            </Typography>
            <List>
              {dataMenuItems.map((item) => (
                <ListItem
                  key={item.text}
                  disablePadding
                  sx={{ mb: 0.5 }}
                >
                  <Button
                    fullWidth
                    startIcon={item.icon}
                    onClick={() => {
                      navigate(item.route);
                      if (!isDesktop) setMobileOpen(false);
                    }}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      borderRadius: 2,
                      py: { xs: 0.75, sm: 1 },
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      color: 'text.primary',
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
              sx={{ 
                px: 2, 
                mb: 1, 
                color: 'text.secondary', 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              Sistema
            </Typography>
            <Box sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              backgroundColor: 'action.hover', 
              borderRadius: 2 
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 600,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                <Backup sx={{ fontSize: { xs: 14, sm: 16 }, mr: 1 }} />
                Backup do Sistema
              </Typography>
              <Button
                fullWidth
                size="small"
                startIcon={<Download sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                onClick={handleDownloadBackup}
                sx={{ 
                  mb: 1, 
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.8rem' }
                }}
                variant="outlined"
              >
                {isMobile ? "Baixar" : "Baixar Backup"}
              </Button>
              <Button
                fullWidth
                size="small"
                startIcon={<Save sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                onClick={handleCreateInternalBackup}
                sx={{ 
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.8rem' }
                }}
                variant="text"
              >
                {isMobile ? "Interno" : "Backup Interno"}
              </Button>
            </Box>
          </Box>
        </Drawer>

        {/* Conteúdo Principal Responsivo */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 1, sm: 2, md: 3 },
            width: { sm: isDesktop ? `calc(100% - ${drawerWidth}px)` : '100%' },
            ml: { sm: isDesktop ? `${drawerWidth}px` : 0 }
          }}
        >
          <Toolbar />
          
          {/* Header com estatísticas responsivas */}
          <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 2, md: 3 } }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography 
                        color="textSecondary" 
                        gutterBottom 
                        variant="overline" 
                        sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                      >
                        Horas Trabalhadas
                      </Typography>
                      <Typography 
                        variant="h4" 
                        component="div" 
                        sx={{ 
                          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                          fontWeight: 600
                        }}
                      >
                        35
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="textSecondary" 
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                      >
                        3:00 agendadas
                      </Typography>
                    </Box>
                    <Schedule sx={{ 
                      fontSize: { xs: 28, sm: 35, md: 40 }, 
                      color: 'primary.main' 
                    }} />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={65} 
                    sx={{ 
                      mt: { xs: 1.5, sm: 2 },
                      height: { xs: 4, sm: 6 }
                    }} 
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="overline" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        Não Faturável
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                        2.000 USD
                      </Typography>
                    </Box>
                    <AccountBalance sx={{ fontSize: { xs: 30, sm: 35, md: 40 }, color: 'warning.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="overline" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        Custo Total
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                        2.000 USD
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        0 USD custo por hora
                      </Typography>
                    </Box>
                    <AttachMoney sx={{ fontSize: { xs: 30, sm: 35, md: 40 }, color: 'success.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="overline" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        Taxa Horária
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
                        2.000 USD
                      </Typography>
                    </Box>
                    <TrendingUp sx={{ fontSize: { xs: 30, sm: 35, md: 40 }, color: 'info.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            {/* Card: Testes de Loja (estilo harmonizado) */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => setOpenTestesModal(true)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderRadius: 3,
                  boxShadow: '0 8px 24px rgba(6,182,212,0.15)',
                  '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 16px 40px rgba(6,182,212,0.18)' }
                }}
              >
                <CardContent sx={{ p: 2, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: '#06b6d4', mb: 1, boxShadow: '0 8px 24px #06b6d440' }}>
                    <Science sx={{ fontSize: 28, color: 'white' }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Testes de Loja</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                    <Chip size="small" label={`Total: ${testesCount}`} color="primary" />
                    <Chip size="small" label={`OK: ${testesOkCount}`} color="success" />
                    <Chip size="small" label={`OFF: ${testesOffCount}`} color="error" />
                    {testesUrgent && <Chip size="small" label="URGENTE" color="error" />}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Gráficos */}
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {/* Gráfico de Atividade */}
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 2,
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 0 }
                  }}>
                    <Typography variant="h6" component="div" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      Atividade
                    </Typography>
                    <Button size="small" variant="outlined" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Mês
                    </Button>
                  </Box>
                  <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                    <BarChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Lista de Colaboradores */}
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" component="div" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Horas por Colaborador
                  </Typography>
                  {workData.map((person, index) => (
                    <Box key={person.name} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: person.color, 
                        mr: 2, 
                        width: { xs: 28, sm: 32 }, 
                        height: { xs: 28, sm: 32 },
                        fontSize: { xs: '0.8rem', sm: '1rem' }
                      }}>
                        {person.name[0]}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                          {person.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                          {person.value}:00
                        </Typography>
                      </Box>
                      <Chip
                        label={`${person.value}h`}
                        size="small"
                        sx={{ 
                          bgcolor: person.color, 
                          color: 'white',
                          fontSize: { xs: '0.65rem', sm: '0.75rem' }
                        }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Seção de Colaboradores Detalhada */}
          <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mt: 2 }}>
            {workData.map((person) => (
              <Grid item xs={12} sm={6} lg={4} key={person.name}>
                <Card>
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: person.color, 
                        mr: 2,
                        width: { xs: 32, sm: 40 },
                        height: { xs: 32, sm: 40 },
                        fontSize: { xs: '0.9rem', sm: '1.25rem' }
                      }}>
                        {person.name[0]}
                      </Avatar>
                      <Typography variant="h6" component="div" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        {person.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      100:00 / 250:00 horas trabalhadas
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      68 / 224 tarefas
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      0 excedidas
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      0 atrasadas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

  <TestesModal open={openTestesModal} onClose={() => setOpenTestesModal(false)} API={API} navigate={navigate} />

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
