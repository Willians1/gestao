import React, { useEffect, useMemo, useState } from 'react';
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
  Chip,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import TestesModal from '../components/TestesModal';
import { Construction, People, AttachMoney, ExitToApp, Storefront } from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';

export default function DashboardHome() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, token, hasPermission, isAdmin, logout } = useAuth();
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const [testesCount, setTestesCount] = useState(null);
  const [testesUrgent, setTestesUrgent] = useState(false);
  const [testesList, setTestesList] = useState([]);
  const [testesArList, setTestesArList] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [testesOffCount, setTestesOffCount] = useState(0);
  const [testesOkCount, setTestesOkCount] = useState(0);
  const [openTestesModal, setOpenTestesModal] = useState(false);
  const [hasPendentes, setHasPendentes] = useState(false);
  const [openPendentes, setOpenPendentes] = useState(false);
  // Backup
  const [backupStatus, setBackupStatus] = useState(null);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [backupsModalOpen, setBackupsModalOpen] = useState(false);
  const [backups, setBackups] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [runningBackup, setRunningBackup] = useState(false);
  const [progress, setProgress] = useState({
    running: false,
    percent: 0,
    processed: 0,
    total: 0,
    current: null,
  });
  const [canceling, setCanceling] = useState(false);
  const [backupError, setBackupError] = useState('');
  const isAuthenticated = useMemo(() => !!token, [token]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [resGer, resAr] = await Promise.all([
          fetch(`${API}/testes-loja/`),
          fetch(`${API}/testes-ar-condicionado/`),
        ]);
        const [dataGer, dataAr] = await Promise.all([
          resGer.ok ? resGer.json() : Promise.resolve([]),
          resAr.ok ? resAr.json() : Promise.resolve([]),
        ]);
        if (!mounted) return;
        const listGer = Array.isArray(dataGer) ? dataGer : [];
        const listAr = Array.isArray(dataAr) ? dataAr : [];
        const total = listGer.length + listAr.length;
        const off =
          listGer.filter((t) => (t.status || '').toString().toUpperCase() === 'OFF').length +
          listAr.filter((t) => (t.status || '').toString().toUpperCase() === 'OFF').length;
        const ok = Math.max(0, total - off);
        setTestesCount(total);
        setTestesOffCount(off);
        setTestesOkCount(ok);
        setTestesUrgent(off > 0);

        // Cálculo de pendências: atraso > 7 dias ou quinta-feira sem registro do dia
        const daysSince = (dateStr) => {
          if (!dateStr) return null;
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return null;
          return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
        };
        const sameDay = (a, b) =>
          a.getFullYear() === b.getFullYear() &&
          a.getMonth() === b.getMonth() &&
          a.getDate() === b.getDate();
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
          // Pendente se qualquer um dos dois não estiver ok (ausente ou >7d), ou quinta-feira sem registro hoje
          const overdue = !(gerOk && arOk);
          const pendenteHoje = isThursday && !hasToday;
          if (overdue || pendenteHoje) pendentes++;
        }
        setHasPendentes(pendentes > 0);
      } catch (e) {
        if (!mounted) return;
        setTestesCount(0);
        setTestesOffCount(0);
        setTestesOkCount(0);
        setTestesUrgent(false);
        setHasPendentes(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API]);

  // Backup: carregar status
  const fetchBackupStatus = async () => {
    if (!isAdmin?.()) return; // Somente admins
    setLoadingBackup(true);
    try {
      const res = await fetch(`${API}/backup/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setBackupStatus(data);
        setBackupError('');
        // Verifica se já existe progresso em andamento
        try {
          const pr = await fetch(`${API}/backup/progress`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (pr.ok) {
            const jd = await pr.json();
            if (jd?.running) {
              setProgress(jd);
              // inicia polling assíncrono
              pollProgress();
            } else if (jd?.percent >= 100 || jd?.canceled) {
              setProgress(jd);
            }
          }
        } catch {}
      } else if (res.status === 401 || res.status === 403) {
        setBackupStatus(null);
        setBackupError('Você precisa estar logado como Administrador para executar backups.');
      }
    } catch (e) {
      // ignore
    } finally {
      setLoadingBackup(false);
    }
  };

  const fetchBackupsList = async () => {
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
  };

  useEffect(() => {
    fetchBackupStatus();
    // revalidar a cada 2 min
    const t = setInterval(fetchBackupStatus, 120000);
    return () => clearInterval(t);
  }, [API, token]);

  const runBackupNow = async () => {
    if (runningBackup) return;
    setRunningBackup(true);
    try {
      const res = await fetch(`${API}/backup/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        // iniciar polling de progresso
        pollProgress();
        setBackupError('');
      } else {
        let msg = 'Falha ao iniciar backup';
        try {
          const j = await res.json();
          if (j?.detail) msg = j.detail;
        } catch {}
        if (res.status === 401 || res.status === 403)
          msg = 'Não autorizado. Faça login como Administrador.';
        setBackupError(msg);
      }
    } finally {
      setRunningBackup(false);
    }
  };

  const pollProgress = async () => {
    setProgress({ running: true, percent: 0, processed: 0, total: 0, current: null });
    let done = false;
    while (!done) {
      try {
        const res = await fetch(`${API}/backup/progress`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setProgress(data);
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
  };

  const cancelBackup = async () => {
    if (!progress.running || canceling) return;
    setCanceling(true);
    try {
      await fetch(`${API}/backup/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } finally {
      setCanceling(false);
    }
  };

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
      title: 'Clientes',
      description: 'Cadastro e gestão de clientes',
      icon: People,
      color: theme.palette.secondary.main,
      path: '/clientes',
      permission: '/clientes',
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
      title: 'Administrador',
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
    const role = (user?.nivel_acesso || '').toLowerCase();
    if (card.title === 'Financeiro' && (role === 'manutenção' || role === 'manutencao' || role === 'visualização' || role === 'visualizacao')) {
      return false;
    }
    return hasPermission(card.permission);
  });

  // Forçar ordem desejada: Obras acima de Clientes
  const desiredOrder = ['Obras', 'Clientes', 'Financeiro', 'Testes de Loja', 'Administrador'];
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

        <Grid
          container
          spacing={{ xs: 2, sm: 3, md: 3 }}
          alignItems="stretch"
          justifyContent="center"
        >
          {sortedCards.map((card, index) => (
            <Grid item xs={12} sm={12} key={index}>
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
                  borderRadius: 6,
                  boxShadow: '0 28px 80px rgba(0,0,0,0.14)',
                  '&:hover': {
                    transform: 'translateY(-12px)',
                    boxShadow: '0 40px 120px rgba(0,0,0,0.18)',
                  },
                  maxWidth: 940,
                  mx: 'auto',
                  minHeight: { xs: 210, sm: 240 },
                }}
              >
                <CardContent
                  sx={{
                    p: { xs: 4, sm: 5 },
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Avatar
                    sx={{
                      width: { xs: 86, sm: 108 },
                      height: { xs: 86, sm: 108 },
                      mx: 'auto',
                      mb: 3,
                      bgcolor: card.color,
                    }}
                  >
                    <card.icon sx={{ fontSize: { xs: 35, sm: 45 }, color: 'white' }} />
                  </Avatar>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, fontSize: { xs: '1.4rem', sm: '1.7rem' } }}
                  >
                    {card.title}
                  </Typography>
                  {card.title === 'Testes de Loja' &&
                    (hasPendentes ? (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenPendentes(true);
                            setOpenTestesModal(true);
                          }}
                        >
                          Lojas pendentes
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenPendentes(false);
                            setOpenTestesModal(true);
                          }}
                        >
                          LOJAS OK
                        </Button>
                      </Box>
                    ))}
                  {card.title === 'Administrador' && isAdmin?.() && (
                    <Box sx={{ mt: 2, width: '100%' }} onClick={(e) => e.stopPropagation()}>
                      {loadingBackup && <CircularProgress size={22} />}
                      {!loadingBackup && (
                        <Stack spacing={1} sx={{ alignItems: 'center' }}>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/cadastro-usuarios');
                            }}
                            sx={{ alignSelf: 'stretch' }}
                          >
                            Acessar Cadastro de Usuários
                          </Button>
                          {backupError && (
                            <Alert severity="error" sx={{ width: '100%' }}>
                              {backupError}
                            </Alert>
                          )}
                          {backupStatus && backupStatus?.pending ? (
                            <Alert
                              severity="warning"
                              sx={{ width: '100%' }}
                              action={
                                <Button
                                  color="inherit"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    runBackupNow();
                                  }}
                                  disabled={progress.running}
                                >
                                  {progress.running
                                    ? `${progress.percent?.toFixed?.(0) || 0}%`
                                    : 'Fazer backup agora'}
                                </Button>
                              }
                            >
                              {backupStatus?.hours_since != null
                                ? `Backup pendente há ${backupStatus.hours_since}h`
                                : 'Backup pendente'}
                            </Alert>
                          ) : backupStatus ? (
                            <Alert
                              severity="success"
                              sx={{ width: '100%' }}
                              action={
                                <Button
                                  color="inherit"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    runBackupNow();
                                  }}
                                  disabled={progress.running}
                                >
                                  {progress.running
                                    ? `${progress.percent?.toFixed?.(0) || 0}%`
                                    : 'Criar agora'}
                                </Button>
                              }
                            >
                              {backupStatus?.last_backup_at
                                ? `Último backup: ${formatDateTimeBr(backupStatus.last_backup_at)}`
                                : 'Sem histórico de backup'}
                            </Alert>
                          ) : (
                            <Alert
                              severity="info"
                              sx={{ width: '100%' }}
                              action={
                                <Button
                                  color="inherit"
                                  size="small"
                                  onClick={() => navigate('/login')}
                                >
                                  Entrar
                                </Button>
                              }
                            >
                              Backup indisponível. Faça login como Administrador.
                            </Alert>
                          )}
                          {(progress.running || progress.percent > 0) && (
                            <Box
                              sx={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  noWrap
                                  maxWidth={240}
                                >
                                  {progress.current ||
                                    (progress.running
                                      ? 'Preparando…'
                                      : progress.canceled
                                        ? 'Cancelado'
                                        : 'Concluído')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {progress.processed}/{progress.total}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(100, progress.percent || 0)}
                              />
                              {progress.running && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <Button
                                    size="small"
                                    color="inherit"
                                    onClick={cancelBackup}
                                    disabled={canceling}
                                  >
                                    {canceling ? 'Cancelando…' : 'Cancelar'}
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          )}
                          {(backupStatus?.over_limit || (backupStatus?.backups_count || 0) > 7) && (
                            <Alert
                              severity="info"
                              sx={{ width: '100%' }}
                              action={
                                <Button
                                  color="inherit"
                                  size="small"
                                  onClick={async () => {
                                    setBackupsModalOpen(true);
                                    await fetchBackupsList();
                                  }}
                                >
                                  Gerenciar
                                </Button>
                              }
                            >
                              Você tem {backupStatus?.backups_count} backups. Mantenha apenas 7.
                            </Alert>
                          )}
                        </Stack>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
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
