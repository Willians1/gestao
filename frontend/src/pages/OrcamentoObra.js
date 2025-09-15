import React from 'react';
import { Box, Button, Paper, Typography, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';

export default function OrcamentoObra() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { token, hasPermission } = useAuth();
  const canRead = hasPermission('/orcamento-obra', 'read');
  const canCreate = hasPermission('/orcamento-obra', 'create');
  const canUpdate = hasPermission('/orcamento-obra', 'update');
  const canDelete = hasPermission('/orcamento-obra', 'delete');
  const [rows, setRows] = React.useState([]);
  const [selectedOrcamento, setSelectedOrcamento] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [total, setTotal] = React.useState(0);
  const [openModal, setOpenModal] = React.useState(false);
  const [form, setForm] = React.useState({ cliente_id: '', etapa: '', descricao: '', unidade: '', quantidade: '', custo_unitario: '', data: '' });
  const [clientes, setClientes] = React.useState([]);  // Lista de clientes para o dropdown
  const [saving, setSaving] = React.useState(false);
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const loadPersisted = async () => {
    try {
      const resp = await fetch(`${API}/orcamento_obra/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!resp.ok) return;
      const data = await resp.json();
      if (!data) return;
      setRows((data || []).map((r, i) => ({ id: r.id ?? i + 1, ...r })));
      setTotal((data || []).length);
    } catch (e) { console.error(e); }
  };

  const loadClientes = async () => {
    try {
      const response = await fetch(`${API}/clientes/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  React.useEffect(() => { 
    loadPersisted(); 
    loadClientes();
  }, []);

  return (
    <Box sx={{ background: theme.palette.background.default, minHeight: '100vh', p: { xs: 1, md: 4 } }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mr: 2 }}>Voltar</Button>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0 }}>Orçamentos de Obra</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>Total de resultados:</Typography>
          <Chip label={total} color="primary" sx={{ fontWeight: 700, fontSize: 16 }} />
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" color="success" sx={{ mr: 2 }}>Filtrar</Button>
          {canCreate && (
            <Button variant="contained" color="primary" onClick={() => setOpenModal(true)}>Criar novo orçamento</Button>
          )}
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
                <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Etapa</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Unidade</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Quantidade</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Custo Unit.</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                <TableRow key={row.id || idx} hover sx={{ borderBottom: '1px solid #e0e0e0' }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      ID: {row.cliente_id || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.etapa || ''}</TableCell>
                  <TableCell>{row.descricao || ''}</TableCell>
                  <TableCell>{row.unidade || ''}</TableCell>
                  <TableCell>{row.quantidade || ''}</TableCell>
                  <TableCell>R$ {parseFloat(row.custo_unitario || 0).toFixed(2)}</TableCell>
                  <TableCell>{row.data || ''}</TableCell>
                  <TableCell>
                    <Button size="small" variant="text" onClick={() => setSelectedOrcamento(row)}>Ver detalhes</Button>
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
          <DialogTitle>Novo Orçamento</DialogTitle>
          <DialogContent sx={{ minWidth: 340 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Cliente</InputLabel>
              <Select
                value={form.cliente_id}
                label="Cliente"
                onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}
              >
                {clientes.map(cliente => (
                  <MenuItem key={cliente.id} value={cliente.id}>
                    ID: {cliente.id} - {cliente.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Etapa" fullWidth margin="normal" value={form.etapa} onChange={e => setForm(f => ({ ...f, etapa: e.target.value }))} />
            <TextField label="Descrição" fullWidth margin="normal" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            <TextField label="Unidade" fullWidth margin="normal" value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} />
            <TextField label="Quantidade" type="number" fullWidth margin="normal" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))} />
            <TextField label="Custo Unitário" type="number" fullWidth margin="normal" value={form.custo_unitario} onChange={e => setForm(f => ({ ...f, custo_unitario: e.target.value }))} />
            <TextField label="Data" type="date" InputLabelProps={{ shrink: true }} fullWidth margin="normal" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)} disabled={saving}>Cancelar</Button>
            <Button variant="contained" onClick={async () => {
              if (!form.cliente_id) {
                alert('Por favor, selecione um cliente');
                return;
              }
              setSaving(true);
              try {
                const resp = await fetch(`${API}/orcamento_obra/`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                  body: JSON.stringify(form)
                });
                if (!resp.ok) throw new Error('Erro ao criar orçamento');
                setOpenModal(false);
                setForm({ cliente_id: '', etapa: '', descricao: '', unidade: '', quantidade: '', custo_unitario: '', data: '' });
                await loadPersisted();
              } catch (e) {
                alert('Erro ao criar orçamento.');
              } finally {
                setSaving(false);
              }
            }} disabled={saving || !canCreate || !form.cliente_id || !form.etapa || !form.descricao}>Salvar</Button>
          </DialogActions>
        </Dialog>
        {/* Modal de detalhes do orçamento */}
        <Dialog open={!!selectedOrcamento} onClose={() => setSelectedOrcamento(null)}>
          <DialogTitle>Detalhes do Orçamento</DialogTitle>
          <DialogContent sx={{ minWidth: 340 }}>
            {selectedOrcamento && (
              <Box>
                <Typography><b>Nome:</b> {selectedOrcamento.nome}</Typography>
                <Typography><b>ID:</b> {selectedOrcamento.id}</Typography>
                <Typography><b>Valor Total:</b> {selectedOrcamento.valor_total}</Typography>
                <Typography><b>Data:</b> {selectedOrcamento.data}</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedOrcamento(null)}>Fechar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
