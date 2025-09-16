import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TestesModal from '../components/TestesModal';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Construction,
  People,
  AttachMoney,
  Inventory,
  Science,
  ExitToApp,
  Storefront } from '@mui/icons-material';


export default function DashboardHome() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, hasPermission, logout, isAdmin } = useAuth();
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const [testesCount, setTestesCount] = useState(null);
  const [testesUrgent, setTestesUrgent] = useState(false);
  const [testesList, setTestesList] = useState([]); // Gerador
  const [testesArList, setTestesArList] = useState([]); // Ar Condicionado
  const [clientes, setClientes] = useState([]);
  const [testesOffCount, setTestesOffCount] = useState(0);
  const [testesOkCount, setTestesOkCount] = useState(0);
  const [openTestesModal, setOpenTestesModal] = useState(false);
  const [testesFilter, setTestesFilter] = useState('all'); // all | ok | alerta | sem
  const [testesSortOverdue, setTestesSortOverdue] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [openTestDetail, setOpenTestDetail] = useState(false);
  const getClienteNomeById = (id) => {
    const c = clientes.find((x) => Number(x.id) === Number(id));
    return c ? c.nome : `Cliente ${id ?? ''}`;
  };

  const fetchBothTestes = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const auth = token ? { Authorization: `Bearer ${token}` } : undefined;
      const [resGer, resAr] = await Promise.all([
        fetch(`${API}/testes-loja/`, { headers: auth }),
        fetch(`${API}/testes-ar-condicionado/`, { headers: auth }),
      ]);
      const [dataGer, dataAr] = await Promise.all([
        resGer.ok ? resGer.json() : Promise.resolve([]),
        resAr.ok ? resAr.json() : Promise.resolve([]),
      ]);
      const listGer = Array.isArray(dataGer) ? dataGer : [];
      const listAr = Array.isArray(dataAr) ? dataAr : [];
      const count = listGer.length; // métricas do card baseadas em Gerador
      const off = listGer.filter((t) => (t.status || '').toString().toUpperCase() === 'OFF').length;
      const ok = count - off;
      setTestesList(listGer);
      setTestesArList(listAr);
      setTestesCount(count);
      setTestesOffCount(off);
      setTestesOkCount(ok);
      setTestesUrgent(off > 0);
    } catch (e) {
      setTestesList([]);
      setTestesArList([]);
      setTestesCount(0);
      setTestesOffCount(0);
      setTestesOkCount(0);
      setTestesUrgent(false);
    }
  }, [API]);

  React.useEffect(() => {
    fetchBothTestes();
  }, [fetchBothTestes]);
  React.useEffect(() => {
    if (openTestesModal) fetchBothTestes();
  }, [openTestesModal, fetchBothTestes]);

  // carregar clientes para mapear nomes por cliente_id
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const auth = token ? { Authorization: `Bearer ${token}` } : undefined;
        const res = await fetch(`${API}/clientes/`, { headers: auth });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setClientes(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setClientes([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API]);

  const allDashboardCards = [
    {
      title: 'Clientes',
      description: 'Gestão de clientes',
      icon: People,
      color: '#3b82f6',
      path: '/clientes',
      permission: 'clientes:read',
    },
    {
      title: 'Obras',
      description: 'Gerenciar contratos e obras',
      icon: Construction,
      color: '#10b981',
      path: '/contratos',
      permission: 'contratos:read',
    },
    {
      title: 'Financeiro',
      description: 'Controle financeiro e despesas',
      icon: AttachMoney,
      color: '#f59e0b',
      path: '/financeiro',
      permission: 'financeiro:read',
    },
    // Removed cards: Contratos, Despesas, Fornecedores, Orçamento Obra, Valor Materiais, Resumo Mensal
    {
      title: 'Testes de Loja',
      description: 'Agendamentos e registros de testes',
      icon: Storefront,
      color: '#06b6d4',
      path: '/testes-loja-menu',
      permission: 'testes_loja:read',
    },
    {
      title: 'Administrador',
      description: 'Administração',
      icon: ExitToApp,
      color: '#6b7280',
      path: '/cadastro-usuarios',
      permission: 'admin:read',
      adminOnly: true,
    },
  ];

  // Filtrar cards baseado nas permissões do usuário
  const filteredCards = allDashboardCards.filter((card) => {
    if (card.adminOnly && !isAdmin()) return false;
    // Remover card Financeiro para usuários de Manutenção/Visualização
    const role = (user?.nivel_acesso || '').toLowerCase();
    if (card.title === 'Financeiro' && (role === 'manutenção' || role === 'manutencao' || role === 'visualização' || role === 'visualizacao')) {
      return false;
    }
    return hasPermission(card.permission);
  });

  const handleCardClick = (path, title) => {
    if (title === 'Testes de Loja') {
      setOpenTestesModal(true);
      return;
    }
    navigate(path);
  };

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
    candidates.sort(
      (a, b) =>
        new Date(b.data_teste || b.data || b.created_at || 0) -
        new Date(a.data_teste || a.data || a.created_at || 0)
    );
    return candidates[0];
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 3,
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 3,
          p: 4,
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            pb: 2,
            borderBottom: '2px solid',
            borderColor: theme.palette.grey[200],
          }}
        >
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                mb: 1,
              }}
            >
              Dashboard
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 400,
              }}
            >
              Bem-vindo, {user?.nome}!
            </Typography>
          </Box>

          <Button
            variant="outlined"
            color="error"
            startIcon={<ExitToApp />}
            onClick={logout}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              fontWeight: 600,
            }}
          >
            Sair
          </Button>
        </Box>

        {/* Cards Grid */}
        <Grid
          container
          spacing={3}
          alignItems="stretch"
          sx={{ flexDirection: { xs: 'column', sm: 'row' } }}
        >
          {filteredCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderRadius: 3,
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                }}
                onClick={() => handleCardClick(card.path)}
              >
                <CardContent
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flexGrow: 1,
                    minHeight: { xs: 160, sm: 200, md: 240 },
                  }}
                >
                  <Avatar
                    sx={{
                      width: { xs: 56, sm: 64 },
                      height: { xs: 56, sm: 64 },
                      mx: 'auto',
                      mb: 2,
                      bgcolor: card.color,
                      boxShadow: `0 8px 24px ${card.color}40`,
                    }}
                  >
                    <card.icon sx={{ fontSize: { xs: 24, sm: 32 }, color: 'white' }} />
                  </Avatar>

                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      mb: 1,
                      fontSize: { xs: '1rem', sm: '1.05rem', md: '1.1rem' },
                      textAlign: 'center',
                    }}
                  >
                    {card.title}
                  </Typography>
                  {card.title === 'Testes de Loja' && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1 }}>
                      <Chip
                        label={testesCount === null ? '...' : String(testesCount)}
                        size="small"
                        color="primary"
                        clickable
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenTestesModal(true);
                        }}
                      />
                      {testesUrgent && (
                        <Chip
                          label="URGENTE"
                          size="small"
                          color="error"
                          clickable
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenTestesModal(true);
                          }}
                        />
                      )}
                    </Box>
                  )}

                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.4,
                      fontSize: { xs: '0.78rem', sm: '0.9rem' },
                      mt: 1,
                      textAlign: 'center',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    title={card.description}
                  >
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Footer */}
        <Box
          sx={{
            textAlign: 'center',
            mt: 6,
            pt: 3,
            borderTop: '1px solid',
            borderColor: theme.palette.grey[200],
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
            }}
          >
            Sistema de Gestão de Obras © {new Date().getFullYear()}
          </Typography>
        </Box>
      </Box>

      <TestesModal
        open={openTestesModal}
        onClose={() => setOpenTestesModal(false)}
        API={API}
        navigate={navigate}
      />
    </Box>
  );
}
