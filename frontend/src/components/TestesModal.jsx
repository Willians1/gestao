import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function TestesModal({ open, onClose, API = (process.env.REACT_APP_API_URL || 'http://localhost:8000'), navigate, initialPendentes = false }) {
  const [clientes, setClientes] = useState([]);
  const [testesList, setTestesList] = useState([]);
  const [testesArList, setTestesArList] = useState([]);
  const [testesCount, setTestesCount] = useState(0);
  const [testesOkCount, setTestesOkCount] = useState(0);
  const [testesOffCount, setTestesOffCount] = useState(0);
  const [testesUrgent, setTestesUrgent] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [openTestDetail, setOpenTestDetail] = useState(false);
  const [testesFilter, setTestesFilter] = useState('all');
  const [testesSortOverdue, setTestesSortOverdue] = useState(false);

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
    } catch (e) {
      setTestesList([]);
      setTestesArList([]);
      setTestesCount(0);
      setTestesOffCount(0);
      setTestesOkCount(0);
      setTestesUrgent(false);
    }
  }, [API]);

  useEffect(() => { fetchBothTestes(); }, [fetchBothTestes]);
  useEffect(() => {
    if (open) setTestesFilter(initialPendentes ? 'pendentes' : 'all');
  }, [open, initialPendentes]);
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

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Testes de Loja
          <IconButton aria-label="close" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip label={`Total: ${testesCount ?? 0}`} color="primary" />
            <Chip label={`OK: ${testesOkCount ?? 0}`} color="success" />
            <Chip label={`OFF: ${testesOffCount ?? 0}`} color="error" />
            {testesUrgent && <Chip label="URGENTE" color="error" />}
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button size="small" variant={testesFilter === 'pendentes' ? 'contained' : 'outlined'} onClick={() => setTestesFilter('pendentes')}>Pendentes</Button>
              <Button size="small" variant={testesFilter === 'all' ? 'contained' : 'outlined'} onClick={() => setTestesFilter('all')}>Todos</Button>
              <Button size="small" variant={testesFilter === 'ok' ? 'contained' : 'outlined'} onClick={() => setTestesFilter('ok')}>OK</Button>
              <Button size="small" variant={testesFilter === 'alerta' ? 'contained' : 'outlined'} onClick={() => setTestesFilter('alerta')}>ALERTA</Button>
              <Button size="small" variant={testesFilter === 'sem' ? 'contained' : 'outlined'} onClick={() => setTestesFilter('sem')}>Sem registro</Button>
              <Button size="small" variant={testesSortOverdue ? 'contained' : 'outlined'} onClick={() => setTestesSortOverdue(s => !s)} sx={{ ml: 1 }}>{testesSortOverdue ? 'Ordenar: Mais atrasadas' : 'Ordenar: Padrão'}</Button>
            </Box>
          </Box>

          <Box sx={{ mb: 1, display: 'flex', px: 1 }}>
            <Box sx={{ flex: 1, textAlign: 'left', fontWeight: 700 }}>Loja</Box>
            <Box sx={{ width: 150, textAlign: 'center', fontWeight: 700 }}>GERADOR</Box>
            <Box sx={{ width: 150, textAlign: 'center', fontWeight: 700 }}>AR</Box>
          </Box>

          <List>
            {(() => {
              const rows = Array.from({ length: 16 }).map((_, i) => {
                const idx = i + 1;
                const clienteObj = clientes.find(c => Number(c.id) === idx);
                const lojaName = clienteObj ? clienteObj.nome : `PEREQUE LOJA ${String(idx).padStart(2, '0')}`;
                const gerCandidate = getLatestBy(testesList, t => Number(t.cliente_id) === idx);
                const arCandidate = getLatestBy(testesArList, t => Number(t.cliente_id) === idx);
                const gerDays = gerCandidate ? daysSince(gerCandidate.data_teste || gerCandidate.data || gerCandidate.created_at) : null;
                const arDays = arCandidate ? daysSince(arCandidate.data_teste || arCandidate.data || arCandidate.created_at) : null;
                const maxDays = Math.max(gerDays ?? -1, arDays ?? -1);
                // Status agora exige que AMBOS testes (gerador e ar) estejam dentro do prazo para 'ok'
                let status = 'sem';
                const gerOk = (gerDays !== null && gerDays <= 7);
                const arOk = (arDays !== null && arDays <= 7);
                if (gerOk && arOk) {
                  status = 'ok';
                } else if (gerDays === null && arDays === null) {
                  status = 'sem';
                } else {
                  // Se qualquer um estiver ausente ou atrasado, marcar alerta
                  if ((gerDays !== null && gerDays > 7) || (arDays !== null && arDays > 7) || (gerDays === null || arDays === null)) {
                    status = 'alerta';
                  }
                }
                // Lógica de pendência: atraso > 7 dias OU (quinta-feira e sem registro no dia)
                const today = new Date();
                const isThursday = today.getDay() === 4;
                const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
                const gerDate = gerCandidate ? new Date(gerCandidate.data_teste || gerCandidate.data || gerCandidate.created_at) : null;
                const arDate = arCandidate ? new Date(arCandidate.data_teste || arCandidate.data || arCandidate.created_at) : null;
                const hasToday = [gerDate, arDate].some(d => d && sameDay(d, today));
                const overdue = (gerDays === null && arDays === null) || (gerDays !== null && gerDays > 7) || (arDays !== null && arDays > 7);
                const pendente = overdue || (isThursday && !hasToday);
                return { lojaName, gerCandidate, arCandidate, gerDays, arDays, maxDays, status, pendente };
              });

              const filtered = rows.filter(r => {
                if (testesFilter === 'all') return true;
                if (testesFilter === 'pendentes') return r.pendente;
                if (testesFilter === 'ok') return r.status === 'ok';
                if (testesFilter === 'alerta') return r.status === 'alerta';
                if (testesFilter === 'sem') return r.status === 'sem';
                return true;
              });

              if (testesSortOverdue) filtered.sort((a, b) => b.maxDays - a.maxDays);

              return filtered.map(r => (
                <ListItem key={r.lojaName} divider sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <ListItemText primary={r.lojaName} />
                  </Box>
                  <Box sx={{ width: 150, textAlign: 'center' }}>
                    {r.gerCandidate ? (
                      (r.gerDays !== null && r.gerDays <= 7) ? (
                        <Button size="small" variant="contained" color="success" onClick={(e) => { e.stopPropagation(); setSelectedTest({ ...r.gerCandidate, _tipo: 'gerador' }); setOpenTestDetail(true); }}>{new Date(r.gerCandidate.data_teste || r.gerCandidate.data || r.gerCandidate.created_at).toLocaleDateString()}</Button>
                      ) : (
                        <Button size="small" variant="contained" color="error" onClick={(e) => { e.stopPropagation(); setSelectedTest({ ...r.gerCandidate, _tipo: 'gerador' }); setOpenTestDetail(true); }}>{r.gerDays != null ? `${r.gerDays}d` : 'SEM REGISTRO'}</Button>
                      )
                    ) : (
                      <Button size="small" variant="contained" color="error" onClick={(e) => { e.stopPropagation(); setSelectedTest(null); setOpenTestDetail(true); }}>SEM REGISTRO</Button>
                    )}
                  </Box>
                  <Box sx={{ width: 150, textAlign: 'center' }}>
                    {r.arCandidate ? (
                      (r.arDays !== null && r.arDays <= 7) ? (
                        <Button size="small" variant="contained" color="success" onClick={(e) => { e.stopPropagation(); setSelectedTest({ ...r.arCandidate, _tipo: 'ar' }); setOpenTestDetail(true); }}>{new Date(r.arCandidate.data_teste || r.arCandidate.data || r.arCandidate.created_at).toLocaleDateString()}</Button>
                      ) : (
                        <Button size="small" variant="contained" color="error" onClick={(e) => { e.stopPropagation(); setSelectedTest({ ...r.arCandidate, _tipo: 'ar' }); setOpenTestDetail(true); }}>{r.arDays != null ? `${r.arDays}d` : 'SEM REGISTRO'}</Button>
                      )
                    ) : (
                      <Button size="small" variant="contained" color="error" onClick={(e) => { e.stopPropagation(); setSelectedTest(null); setOpenTestDetail(true); }}>SEM REGISTRO</Button>
                    )}
                  </Box>
                </ListItem>
              ));
            })()}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { onClose(); navigate('/testes-loja-menu'); }} color="primary" variant="contained">
            Ir para Testes de Loja
          </Button>
          <Button onClick={onClose} color="inherit">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog - Detalhes do Teste */}
      <Dialog open={openTestDetail} onClose={() => setOpenTestDetail(false)} fullWidth maxWidth="sm">
        <DialogTitle>Detalhes do Teste</DialogTitle>
        <DialogContent dividers>
          {selectedTest ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography><b>Cliente:</b> {getClienteNomeById(selectedTest.cliente_id) || selectedTest.cliente || '—'}</Typography>
              <Typography><b>Data:</b> {new Date(selectedTest.data_teste || selectedTest.data || selectedTest.created_at).toLocaleString()}</Typography>
              <Typography><b>Status:</b> {selectedTest.status || '—'}</Typography>
              {selectedTest.observacao && <Typography><b>Observação:</b> {selectedTest.observacao}</Typography>}
              {selectedTest.foto && (
                <Box sx={{ mt: 1 }}>
                  {(() => {
                    const base = `${API}/uploads/${selectedTest._tipo === 'ar' ? 'testes-ar-condicionado' : 'testes-loja'}`;
                    const url = `${base}/${selectedTest.foto}`;
                    return <img src={url} alt="foto" style={{ maxWidth: '100%', borderRadius: 6 }} />;
                  })()}
                </Box>
              )}
            </Box>
          ) : (
            <Typography color="text.secondary">Sem registro disponível para este tipo.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            // navegar para a página de testes e abrir o teste selecionado via query params
            setOpenTestDetail(false);
            onClose();
            if (selectedTest && selectedTest.id) {
              const tipo = selectedTest._tipo === 'ar' ? 'ar' : 'gerador';
              navigate(`/testes-loja?id=${selectedTest.id}&tipo=${tipo}`);
            } else {
              navigate('/testes-loja');
            }
          }} variant="contained">Abrir na página</Button>
          <Button onClick={() => setOpenTestDetail(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
