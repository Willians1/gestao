/* eslint-disable prettier/prettier */
import React, { useEffect, useState, useCallback } from 'react';
import { formatDateTimeBr } from '../utils/datetime';
import ApiStatusBadge from '../components/ApiStatusBadge';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Checkbox,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import TestesModal from '../components/TestesModal';
import { Construction, People, AttachMoney, ExitToApp, Storefront, Assessment } from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';

export default function DashboardHome() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, token, hasPermission, isAdmin, logout } = useAuth();
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  // Tamanho fixo dos cards 150x150 px
  const CARD_HEIGHT = 150;
  // Área de ação bem compacta para caber no card 150x150 com avatar 75
  const ACTION_AREA_HEIGHT = { xs: 14, sm: 14 };
  // Ajuste dinâmico de fonte para títulos longos (2 linhas)
  const getTitleSx = (title) => {
    const len = (title || '').length;
    let fontSize = { xs: '1.1rem', sm: '1.2rem' };
    if (len > 14) fontSize = { xs: '1.05rem', sm: '1.15rem' };
    if (len > 22) fontSize = { xs: '1rem', sm: '1.1rem' };
    return {
      fontWeight: 800,
      fontSize,
      lineHeight: 1.2,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
  // Altura do título reduzida para acomodar avatar 75 e margin 20
  height: { xs: 28, sm: 28 },
  textAlign: 'center',
    };
  };

  const [, setTestesCount] = useState(null);
  // Contadores detalhados não exibidos nesta versão simplificada
  const [openTestesModal, setOpenTestesModal] = useState(false);
  const [hasPendentes, setHasPendentes] = useState(false);
  const [openPendentes, setOpenPendentes] = useState(false);
  // Backup
  const [_backupStatus, setBackupStatus] = useState(null);
  const [_loadingBackup, setLoadingBackup] = useState(false);
  const [backupsModalOpen, setBackupsModalOpen] = useState(false);
  const [backups, setBackups] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [_runningBackup, _setRunningBackup] = useState(false);
  const [_progress, _setProgress] = useState({
    running: false,
    percent: 0,
    processed: 0,
    total: 0,
    current: null,
  });
  const [_canceling, _setCanceling] = useState(false);
  const [_backupError, _setBackupError] = useState('');
  // const isAuthenticated = useMemo(() => !!token, [token]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        const [resGer, resAr] = await Promise.all([
          fetch(`${API}/testes-loja/`, { headers: authHeaders }),
          fetch(`${API}/testes-ar-condicionado/`, { headers: authHeaders }),
        ]);
        const [dataGer, dataAr] = await Promise.all([
          resGer.ok ? resGer.json() : Promise.resolve([]),
          resAr.ok ? resAr.json() : Promise.resolve([]),
        ]);
        if (!mounted) return;
        const listGer = Array.isArray(dataGer) ? dataGer : [];
        const listAr = Array.isArray(dataAr) ? dataAr : [];
        const daysSince = (dateOrStr) => {
          if (!dateOrStr) return null;
          const d = new Date(dateOrStr);
          if (Number.isNaN(d.getTime())) return null;
          const diffMs = Date.now() - d.getTime();
          return Math.floor(diffMs / (1000 * 60 * 60 * 24));
        };
        const sameDay = (a, b) =>
          a.getFullYear() === b.getFullYear() &&
          a.getMonth() === b.getMonth() &&
          a.getDate() === b.getDate();
        const getLatestBy = (list, predicate) => {
          if (!Array.isArray(list)) return null;
          const candidates = list.filter(predicate);
          if (!candidates.length) return null;
          candidates.sort((a, b) => {
            return (
              new Date(b.data_teste || b.data || b.created_at || 0) -
              new Date(a.data_teste || a.data || a.created_at || 0)
            );
          });
          return candidates[0];
        };
        const today = new Date();
        const isThursday = today.getDay() === 4; // 0-dom, 4-qui
        let pendentes = 0;
        for (let i = 1; i <= 16; i++) {
          const ger = getLatestBy(listGer, (t) => Number(t.cliente_id) === i);
          const ar = getLatestBy(listAr, (t) => Number(t.cliente_id) === i);
          const gerDate = ger ? new Date(ger.data_teste || ger.data || ger.created_at) : null;
          const arDate = ar ? new Date(ar.data_teste || ar.data || ar.created_at) : null;
          const gerDays = gerDate ? daysSince(gerDate) : null;
          const arDays = arDate ? daysSince(arDate) : null;
          const gerOk = gerDays !== null && gerDays <= 7;
          const arOk = arDays !== null && arDays <= 7;
          const hasToday = [gerDate, arDate].some((d) => d && sameDay(d, today));
          const overdue = !(gerOk && arOk);
          const pendenteHoje = isThursday && !hasToday;
          if (overdue || pendenteHoje) pendentes++;
        }
        setHasPendentes(pendentes > 0);
      } catch (e) {
        if (!mounted) return;
        setTestesCount(0);
        // setTestesOffCount(0);
        // setTestesOkCount(0);
        setHasPendentes(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API, token]);

  // Backup: carregar status
  const callPollProgress = useCallback(async () => {
    _setProgress({ running: true, percent: 0, processed: 0, total: 0, current: null });
    let done = false;
    while (!done) {
      try {
        const res = await fetch(`${API}/backup/progress`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          _setProgress(data);
          if (!data.running && (data.percent >= 100 || data.canceled)) {
            done = true;
            await fetchBackupStatus();
            if (backupsModalOpen) await fetchBackupsList();
            break;
          }
        }
      } catch (e) {}
      await new Promise((r) => setTimeout(r, 800));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API, token, backupsModalOpen]);

  const fetchBackupStatus = useCallback(async () => {
    if (!isAdmin?.()) return; // Somente admins
    setLoadingBackup(true);
    try {
      const res = await fetch(`${API}/backup/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setBackupStatus(data);
        _setBackupError('');
        // Verifica se já existe progresso em andamento
        try {
          const pr = await fetch(`${API}/backup/progress`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (pr.ok) {
            const jd = await pr.json();
            if (jd?.running) {
              _setProgress(jd);
              // inicia polling assíncrono
              callPollProgress();
            } else if (jd?.percent >= 100 || jd?.canceled) {
              _setProgress(jd);
            }
          }
        } catch {}
      } else if (res.status === 401 || res.status === 403) {
        setBackupStatus(null);
        _setBackupError('Você precisa estar logado como Administrador para executar backups.');
      }
    } catch (e) {
      // ignore
    } finally {
      setLoadingBackup(false);
    }
  }, [API, token, isAdmin, callPollProgress]);

  const fetchBackupsList = useCallback(async () => {
    try {
      const res = await fetch(`${API}/backup/list`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      // ignore
    }
  }, [API, token]);

  useEffect(() => {
    fetchBackupStatus();
    // revalidar a cada 2 min
    const t = setInterval(fetchBackupStatus, 120000);
    return () => clearInterval(t);
  }, [fetchBackupStatus, token]);

  // Ações diretas de backup removidas (uso via modal/diálogo)

  const toggleFile = (name) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (!selectedFiles.size) return;
    const files = Array.from(selectedFiles);
    try {
      const res = await fetch(`${API}/backup`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ files }),
      });
      if (res.ok) {
        setSelectedFiles(new Set());
        await fetchBackupsList();
        await fetchBackupStatus();
      }
    } catch (e) {
      // ignore
    }
  };

  const allDashboardCards = [
    {
      title: 'Obras',
      description: 'Gerenciar contratos e obras',
      icon: Construction,
      color: theme.palette.primary.main,
      path: '/contratos',
      permission: '/contratos',
    },
    {
      title: 'Relatório de Obras',
      description: 'Inspeção e relatórios de obras',
      icon: Assessment,
      color: theme.palette.info.main,
      path: '/relatorio-obras',
      permission: '/relatorio-obras',
    },
    {
      title: 'Clientes',
      description: 'Cadastro e gestão de clientes',
      icon: People,
      color: theme.palette.secondary.main,
      path: '/clientes',
      permission: '/clientes',
    },
    {
      title: 'Financeiro',
      description: 'Controle financeiro e despesas',
      icon: AttachMoney,
      color: theme.palette.warning.main,
      path: '/financeiro',
      permission: '/financeiro',
      adminOnly: true,
    },
    {
      title: 'Testes de Loja',
      description: 'Agendamentos e registros de testes',
      icon: Storefront,
      color: theme.palette.primary.light,
      path: '/testes-loja-menu',
      permission: '/testes-loja-menu',
    },
    {
      title: 'Admin',
      description: 'Administração do sistema',
      icon: ExitToApp,
      color: theme.palette.grey[600],
      path: '/cadastro-usuarios',
      permission: '/admin',
      adminOnly: true,
    },
  ];

  const filteredCards = allDashboardCards.filter((card) => {
    if (card.adminOnly && !isAdmin()) return false;
    return hasPermission(card.permission);
  });

  // Forçar ordem desejada: Obras acima de Clientes
  const desiredOrder = ['Obras', 'Clientes', 'Financeiro', 'Testes de Loja', 'Admin'];
  const sortedCards = [...filteredCards].sort((a, b) => {
    const ia = desiredOrder.indexOf(a.title);
    const ib = desiredOrder.indexOf(b.title);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const handleCardClick = (path, title) => {
    console.log('card clicked:', title, path);
    if (title === 'Testes de Loja') {
      setOpenTestesModal(true);
      return;
    }
    try {
      navigate(path);
    } catch (e) {
      console.error('navigate error:', e);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', p: 3 }}>
      <Box sx={{ maxWidth: 940, mx: 'auto', background: 'white', borderRadius: 3, p: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: 4,
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Bem-vindo, {user?.nome}!
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              alignItems: 'center',
              flexWrap: 'wrap',
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-end' },
            }}
          >
            <ApiStatusBadge />
            <Button variant="outlined" color="error" onClick={logout} size="small">
              Sair
            </Button>
          </Box>
        </Box>

        <Grid container spacing={{ xs: 2, sm: 3 }} alignItems="stretch" justifyContent="center">
          {sortedCards.map((card, index) => {
            return (
              <Grid item xs={'auto'} sm={'auto'} md={'auto'} key={index}>
                <Card
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCardClick(card.path, card.title)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(card.path, card.title);
                    }
                  }}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    borderRadius: 4,
                    boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 24px 60px rgba(0,0,0,0.16)',
                    },
                    width: 150,
                    height: CARD_HEIGHT,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardContent
                    sx={{
                      p: 0, // sem padding para aproveitar totalmente os 150x150
                      pt: '10px', // padding superior solicitado para afastar o avatar do topo
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexGrow: 1,
                      width: '100%',
                      gap: 0,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 75,
                        height: 75,
                        mb: '20px', // solicitado
                        bgcolor: card.color,
                        alignSelf: 'center',
                      }}
                    >
                      <card.icon sx={{ fontSize: 36, color: 'white' }} />
                    </Avatar>
                    <Typography component="div" sx={{ ...getTitleSx(card.title), px: 1 }}>
                      {card.title}
                    </Typography>
                    {/* Área de ação padronizada: reserva espaço fixo para o botão */}
                    <Box
                      sx={{
                        height: ACTION_AREA_HEIGHT,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mt: 0.25,
                        px: 1,
                      }}
                    >
                      {card.title === 'Testes de Loja' ? (
                        <Button
                          size="small"
                          variant="contained"
                          color={hasPendentes ? 'error' : 'success'}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenPendentes(hasPendentes);
                            setOpenTestesModal(true);
                          }}
                          sx={{
                            fontSize: '0.60rem', // reduz fonte
                            lineHeight: 1.1,
                            px: 0.6, // padding horizontal reduzido
                            py: 0.25, // padding vertical menor
                            minHeight: 16, // cerca de 1/3 menor que ~24 padrão
                            minWidth: 60, // largura enxuta
                            borderRadius: 1.2,
                            fontWeight: 700,
                            letterSpacing: 0.3,
                            '& .MuiButton-startIcon,& .MuiButton-endIcon': { m: 0 },
                          }}
                        >
                          {hasPendentes ? 'PENDÊNCIAS' : 'LOJAS OK'}
                        </Button>
                      ) : card.title === 'Admin' ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            // abrir modal de backups
                            setBackupsModalOpen(true);
                          }}
                          sx={{
                            fontSize: '0.60rem',
                            lineHeight: 1.1,
                            px: 0.6,
                            py: 0.25,
                            minHeight: 16,
                            minWidth: 60,
                            borderRadius: 1.2,
                            fontWeight: 700,
                            letterSpacing: 0.3,
                          }}
                        >
                          BACKUP
                        </Button>
                      ) : (
                        // Placeholder invisível para manter a mesma altura
                        <Box sx={{ height: ACTION_AREA_HEIGHT }} />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Box
          sx={{
            textAlign: 'center',
            mt: 6,
            pt: 3,
            borderTop: '1px solid',
            borderColor: theme.palette.grey[200],
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Sistema de Gestão de Obras © {new Date().getFullYear()}
          </Typography>
        </Box>
      </Box>

      <TestesModal
        open={openTestesModal}
        onClose={() => {
          setOpenTestesModal(false);
          setOpenPendentes(false);
        }}
        API={API}
        navigate={navigate}
        initialPendentes={openPendentes}
      />

      <Dialog
        open={backupsModalOpen}
        onClose={() => setBackupsModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Gerenciar backups (guardar até 7 dias)</DialogTitle>
        <DialogContent>
          <List>
            {backups.map((b) => (
              <ListItem
                key={b.name}
                dense
                disableGutters
                secondaryAction={
                  <Checkbox
                    edge="end"
                    checked={selectedFiles.has(b.name)}
                    onChange={() => toggleFile(b.name)}
                  />
                }
              >
                <ListItemText
                  primary={b.name}
                  secondary={`${formatDateTimeBr(b.created)} • ${(b.size / 1024 / 1024).toFixed(2)} MB`}
                />
              </ListItem>
            ))}
            {!backups.length && (
              <Typography variant="body2" color="text.secondary">
                Nenhum backup encontrado.
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={async () => {
              await fetchBackupsList();
            }}
            variant="text"
          >
            Atualizar
          </Button>
          <Button
            onClick={deleteSelected}
            variant="contained"
            color="error"
            disabled={!selectedFiles.size}
          >
            Excluir selecionados
          </Button>
          <Button onClick={() => setBackupsModalOpen(false)} variant="outlined">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
