import React from 'react';
import { 
  Box, Button, Paper, Typography, Chip, Stack, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Alert, CircularProgress, IconButton,
  TableSortLabel, InputAdornment, Menu, MenuItem, FormControl, InputLabel, Select,
  Checkbox, Toolbar, Tooltip, Grid, CardContent, Card
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import EditIcon from '@mui/icons-material/Edit';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ClearIcon from '@mui/icons-material/Clear';

export default function ValorMateriais() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [rows, setRows] = React.useState([]);
  const [selectedValor, setSelectedValor] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [total, setTotal] = React.useState(0);
  const [openModal, setOpenModal] = React.useState(false);
  const [form, setForm] = React.useState({ 
    cliente_id: '',  // Cliente específico (opcional)
    descricao_produto: '', 
    marca: '', 
    unidade_medida: '', 
    valor_unitario: '', 
    estoque_atual: '', 
    estoque_minimo: '', 
    data_ultima_entrada: '', 
    responsavel: '', 
    fornecedor: '', 
    valor: '', 
    localizacao: '', 
    observacoes: '' 
  });
  
  // Estados para filtros e ordenação
  const [clientes, setClientes] = React.useState([]);  // Lista de clientes
  const [filtros, setFiltros] = React.useState({});
  const [ordenacao, setOrdenacao] = React.useState({ campo: '', direcao: 'asc' });
  const [busca, setBusca] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  
  // Estados para ações em lote
  const [selectedItems, setSelectedItems] = React.useState([]);
  const [selectAll, setSelectAll] = React.useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  
  // Estados para modal de filtros
  const [openFilterModal, setOpenFilterModal] = React.useState(false);
  const [tempFiltros, setTempFiltros] = React.useState({});
  const [deleting, setDeleting] = React.useState(false);
  
  // Estados para importação de Excel
  const [openImportModal, setOpenImportModal] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadMessage, setUploadMessage] = React.useState('');
  const [uploadError, setUploadError] = React.useState('');
  const [importedFiles, setImportedFiles] = React.useState([]);
  
  // Estado para arquivo anexado no formulário
  const [formFile, setFormFile] = React.useState(null);
  
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const loadPersisted = async () => {
    try {
      const resp = await fetch(`${API}/valor_materiais/`);
      if (!resp.ok) return;
      let data = await resp.json();
      if (!data) return;
      
      // Aplicar busca
      if (busca.trim()) {
        const searchTerm = busca.toLowerCase();
        data = data.filter(item => 
          Object.values(item).some(value => 
            value && value.toString().toLowerCase().includes(searchTerm)
          )
        );
      }
      
      // Aplicar filtros
      Object.keys(filtros).forEach(key => {
        if (filtros[key] && filtros[key] !== '') {
          data = data.filter(item => {
            const itemValue = item[key];
            
            // Filtros de valor mínimo e máximo
            if (key === 'valor_unitario_min') {
              const valor = parseFloat(item.valor_unitario);
              const min = parseFloat(filtros[key]);
              return !isNaN(valor) && !isNaN(min) && valor >= min;
            }
            if (key === 'valor_unitario_max') {
              const valor = parseFloat(item.valor_unitario);
              const max = parseFloat(filtros[key]);
              return !isNaN(valor) && !isNaN(max) && valor <= max;
            }
            if (key === 'estoque_atual_min') {
              const estoque = parseFloat(item.estoque_atual);
              const min = parseFloat(filtros[key]);
              return !isNaN(estoque) && !isNaN(min) && estoque >= min;
            }
            
            // Filtros de data
            if (key === 'data_entrada_inicio') {
              const itemDate = new Date(item.data_ultima_entrada);
              const filterDate = new Date(filtros[key]);
              return itemDate >= filterDate;
            }
            if (key === 'data_entrada_fim') {
              const itemDate = new Date(item.data_ultima_entrada);
              const filterDate = new Date(filtros[key]);
              return itemDate <= filterDate;
            }
            
            // Filtro de texto padrão
            return itemValue && itemValue.toString().toLowerCase().includes(filtros[key].toLowerCase());
          });
        }
      });
      
      // Aplicar ordenação
      if (ordenacao.campo) {
        data.sort((a, b) => {
          const aVal = a[ordenacao.campo] || '';
          const bVal = b[ordenacao.campo] || '';
          
          // Verificar se são números
          const aNum = parseFloat(aVal);
          const bNum = parseFloat(bVal);
          
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return ordenacao.direcao === 'asc' ? aNum - bNum : bNum - aNum;
          }
          
          // Comparação de strings
          const comparison = aVal.toString().localeCompare(bVal.toString());
          return ordenacao.direcao === 'asc' ? comparison : -comparison;
        });
      }
      
      setRows((data || []).map((r, i) => ({ id: r.id ?? i + 1, ...r })));
      setTotal((data || []).length);
    } catch (e) { console.error(e); }
  };

  const loadImportedFiles = async () => {
    try {
      const resp = await fetch(`${API}/uploads?entidade=valor_materiais`);
      if (!resp.ok) return;
      const data = await resp.json();
      setImportedFiles(data || []);
    } catch (e) { console.error(e); }
  };

  const loadClientes = async () => {
    try {
      const response = await fetch(`${API}/clientes/`);
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadError('Por favor, selecione um arquivo');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadMessage('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const resp = await fetch(`${API}/upload_valor_materiais`, {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.detail || 'Erro no upload');
      }

      const result = await resp.json();
      setUploadMessage(`Arquivo enviado com sucesso! ${result.records_imported || 0} registros importados.`);
      setSelectedFile(null);
      
      // Recarregar dados
      await loadPersisted();
      await loadImportedFiles();
      
      // Fechar modal após 2 segundos
      setTimeout(() => {
        setOpenImportModal(false);
        setUploadMessage('');
      }, 2000);

    } catch (error) {
      setUploadError(error.message || 'Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadFile = async (fileId, filename) => {
    try {
      const resp = await fetch(`${API}/uploads/${fileId}/download`);
      if (!resp.ok) throw new Error('Erro ao baixar arquivo');
      
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Erro ao baixar arquivo: ' + error.message);
    }
  };

  // Funções para ações em lote
  const handleSelectAll = (event) => {
    const checked = event.target.checked;
    setSelectAll(checked);
    
    if (checked) {
      const currentPageItems = rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
      setSelectedItems(currentPageItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSelected = prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      
      // Atualizar estado do selectAll
      const currentPageItems = rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
      const allCurrentSelected = currentPageItems.every(item => newSelected.includes(item.id));
      setSelectAll(allCurrentSelected && currentPageItems.length > 0);
      
      return newSelected;
    });
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      for (const itemId of selectedItems) {
        const resp = await fetch(`${API}/valor_materiais/${itemId}`, {
          method: 'DELETE',
        });
        if (!resp.ok) throw new Error(`Erro ao excluir item ${itemId}`);
      }
      
      await loadPersisted();
      setSelectedItems([]);
      setSelectAll(false);
      setOpenDeleteDialog(false);
      alert(`${selectedItems.length} itens excluídos com sucesso!`);
    } catch (error) {
      alert('Erro ao excluir itens: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkEdit = () => {
    if (selectedItems.length === 1) {
      const item = rows.find(r => r.id === selectedItems[0]);
      setSelectedValor(item);
      setForm(item);
      setOpenModal(true);
    } else {
      alert('Para editar, selecione apenas um item.');
    }
  };

  // Função para aplicar busca
  const handleSearchChange = (event) => {
    setBusca(event.target.value);
  };

  // Função para aplicar ordenação
  const handleSort = (campo) => {
    const novaOrdenacao = {
      campo,
      direcao: ordenacao.campo === campo && ordenacao.direcao === 'asc' ? 'desc' : 'asc'
    };
    setOrdenacao(novaOrdenacao);
  };

  // Efeito para recarregar dados quando busca, filtros ou ordenação mudam
  React.useEffect(() => {
    loadPersisted();
  }, [busca, filtros, ordenacao]);

  // Carregar clientes na inicialização
  React.useEffect(() => {
    loadClientes();
  }, []);

  React.useEffect(() => { 
    loadPersisted(); 
    loadImportedFiles();
  }, []);

  // Voltar na navegação

  // Função para salvar/editar material
  const handleSave = async () => {
    if (!form.descricao_produto || !form.valor_unitario) {
      alert('Preencha os campos obrigatórios (Descrição do Produto e Valor Unitário)');
      return;
    }

    setSaving(true);
    try {
      const method = selectedValor ? 'PUT' : 'POST';
      const url = selectedValor 
        ? `${API}/valor_materiais/${selectedValor.id}` 
        : `${API}/valor_materiais/`;

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.detail || 'Erro ao salvar');
      }

      await loadPersisted();
      setOpenModal(false);
      setForm({ 
        cliente_id: '',  // Adicionar cliente_id no reset
        descricao_produto: '', 
        marca: '', 
        unidade_medida: '', 
        valor_unitario: '', 
        estoque_atual: '', 
        estoque_minimo: '', 
        data_ultima_entrada: '', 
        responsavel: '', 
        fornecedor: '', 
        valor: '', 
        localizacao: '', 
        observacoes: '' 
      });
      setSelectedValor(null);
      alert(selectedValor ? 'Material atualizado com sucesso!' : 'Material criado com sucesso!');
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Funções para filtros
  const handleOpenFilterModal = () => {
    setTempFiltros({ ...filtros });
    setOpenFilterModal(true);
  };

  const handleCloseFilterModal = () => {
    setOpenFilterModal(false);
    setTempFiltros({});
  };

  const handleApplyFilters = () => {
    setFiltros(tempFiltros);
    setOpenFilterModal(false);
  };

  const handleClearFilters = () => {
    setTempFiltros({});
    setFiltros({});
    setOpenFilterModal(false);
  };

  const handleFilterChange = (campo, valor) => {
    setTempFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Função para upload de arquivo do formulário
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormFile(file);
    }
  };

  const handleRemoveFile = () => {
    setFormFile(null);
  };

  return (
    <Box sx={{ background: theme.palette.background.default, minHeight: '100vh', p: { xs: 1, sm: 2, md: 4 } }}>
      <Box sx={{ maxWidth: { xs: '100%', lg: 1200 }, mx: 'auto', mt: { xs: 1, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, md: 2 } }}>
          <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mr: 2 }}>Voltar</Button>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              mb: 0,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}
          >
            Valores de Materiais
          </Typography>
        </Box>
        
        {/* Controles Responsivos */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' }, 
          mb: 2, 
          gap: { xs: 1, sm: 2 }
        }}>
          {/* Total de resultados */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 } }}>
            <Typography variant="subtitle1" sx={{ mr: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Total de resultados:
            </Typography>
            <Chip 
              label={`${total} / ${total}`} 
              color="primary" 
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: '0.75rem', sm: '1rem' }
              }} 
            />
          </Box>
          
          <Box sx={{ flex: 1 }} />
          
          {/* Controles de ação responsivos */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            width: { xs: '100%', sm: 'auto' }
          }}>
            {/* Campo de busca */}
            <TextField
              size="small"
              placeholder="Buscar..."
              value={busca}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                minWidth: { xs: '100%', sm: 200 },
                mb: { xs: 1, sm: 0 }
              }}
            />
            
            {/* Botões de ação */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              flexDirection: { xs: 'row', sm: 'row' },
              justifyContent: { xs: 'space-between', sm: 'flex-start' }
            }}>
              <Button 
                variant="contained" 
                color="success" 
                onClick={handleOpenFilterModal}
                size={window.innerWidth < 600 ? 'small' : 'medium'}
                sx={{ 
                  minWidth: { xs: 'auto', sm: 'auto' },
                  px: { xs: 1, sm: 2 }
                }}
              >
                <FilterListIcon fontSize={window.innerWidth < 600 ? 'small' : 'medium'} />
              </Button>
              
              <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<CloudUploadIcon fontSize={window.innerWidth < 600 ? 'small' : 'medium'} />}
                onClick={() => setOpenImportModal(true)}
                size={window.innerWidth < 600 ? 'small' : 'medium'}
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 }
                }}
              >
                {window.innerWidth < 600 ? 'Excel' : 'Importar Excel'}
              </Button>
              
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => {
                  setSelectedValor(null);
                  setForm({ 
                    descricao_produto: '', marca: '', unidade_medida: '', valor_unitario: '', 
                    estoque_atual: '', estoque_minimo: '', data_ultima_entrada: '', 
                    responsavel: '', fornecedor: '', valor: '', localizacao: '', observacoes: '' 
                  });
                  setOpenModal(true);
                }}
                size={window.innerWidth < 600 ? 'small' : 'medium'}
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 }
                }}
              >
                {window.innerWidth < 600 ? 'Novo' : 'Criar novo'}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Botões de ação em lote */}
        {selectedItems.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Toolbar 
              sx={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderRadius: 1,
                justifyContent: 'space-between'
              }}
            >
              <Typography variant="subtitle1">
                {selectedItems.length} item(s) selecionado(s)
              </Typography>
              <Box>
                <Tooltip title="Editar (apenas 1 item)">
                  <IconButton 
                    onClick={handleBulkEdit}
                    disabled={selectedItems.length !== 1}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Excluir selecionados">
                  <IconButton 
                    onClick={() => setOpenDeleteDialog(true)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </Box>
        )}
        
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 2, 
            boxShadow: 0,
            overflowX: 'auto',
            '& .MuiTable-root': {
              minWidth: { xs: 800, md: 'auto' }
            }
          }}
        >
          <Table size={window.innerWidth < 600 ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={{ background: '#f4f6f8' }}>
                <TableCell padding="checkbox" sx={{ minWidth: 40 }}>
                  <Checkbox
                    indeterminate={selectedItems.length > 0 && selectedItems.length < rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage).length}
                    checked={selectAll}
                    onChange={handleSelectAll}
                    size={window.innerWidth < 600 ? 'small' : 'medium'}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: { xs: 60, sm: 80 } }}>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Cliente
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: { xs: 120, sm: 150 } }}>
                  <TableSortLabel
                    active={ordenacao.campo === 'descricao_produto'}
                    direction={ordenacao.campo === 'descricao_produto' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleSort('descricao_produto')}
                  >
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Descrição
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: { xs: 80, sm: 100 } }}>
                  <TableSortLabel
                    active={ordenacao.campo === 'marca'}
                    direction={ordenacao.campo === 'marca' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleSort('marca')}
                  >
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Marca
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: { xs: 70, sm: 90 } }}>
                  <TableSortLabel
                    active={ordenacao.campo === 'unidade_medida'}
                    direction={ordenacao.campo === 'unidade_medida' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleSort('unidade_medida')}
                  >
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Unid.
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: { xs: 80, sm: 100 } }}>
                  <TableSortLabel
                    active={ordenacao.campo === 'valor_unitario'}
                    direction={ordenacao.campo === 'valor_unitario' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleSort('valor_unitario')}
                  >
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Valor Unit.
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: { xs: 70, sm: 90 } }}>
                  <TableSortLabel
                    active={ordenacao.campo === 'estoque_atual'}
                    direction={ordenacao.campo === 'estoque_atual' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleSort('estoque_atual')}
                  >
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Estoque
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: { xs: 70, sm: 90 } }}>
                  <TableSortLabel
                    active={ordenacao.campo === 'estoque_minimo'}
                    direction={ordenacao.campo === 'estoque_minimo' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleSort('estoque_minimo')}
                  >
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Est. Mín.
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: { xs: 80, sm: 100 } }}>
                  <TableSortLabel
                    active={ordenacao.campo === 'responsavel'}
                    direction={ordenacao.campo === 'responsavel' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleSort('responsavel')}
                  >
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Responsável
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: { xs: 80, sm: 100 } }}>
                  <TableSortLabel
                    active={ordenacao.campo === 'data_ultima_entrada'}
                    direction={ordenacao.campo === 'data_ultima_entrada' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleSort('data_ultima_entrada')}
                  >
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Data Últ. Entrada
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: { xs: 80, sm: 100 } }}>
                  <TableSortLabel
                    active={ordenacao.campo === 'valor'}
                    direction={ordenacao.campo === 'valor' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleSort('valor')}
                  >
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Valor
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: { xs: 80, sm: 100 } }}>
                  <TableSortLabel
                    active={ordenacao.campo === 'fornecedor'}
                    direction={ordenacao.campo === 'fornecedor' ? ordenacao.direcao : 'asc'}
                    onClick={() => handleSort('fornecedor')}
                  >
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Fornecedor
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 60 }}>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Ações
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                <TableRow key={row.id || idx} hover sx={{ borderBottom: '1px solid #e0e0e0' }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedItems.includes(row.id)}
                      onChange={() => handleSelectItem(row.id)}
                      size={window.innerWidth < 600 ? 'small' : 'medium'}
                    />
                  </TableCell>
                  <TableCell sx={{ 
                    maxWidth: { xs: 60, sm: 80 },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, fontWeight: 'bold' }}>
                      {row.cliente_id ? `ID: ${row.cliente_id}` : 'Geral'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ 
                    maxWidth: { xs: 120, sm: 200 },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {row.descricao_produto || ''}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ 
                    maxWidth: { xs: 80, sm: 120 },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {row.marca || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {row.unidade_medida || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      R$ {parseFloat(row.valor_unitario || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {row.estoque_atual || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {row.estoque_minimo || 0}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ 
                    maxWidth: { xs: 80, sm: 120 },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {row.responsavel || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {row.data_ultima_entrada || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      R$ {parseFloat(row.valor || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ 
                    maxWidth: { xs: 80, sm: 120 },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {row.fornecedor || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button 
                      size={window.innerWidth < 600 ? 'small' : 'medium'}
                      variant="text" 
                      onClick={() => {
                        setSelectedValor(row);
                        setForm(row);
                        setOpenModal(true);
                      }}
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        minWidth: { xs: 'auto', sm: 'auto' },
                        px: { xs: 0.5, sm: 1 }
                      }}
                    >
                      {window.innerWidth < 600 ? 'Edit' : 'Editar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage={window.innerWidth < 600 ? 'Por página:' : 'Linhas por página:'}
            labelDisplayedRows={({ from, to, count }) => 
              window.innerWidth < 600 
                ? `${from}-${to} de ${count}`
                : `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
            sx={{
              '& .MuiTablePagination-toolbar': {
                minHeight: { xs: 52, sm: 64 }
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }
            }}
          />
        </TableContainer>
        {/* Modal de cadastro responsivo */}
        <Dialog 
          open={openModal} 
          onClose={() => {
            setOpenModal(false);
            setSelectedValor(null);
            setForm({ 
              descricao_produto: '', marca: '', unidade_medida: '', valor_unitario: '', 
              estoque_atual: '', estoque_minimo: '', data_ultima_entrada: '', 
              responsavel: '', fornecedor: '', valor: '', localizacao: '', observacoes: '' 
            });
          }} 
          maxWidth="md" 
          fullWidth
          fullScreen={window.innerWidth < 600}
        >
          <DialogTitle sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            {selectedValor ? 'Editar Material' : 'Novo Material'}
          </DialogTitle>
          <DialogContent sx={{ 
            minWidth: { xs: 'auto', sm: 340 },
            p: { xs: 1, sm: 3 }
          }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: { xs: 2, sm: 2 }, 
              mt: 1 
            }}>
              <FormControl fullWidth size={window.innerWidth < 600 ? 'small' : 'medium'}>
                <InputLabel>Cliente (Opcional)</InputLabel>
                <Select
                  value={form.cliente_id || ''}
                  label="Cliente (Opcional)"
                  onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}
                >
                  <MenuItem value="">
                    <em>Geral (Todos os clientes)</em>
                  </MenuItem>
                  {clientes.map(cliente => (
                    <MenuItem key={cliente.id} value={cliente.id}>
                      ID: {cliente.id} - {cliente.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField 
                label="Descrição do Produto *" 
                fullWidth 
                size={window.innerWidth < 600 ? 'small' : 'medium'}
                value={form.descricao_produto} 
                onChange={e => setForm(f => ({ ...f, descricao_produto: e.target.value }))} 
              />
              <TextField 
                label="Marca" 
                fullWidth 
                size={window.innerWidth < 600 ? 'small' : 'medium'}
                value={form.marca} 
                onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} 
              />
              <TextField 
                label="Unidade de Medida" 
                fullWidth 
                size={window.innerWidth < 600 ? 'small' : 'medium'}
                value={form.unidade_medida} 
                onChange={e => setForm(f => ({ ...f, unidade_medida: e.target.value }))} 
              />
              <TextField 
                label="Valor Unitário *" 
                fullWidth 
                type="number" 
                step="0.01"
                size={window.innerWidth < 600 ? 'small' : 'medium'}
                value={form.valor_unitario} 
                onChange={e => setForm(f => ({ ...f, valor_unitario: e.target.value }))} 
              />
              <TextField 
                label="Estoque Atual" 
                fullWidth 
                type="number" 
                size={window.innerWidth < 600 ? 'small' : 'medium'}
                value={form.estoque_atual} 
                onChange={e => setForm(f => ({ ...f, estoque_atual: e.target.value }))} 
              />
              <TextField 
                label="Estoque Mínimo" 
                fullWidth 
                type="number" 
                size={window.innerWidth < 600 ? 'small' : 'medium'}
                value={form.estoque_minimo} 
                onChange={e => setForm(f => ({ ...f, estoque_minimo: e.target.value }))} 
              />
              <TextField 
                label="Data Última Entrada" 
                fullWidth 
                type="date"
                size={window.innerWidth < 600 ? 'small' : 'medium'}
                InputLabelProps={{ shrink: true }}
                value={form.data_ultima_entrada} 
                onChange={e => setForm(f => ({ ...f, data_ultima_entrada: e.target.value }))} 
              />
              <TextField 
                label="Responsável" 
                fullWidth 
                size={window.innerWidth < 600 ? 'small' : 'medium'}
                value={form.responsavel} 
                onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} 
              />
              <TextField 
                label="Fornecedor" 
                fullWidth 
                size={window.innerWidth < 600 ? 'small' : 'medium'}
                value={form.fornecedor} 
                onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))} 
              />
              <TextField 
                label="Valor Total" 
                fullWidth 
                type="number" 
                step="0.01"
                size={window.innerWidth < 600 ? 'small' : 'medium'}
                value={form.valor} 
                onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} 
              />
              <TextField 
                label="Localização" 
                fullWidth 
                size={window.innerWidth < 600 ? 'small' : 'medium'}
                value={form.localizacao} 
                onChange={e => setForm(f => ({ ...f, localizacao: e.target.value }))} 
              />
              <TextField 
                label="Observações" 
                fullWidth 
                multiline 
                rows={window.innerWidth < 600 ? 2 : 3}
                size={window.innerWidth < 600 ? 'small' : 'medium'}
                value={form.observacoes} 
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} 
              />
              
              {/* Campo de upload de arquivo responsivo */}
              <Box sx={{ gridColumn: { xs: '1fr', sm: 'span 2' } }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 1,
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  Anexar Arquivo (PDF ou Imagem)
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' }, 
                  gap: 1 
                }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AttachFileIcon />}
                    size={window.innerWidth < 600 ? 'small' : 'medium'}
                    sx={{ 
                      flexShrink: 0,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    {window.innerWidth < 600 ? 'Arquivo' : 'Escolher Arquivo'}
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.jpg,.jpeg,.png,.gif"
                      onChange={handleFileSelect}
                    />
                  </Button>
                  {formFile && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      flex: 1,
                      mt: { xs: 1, sm: 0 }
                    }}>
                      <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {formFile.name}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={handleRemoveFile}
                        color="error"
                      >
                        <ClearIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Formatos aceitos: PDF, JPG, JPEG, PNG, GIF (máx. 10MB)
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            p: { xs: 2, sm: 3 },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 }
          }}>
            <Button 
              onClick={() => setOpenModal(false)} 
              disabled={saving}
              size={window.innerWidth < 600 ? 'medium' : 'large'}
              sx={{ 
                width: { xs: '100%', sm: 'auto' },
                order: { xs: 2, sm: 1 }
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSave} 
              disabled={saving || !form.descricao_produto || !form.valor_unitario}
              size={window.innerWidth < 600 ? 'medium' : 'large'}
              sx={{ 
                width: { xs: '100%', sm: 'auto' },
                order: { xs: 1, sm: 2 }
              }}
            >
              {saving ? <CircularProgress size={20} /> : (selectedValor ? 'Atualizar' : 'Salvar')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de confirmação de exclusão em lote */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogContent>
            <Typography>
              Tem certeza que deseja excluir {selectedItems.length} item(s) selecionado(s)? 
              Esta ação não pode ser desfeita.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
            <Button 
              onClick={handleBulkDelete} 
              color="error" 
              variant="contained"
              disabled={deleting}
            >
              {deleting ? <CircularProgress size={20} /> : 'Excluir'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de importação de Excel */}
        <Dialog open={openImportModal} onClose={() => !uploading && setOpenImportModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Importar Valores de Materiais via Excel</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Faça upload de um arquivo Excel (.xlsx) com as colunas: Descricao_Produto*, Marca, Unidade_Medida, 
                Valor_unitario*, Estoque_atual, Estoque_Minimo, Data_Ultima_Entrada, Responsavel, Fornecedor, 
                Valor, Localizacao, Observacoes (* = obrigatório)
              </Typography>
              
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  setSelectedFile(e.target.files[0]);
                  setUploadError('');
                  setUploadMessage('');
                }}
                style={{ display: 'none' }}
                id="excel-upload"
              />
              <label htmlFor="excel-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  sx={{ mb: 2 }}
                  disabled={uploading}
                >
                  Selecionar Arquivo Excel
                </Button>
              </label>

              {selectedFile && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                  <Typography variant="body2">
                    <strong>Arquivo selecionado:</strong> {selectedFile.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tamanho: {(selectedFile.size / 1024).toFixed(2)} KB
                  </Typography>
                </Box>
              )}

              {uploadMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {uploadMessage}
                </Alert>
              )}

              {uploadError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {uploadError}
                </Alert>
              )}

              {/* Lista de arquivos importados */}
              {importedFiles.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Arquivos Importados Anteriormente</Typography>
                  <Paper sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {importedFiles.map((file) => (
                      <Box 
                        key={file.id} 
                        sx={{ 
                          p: 2, 
                          borderBottom: 1, 
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {file.filename}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Importado em: {new Date(file.criado_em).toLocaleString('pt-BR')}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadFile(file.id, file.filename)}
                          title="Baixar arquivo"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Paper>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenImportModal(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleFileUpload}
              disabled={!selectedFile || uploading}
              startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
            >
              {uploading ? 'Importando...' : 'Importar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de filtros */}
        <Dialog open={openFilterModal} onClose={handleCloseFilterModal} maxWidth="md" fullWidth>
          <DialogTitle>Filtrar Resultados</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Descrição do Produto"
                  fullWidth
                  value={tempFiltros.descricao_produto || ''}
                  onChange={(e) => handleFilterChange('descricao_produto', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Marca"
                  fullWidth
                  value={tempFiltros.marca || ''}
                  onChange={(e) => handleFilterChange('marca', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Unidade de Medida"
                  fullWidth
                  value={tempFiltros.unidade_medida || ''}
                  onChange={(e) => handleFilterChange('unidade_medida', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Valor Unitário (mín)"
                  fullWidth
                  type="number"
                  value={tempFiltros.valor_unitario_min || ''}
                  onChange={(e) => handleFilterChange('valor_unitario_min', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Valor Unitário (máx)"
                  fullWidth
                  type="number"
                  value={tempFiltros.valor_unitario_max || ''}
                  onChange={(e) => handleFilterChange('valor_unitario_max', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Estoque Atual (mín)"
                  fullWidth
                  type="number"
                  value={tempFiltros.estoque_atual_min || ''}
                  onChange={(e) => handleFilterChange('estoque_atual_min', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Responsável"
                  fullWidth
                  value={tempFiltros.responsavel || ''}
                  onChange={(e) => handleFilterChange('responsavel', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fornecedor"
                  fullWidth
                  value={tempFiltros.fornecedor || ''}
                  onChange={(e) => handleFilterChange('fornecedor', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Localização"
                  fullWidth
                  value={tempFiltros.localizacao || ''}
                  onChange={(e) => handleFilterChange('localizacao', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Data da Última Entrada (de)"
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={tempFiltros.data_entrada_inicio || ''}
                  onChange={(e) => handleFilterChange('data_entrada_inicio', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Data da Última Entrada (até)"
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={tempFiltros.data_entrada_fim || ''}
                  onChange={(e) => handleFilterChange('data_entrada_fim', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'grey.50', p: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Dica:</strong> Use os filtros para encontrar materiais específicos. 
                    Deixe em branco os campos que não deseja filtrar.
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClearFilters} color="error">
              Limpar Filtros
            </Button>
            <Button onClick={handleCloseFilterModal}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApplyFilters} 
              variant="contained"
            >
              Aplicar Filtros
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
