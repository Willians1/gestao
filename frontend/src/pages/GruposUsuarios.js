import React from 'react';
import {
  Box, Button, Paper, Typography, Chip, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, FormControlLabel, Checkbox, useTheme,
  FormControl, InputLabel, Select, MenuItem, Grid, Divider, InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';

export default function GruposUsuarios() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [grupos, setGrupos] = React.useState([]);
  const [permissoes, setPermissoes] = React.useState([]);
  const [lojas, setLojas] = React.useState([]);
  const [selectedGrupo, setSelectedGrupo] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [openModal, setOpenModal] = React.useState(false);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [editingGrupo, setEditingGrupo] = React.useState(null);
  const [form, setForm] = React.useState({
    nome: '',
    descricao: '',
    status: 'Aprovado',
    motivo: '',
    valor_maximo_diario_financeiro: 0,
    preco_venda: 0,
    plano_contas: 0,
    valor_maximo_movimentacao: 0,
    valor_maximo_solicitacao_compra: 0,
    valor_maximo_diario_solicitacao_compra: 0,
    permissoes: [],
    lojas: [],
    acesso_total_lojas: false
  });
  const [saving, setSaving] = React.useState(false);
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const loadData = async () => {
    try {
      const [gruposResp, permissoesResp, lojasResp] = await Promise.all([
        fetch(`${API}/grupos/`),
        fetch(`${API}/permissoes/`),
        fetch(`${API}/lojas/`)
      ]);
      
      if (gruposResp.ok) {
        const gruposData = await gruposResp.json();
        setGrupos(gruposData);
      }
      
      if (permissoesResp.ok) {
        const permissoesData = await permissoesResp.json();
        setPermissoes(permissoesData);
      }
      
      if (lojasResp.ok) {
        const lojasData = await lojasResp.json();
        setLojas(lojasData);
      }
    } catch (e) { 
      console.error(e); 
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleCreateGrupo = async () => {
    setSaving(true);
    try {
      const resp = await fetch(`${API}/grupos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!resp.ok) throw new Error('Erro ao criar grupo');
      setOpenModal(false);
      resetForm();
      await loadData();
    } catch (e) {
      alert('Erro ao criar grupo.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      nome: '',
      descricao: '',
      status: 'Aprovado',
      motivo: '',
      valor_maximo_diario_financeiro: 0,
      preco_venda: 0,
      plano_contas: 0,
      valor_maximo_movimentacao: 0,
      valor_maximo_solicitacao_compra: 0,
      valor_maximo_diario_solicitacao_compra: 0,
      permissoes: [],
      lojas: [],
      acesso_total_lojas: false
    });
  };

  const handlePermissaoChange = (permissaoNome, checked) => {
    setForm(f => ({
      ...f,
      permissoes: checked 
        ? [...f.permissoes, permissaoNome]
        : f.permissoes.filter(p => p !== permissaoNome)
    }));
  };

  const handleLojaChange = (lojaId, checked) => {
    setForm(f => ({
      ...f,
      lojas: checked 
        ? [...f.lojas, lojaId]
        : f.lojas.filter(l => l !== lojaId)
    }));
  };

  const agruparPermissoesPorCategoria = () => {
    const categorias = {};
    permissoes.forEach(perm => {
      const cat = perm.categoria || 'Outros';
      if (!categorias[cat]) categorias[cat] = [];
      categorias[cat].push(perm);
    });
    return categorias;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mr: 2 }}>Voltar</Button>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          Grupos de Usuários
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" color="primary" onClick={() => setOpenModal(true)}>
          Criar Novo Grupo
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 0 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f4f6f8' }}>
              <TableCell sx={{ fontWeight: 700 }}>Nome do Grupo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Valor Máximo Financeiro</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {grupos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((grupo, idx) => (
              <TableRow key={grupo.id || idx} hover sx={{ borderBottom: '1px solid #e0e0e0' }}>
                <TableCell>{grupo.nome}</TableCell>
                <TableCell>
                  <Chip 
                    label={grupo.status}
                    color={grupo.status === 'Aprovado' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{grupo.descricao || '-'}</TableCell>
                <TableCell>R$ {Number(grupo.valor_maximo_diario_financeiro || 0).toFixed(2)}</TableCell>
                <TableCell>
                  <Button size="small" variant="text" onClick={() => setSelectedGrupo(grupo)} sx={{ mr: 1 }}>
                    Ver detalhes
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => {/* handleEditGrupo(grupo) */}}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={grupos.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Linhas por página:"
        />
      </TableContainer>

      {/* Modal de criação */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Novo Grupo de Usuários</DialogTitle>
        <DialogContent sx={{ minWidth: 600 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nome do Grupo"
                fullWidth
                margin="normal"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={form.status}
                  label="Status"
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <MenuItem value="Aprovado">Aprovado</MenuItem>
                  <MenuItem value="Pendente">Pendente</MenuItem>
                  <MenuItem value="Rejeitado">Rejeitado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descrição"
                fullWidth
                multiline
                rows={2}
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Valor Máximo Diário (Financeiro)"
                type="number"
                fullWidth
                margin="normal"
                value={form.valor_maximo_diario_financeiro}
                onChange={e => setForm(f => ({ ...f, valor_maximo_diario_financeiro: parseFloat(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Valor Máximo de Movimentação"
                type="number"
                fullWidth
                margin="normal"
                value={form.valor_maximo_movimentacao}
                onChange={e => setForm(f => ({ ...f, valor_maximo_movimentacao: parseFloat(e.target.value) || 0 }))}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Seção de Permissões */}
          <Typography variant="h6" sx={{ mb: 2 }}>Permissões</Typography>
          {Object.entries(agruparPermissoesPorCategoria()).map(([categoria, perms]) => (
            <Accordion key={categoria} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{categoria}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {perms.map(perm => (
                    <ListItem key={perm.id}>
                      <ListItemText 
                        primary={perm.nome}
                        secondary={perm.descricao}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={form.permissoes.includes(perm.nome)}
                          onChange={(e) => handlePermissaoChange(perm.nome, e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}

          <Divider sx={{ my: 2 }} />

          {/* Seção de Lojas */}
          <Typography variant="h6" sx={{ mb: 2 }}>Acesso às Lojas</Typography>
          <FormControlLabel
            control={
              <Checkbox 
                checked={form.acesso_total_lojas}
                onChange={e => setForm(f => ({ ...f, acesso_total_lojas: e.target.checked }))}
              />
            }
            label="Acesso a todas as lojas"
          />
          
          {!form.acesso_total_lojas && (
            <List dense>
              {lojas.map(loja => (
                <ListItem key={loja.id}>
                  <ListItemText 
                    primary={loja.nome}
                    secondary={`${loja.codigo} - ${loja.endereco}`}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={form.lojas.includes(loja.id)}
                      onChange={(e) => handleLojaChange(loja.id, e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateGrupo} disabled={saving || !form.nome}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de detalhes */}
      <Dialog open={!!selectedGrupo} onClose={() => setSelectedGrupo(null)}>
        <DialogTitle>Detalhes do Grupo</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          {selectedGrupo && (
            <Box>
              <Typography><b>Nome:</b> {selectedGrupo.nome}</Typography>
              <Typography><b>Status:</b> {selectedGrupo.status}</Typography>
              <Typography><b>Descrição:</b> {selectedGrupo.descricao || '-'}</Typography>
              <Typography><b>Valor Máximo Financeiro:</b> R$ {Number(selectedGrupo.valor_maximo_diario_financeiro || 0).toFixed(2)}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedGrupo(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
