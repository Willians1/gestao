import React from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { API_BASE } from '../api';
import { formatDateTimeBr } from '../utils/datetime';
import { useAuth } from '../contexts/AuthContext';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';

function Despesas() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { token } = useAuth();
  const handleDownloadTemplate = async () => {
    try {
      const resp = await fetch(`${API_BASE}/templates/despesas`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error('Erro ao baixar modelo');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_despesas.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      setSnackbar({ open: true, message: 'Falha ao baixar modelo de despesas', severity: 'error' });
    }
  };
  // const canRead = hasPermission('/despesas', 'read');
  // const canCreate = hasPermission('/despesas', 'create');
  // const canUpdate = hasPermission('/despesas', 'update');
  // const canDelete = hasPermission('/despesas', 'delete');

  // Estados principais
  const [despesas, setDespesas] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  // Estados para modais
  const [openModal, setOpenModal] = React.useState(false);
  // const [openEditModal, setOpenEditModal] = React.useState(false);
  // const [editingDespesa, setEditingDespesa] = React.useState(null);

  // Estados para upload de Excel
  const [openUploadModal, setOpenUploadModal] = React.useState(false);
  const [uploadFile, setUploadFile] = React.useState(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  // Estados para formulário
  const [formData, setFormData] = React.useState({
    id_cliente: '',
    servico: '',
    valor: '',
    data: '',
    categoria: '',
    status: 'Pendente',
    observacoes: '',
  });

  // Estados para notificações
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Carregar despesas
  const loadDespesas = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/despesas`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setDespesas(data);
      } else {
        throw new Error('Erro ao carregar despesas');
      }
    } catch (e) {
      console.error(e);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar despesas',
        severity: 'error',
      });
    }
    setLoading(false);
  }, [token]);

  React.useEffect(() => {
    loadDespesas();
  }, [loadDespesas]);

  // Handlers do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${API_BASE}/despesas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setOpenModal(false);
        setFormData({
          id_cliente: '',
          servico: '',
          valor: '',
          data: '',
          categoria: '',
          status: 'Pendente',
          observacoes: '',
        });
        loadDespesas();
        setSnackbar({
          open: true,
          message: 'Despesa adicionada com sucesso!',
          severity: 'success',
        });
      } else {
        throw new Error('Erro ao adicionar despesa');
      }
    } catch (e) {
      console.error(e);
      setSnackbar({
        open: true,
        message: 'Erro ao adicionar despesa',
        severity: 'error',
      });
    }
  };

  // Handler para upload de Excel
  const handleFileUpload = async () => {
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('file', uploadFile);

    setUploadProgress(0);
    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress((e.loaded / e.total) * 100);
        }
      };

      xhr.onload = function () {
        if (xhr.status === 200) {
          setOpenUploadModal(false);
          setUploadFile(null);
          setUploadProgress(0);
          loadDespesas();
          setSnackbar({
            open: true,
            message: 'Arquivo Excel importado com sucesso!',
            severity: 'success',
          });
        } else {
          throw new Error('Erro no upload');
        }
      };

      xhr.onerror = function () {
        throw new Error('Erro de conexão');
      };

      xhr.open('POST', `${API_BASE}/despesas/upload-excel`);
      xhr.send(formData);
    } catch (e) {
      console.error(e);
      setSnackbar({
        open: true,
        message: 'Erro ao importar arquivo Excel',
        severity: 'error',
      });
      setUploadProgress(0);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pago':
        return 'success';
      case 'pendente':
        return 'warning';
      case 'cancelado':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box
      sx={{
        background: theme.palette.background.default,
        minHeight: '100vh',
        p: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Cabeçalho */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 } }}>
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{ mr: 2 }}
            >
              Voltar
            </Button>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Despesas
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setOpenUploadModal(true)}
              size={isMobile ? 'small' : 'medium'}
            >
              Importar Excel
            </Button>
            <Button
              variant="text"
              onClick={handleDownloadTemplate}
              size={isMobile ? 'small' : 'medium'}
            >
              Baixar modelo
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenModal(true)}
              size={isMobile ? 'small' : 'medium'}
            >
              Nova Despesa
            </Button>
          </Box>
        </Box>

        {/* Loading */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Tabela */}
        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ backgroundColor: theme.palette.primary.main }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID Cliente</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Serviço</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Valor</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Data</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Categoria</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {despesas.map((despesa, index) => (
                <TableRow key={despesa.id || index} hover>
                  <TableCell>{despesa.id_cliente}</TableCell>
                  <TableCell>{despesa.servico}</TableCell>
                  <TableCell>
                    R${' '}
                    {Number(despesa.valor || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>{despesa.data ? formatDateTimeBr(despesa.data) : '-'}</TableCell>
                  <TableCell>{despesa.categoria}</TableCell>
                  <TableCell>
                    <Chip
                      label={despesa.status}
                      color={getStatusColor(despesa.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Visualizar">
                        <IconButton size="small" color="primary">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {despesas.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma despesa encontrada
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Modal de Nova Despesa */}
        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>Nova Despesa</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                name="id_cliente"
                label="ID Cliente"
                value={formData.id_cliente}
                onChange={handleInputChange}
                fullWidth
                required
              />
              <TextField
                name="servico"
                label="Serviço"
                value={formData.servico}
                onChange={handleInputChange}
                fullWidth
                required
              />
              <TextField
                name="valor"
                label="Valor"
                type="number"
                value={formData.valor}
                onChange={handleInputChange}
                fullWidth
                required
                inputProps={{ step: '0.01' }}
              />
              <TextField
                name="data"
                label="Data"
                type="date"
                value={formData.data}
                onChange={handleInputChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                name="categoria"
                label="Categoria"
                value={formData.categoria}
                onChange={handleInputChange}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label="Status"
                >
                  <MenuItem value="Pendente">Pendente</MenuItem>
                  <MenuItem value="Pago">Pago</MenuItem>
                  <MenuItem value="Cancelado">Cancelado</MenuItem>
                </Select>
              </FormControl>
              <TextField
                name="observacoes"
                label="Observações"
                value={formData.observacoes}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained">
              Salvar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Upload Excel */}
        <Dialog
          open={openUploadModal}
          onClose={() => setOpenUploadModal(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Importar Arquivo Excel</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                O arquivo deve conter as colunas: ID Cliente, Serviço, Valor, Data, Categoria,
                Status, Observações
              </Alert>

              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files[0])}
                style={{ marginBottom: 16, width: '100%' }}
              />

              {uploadProgress > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Progresso do upload: {Math.round(uploadProgress)}%
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenUploadModal(false)}>Cancelar</Button>
            <Button
              onClick={handleFileUpload}
              variant="contained"
              disabled={!uploadFile || uploadProgress > 0}
            >
              Importar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para notificações */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

export default Despesas;
