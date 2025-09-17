import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  IconButton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Add,
  PhotoCamera,
  CheckCircle,
  Cancel,
  FilterList,
  DateRange,
  Person,
  Edit,
  Delete,
  Home,
  NavigateNext,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../api';
import { getLojaNome } from '../utils/lojas';
import { formatDateTimeBr } from '../utils/datetime';

export default function TestesLoja() {
  const navigate = useNavigate();
  const [testes, setTestes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [meClientes, setMeClientes] = useState([]);
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    clienteId: '',
    status: '',
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetalhesDialog, setOpenDetalhesDialog] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [testeDetalhes, setTesteDetalhes] = useState(null);
  const [editandoTeste, setEditandoTeste] = useState(null);
  const [novoTeste, setNovoTeste] = useState({
    data_teste: new Date().toISOString().split('T')[0],
    cliente_id: '',
    horario: '',
    foto: null,
    video: null,
    status: 'OK',
    observacao: '',
  });

  // Função para obter horário atual no formato HH:MM
  const getHorarioAtual = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Carregar dados iniciais
  useEffect(() => {
    carregarTestes();
    carregarClientes();
    carregarMeClientes();
  }, []);

  const carregarMeClientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/me/clientes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        setMeClientes(Array.isArray(data?.clientes) ? data.clientes : []);
      }
    } catch (e) {
      /* ignore */
    }
  };

  // Abrir detalhes automaticamente se houver query param ?id=... e opcional ?tipo=gerador|ar
  const location = useLocation();
  useEffect(() => {
    try {
      const qp = new URLSearchParams(location.search);
      const id = qp.get('id');
      if (id) {
        const found = testes.find((t) => String(t.id) === String(id));
        if (found) {
          setTesteDetalhes(found);
          setOpenDetalhesDialog(true);
          // remover query param da URL para não manter ?id= após abrir
          try {
            navigate(location.pathname, { replace: true });
          } catch (e) {
            /* ignore */
          }
        } else {
          // tentar buscar do backend apenas esse teste
          (async () => {
            try {
              const token = localStorage.getItem('token');
              const res = await fetch(`${API_BASE}/testes-loja/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              });
              if (res.ok) {
                const data = await res.json();
                setTesteDetalhes(data);
                setOpenDetalhesDialog(true);
                try {
                  navigate(location.pathname, { replace: true });
                } catch (e) {
                  /* ignore */
                }
              }
            } catch (e) {
              /* ignore */
            }
          })();
        }
      }
    } catch (e) {
      /* ignore */
    }
  }, [location.search, location.pathname, navigate, testes]);

  const carregarTestes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/testes-loja/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (response.ok) {
        const data = await response.json();
        setTestes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar testes:', error);
    }
  };

  const carregarClientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/clientes/`, {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação de observação obrigatória para status OFF
    if (
      novoTeste.status === 'OFF' &&
      (!novoTeste.observacao || novoTeste.observacao.trim().length === 0)
    ) {
      setSnackbar({
        open: true,
        message: 'Observação é obrigatória quando o status for OFF',
        severity: 'error',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('data_teste', novoTeste.data_teste);
      formData.append('cliente_id', novoTeste.cliente_id);
      formData.append('horario', novoTeste.horario);
      formData.append('status', novoTeste.status);
      if (novoTeste.observacao) {
        formData.append('observacao', novoTeste.observacao);
      }
      if (novoTeste.foto) {
        formData.append('foto', novoTeste.foto);
      }
      if (novoTeste.video) {
        formData.append('video', novoTeste.video);
      }

      const url = editandoTeste
        ? `${API_BASE}/testes-loja/${editandoTeste.id}`
        : `${API_BASE}/testes-loja/`;
      const method = editandoTeste ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        body: formData,
        headers: (() => {
          const token = localStorage.getItem('token');
          return token ? { Authorization: `Bearer ${token}` } : undefined;
        })(),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: editandoTeste ? 'Teste atualizado com sucesso!' : 'Teste salvo com sucesso!',
          severity: 'success',
        });
        fecharDialogo();
        carregarTestes();
      } else {
        // Tentar capturar o erro detalhado do backend
        const errorData = await response.text();
        console.error('Erro da API:', response.status, errorData);
        let errorMessage = editandoTeste ? 'Erro ao atualizar teste' : 'Erro ao salvar teste';
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.detail) {
            errorMessage += `: ${errorJson.detail}`;
          }
        } catch (e) {
          errorMessage += `: ${errorData}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error',
      });
    }
  };

  const handleFotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNovoTeste((prev) => ({ ...prev, foto: file }));
    }
  };

  const handleVideoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Verificar tamanho do arquivo (10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB em bytes
      if (file.size > maxSize) {
        setSnackbar({
          open: true,
          message: 'O arquivo de vídeo não pode exceder 10MB',
          severity: 'error',
        });
        return;
      }
      setNovoTeste((prev) => ({ ...prev, video: file }));
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpenImageDialog(true);
  };

  const filtrarTestes = () => {
    let testesFiltrados = [...testes];

    if (filtros.dataInicio) {
      testesFiltrados = testesFiltrados.filter((teste) => teste.data_teste >= filtros.dataInicio);
    }

    if (filtros.dataFim) {
      testesFiltrados = testesFiltrados.filter((teste) => teste.data_teste <= filtros.dataFim);
    }

    if (filtros.clienteId) {
      testesFiltrados = testesFiltrados.filter(
        (teste) => teste.cliente_id === parseInt(filtros.clienteId)
      );
    }

    if (filtros.status) {
      testesFiltrados = testesFiltrados.filter((teste) => teste.status === filtros.status);
    }

    return testesFiltrados;
  };

  // Função para abrir o diálogo com data e hora atuais
  const abrirDialogoNovoTeste = () => {
    setEditandoTeste(null);
    // se houver exatamente um cliente permitido, fixar
    const fixedClienteId = meClientes && meClientes.length === 1 ? Number(meClientes[0]) : '';
    setNovoTeste({
      data_teste: new Date().toISOString().split('T')[0],
      cliente_id: fixedClienteId,
      horario: getHorarioAtual(),
      foto: null,
      video: null,
      status: 'OK',
      observacao: '',
    });
    setOpenDialog(true);
  };

  // Função para abrir o diálogo de edição
  const abrirDialogoEdicao = (teste) => {
    setEditandoTeste(teste);
    setNovoTeste({
      data_teste: teste.data_teste,
      cliente_id: teste.cliente_id,
      horario: teste.horario,
      foto: null, // Não carregamos a foto existente para edição
      video: null, // Não carregamos o vídeo existente para edição
      status: teste.status,
      observacao: teste.observacao || '',
    });
    setOpenDialog(true);
  };

  // Função para fechar o diálogo
  const fecharDialogo = () => {
    setOpenDialog(false);
    setEditandoTeste(null);
    setNovoTeste({
      data_teste: new Date().toISOString().split('T')[0],
      cliente_id: '',
      horario: getHorarioAtual(),
      foto: null,
      video: null,
      status: 'OK',
      observacao: '',
    });
  };

  // Função para deletar teste
  const deletarTeste = async (testeId) => {
    if (window.confirm('Tem certeza que deseja deletar este teste?')) {
      try {
        const response = await fetch(`${API_BASE}/testes-loja/${testeId}`, {
          method: 'DELETE',
          headers: (() => {
            const token = localStorage.getItem('token');
            return token ? { Authorization: `Bearer ${token}` } : undefined;
          })(),
        });

        if (response.ok) {
          setSnackbar({
            open: true,
            message: 'Teste deletado com sucesso!',
            severity: 'success',
          });
          carregarTestes();
        } else {
          throw new Error('Erro ao deletar teste');
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Erro ao deletar teste: ' + error.message,
          severity: 'error',
        });
      }
    }
  };

  const abrirDetalhes = (teste) => {
    setTesteDetalhes(teste);
    setOpenDetalhesDialog(true);
  };

  const fecharDetalhes = () => {
    setTesteDetalhes(null);
    setOpenDetalhesDialog(false);
  };

  const getClienteNome = (clienteId) => getLojaNome(clienteId, clientes);

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
        <Link
          underline="hover"
          color="inherit"
          href="#"
          onClick={() => navigate('/')}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Link
          underline="hover"
          color="inherit"
          href="#"
          onClick={() => navigate('/testes-loja-menu')}
        >
          Testes de Loja
        </Link>
        <Typography color="text.primary">Testes de Gerador</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
          Testes de Gerador
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={abrirDialogoNovoTeste}
          sx={{
            backgroundColor: '#EF5350',
            '&:hover': { backgroundColor: '#D32F2F' },
          }}
        >
          Novo Teste
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <FilterList sx={{ mr: 1 }} />
          Filtros de Busca
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              type="date"
              label="Data Início"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros((prev) => ({ ...prev, dataInicio: e.target.value }))}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              type="date"
              label="Data Fim"
              value={filtros.dataFim}
              onChange={(e) => setFiltros((prev) => ({ ...prev, dataFim: e.target.value }))}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Cliente"
              value={filtros.clienteId}
              onChange={(e) => setFiltros((prev) => ({ ...prev, clienteId: e.target.value }))}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">Todos os clientes</MenuItem>
              {clientes.map((cliente) => (
                <MenuItem key={cliente.id} value={cliente.id}>
                  {getClienteNome(cliente.id)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              select
              label="Status"
              value={filtros.status}
              onChange={(e) => setFiltros((prev) => ({ ...prev, status: e.target.value }))}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">Todos os status</MenuItem>
              <MenuItem value="OK">OK - Funcionando</MenuItem>
              <MenuItem value="OFF">OFF - Desligado</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={12} md={1.5}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setFiltros({ dataInicio: '', dataFim: '', clienteId: '', status: '' })}
            >
              Limpar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de Testes */}
      <Grid container spacing={3}>
        {filtrarTestes().map((teste) => (
          <Grid item xs={12} sm={6} md={4} key={teste.id}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: (theme) => theme.shadows[8],
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
              onClick={() => abrirDetalhes(teste)}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Teste #{teste.id}
                  </Typography>
                  <Chip
                    icon={teste.status === 'OK' ? <CheckCircle /> : <Cancel />}
                    label={teste.status}
                    color={teste.status === 'OK' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <DateRange sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatDateTimeBr(teste.data_teste, teste.horario)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    {getClienteNome(teste.cliente_id)}
                  </Typography>
                </Box>

                {teste.foto && (
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Avatar
                      src={`${API_BASE}/uploads/testes-loja/${teste.foto}`}
                      sx={{ width: 60, height: 60, mx: 'auto', cursor: 'pointer' }}
                      variant="rounded"
                      onClick={() =>
                        handleImageClick(`${API_BASE}/uploads/testes-loja/${teste.foto}`)
                      }
                    />
                  </Box>
                )}

                {teste.video && (
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="caption" color="primary">
                      📹 Vídeo disponível
                    </Typography>
                  </Box>
                )}

                {teste.observacao && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1,
                      backgroundColor: teste.status === 'OFF' ? '#ffebee' : '#e8f5e8',
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color={teste.status === 'OFF' ? 'error' : 'success'}
                    >
                      Observação: {teste.observacao}
                    </Typography>
                  </Box>
                )}
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirDialogoEdicao(teste);
                    }}
                    sx={{ color: '#1976d2', mr: 1 }}
                    title="Editar teste"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletarTeste(teste.id);
                    }}
                    sx={{ color: '#d32f2f' }}
                    title="Deletar teste"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={fecharDialogo} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editandoTeste ? `Editar Teste #${editandoTeste.id}` : 'Novo Teste de Gerador'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  label="Data do Teste"
                  value={novoTeste.data_teste}
                  onChange={(e) =>
                    setNovoTeste((prev) => ({ ...prev, data_teste: e.target.value }))
                  }
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="time"
                  label="Horário"
                  value={novoTeste.horario}
                  onChange={(e) => setNovoTeste((prev) => ({ ...prev, horario: e.target.value }))}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                {meClientes && meClientes.length === 1 ? (
                  <TextField
                    label="Cliente"
                    value={getClienteNome(Number(meClientes[0]))}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                ) : (
                  <FormControl fullWidth required>
                    <InputLabel>Cliente</InputLabel>
                    <Select
                      value={String(novoTeste.cliente_id || '')}
                      onChange={(e) =>
                        setNovoTeste((prev) => ({ ...prev, cliente_id: Number(e.target.value) }))
                      }
                      label="Cliente"
                    >
                      <MenuItem value="" disabled>
                        Selecione o cliente
                      </MenuItem>
                      {(clientes && clientes.length > 0
                        ? clientes.map((c) => c.id)
                        : Array.from({ length: 16 }, (_, i) => i + 1)
                      ).map((id) => (
                        <MenuItem key={id} value={String(id)}>
                          {getClienteNome(id)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={novoTeste.status}
                    onChange={(e) => setNovoTeste((prev) => ({ ...prev, status: e.target.value }))}
                    label="Status"
                  >
                    <MenuItem value="OK">OK - Funcionamento Correto</MenuItem>
                    <MenuItem value="OFF">OFF - Desligado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {/* Campo de observação - agora opcional para OK e obrigatório para OFF */}
              <Grid item xs={12}>
                <TextField
                  label={
                    novoTeste.status === 'OFF'
                      ? 'Observação (Obrigatória)'
                      : 'Observação (Opcional)'
                  }
                  value={novoTeste.observacao}
                  onChange={(e) =>
                    setNovoTeste((prev) => ({ ...prev, observacao: e.target.value }))
                  }
                  fullWidth
                  multiline
                  rows={3}
                  inputProps={{ maxLength: 150 }}
                  helperText={`${novoTeste.observacao.length}/150 caracteres`}
                  required={novoTeste.status === 'OFF'}
                  placeholder={
                    novoTeste.status === 'OK'
                      ? 'Adicione uma observação se necessário...'
                      : 'Descreva o problema encontrado...'
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Button variant="outlined" component="label" startIcon={<PhotoCamera />} fullWidth>
                  {novoTeste.foto ? novoTeste.foto.name : 'Adicionar Foto (Opcional)'}
                  <input type="file" hidden accept="image/*" onChange={handleFotoChange} />
                </Button>
                {novoTeste.foto && (
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ mt: 0.5, color: 'success.main' }}
                  >
                    ✓ Foto selecionada: {novoTeste.foto.name}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCamera />}
                  fullWidth
                  color="secondary"
                >
                  {novoTeste.video ? novoTeste.video.name : 'Adicionar Vídeo (Opcional - Max 10MB)'}
                  <input type="file" hidden accept="video/*" onChange={handleVideoChange} />
                </Button>
                {novoTeste.video && (
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ mt: 0.5, color: 'success.main' }}
                  >
                    ✓ Vídeo selecionado: {novoTeste.video.name}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={fecharDialogo}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {editandoTeste ? 'Atualizar Teste' : 'Salvar Teste'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Diálogo de Detalhes do Teste */}
      <Dialog open={openDetalhesDialog} onClose={fecharDetalhes} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Detalhes do Teste #{testeDetalhes?.id}
            </Typography>
            <Chip
              icon={testeDetalhes?.status === 'OK' ? <CheckCircle /> : <Cancel />}
              label={
                testeDetalhes?.status === 'OK' ? 'OK - Funcionamento Correto' : 'OFF - Desligado'
              }
              color={testeDetalhes?.status === 'OK' ? 'success' : 'error'}
              size="medium"
            />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {testeDetalhes && (
            <Grid container spacing={3}>
              {/* Informações Básicas */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                    📋 Informações do Teste
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Data do Teste
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatDateTimeBr(testeDetalhes.data_teste, testeDetalhes.horario)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Horário
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {testeDetalhes.horario}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Cliente
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {getClienteNome(testeDetalhes.cliente_id)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {testeDetalhes.status === 'OK' ? 'Funcionamento Correto' : 'Desligado'}
                    </Typography>
                  </Box>

                  {testeDetalhes.observacao && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Observações
                      </Typography>
                      <Paper
                        sx={{
                          p: 2,
                          mt: 1,
                          backgroundColor: testeDetalhes.status === 'OFF' ? '#ffebee' : '#e8f5e8',
                          border: `1px solid ${testeDetalhes.status === 'OFF' ? '#ffcdd2' : '#c8e6c8'}`,
                        }}
                      >
                        <Typography variant="body2">{testeDetalhes.observacao}</Typography>
                      </Paper>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Criado em
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTimeBr(testeDetalhes.criado_em)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Mídia */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                    🎬 Arquivos de Mídia
                  </Typography>

                  {/* Foto */}
                  {testeDetalhes.foto ? (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        📸 Foto do Teste
                      </Typography>
                      <Box
                        sx={{
                          border: '2px solid #e0e0e0',
                          borderRadius: 2,
                          overflow: 'hidden',
                          backgroundColor: '#f5f5f5',
                          cursor: 'pointer',
                        }}
                      >
                        <img
                          src={`${API_BASE}/uploads/testes-loja/${testeDetalhes.foto}`}
                          alt="Foto do teste"
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '200px',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                          onClick={() =>
                            handleImageClick(
                              `${API_BASE}/uploads/testes-loja/${testeDetalhes.foto}`
                            )
                          }
                        />
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        📸 Foto do Teste
                      </Typography>
                      <Paper
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          backgroundColor: '#f9f9f9',
                          border: '2px dashed #e0e0e0',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Nenhuma foto disponível
                        </Typography>
                      </Paper>
                    </Box>
                  )}

                  {/* Vídeo */}
                  {testeDetalhes.video ? (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        🎥 Vídeo do Teste
                      </Typography>
                      <Box
                        sx={{
                          border: '2px solid #e0e0e0',
                          borderRadius: 2,
                          overflow: 'hidden',
                          backgroundColor: '#000',
                        }}
                      >
                        <video
                          controls
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '200px',
                            display: 'block',
                          }}
                        >
                          <source
                            src={`${API_BASE}/uploads/testes-loja/${testeDetalhes.video}`}
                            type="video/mp4"
                          />
                          Seu navegador não suporta o elemento de vídeo.
                        </video>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        🎥 Vídeo do Teste
                      </Typography>
                      <Paper
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          backgroundColor: '#f9f9f9',
                          border: '2px dashed #e0e0e0',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Nenhum vídeo disponível
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={fecharDetalhes} variant="outlined">
            Fechar
          </Button>
          <Button
            onClick={() => {
              fecharDetalhes();
              abrirDialogoEdicao(testeDetalhes);
            }}
            variant="contained"
            startIcon={<Edit />}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': { backgroundColor: '#1565c0' },
            }}
          >
            Editar Teste
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Zoom da Imagem */}
      <Dialog
        open={openImageDialog}
        onClose={() => setOpenImageDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Visualização da Foto</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <img
              src={selectedImage}
              alt="Foto ampliada"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                transform: 'scale(2)',
                transformOrigin: 'center center',
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImageDialog(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensagens */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
