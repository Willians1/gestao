import React from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Input,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useMediaQuery,
  useTheme,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';

export default function Contratos() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { token, hasPermission } = useAuth();
  // const canRead = hasPermission('/contratos', 'read');
  const canCreate = hasPermission('/contratos', 'create');
  const canUpdate = hasPermission('/contratos', 'update');
  // const canDelete = hasPermission('/contratos', 'delete');
  const [rows, setRows] = React.useState([]);
  const [selectedContrato, setSelectedContrato] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  // const [total, setTotal] = React.useState(0);
  const [openModal, setOpenModal] = React.useState(false);
  const [form, setForm] = React.useState({
    numero: '',
    cliente_id: '',
    cliente: '',
    valor: '',
    dataInicio: '',
    dataFim: '',
    tipo: '',
    situacao: '',
    prazoPagamento: '',
    quantidadeParcelas: '',
  });
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [editForm, setEditForm] = React.useState({});
  const [clientes, setClientes] = React.useState([]); // Lista de clientes para o dropdown
  const [openFilter, setOpenFilter] = React.useState(false);
  const [filteredRows, setFilteredRows] = React.useState([]);
  const [filters, setFilters] = React.useState({
    searchText: '',
    orderBy: 'numero',
    orderDirection: 'asc',
    valorMin: '',
    valorMax: '',
    dataFimInicio: '',
    dataFimFim: '',
  });
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const importInputRef = React.useRef(null);

  const handleImportClick = () => importInputRef.current && importInputRef.current.click();
  const handleImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch(`${API}/api/uploads/contratos`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      if (!resp.ok) {
        let msg = 'Falha ao importar contratos. Certifique-se de usar o modelo.';
        try {
          const data = await resp.json();
          if (data && (data.detail || data.message)) msg = data.detail || data.message;
        } catch {}
        throw new Error(msg);
      }
      const result = await resp.json();
      await loadPersisted();
      alert(`Importação concluída. Registros processados: ${result.records_imported || 0}.`);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Erro ao importar contratos');
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };
  const handleDownloadTemplate = async () => {
    try {
      const resp = await fetch(`${API}/templates/contratos`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!resp.ok) throw new Error('Erro ao baixar modelo');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_contratos.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      alert('Falha ao baixar modelo de contratos');
    }
  };

  const handleDownloadAnexo = async (contratoId, filename) => {
    try {
      const resp = await fetch(`${API}/contratos/${contratoId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!resp.ok) throw new Error('Erro ao baixar arquivo');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `contrato_${contratoId}.bin`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      alert('Falha ao baixar arquivo');
    }
  };

  const calcularDiasRestantes = (dataFim) => {
    if (!dataFim) return null;

    const hoje = new Date();
    const dataLimite = new Date(dataFim);
    const diffTime = dataLimite - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { dias: `${Math.abs(diffDays)}d atraso`, cor: '#f44336', fontWeight: 'bold' };
    } else if (diffDays <= 7) {
      return { dias: `${diffDays}d restam`, cor: '#f44336', fontWeight: 'bold' }; // Vermelho para prazo curto/urgente
    } else if (diffDays <= 30) {
      return { dias: `${diffDays}d restam`, cor: '#ff9800', fontWeight: 'bold' }; // Amarelo para prazo intermediário
    } else {
      return { dias: `${diffDays}d restam`, cor: '#4caf50', fontWeight: 'normal' }; // Verde para prazo longo
    }
  };

  const loadPersisted = async () => {
    try {
      const response = await fetch(`${API}/contratos`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (response.ok) {
        const data = await response.json();
        setRows(data);
        setFilteredRows(data);
      } else if (response.status === 401 || response.status === 403) {
        setRows([]);
        setFilteredRows([]);
      }
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
    }
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

  const applyFilters = React.useCallback(() => {
    let filtered = [...rows];

    if (filters.searchText) {
      filtered = filtered.filter(
        (row) =>
          (row.numero || '').toString().toLowerCase().includes(filters.searchText.toLowerCase()) ||
          (row.cliente || '').toLowerCase().includes(filters.searchText.toLowerCase())
      );
    }

    if (filters.valorMin) {
      filtered = filtered.filter(
        (row) => parseFloat(row.valor || 0) >= parseFloat(filters.valorMin)
      );
    }

    if (filters.valorMax) {
      filtered = filtered.filter(
        (row) => parseFloat(row.valor || 0) <= parseFloat(filters.valorMax)
      );
    }

    if (filters.dataFimInicio) {
      filtered = filtered.filter((row) => row.dataFim >= filters.dataFimInicio);
    }

    if (filters.dataFimFim) {
      filtered = filtered.filter((row) => row.dataFim <= filters.dataFimFim);
    }

    filtered.sort((a, b) => {
      let aVal = a[filters.orderBy] || '';
      let bVal = b[filters.orderBy] || '';

      if (filters.orderBy === 'valor') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (filters.orderBy === 'dataFim') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (filters.orderDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredRows(filtered);
    setPage(0);
  }, [filters, rows]);

  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const loadPersistedCb = React.useCallback(loadPersisted, [API, token]);
  const loadClientesCb = React.useCallback(loadClientes, [API, token]);
  React.useEffect(() => {
    loadPersistedCb();
    loadClientesCb();
  }, [loadPersistedCb, loadClientesCb]);

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
        p: { xs: 1, sm: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            Voltar
          </Button>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 0,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            }}
          >
            Gestão de Contratos
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Gerencie seus contratos de forma eficiente
        </Typography>

        {/* Header com botões responsivos */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 3,
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flex: 1 }}>
            {canCreate && (
              <Button
                variant="contained"
                onClick={() => setOpenModal(true)}
                size={isMobile ? 'small' : 'medium'}
                sx={{ fontWeight: 600 }}
              >
                Novo Contrato
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => setOpenFilter(true)}
              size={isMobile ? 'small' : 'medium'}
            >
              Filtros
            </Button>
            {canCreate && (
              <>
                <input
                  type="file"
                  ref={importInputRef}
                  onChange={handleImportFile}
                  accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outlined"
                  onClick={handleImportClick}
                  size={isMobile ? 'small' : 'medium'}
                  title="Importe um Excel exatamente no padrão do modelo"
                >
                  Importar Excel
                </Button>
              </>
            )}
            <Button
              variant="text"
              onClick={handleDownloadTemplate}
              size={isMobile ? 'small' : 'medium'}
              title="Use este modelo para importar"
            >
              Baixar modelo
            </Button>
          </Stack>
        </Box>

        {/* Chips de filtro */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          {filters.searchText && (
            <Chip
              label={`Busca: ${filters.searchText}`}
              onDelete={() => setFilters((f) => ({ ...f, searchText: '' }))}
              size={isMobile ? 'small' : 'medium'}
            />
          )}
          {filters.orderBy !== 'numero' && (
            <Chip
              label={`Ordem: ${filters.orderBy} ${filters.orderDirection}`}
              onDelete={() =>
                setFilters((f) => ({ ...f, orderBy: 'numero', orderDirection: 'asc' }))
              }
              size={isMobile ? 'small' : 'medium'}
            />
          )}
          {(filters.valorMin || filters.valorMax) && (
            <Chip
              label="Filtro Valor"
              onDelete={() => setFilters((f) => ({ ...f, valorMin: '', valorMax: '' }))}
              size={isMobile ? 'small' : 'medium'}
            />
          )}
        </Stack>

        {/* Versão Desktop - Tabela */}
        {!isMobile ? (
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 0 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#f4f6f8' }}>
                  <TableCell sx={{ fontWeight: 700 }}>O.S</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Valor</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Data Início</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Data Fim</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Situação</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, idx) => {
                    const diasRestantes = calcularDiasRestantes(row.dataFim);
                    return (
                      <TableRow
                        key={row.id || idx}
                        hover
                        sx={{ borderBottom: '1px solid #e0e0e0' }}
                      >
                        <TableCell>{row.numero || ''}</TableCell>
                        <TableCell>{row.cliente || ''}</TableCell>
                        <TableCell>
                          {row.valor
                            ? `R$ ${parseFloat(row.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : ''}
                        </TableCell>
                        <TableCell>{row.dataInicio || ''}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{row.dataFim || ''}</span>
                            {diasRestantes && (
                              <Chip
                                label={diasRestantes.dias}
                                size="small"
                                sx={{
                                  backgroundColor: diasRestantes.cor,
                                  color: 'white',
                                  fontWeight: diasRestantes.fontWeight,
                                  fontSize: '0.75rem',
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{row.tipo || ''}</TableCell>
                        <TableCell>{row.situacao || ''}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => setSelectedContrato(row)}
                          >
                            Ver detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredRows.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Linhas por página:"
            />
          </TableContainer>
        ) : (
          /* Versão Mobile - Cards */
          <Box>
            {filteredRows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, idx) => {
                const diasRestantes = calcularDiasRestantes(row.dataFim);
                return (
                  <Card key={row.id || idx} sx={{ mb: 2, borderRadius: 2 }}>
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                          O.S #{row.numero || ''}
                        </Typography>
                        <Chip
                          label={row.situacao || ''}
                          size="small"
                          variant="outlined"
                          sx={{ backgroundColor: '#f5f5f5' }}
                        />
                      </Box>

                      <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                        {row.cliente || ''}
                      </Typography>

                      <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 600 }}>
                        {row.valor
                          ? `R$ ${parseFloat(row.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : ''}
                      </Typography>

                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Início
                          </Typography>
                          <Typography variant="body2">{row.dataInicio || ''}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Fim
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">{row.dataFim || ''}</Typography>
                            {diasRestantes && (
                              <Chip
                                label={diasRestantes.dias}
                                size="small"
                                sx={{
                                  backgroundColor: diasRestantes.cor,
                                  color: 'white',
                                  fontWeight: diasRestantes.fontWeight,
                                  fontSize: '0.7rem',
                                  height: 20,
                                }}
                              />
                            )}
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">
                            Tipo
                          </Typography>
                          <Typography variant="body2">{row.tipo || ''}</Typography>
                        </Grid>
                      </Grid>

                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => setSelectedContrato(row)}
                        fullWidth
                      >
                        Ver detalhes
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}

            {/* Paginação Mobile */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <TablePagination
                component="div"
                count={filteredRows.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25]}
                labelRowsPerPage="Por página:"
                sx={{
                  '& .MuiTablePagination-toolbar': {
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontSize: '0.875rem',
                  },
                }}
              />
            </Box>
          </Box>
        )}

        {/* Modal de Filtros */}
        <Dialog open={openFilter} onClose={() => setOpenFilter(false)} maxWidth="md" fullWidth>
          <DialogTitle>Filtros e Ordenação</DialogTitle>
          <DialogContent sx={{ minWidth: isMobile ? 300 : 500 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 2,
                mt: 1,
              }}
            >
              {/* Busca por texto */}
              <TextField
                label="Buscar por O.S ou Cliente"
                fullWidth
                value={filters.searchText}
                onChange={(e) => setFilters((f) => ({ ...f, searchText: e.target.value }))}
                placeholder="Digite para buscar..."
              />

              {/* Ordenação */}
              <FormControl fullWidth>
                <InputLabel>Ordenar por</InputLabel>
                <Select
                  value={filters.orderBy}
                  onChange={(e) => setFilters((f) => ({ ...f, orderBy: e.target.value }))}
                  label="Ordenar por"
                >
                  <MenuItem value="numero">O.S</MenuItem>
                  <MenuItem value="cliente">Cliente (A-Z)</MenuItem>
                  <MenuItem value="valor">Valor</MenuItem>
                  <MenuItem value="dataFim">Data Fim</MenuItem>
                </Select>
              </FormControl>

              {/* Direção da ordenação */}
              <FormControl fullWidth>
                <InputLabel>Direção</InputLabel>
                <Select
                  value={filters.orderDirection}
                  onChange={(e) => setFilters((f) => ({ ...f, orderDirection: e.target.value }))}
                  label="Direção"
                >
                  <MenuItem value="asc">Crescente (A-Z, Menor-Maior, Mais próximo)</MenuItem>
                  <MenuItem value="desc">Decrescente (Z-A, Maior-Menor, Mais distante)</MenuItem>
                </Select>
              </FormControl>

              {/* Valor mínimo */}
              <TextField
                label="Valor Mínimo (R$)"
                type="number"
                fullWidth
                value={filters.valorMin}
                onChange={(e) => setFilters((f) => ({ ...f, valorMin: e.target.value }))}
                placeholder="0.00"
              />

              {/* Valor máximo */}
              <TextField
                label="Valor Máximo (R$)"
                type="number"
                fullWidth
                value={filters.valorMax}
                onChange={(e) => setFilters((f) => ({ ...f, valorMax: e.target.value }))}
                placeholder="0.00"
              />

              {/* Data fim início */}
              <TextField
                label="Data Fim - A partir de"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.dataFimInicio}
                onChange={(e) => setFilters((f) => ({ ...f, dataFimInicio: e.target.value }))}
              />

              {/* Data fim final */}
              <TextField
                label="Data Fim - Até"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.dataFimFim}
                onChange={(e) => setFilters((f) => ({ ...f, dataFimFim: e.target.value }))}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setFilters({
                  searchText: '',
                  orderBy: 'numero',
                  orderDirection: 'asc',
                  valorMin: '',
                  valorMax: '',
                  dataFimInicio: '',
                  dataFimFim: '',
                });
              }}
            >
              Limpar Filtros
            </Button>
            <Button onClick={() => setOpenFilter(false)}>Fechar</Button>
          </DialogActions>
        </Dialog>

        {/* Modal de cadastro */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Novo Contrato</DialogTitle>
          <DialogContent>
            <TextField
              margin="normal"
              label="Número O.S"
              fullWidth
              value={form.numero}
              onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Cliente</InputLabel>
              <Select
                value={form.cliente_id}
                label="Cliente"
                onChange={(e) => {
                  const clienteId = e.target.value;
                  const cliente = clientes.find((c) => c.id === clienteId);
                  setForm((f) => ({
                    ...f,
                    cliente_id: clienteId,
                    cliente: cliente ? cliente.nome : '',
                  }));
                }}
              >
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.id} value={cliente.id}>
                    ID: {cliente.id} - {cliente.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              label="Valor (R$)"
              type="number"
              fullWidth
              value={form.valor}
              onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
            />
            <TextField
              margin="normal"
              label="Data Início"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.dataInicio}
              onChange={(e) => setForm((f) => ({ ...f, dataInicio: e.target.value }))}
            />
            <TextField
              margin="normal"
              label="Data Fim"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.dataFim}
              onChange={(e) => setForm((f) => ({ ...f, dataFim: e.target.value }))}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                label="Tipo"
              >
                <MenuItem value="Obra">Obra</MenuItem>
                <MenuItem value="Reforma">Reforma</MenuItem>
                <MenuItem value="Manutenção">Manutenção</MenuItem>
                <MenuItem value="Serviços">Serviços</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Situação</InputLabel>
              <Select
                value={form.situacao}
                onChange={(e) => setForm((f) => ({ ...f, situacao: e.target.value }))}
                label="Situação"
              >
                <MenuItem value="Em andamento">Em andamento</MenuItem>
                <MenuItem value="Concluído">Concluído</MenuItem>
                <MenuItem value="Cancelado">Cancelado</MenuItem>
                <MenuItem value="Pausado">Pausado</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Prazo de Pagamento</InputLabel>
              <Select
                value={form.prazoPagamento}
                onChange={(e) => setForm((f) => ({ ...f, prazoPagamento: e.target.value }))}
                label="Prazo de Pagamento"
              >
                <MenuItem value="À vista">À vista</MenuItem>
                {Array.from({ length: 180 }, (_, i) => i + 1).map((dias) => (
                  <MenuItem key={dias} value={`${dias} DD`}>
                    {dias} DD
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Quantidade de Parcelas</InputLabel>
              <Select
                value={form.quantidadeParcelas}
                onChange={(e) => setForm((f) => ({ ...f, quantidadeParcelas: e.target.value }))}
                label="Quantidade de Parcelas"
              >
                <MenuItem value="1">1x</MenuItem>
                {Array.from({ length: 36 }, (_, i) => i + 2).map((parcelas) => (
                  <MenuItem key={parcelas} value={parcelas}>
                    {parcelas}x
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              sx={{ mt: 2 }}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={async () => {
                if (!form.cliente_id) {
                  alert('Por favor, selecione um cliente');
                  return;
                }

                setSaving(true);
                try {
                  const formData = new FormData();
                  Object.keys(form).forEach((key) => formData.append(key, form[key]));
                  if (selectedFile) formData.append('arquivo', selectedFile);

                  const response = await fetch(`${API}/contratos`, {
                    method: 'POST',
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    body: formData,
                  });

                  if (response.ok) {
                    await loadPersisted();
                    setForm({
                      numero: '',
                      cliente_id: '',
                      cliente: '',
                      valor: '',
                      dataInicio: '',
                      dataFim: '',
                      tipo: '',
                      situacao: '',
                      prazoPagamento: '',
                      quantidadeParcelas: '',
                    });
                    setSelectedFile(null);
                    setOpenModal(false);
                  } else {
                    alert('Erro ao criar contrato');
                  }
                } catch (e) {
                  alert('Erro ao criar contrato');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !canCreate}
            >
              {saving ? 'Salvando...' : 'Criar contrato'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de detalhes do contrato */}
        <Dialog
          open={!!selectedContrato}
          onClose={() => setSelectedContrato(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{editMode ? 'Editar Contrato' : 'Detalhes do Contrato'}</DialogTitle>
          <DialogContent>
            {selectedContrato && (
              <Box sx={{ mt: 1 }}>
                {!editMode ? (
                  <>
                    <Typography>
                      <b>O.S:</b> {selectedContrato.numero}
                    </Typography>
                    <Typography>
                      <b>Cliente:</b> {selectedContrato.cliente}
                    </Typography>
                    <Typography>
                      <b>Valor:</b> R${' '}
                      {parseFloat(selectedContrato.valor || 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                    <Typography>
                      <b>Data Início:</b> {selectedContrato.dataInicio}
                    </Typography>
                    <Typography>
                      <b>Data Fim:</b> {selectedContrato.dataFim}
                    </Typography>
                    <Typography>
                      <b>Tipo:</b> {selectedContrato.tipo}
                    </Typography>
                    <Typography>
                      <b>Situação:</b> {selectedContrato.situacao}
                    </Typography>
                    <Typography>
                      <b>Prazo Pagamento:</b> {selectedContrato.prazoPagamento}
                    </Typography>
                    <Typography>
                      <b>Parcelas:</b> {selectedContrato.quantidadeParcelas}
                    </Typography>

                    {selectedContrato.arquivo && (
                      <Box sx={{ mt: 2 }}>
                        <Typography>
                          <b>Anexo:</b>
                        </Typography>
                        <Button
                          variant="outlined"
                          sx={{ mt: 1 }}
                          onClick={() =>
                            handleDownloadAnexo(selectedContrato.id, selectedContrato.arquivo)
                          }
                        >
                          Baixar arquivo ({selectedContrato.arquivo})
                        </Button>
                      </Box>
                    )}
                  </>
                ) : (
                  <>
                    <TextField
                      margin="normal"
                      label="Número O.S"
                      fullWidth
                      value={editForm.numero || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, numero: e.target.value }))}
                    />

                    <FormControl fullWidth margin="normal">
                      <InputLabel>Cliente</InputLabel>
                      <Select
                        value={editForm.cliente_id || ''}
                        label="Cliente"
                        onChange={(e) => {
                          const clienteId = e.target.value;
                          const cliente = clientes.find((c) => c.id === clienteId);
                          setEditForm((f) => ({
                            ...f,
                            cliente_id: clienteId,
                            cliente: cliente ? cliente.nome : '',
                          }));
                        }}
                      >
                        {clientes.map((cliente) => (
                          <MenuItem key={cliente.id} value={cliente.id}>
                            ID: {cliente.id} - {cliente.nome}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      margin="normal"
                      label="Valor (R$)"
                      type="number"
                      fullWidth
                      value={editForm.valor || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, valor: e.target.value }))}
                    />
                    <TextField
                      margin="normal"
                      label="Data Início"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={editForm.dataInicio || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, dataInicio: e.target.value }))}
                    />
                    <TextField
                      margin="normal"
                      label="Data Fim"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={editForm.dataFim || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, dataFim: e.target.value }))}
                    />

                    <FormControl fullWidth margin="normal">
                      <InputLabel>Tipo</InputLabel>
                      <Select
                        value={editForm.tipo || ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, tipo: e.target.value }))}
                        label="Tipo"
                      >
                        <MenuItem value="Obra">Obra</MenuItem>
                        <MenuItem value="Reforma">Reforma</MenuItem>
                        <MenuItem value="Manutenção">Manutenção</MenuItem>
                        <MenuItem value="Serviços">Serviços</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal">
                      <InputLabel>Situação</InputLabel>
                      <Select
                        value={editForm.situacao || ''}
                        onChange={(e) => setEditForm((f) => ({ ...f, situacao: e.target.value }))}
                        label="Situação"
                      >
                        <MenuItem value="Em andamento">Em andamento</MenuItem>
                        <MenuItem value="Concluído">Concluído</MenuItem>
                        <MenuItem value="Cancelado">Cancelado</MenuItem>
                        <MenuItem value="Pausado">Pausado</MenuItem>
                      </Select>
                    </FormControl>

                    {selectedContrato.arquivo && (
                      <Box sx={{ mt: 2 }}>
                        <Typography>
                          <b>Anexo atual:</b>
                        </Typography>
                        <Button
                          variant="outlined"
                          sx={{ mt: 1 }}
                          onClick={() =>
                            handleDownloadAnexo(selectedContrato.id, selectedContrato.arquivo)
                          }
                        >
                          Baixar arquivo ({selectedContrato.arquivo})
                        </Button>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {!editMode ? (
              <>
                {canUpdate && (
                  <Button
                    onClick={() => {
                      setEditMode(true);
                      setEditForm({
                        numero: selectedContrato.numero,
                        cliente_id: selectedContrato.cliente_id,
                        cliente: selectedContrato.cliente,
                        valor: selectedContrato.valor,
                        dataInicio: selectedContrato.dataInicio,
                        dataFim: selectedContrato.dataFim,
                        tipo: selectedContrato.tipo,
                        situacao: selectedContrato.situacao,
                        prazoPagamento: selectedContrato.prazoPagamento,
                        quantidadeParcelas: selectedContrato.quantidadeParcelas,
                      });
                    }}
                  >
                    Editar
                  </Button>
                )}
                <Button onClick={() => setSelectedContrato(null)}>Fechar</Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setEditMode(false);
                    setEditForm({});
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const response = await fetch(`${API}/contratos/${selectedContrato.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify(editForm),
                      });

                      if (response.ok) {
                        await loadPersisted();
                        setSelectedContrato(null);
                        setEditMode(false);
                        setEditForm({});
                      } else {
                        alert('Erro ao atualizar contrato');
                      }
                    } catch (e) {
                      alert('Erro ao atualizar contrato');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving || !canUpdate}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Status */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          {filteredRows.length === 0
            ? 'Nenhum contrato encontrado'
            : `${filteredRows.length} contratos encontrados`}
        </Typography>
      </Box>
    </Box>
  );
}
