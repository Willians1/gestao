import React from 'react';
import { Box, Button, Paper, Typography, Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function ResumoMensal() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [rows, setRows] = React.useState([]);
  const [selectedResumo, setSelectedResumo] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [total, setTotal] = React.useState(0);
  const [openModal, setOpenModal] = React.useState(false);
  const [form, setForm] = React.useState({ nome: '', valor_total: '', data: '' });
  const [saving, setSaving] = React.useState(false);
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const loadPersisted = async () => {
    try {
      const resp = await fetch(`${API}/resumo_mensal/`);
      if (!resp.ok) return;
      const data = await resp.json();
      if (!data) return;
      setRows((data || []).map((r, i) => ({ id: r.id ?? i + 1, ...r })));
      setTotal((data || []).length);
    } catch (e) { console.error(e); }
  };

  React.useEffect(() => { loadPersisted(); }, []);

  return (
    <Box sx={{ background: theme.palette.background.default, minHeight: '100vh', p: { xs: 1, md: 4 } }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mr: 2 }}>Voltar</Button>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0 }}>Resumos Mensais</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>Total de resultados:</Typography>
          <Chip label={total} color="primary" sx={{ fontWeight: 700, fontSize: 16 }} />
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" color="success" sx={{ mr: 2 }}>Filtrar</Button>
          <Button variant="contained" color="primary" onClick={() => setOpenModal(true)}>Criar novo resumo</Button>
        </Box>
        {/* Chips de filtro exemplo */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip label="Nome" onDelete={() => {}} />
          <Chip label="Data" onDelete={() => {}} />
        </Stack>
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 0 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#f4f6f8' }}>
                <TableCell sx={{ fontWeight: 700 }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Valor Total</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                <TableRow key={row.id || idx} hover sx={{ borderBottom: '1px solid #e0e0e0' }}>
                  <TableCell>{row.nome || ''}</TableCell>
                  <TableCell>{row.valor_total || ''}</TableCell>
                  <TableCell>{row.data || ''}</TableCell>
                  <TableCell>
                    <Button size="small" variant="text" onClick={() => setSelectedResumo(row)}>Ver detalhes</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={rows.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Linhas por página:"
          />
        </TableContainer>
        {/* Modal de cadastro */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)}>
          <DialogTitle>Novo Resumo</DialogTitle>
          <DialogContent sx={{ minWidth: 340 }}>
            <TextField label="Nome" fullWidth margin="normal" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            <TextField label="Valor Total" fullWidth margin="normal" value={form.valor_total} onChange={e => setForm(f => ({ ...f, valor_total: e.target.value }))} />
            <TextField label="Data" fullWidth margin="normal" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)} disabled={saving}>Cancelar</Button>
            <Button variant="contained" onClick={async () => {
              setSaving(true);
              try {
                const resp = await fetch(`${API}/resumo_mensal/`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(form)
                });
                if (!resp.ok) throw new Error('Erro ao criar resumo');
                setOpenModal(false);
                setForm({ nome: '', valor_total: '', data: '' });
                await loadPersisted();
              } catch (e) {
                alert('Erro ao criar resumo.');
              } finally {
                setSaving(false);
              }
            }} disabled={saving || !form.nome || !form.valor_total}>Salvar</Button>
          </DialogActions>
        </Dialog>
        {/* Modal de detalhes do resumo */}
        <Dialog open={!!selectedResumo} onClose={() => setSelectedResumo(null)}>
          <DialogTitle>Detalhes do Resumo</DialogTitle>
          <DialogContent sx={{ minWidth: 340 }}>
            {selectedResumo && (
              <Box>
                <Typography><b>Nome:</b> {selectedResumo.nome}</Typography>
                <Typography><b>ID:</b> {selectedResumo.id}</Typography>
                <Typography><b>Valor Total:</b> {selectedResumo.valor_total}</Typography>
                <Typography><b>Data:</b> {selectedResumo.data}</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedResumo(null)}>Fechar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
