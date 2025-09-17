import React from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
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
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  InputAdornment,
  Stack,
  Alert,
  Snackbar,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function GruposUsuarios() {
  // const theme = useTheme();
  const navigate = useNavigate();
  const [grupos, setGrupos] = React.useState([]);
  // const [permissoes, setPermissoes] = React.useState([]);
  const [lojas, setLojas] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [searchPermissao, setSearchPermissao] = React.useState('');
  const [, setEditingGrupo] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });

  const [form, setForm] = React.useState({
    id: null,
    nome: '',
    status: 'Aprovado',
    motivo: '',
    permissoes: [],
  });

  const [saving, setSaving] = React.useState(false);
  const [permissoesSelecionadas, setPermissoesSelecionadas] = React.useState({});
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // Lista de permissões organizadas para layout de tabela com IDs numéricos
  const permissoesSistema = [
    // Sistema (1000-1099)
    { id: 1001, nome: 'Dashboard', categoria: 'Sistema', checked: false },
    { id: 1002, nome: 'Relatórios', categoria: 'Sistema', checked: false },
    { id: 1003, nome: 'Análises', categoria: 'Sistema', checked: false },
    { id: 1004, nome: 'Administração do Sistema', categoria: 'Sistema', checked: false },
    { id: 1005, nome: 'Backup', categoria: 'Sistema', checked: false },

    // Cadastros - Usuários (1100-1199)
    { id: 1101, nome: 'Usuários', categoria: 'Cadastros', checked: false },
    { id: 1102, nome: 'Usuários - Alterar', categoria: 'Cadastros', checked: false, hidden: true },
    { id: 1103, nome: 'Usuários - Excluir', categoria: 'Cadastros', checked: false, hidden: true },
    { id: 1104, nome: 'Usuários - Criar', categoria: 'Cadastros', checked: false, hidden: true },

    // Cadastros - Clientes (1200-1299)
    { id: 1201, nome: 'Clientes', categoria: 'Cadastros', checked: false },
    { id: 1202, nome: 'Clientes - Alterar', categoria: 'Cadastros', checked: false, hidden: true },
    { id: 1203, nome: 'Clientes - Excluir', categoria: 'Cadastros', checked: false, hidden: true },
    {
      id: 1204,
      nome: 'Clientes - Criar/Importar',
      categoria: 'Cadastros',
      checked: false,
      hidden: true,
    },

    // Cadastros - Fornecedores (1300-1399)
    { id: 1301, nome: 'Fornecedores', categoria: 'Cadastros', checked: false },
    {
      id: 1302,
      nome: 'Fornecedores - Alterar',
      categoria: 'Cadastros',
      checked: false,
      hidden: true,
    },
    {
      id: 1303,
      nome: 'Fornecedores - Excluir',
      categoria: 'Cadastros',
      checked: false,
      hidden: true,
    },
    {
      id: 1304,
      nome: 'Fornecedores - Criar/Importar',
      categoria: 'Cadastros',
      checked: false,
      hidden: true,
    },

    // Obras - Contratos (1400-1499)
    { id: 1401, nome: 'Contratos', categoria: 'Obras', checked: false },
    { id: 1402, nome: 'Contratos - Alterar', categoria: 'Obras', checked: false, hidden: true },
    { id: 1403, nome: 'Contratos - Excluir', categoria: 'Obras', checked: false, hidden: true },
    {
      id: 1404,
      nome: 'Contratos - Criar/Importar',
      categoria: 'Obras',
      checked: false,
      hidden: true,
    },

    // Obras - Orçamento (1500-1599)
    { id: 1501, nome: 'Orçamento de Obra', categoria: 'Obras', checked: false },
    { id: 1502, nome: 'Orçamento - Alterar', categoria: 'Obras', checked: false, hidden: true },
    { id: 1503, nome: 'Orçamento - Excluir', categoria: 'Obras', checked: false, hidden: true },
    {
      id: 1504,
      nome: 'Orçamento - Criar/Importar',
      categoria: 'Obras',
      checked: false,
      hidden: true,
    },

    // Financeiro - Despesas (1600-1699)
    { id: 1601, nome: 'Despesas', categoria: 'Financeiro', checked: false },
    { id: 1602, nome: 'Despesas - Alterar', categoria: 'Financeiro', checked: false, hidden: true },
    { id: 1603, nome: 'Despesas - Excluir', categoria: 'Financeiro', checked: false, hidden: true },
    {
      id: 1604,
      nome: 'Despesas - Criar/Importar',
      categoria: 'Financeiro',
      checked: false,
      hidden: true,
    },

    // Materiais (1700-1799)
    { id: 1701, nome: 'Valor Materiais', categoria: 'Materiais', checked: false },
    {
      id: 1702,
      nome: 'Valor Materiais - Alterar',
      categoria: 'Materiais',
      checked: false,
      hidden: true,
    },
    {
      id: 1703,
      nome: 'Valor Materiais - Excluir',
      categoria: 'Materiais',
      checked: false,
      hidden: true,
    },
    {
      id: 1704,
      nome: 'Valor Materiais - Criar/Importar',
      categoria: 'Materiais',
      checked: false,
      hidden: true,
    },

    // Relatórios (1800-1899)
    { id: 1801, nome: 'Resumo Mensal', categoria: 'Relatórios', checked: false },
    {
      id: 1802,
      nome: 'Resumo Mensal - Alterar',
      categoria: 'Relatórios',
      checked: false,
      hidden: true,
    },
    {
      id: 1803,
      nome: 'Resumo Mensal - Excluir',
      categoria: 'Relatórios',
      checked: false,
      hidden: true,
    },
    {
      id: 1804,
      nome: 'Resumo Mensal - Criar/Importar',
      categoria: 'Relatórios',
      checked: false,
      hidden: true,
    },

    // Lojas (1900-1999)
    { id: 1901, nome: 'Acesso a Todas as Lojas', categoria: 'Lojas', checked: false },
    { id: 1902, nome: 'Acesso a Loja Individual', categoria: 'Lojas', checked: false },
    { id: 1903, nome: 'Gerenciar Lojas', categoria: 'Lojas', checked: false },
  ];

  const loadData = React.useCallback(async () => {
    try {
      const [gruposResp, permissoesResp, lojasResp] = await Promise.all([
        fetch(`${API}/grupos/`),
        fetch(`${API}/permissoes/`),
        fetch(`${API}/lojas/`),
      ]);

      if (gruposResp.ok) {
        const gruposData = await gruposResp.json();
        setGrupos(gruposData);
      }

      if (permissoesResp.ok) {
        await permissoesResp.json();
        // setPermissoes(permissoesData);
      }

      if (lojasResp.ok) {
        const lojasData = await lojasResp.json();
        setLojas(lojasData);
      }
    } catch (e) {
      console.error(e);
    }
  }, [API]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEditGrupo = async (grupo) => {
    setEditingGrupo(grupo);

    // Buscar permissões do grupo
    try {
      const permissoesResponse = await fetch(`${API}/grupos/${grupo.id}/permissoes/`);
      const dataPerms = await permissoesResponse.json();
      const lista = Array.isArray(dataPerms)
        ? dataPerms
        : Array.isArray(dataPerms?.permissoes)
          ? dataPerms.permissoes
          : [];
      const permissoesIds = lista.map((p) => (p.id ?? p).toString());

      setForm({
        id: grupo.id,
        nome: grupo.nome || '',
        status: grupo.status || 'Aprovado',
        motivo: grupo.motivo || '',
        permissoes: permissoesIds,
      });

      // Atualizar estado das permissões selecionadas
      const newPermissoesSelecionadas = {};
      permissoesIds.forEach((id) => {
        newPermissoesSelecionadas[id] = true;
      });
      setPermissoesSelecionadas(newPermissoesSelecionadas);
    } catch (error) {
      console.error('Erro ao buscar permissões do grupo:', error);
      setForm({
        id: grupo.id,
        nome: grupo.nome || '',
        status: grupo.status || 'Aprovado',
        motivo: grupo.motivo || '',
        permissoes: [],
      });
    }

    setOpenEditModal(true);
  };

  const handleSaveGrupo = async () => {
    setSaving(true);
    try {
      const method = form.id ? 'PUT' : 'POST';
      const url = form.id ? `${API}/grupos/${form.id}` : `${API}/grupos/`;

      // Preparar dados para envio com campos obrigatórios do backend
      const dataToSend = {
        nome: form.nome,
        descricao: '', // Campo obrigatório no schema
        status: form.status,
        motivo: form.motivo || '',
        // Campos financeiros obrigatórios (mesmo que zerados)
        valor_maximo_diario_financeiro: 0.0,
        preco_venda: 0.0,
        plano_contas: 0.0,
        valor_maximo_movimentacao: 0.0,
        valor_maximo_solicitacao_compra: 0.0,
        valor_maximo_diario_solicitacao_compra: 0.0,
        // Converter permissões para strings
        permissoes: form.permissoes.map((p) => p.toString()),
        lojas: [],
        acesso_total_lojas: false,
      };

      // Adicionar ID apenas para PUT
      if (form.id) {
        dataToSend.id = form.id;
      }

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!resp.ok) {
        const errorData = await resp.text();
        console.error('Erro detalhado:', errorData);
        throw new Error('Erro ao salvar grupo');
      }

      setSnackbar({ open: true, message: 'Grupo salvo com sucesso!', severity: 'success' });
      setOpenEditModal(false);
      await loadData();
    } catch (e) {
      console.error('Erro ao salvar:', e);
      setSnackbar({ open: true, message: 'Erro ao salvar grupo.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePermissaoChange = (permissaoId, checked) => {
    setForm((f) => ({
      ...f,
      permissoes: checked
        ? [...f.permissoes, permissaoId]
        : f.permissoes.filter((p) => p !== permissaoId),
    }));
  };

  // Função para lidar com mudanças de permissão mantendo hierarquia
  const handlePermissaoChangeWithHierarchy = (permissaoId, checked, tipo = 'geral') => {
    const grupoBase = Math.floor(permissaoId / 100) * 100;
    const permissaoBase = grupoBase + 1;
    const permissaoAlterar = grupoBase + 2;
    const permissaoExcluir = grupoBase + 3;
    const permissaoCriar = grupoBase + 4;

    let novasPermissoes = [...form.permissoes];

    if (checked) {
      // Adicionar permissão selecionada
      if (!novasPermissoes.includes(permissaoId)) {
        novasPermissoes.push(permissaoId);
      }

      // Adicionar dependências obrigatórias baseado no tipo
      if (tipo === 'editar' && permissaoId === permissaoAlterar) {
        // Para editar, precisa da permissão base
        if (!novasPermissoes.includes(permissaoBase)) {
          novasPermissoes.push(permissaoBase);
        }
      } else if (tipo === 'excluir' && permissaoId === permissaoExcluir) {
        // Para excluir, precisa da base + editar
        if (!novasPermissoes.includes(permissaoBase)) {
          novasPermissoes.push(permissaoBase);
        }
        if (!novasPermissoes.includes(permissaoAlterar)) {
          novasPermissoes.push(permissaoAlterar);
        }
      } else if (tipo === 'criar' && permissaoId === permissaoCriar) {
        // Para criar, precisa da base + editar + excluir
        if (!novasPermissoes.includes(permissaoBase)) {
          novasPermissoes.push(permissaoBase);
        }
        if (!novasPermissoes.includes(permissaoAlterar)) {
          novasPermissoes.push(permissaoAlterar);
        }
        if (!novasPermissoes.includes(permissaoExcluir)) {
          novasPermissoes.push(permissaoExcluir);
        }
      }
    } else {
      // Remover permissão selecionada
      novasPermissoes = novasPermissoes.filter((p) => p !== permissaoId);

      // Remover dependentes automaticamente
      if (tipo === 'geral' && permissaoId === permissaoBase) {
        // Se remover permissão base, remove todas as outras do grupo
        novasPermissoes = novasPermissoes.filter(
          (p) => p !== permissaoAlterar && p !== permissaoExcluir && p !== permissaoCriar
        );
      } else if (tipo === 'editar' && permissaoId === permissaoAlterar) {
        // Se remover editar, remove excluir e criar
        novasPermissoes = novasPermissoes.filter(
          (p) => p !== permissaoExcluir && p !== permissaoCriar
        );
      } else if (tipo === 'excluir' && permissaoId === permissaoExcluir) {
        // Se remover excluir, remove criar
        novasPermissoes = novasPermissoes.filter((p) => p !== permissaoCriar);
      }
    }

    setForm((f) => ({
      ...f,
      permissoes: [...new Set(novasPermissoes)],
    }));

    // Atualizar também o estado permissoesSelecionadas para manter sincronização
    const newPermissoesSelecionadas = {};
    novasPermissoes.forEach((id) => {
      newPermissoesSelecionadas[id] = true;
    });
    setPermissoesSelecionadas(newPermissoesSelecionadas);
  };

  // Função para selecionar todas as permissões de uma coluna específica
  const handleSelectAllColumn = (columnType) => {
    const permissoesParaAdicionar = [];

    filteredPermissoes.forEach((perm) => {
      if (perm.hidden) return; // Ignora permissões ocultas

      const grupoBase = Math.floor(perm.id / 100) * 100;

      switch (columnType) {
        case 'permissao':
          // Seleciona apenas a permissão base (restritivo à visualização)
          permissoesParaAdicionar.push(perm.id);
          break;
        case 'visualizar':
          // Seleciona apenas a permissão base (igual à permissão)
          permissoesParaAdicionar.push(perm.id);
          break;
        case 'editar':
          // Seleciona permissão base + editar
          permissoesParaAdicionar.push(perm.id); // permissão base
          const permissaoAlterar = permissoesSistema.find((p) => p.id === grupoBase + 2);
          if (permissaoAlterar) permissoesParaAdicionar.push(permissaoAlterar.id);
          break;
        case 'excluir':
          // Seleciona permissão base + editar + excluir
          permissoesParaAdicionar.push(perm.id); // permissão base
          const permissaoAlterar2 = permissoesSistema.find((p) => p.id === grupoBase + 2);
          if (permissaoAlterar2) permissoesParaAdicionar.push(permissaoAlterar2.id);
          const permissaoExcluir = permissoesSistema.find((p) => p.id === grupoBase + 3);
          if (permissaoExcluir) permissoesParaAdicionar.push(permissaoExcluir.id);
          break;
        case 'criar':
          // Seleciona permissão base + editar + excluir + criar
          permissoesParaAdicionar.push(perm.id); // permissão base
          const permissaoAlterar3 = permissoesSistema.find((p) => p.id === grupoBase + 2);
          if (permissaoAlterar3) permissoesParaAdicionar.push(permissaoAlterar3.id);
          const permissaoExcluir2 = permissoesSistema.find((p) => p.id === grupoBase + 3);
          if (permissaoExcluir2) permissoesParaAdicionar.push(permissaoExcluir2.id);
          const permissaoCriar = permissoesSistema.find((p) => p.id === grupoBase + 4);
          if (permissaoCriar) permissoesParaAdicionar.push(permissaoCriar.id);
          break;
        default:
          break;
      }
    });

    setForm((f) => {
      const novasPermissoes = [...new Set([...f.permissoes, ...permissoesParaAdicionar])];

      // Atualizar também o estado permissoesSelecionadas para manter sincronização
      const newPermissoesSelecionadas = {};
      novasPermissoes.forEach((id) => {
        newPermissoesSelecionadas[id] = true;
      });
      setPermissoesSelecionadas(newPermissoesSelecionadas);

      return {
        ...f,
        permissoes: novasPermissoes,
      };
    });
  };

  // Função para desmarcar todas as permissões de uma coluna específica
  const handleDeselectAllColumn = (columnType) => {
    const permissoesParaRemover = [];

    filteredPermissoes.forEach((perm) => {
      if (perm.hidden) return;

      const grupoBase = Math.floor(perm.id / 100) * 100;

      switch (columnType) {
        case 'permissao':
          // Remove apenas permissão base (restritivo - não remove dependentes automaticamente)
          permissoesParaRemover.push(perm.id);
          break;
        case 'visualizar':
          // Remove todas as permissões do grupo (base + todas as dependentes)
          permissoesParaRemover.push(perm.id); // permissão base
          const permissaoAlterar = permissoesSistema.find((p) => p.id === grupoBase + 2);
          if (permissaoAlterar) permissoesParaRemover.push(permissaoAlterar.id);
          const permissaoExcluir = permissoesSistema.find((p) => p.id === grupoBase + 3);
          if (permissaoExcluir) permissoesParaRemover.push(permissaoExcluir.id);
          const permissaoCriar = permissoesSistema.find((p) => p.id === grupoBase + 4);
          if (permissaoCriar) permissoesParaRemover.push(permissaoCriar.id);
          break;
        case 'editar':
          // Remove editar + excluir + criar (mantém visualizar)
          const permissaoAlterar2 = permissoesSistema.find((p) => p.id === grupoBase + 2);
          if (permissaoAlterar2) permissoesParaRemover.push(permissaoAlterar2.id);
          const permissaoExcluir2 = permissoesSistema.find((p) => p.id === grupoBase + 3);
          if (permissaoExcluir2) permissoesParaRemover.push(permissaoExcluir2.id);
          const permissaoCriar2 = permissoesSistema.find((p) => p.id === grupoBase + 4);
          if (permissaoCriar2) permissoesParaRemover.push(permissaoCriar2.id);
          break;
        case 'excluir':
          // Remove excluir + criar (mantém visualizar + editar)
          const permissaoExcluir3 = permissoesSistema.find((p) => p.id === grupoBase + 3);
          if (permissaoExcluir3) permissoesParaRemover.push(permissaoExcluir3.id);
          const permissaoCriar3 = permissoesSistema.find((p) => p.id === grupoBase + 4);
          if (permissaoCriar3) permissoesParaRemover.push(permissaoCriar3.id);
          break;
        case 'criar':
          // Remove apenas criar (mantém visualizar + editar + excluir)
          const permissaoCriar4 = permissoesSistema.find((p) => p.id === grupoBase + 4);
          if (permissaoCriar4) permissoesParaRemover.push(permissaoCriar4.id);
          break;
        default:
          break;
      }
    });

    setForm((f) => {
      const novasPermissoes = f.permissoes.filter((p) => !permissoesParaRemover.includes(p));

      // Atualizar também o estado permissoesSelecionadas para manter sincronização
      const newPermissoesSelecionadas = {};
      novasPermissoes.forEach((id) => {
        newPermissoesSelecionadas[id] = true;
      });
      setPermissoesSelecionadas(newPermissoesSelecionadas);

      return {
        ...f,
        permissoes: novasPermissoes,
      };
    });
  };

  // Função para verificar se todas as permissões de uma coluna estão selecionadas
  const isAllColumnSelected = (columnType) => {
    const gruposPermissoes = {};

    // Agrupa permissões por grupo base
    filteredPermissoes.forEach((perm) => {
      if (perm.hidden) return;

      const grupoBase = Math.floor(perm.id / 100) * 100;
      if (!gruposPermissoes[grupoBase]) {
        gruposPermissoes[grupoBase] = {
          base: grupoBase + 1,
          editar: grupoBase + 2,
          excluir: grupoBase + 3,
          criar: grupoBase + 4,
        };
      }
    });

    const grupos = Object.values(gruposPermissoes);

    if (grupos.length === 0) return false;

    switch (columnType) {
      case 'permissao':
        // Verifica apenas se todos têm permissão base (restritivo)
        return grupos.every((grupo) => form.permissoes.includes(grupo.base));

      case 'visualizar':
        // Todos os grupos devem ter pelo menos a permissão base
        return grupos.every((grupo) => form.permissoes.includes(grupo.base));

      case 'editar':
        // Todos os grupos devem ter base + editar (se editar existir)
        return grupos.every((grupo) => {
          const editarExiste = permissoesSistema.some((p) => p.id === grupo.editar);
          return (
            form.permissoes.includes(grupo.base) &&
            (!editarExiste || form.permissoes.includes(grupo.editar))
          );
        });

      case 'excluir':
        // Todos os grupos devem ter base + editar + excluir (se existirem)
        return grupos.every((grupo) => {
          const editarExiste = permissoesSistema.some((p) => p.id === grupo.editar);
          const excluirExiste = permissoesSistema.some((p) => p.id === grupo.excluir);
          return (
            form.permissoes.includes(grupo.base) &&
            (!editarExiste || form.permissoes.includes(grupo.editar)) &&
            (!excluirExiste || form.permissoes.includes(grupo.excluir))
          );
        });

      case 'criar':
        // Todos os grupos devem ter base + editar + excluir + criar (se existirem)
        return grupos.every((grupo) => {
          const editarExiste = permissoesSistema.some((p) => p.id === grupo.editar);
          const excluirExiste = permissoesSistema.some((p) => p.id === grupo.excluir);
          const criarExiste = permissoesSistema.some((p) => p.id === grupo.criar);
          return (
            form.permissoes.includes(grupo.base) &&
            (!editarExiste || form.permissoes.includes(grupo.editar)) &&
            (!excluirExiste || form.permissoes.includes(grupo.excluir)) &&
            (!criarExiste || form.permissoes.includes(grupo.criar))
          );
        });

      default:
        return false;
    }
  };

  const filteredPermissoes = permissoesSistema.filter((p) =>
    p.nome.toLowerCase().includes(searchPermissao.toLowerCase())
  );

  const handleNewGrupo = () => {
    setEditingGrupo(null);
    setForm({
      id: null,
      nome: '',
      status: 'Aprovado',
      motivo: '',
      permissoes: [],
    });
    setPermissoesSelecionadas({}); // Resetar permissões selecionadas
    setOpenEditModal(true);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{ mr: 2 }}
            >
              Voltar
            </Button>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Grupos de Usuários
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewGrupo}
            sx={{ backgroundColor: '#1976d2' }}
          >
            Novo Grupo
          </Button>
        </Stack>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 700 }}>Nome do Grupo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Motivo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grupos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography>Nenhum grupo encontrado</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                grupos
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((grupo, idx) => (
                    <TableRow key={grupo.id || idx} hover>
                      <TableCell>{grupo.nome}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: grupo.status === 'Aprovado' ? 'green' : 'orange',
                            fontWeight: 'bold',
                          }}
                        >
                          {grupo.status}
                        </Typography>
                      </TableCell>
                      <TableCell>{grupo.motivo || '-'}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditGrupo(grupo)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={grupos.length}
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
      </Paper>

      {/* Modal de Edição - Baseado na imagem anexada */}
      <Dialog
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Edição de Grupo de Usuários
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ minWidth: 800 }}>
          {/* Linha 1 - Campos principais */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do grupo"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={form.status}
                  label="Status"
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <MenuItem value="Aprovado">Aprovado</MenuItem>
                  <MenuItem value="Pendente">Pendente</MenuItem>
                  <MenuItem value="Rejeitado">Rejeitado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Motivo"
                value={form.motivo}
                onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
                variant="outlined"
                size="small"
              />
            </Grid>
          </Grid>

          <Button variant="contained" sx={{ mb: 2, backgroundColor: '#1976d2' }}>
            Permissões
          </Button>

          <Divider sx={{ mb: 2 }} />

          {/* Seção de Permissões */}
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
            Permissão:
          </Typography>

          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Buscar Permissão"
              value={searchPermissao}
              onChange={(e) => setSearchPermissao(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
            <Button variant="outlined" size="small">
              BUSCAR
            </Button>
          </Box>

          {/* Lista de Permissões em formato de tabela similar à imagem */}
          <Box
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              p: 0,
              maxHeight: 500,
              overflow: 'auto',
              backgroundColor: '#fff',
            }}
          >
            {[
              'Sistema',
              'Cadastros',
              'Obras',
              'Financeiro',
              'Materiais',
              'Relatórios',
              'Lojas',
            ].map((categoria) => {
              const permissoesCategoria = filteredPermissoes.filter(
                (p) => p.categoria === categoria
              );

              if (permissoesCategoria.length === 0) return null;

              return (
                <Box key={categoria} sx={{ mb: 1 }}>
                  {/* Header da categoria */}
                  <Box
                    sx={{
                      backgroundColor: '#1976d2',
                      color: 'white',
                      p: 1,
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                    }}
                  >
                    {categoria}
                  </Box>

                  {/* Tabela de permissões */}
                  <Box sx={{ backgroundColor: '#f8f9fa' }}>
                    {/* Header da tabela */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 80px 80px 80px 80px 80px',
                        gap: 1,
                        p: 1,
                        backgroundColor: '#e3f2fd',
                        borderBottom: '1px solid #ddd',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      }}
                    >
                      <Box>Nome da Permissão</Box>
                      <Box
                        sx={{
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                        }}
                      >
                        <Box>Permissão</Box>
                        <Checkbox
                          size="small"
                          checked={isAllColumnSelected('permissao')}
                          onChange={(e) =>
                            e.target.checked
                              ? handleSelectAllColumn('permissao')
                              : handleDeselectAllColumn('permissao')
                          }
                          sx={{ p: 0 }}
                        />
                      </Box>
                      <Box
                        sx={{
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                        }}
                      >
                        <Box>Visualizar</Box>
                        <Checkbox
                          size="small"
                          checked={isAllColumnSelected('visualizar')}
                          onChange={(e) =>
                            e.target.checked
                              ? handleSelectAllColumn('visualizar')
                              : handleDeselectAllColumn('visualizar')
                          }
                          sx={{ p: 0 }}
                        />
                      </Box>
                      <Box
                        sx={{
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                        }}
                      >
                        <Box>Editar</Box>
                        <Checkbox
                          size="small"
                          checked={isAllColumnSelected('editar')}
                          onChange={(e) =>
                            e.target.checked
                              ? handleSelectAllColumn('editar')
                              : handleDeselectAllColumn('editar')
                          }
                          sx={{ p: 0 }}
                        />
                      </Box>
                      <Box
                        sx={{
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                        }}
                      >
                        <Box>Excluir</Box>
                        <Checkbox
                          size="small"
                          checked={isAllColumnSelected('excluir')}
                          onChange={(e) =>
                            e.target.checked
                              ? handleSelectAllColumn('excluir')
                              : handleDeselectAllColumn('excluir')
                          }
                          sx={{ p: 0 }}
                        />
                      </Box>
                      <Box
                        sx={{
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                        }}
                      >
                        <Box>Criar</Box>
                        <Checkbox
                          size="small"
                          checked={isAllColumnSelected('criar')}
                          onChange={(e) =>
                            e.target.checked
                              ? handleSelectAllColumn('criar')
                              : handleDeselectAllColumn('criar')
                          }
                          sx={{ p: 0 }}
                        />
                      </Box>
                    </Box>

                    {/* Linhas de permissões */}
                    {permissoesCategoria
                      .filter((p) => !p.hidden)
                      .map((perm, index) => {
                        // Agrupar por centenas (ex: 1101, 1102, 1103, 1104 = grupo 11)
                        const grupoBase = Math.floor(perm.id / 100) * 100;
                        const permissaoAlterar = permissoesCategoria.find(
                          (p) => p.id === grupoBase + 2
                        );
                        const permissaoExcluir = permissoesCategoria.find(
                          (p) => p.id === grupoBase + 3
                        );
                        const permissaoCriar = permissoesCategoria.find(
                          (p) => p.id === grupoBase + 4
                        );

                        return (
                          <Box
                            key={perm.id}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 80px 80px 80px 80px 80px',
                              gap: 1,
                              p: 1,
                              borderBottom:
                                index < permissoesCategoria.filter((p) => !p.hidden).length - 1
                                  ? '1px solid #eee'
                                  : 'none',
                              backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa',
                              alignItems: 'center',
                            }}
                          >
                            <Box sx={{ fontSize: '0.8rem' }}>
                              <Box
                                component="span"
                                sx={{ color: '#666', fontSize: '0.7rem', mr: 1 }}
                              >
                                {perm.id}
                              </Box>
                              {perm.nome}
                            </Box>

                            {/* Checkbox Permissão Geral */}
                            <Box sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={permissoesSelecionadas[perm.id] || false}
                                onChange={(e) =>
                                  handlePermissaoChangeWithHierarchy(
                                    perm.id,
                                    e.target.checked,
                                    'geral'
                                  )
                                }
                                size="small"
                              />
                            </Box>

                            {/* Checkbox Visualizar */}
                            <Box sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={permissoesSelecionadas[perm.id] || false}
                                onChange={(e) =>
                                  handlePermissaoChangeWithHierarchy(
                                    perm.id,
                                    e.target.checked,
                                    'geral'
                                  )
                                }
                                size="small"
                              />
                            </Box>

                            {/* Checkbox Editar */}
                            <Box sx={{ textAlign: 'center' }}>
                              {permissaoAlterar && (
                                <Checkbox
                                  checked={permissoesSelecionadas[permissaoAlterar.id] || false}
                                  onChange={(e) =>
                                    handlePermissaoChangeWithHierarchy(
                                      permissaoAlterar.id,
                                      e.target.checked,
                                      'editar'
                                    )
                                  }
                                  size="small"
                                />
                              )}
                            </Box>

                            {/* Checkbox Excluir */}
                            <Box sx={{ textAlign: 'center' }}>
                              {permissaoExcluir && (
                                <Checkbox
                                  checked={permissoesSelecionadas[permissaoExcluir.id] || false}
                                  onChange={(e) =>
                                    handlePermissaoChangeWithHierarchy(
                                      permissaoExcluir.id,
                                      e.target.checked,
                                      'excluir'
                                    )
                                  }
                                  size="small"
                                />
                              )}
                            </Box>

                            {/* Checkbox Criar */}
                            <Box sx={{ textAlign: 'center' }}>
                              {permissaoCriar && (
                                <Checkbox
                                  checked={permissoesSelecionadas[permissaoCriar.id] || false}
                                  onChange={(e) =>
                                    handlePermissaoChangeWithHierarchy(
                                      permissaoCriar.id,
                                      e.target.checked,
                                      'criar'
                                    )
                                  }
                                  size="small"
                                />
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                  </Box>
                </Box>
              );
            })}

            {/* Seção especial para Lojas com seleção individual */}
            {filteredPermissoes.some((p) => p.categoria === 'Lojas') && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f7ff', borderRadius: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}
                >
                  Configuração de Acesso às Lojas
                </Typography>

                {/* Permissões gerais de loja em formato compacto */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 2 }}>
                  {filteredPermissoes
                    .filter((p) => p.categoria === 'Lojas')
                    .map((perm) => (
                      <FormControlLabel
                        key={perm.id}
                        control={
                          <Checkbox
                            checked={form.permissoes.includes(perm.id)}
                            onChange={(e) => handlePermissaoChange(perm.id, e.target.checked)}
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {perm.nome}
                          </Typography>
                        }
                        sx={{ margin: 0 }}
                      />
                    ))}
                </Box>

                {/* Seleção de lojas específicas */}
                {form.permissoes.includes(1902) && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      backgroundColor: '#fff',
                      borderRadius: 1,
                      border: '1px solid #ddd',
                    }}
                  >
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Selecionar Lojas Específicas:
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 1,
                      }}
                    >
                      {lojas.map((loja) => (
                        <FormControlLabel
                          key={loja.id}
                          control={
                            <Checkbox
                              checked={form.permissoes.includes(`loja_${loja.id}`)}
                              onChange={(e) =>
                                handlePermissaoChange(`loja_${loja.id}`, e.target.checked)
                              }
                              size="small"
                            />
                          }
                          label={
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {loja.nome}
                            </Typography>
                          }
                          sx={{ margin: 0 }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenEditModal(false)} disabled={saving} variant="outlined">
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveGrupo}
            disabled={saving || !form.nome}
            sx={{ backgroundColor: '#1976d2' }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
