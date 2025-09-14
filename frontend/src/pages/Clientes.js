import React from 'react';
import { Box, Button, Paper, Typography, Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useAuth } from '../contexts/AuthContext';

export default function Clientes() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { token, hasPermission } = useAuth();
  const canRead = hasPermission('/clientes', 'read');
  const canCreate = hasPermission('/clientes', 'create');
  const canUpdate = hasPermission('/clientes', 'update');
  const canDelete = hasPermission('/clientes', 'delete');
  const [rows, setRows] = React.useState([]);
  const [filteredRows, setFilteredRows] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [total, setTotal] = React.useState(0);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCliente, setSelectedCliente] = React.useState(null);
  const [openModal, setOpenModal] = React.useState(false);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [form, setForm] = React.useState({ nome: '', cnpj: '', email: '', contato: '', endereco: '' });
  const [editForm, setEditForm] = React.useState({ nome: '', cnpj: '', email: '', contato: '', endereco: '' });
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const loadPersisted = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/clientes/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!resp.ok) return;
      const data = await resp.json();
      if (!data) return;
      const clientesData = (data || []).map((r, i) => ({ id: r.id ?? i + 1, ...r }));
      setRows(clientesData);
      setFilteredRows(clientesData);
      setTotal(clientesData.length);
    } catch (e) { 
      console.error(e); 
      alert('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  // Função para filtrar clientes
  const handleSearch = (term) => {
    setSearchTerm(term);
    setPage(0); // Reset para primeira página
    
    if (!term.trim()) {
      setFilteredRows(rows);
      setTotal(rows.length);
      return;
    }

    const filtered = rows.filter(cliente => {
      const searchLower = term.toLowerCase();
      return (
        cliente.id?.toString().includes(searchLower) ||
        cliente.nome?.toLowerCase().includes(searchLower) ||
        cliente.cnpj?.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredRows(filtered);
    setTotal(filtered.length);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilteredRows(rows);
    setTotal(rows.length);
    setPage(0);
  };

  const handleCreateCliente = async () => {
    if (!form.nome || !form.cnpj) {
      alert('Nome e CNPJ são obrigatórios');
      return;
    }
    
    setSaving(true);
    try {
      const resp = await fetch(`${API}/clientes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(form)
      });
      if (!resp.ok) {
        const error = await resp.text();
        throw new Error(error);
      }
      setOpenModal(false);
      setForm({ nome: '', cnpj: '', email: '', contato: '', endereco: '' });
      await loadPersisted();
      alert('Cliente criado com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao criar cliente: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCliente = async () => {
    if (!editForm.nome || !editForm.cnpj) {
      alert('Nome e CNPJ são obrigatórios');
      return;
    }
    
    setSaving(true);
    try {
      const resp = await fetch(`${API}/clientes/${selectedCliente.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(editForm)
      });
      if (!resp.ok) {
        const error = await resp.text();
        throw new Error(error);
      }
      setOpenEditModal(false);
      setSelectedCliente(null);
      await loadPersisted();
      alert('Cliente atualizado com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar cliente: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCliente = async () => {
    if (!window.confirm('Tem certeza que deseja deletar este cliente?')) return;
    
    setSaving(true);
    try {
      const resp = await fetch(`${API}/clientes/${selectedCliente.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!resp.ok) {
        const error = await resp.text();
        throw new Error(error);
      }
      setSelectedCliente(null);
      await loadPersisted();
      alert('Cliente deletado com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao deletar cliente: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (cliente) => {
    setEditForm({
      nome: cliente.nome || '',
      cnpj: cliente.cnpj || '',
      email: cliente.email || '',
      contato: cliente.contato || '',
      endereco: cliente.endereco || ''
    });
    setOpenEditModal(true);
  };

  React.useEffect(() => { 
    loadPersisted(); 
  }, []);

  // Atualizar pesquisa quando os dados mudarem
  React.useEffect(() => {
    if (searchTerm) {
      handleSearch(searchTerm);
    }
  }, [rows]);

  // Cabeçalho e ações responsivos
  return (
    <Box sx={{ background: theme.palette.background.default, minHeight: '100vh', p: { xs: 1, sm: 2, md: 4 } }}>
      <Box sx={{ maxWidth: { xs: '100%', lg: 1200 }, mx: 'auto', mt: { xs: 1, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, md: 2 } }}>
          <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mr: 2 }}>Voltar</Button>
          <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            mb: { xs: 0, md: 0 },
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
          }}
        >
          Clientes
        </Typography>
        </Box>
        {/* Campo de pesquisa */}
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Pesquisar por ID, Nome ou CNPJ"
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={clearSearch}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    <ClearIcon fontSize="small" />
                  </Button>
                </InputAdornment>
              ),
            }}
            sx={{
              maxWidth: { xs: '100%', sm: 400 },
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.background.paper,
              }
            }}
          />
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' }, 
          mb: 2,
          gap: { xs: 1, sm: 0 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 } }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                mr: 1,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Total de resultados:
            </Typography>
            <Chip 
              label={total} 
              color="primary" 
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: '0.75rem', sm: '1rem' }
              }} 
            />
          </Box>
          <Box sx={{ flex: 1 }} />
          {canCreate && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setOpenModal(true)}
            size={window.innerWidth < 600 ? 'small' : 'medium'}
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            {window.innerWidth < 600 ? 'Novo Cliente' : 'Criar novo cliente'}
          </Button>
          )}
        </Box>
        
        {/* Chips de filtro responsivos */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={1} 
          sx={{ mb: 2 }}
        >
          <Chip 
            label={
              searchTerm 
                ? `${total} de ${rows.length} clientes` 
                : `${total} clientes`
            } 
            color={searchTerm ? "secondary" : "info"}
            size={window.innerWidth < 600 ? 'small' : 'medium'}
          />
          {searchTerm && (
            <Chip 
              label={`Pesquisando: "${searchTerm}"`}
              color="primary"
              variant="outlined"
              size={window.innerWidth < 600 ? 'small' : 'medium'}
              onDelete={clearSearch}
            />
          )}
        </Stack>
        
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 2, 
            boxShadow: 0,
            overflowX: 'auto',
            '& .MuiTable-root': {
              minWidth: { xs: 600, md: 'auto' }
            }
          }}
        >
          <Table size={window.innerWidth < 600 ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={{ background: '#f4f6f8' }}>
                <TableCell sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minWidth: { xs: 50, sm: 70 }
                }}>
                  ID
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minWidth: { xs: 100, sm: 150 }
                }}>
                  Nome
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minWidth: { xs: 100, sm: 120 }
                }}>
                  CNPJ
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minWidth: { xs: 120, sm: 150 },
                  display: { xs: 'none', sm: 'table-cell' }
                }}>
                  Email
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minWidth: { xs: 80, sm: 100 }
                }}>
                  Contato
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minWidth: { xs: 100, sm: 150 },
                  display: { xs: 'none', md: 'table-cell' }
                }}>
                  Endereço
                </TableCell>
                  <TableCell sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minWidth: 80
                }}>
                  Ações
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Carregando...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, py: 2 }}>
                      {searchTerm ? `Nenhum cliente encontrado para "${searchTerm}"` : 'Nenhum cliente cadastrado'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                <TableRow key={row.id || idx} hover sx={{ borderBottom: '1px solid #e0e0e0' }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>
                      {row.id || ''}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ 
                    maxWidth: { xs: 100, sm: 200 },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {row.nome || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {row.cnpj || ''}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {row.email || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {row.contato || ''}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {row.endereco || ''}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: { xs: 1, sm: 1.5 } }}>
                    <Button 
                      size={window.innerWidth < 600 ? 'small' : 'medium'}
                      variant="text" 
                      onClick={() => setSelectedCliente(row)}
                      sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.875rem' },
                        minWidth: { xs: 'auto', sm: 'auto' },
                        px: { xs: 0.5, sm: 1 }
                      }}
                    >
                      {window.innerWidth < 600 ? 'Ver' : 'Ver detalhes'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Linhas por página:"
          />
        </TableContainer>
        
        {/* Modal de cadastro */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogContent>
            <TextField
              label="Nome do Cliente"
              fullWidth
              margin="normal"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              required
            />
            <TextField
              label="CNPJ"
              fullWidth
              margin="normal"
              value={form.cnpj}
              onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
              required
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
            <TextField
              label="Contato/Telefone"
              fullWidth
              margin="normal"
              value={form.contato}
              onChange={e => setForm(f => ({ ...f, contato: e.target.value }))}
            />
            <TextField
              label="Endereço"
              fullWidth
              margin="normal"
              value={form.endereco}
              onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleCreateCliente} disabled={saving || !form.nome || !form.cnpj}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de detalhes/edição */}
        <Dialog open={!!selectedCliente && !openEditModal} onClose={() => setSelectedCliente(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Detalhes do Cliente</DialogTitle>
          <DialogContent>
            {selectedCliente && (
              <Box sx={{ pt: 1 }}>
                <Typography sx={{ mb: 1 }}><strong>ID:</strong> {selectedCliente.id}</Typography>
                <Typography sx={{ mb: 1 }}><strong>Nome:</strong> {selectedCliente.nome}</Typography>
                <Typography sx={{ mb: 1 }}><strong>CNPJ:</strong> {selectedCliente.cnpj || 'Não informado'}</Typography>
                <Typography sx={{ mb: 1 }}><strong>Email:</strong> {selectedCliente.email || 'Não informado'}</Typography>
                <Typography sx={{ mb: 1 }}><strong>Contato:</strong> {selectedCliente.contato || 'Não informado'}</Typography>
                <Typography sx={{ mb: 1 }}><strong>Endereço:</strong> {selectedCliente.endereco || 'Não informado'}</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedCliente(null)} disabled={saving}>
              Fechar
            </Button>
            {canUpdate && (
              <Button variant="outlined" color="primary" onClick={() => openEditDialog(selectedCliente)} disabled={saving}>
                Editar
              </Button>
            )}
            {canDelete && (
              <Button variant="outlined" color="error" onClick={handleDeleteCliente} disabled={saving}>
                {saving ? 'Deletando...' : 'Deletar'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Modal de edição */}
        <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogContent>
            <TextField
              label="Nome do Cliente"
              fullWidth
              margin="normal"
              value={editForm.nome}
              onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))}
              required
            />
            <TextField
              label="CNPJ"
              fullWidth
              margin="normal"
              value={editForm.cnpj}
              onChange={e => setEditForm(f => ({ ...f, cnpj: e.target.value }))}
              required
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={editForm.email}
              onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
            />
            <TextField
              label="Contato/Telefone"
              fullWidth
              margin="normal"
              value={editForm.contato}
              onChange={e => setEditForm(f => ({ ...f, contato: e.target.value }))}
            />
            <TextField
              label="Endereço"
              fullWidth
              margin="normal"
              value={editForm.endereco}
              onChange={e => setEditForm(f => ({ ...f, endereco: e.target.value }))}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditModal(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleUpdateCliente} disabled={saving || !editForm.nome || !editForm.cnpj}>
              {saving ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
