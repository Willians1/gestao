import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../api';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Stack,
  Snackbar,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Add, Delete, Save } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const TEMPO_OPTIONS = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
];

const CONDICAO_OPTIONS = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
];

export default function RelatorioObras() {
  const { token, hasPermission } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  // Dados do relatório
  const [clienteId, setClienteId] = useState('');
  const [tempo, setTempo] = useState('');
  const [condicao, setCondicao] = useState('');
  const [indicePluviometrico, setIndicePluviometrico] = useState('');

  // Listas dinâmicas
  const [maoDeObra, setMaoDeObra] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [atividades, setAtividades] = useState([]);

  // Campos de entrada para adicionar itens
  const [novoMaoObra, setNovoMaoObra] = useState('');
  const [novoEquipamento, setNovoEquipamento] = useState('');
  const [novaAtividade, setNovaAtividade] = useState('');

  const headers = useMemo(
    () =>
      token
        ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' },
    [token]
  );

  const canCreate = hasPermission('/relatorio-obras', 'create');

  // Carregar clientes
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await fetch(`${API_BASE}/clientes`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setClientes(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('Erro ao carregar clientes:', e);
      }
    };
    if (token) fetchClientes();
  }, [token]);

  // Adicionar item às listas
  const adicionarMaoObra = () => {
    if (novoMaoObra.trim()) {
      setMaoDeObra([...maoDeObra, novoMaoObra.trim()]);
      setNovoMaoObra('');
    }
  };

  const adicionarEquipamento = () => {
    if (novoEquipamento.trim()) {
      setEquipamentos([...equipamentos, novoEquipamento.trim()]);
      setNovoEquipamento('');
    }
  };

  const adicionarAtividade = () => {
    if (novaAtividade.trim()) {
      setAtividades([...atividades, novaAtividade.trim()]);
      setNovaAtividade('');
    }
  };

  // Remover item das listas
  const removerMaoObra = (index) => {
    setMaoDeObra(maoDeObra.filter((_, i) => i !== index));
  };

  const removerEquipamento = (index) => {
    setEquipamentos(equipamentos.filter((_, i) => i !== index));
  };

  const removerAtividade = (index) => {
    setAtividades(atividades.filter((_, i) => i !== index));
  };

  // Salvar relatório
  const salvarRelatorio = async () => {
    if (!clienteId) {
      setSnack({ open: true, message: 'Selecione um cliente', severity: 'warning' });
      return;
    }

    const payload = {
      cliente_id: Number(clienteId),
      tempo,
      condicao,
      indice_pluviometrico: indicePluviometrico ? Number(indicePluviometrico) : null,
      mao_de_obra: maoDeObra,
      equipamentos,
      atividades,
      data_relatorio: new Date().toISOString(),
    };

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/relatorios-obras/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = `Falha ao salvar (HTTP ${res.status})`;
        try {
          const j = await res.json();
          if (j?.detail) msg = j.detail;
        } catch {}
        throw new Error(msg);
      }

      setSnack({ open: true, message: 'Relatório salvo com sucesso!', severity: 'success' });

      // Limpar formulário
      setClienteId('');
      setTempo('');
      setCondicao('');
      setIndicePluviometrico('');
      setMaoDeObra([]);
      setEquipamentos([]);
      setAtividades([]);
    } catch (e) {
      setSnack({ open: true, message: e.message || 'Erro ao salvar relatório', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Relatório de Obras (Inspeção)
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        {/* Seleção de Cliente */}
        <TextField
          select
          fullWidth
          label="Cliente"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          sx={{ mb: 3 }}
          required
        >
          <MenuItem value="">
            <em>Selecione um cliente</em>
          </MenuItem>
          {clientes.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.nome}
            </MenuItem>
          ))}
        </TextField>

        <Divider sx={{ my: 3 }} />

        {/* Condição Climática */}
        <Typography variant="h6" color="primary" gutterBottom>
          Condição climática
        </Typography>

        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Tempo</FormLabel>
          <RadioGroup row value={tempo} onChange={(e) => setTempo(e.target.value)}>
            {TEMPO_OPTIONS.map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                control={<Radio />}
                label={opt.label}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Condição</FormLabel>
          <RadioGroup row value={condicao} onChange={(e) => setCondicao(e.target.value)}>
            {CONDICAO_OPTIONS.map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                control={<Radio />}
                label={opt.label}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <TextField
          fullWidth
          label='Índice pluviométrico (Quantidade em "mm")'
          placeholder="Ex.: 5.30"
          value={indicePluviometrico}
          onChange={(e) => setIndicePluviometrico(e.target.value)}
          type="number"
          inputProps={{ step: '0.01' }}
          sx={{ mb: 3 }}
        />

        <Divider sx={{ my: 3 }} />

        {/* Mão de obra */}
        <Typography variant="h6" color="primary" gutterBottom>
          Mão de obra ({maoDeObra.length})
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Adicionar mão de obra"
            value={novoMaoObra}
            onChange={(e) => setNovoMaoObra(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && adicionarMaoObra()}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={adicionarMaoObra}
            disabled={!novoMaoObra.trim()}
          >
            Adicionar
          </Button>
        </Stack>
        {maoDeObra.length > 0 && (
          <List dense>
            {maoDeObra.map((item, index) => (
              <ListItem key={index}>
                <ListItemText primary={item} />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => removerMaoObra(index)} size="small">
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Equipamentos */}
        <Typography variant="h6" color="primary" gutterBottom>
          Equipamentos ({equipamentos.length})
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Adicionar equipamento"
            value={novoEquipamento}
            onChange={(e) => setNovoEquipamento(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && adicionarEquipamento()}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={adicionarEquipamento}
            disabled={!novoEquipamento.trim()}
          >
            Adicionar
          </Button>
        </Stack>
        {equipamentos.length > 0 && (
          <List dense>
            {equipamentos.map((item, index) => (
              <ListItem key={index}>
                <ListItemText primary={item} />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => removerEquipamento(index)} size="small">
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Atividades */}
        <Typography variant="h6" color="primary" gutterBottom>
          Atividades ({atividades.length})
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Adicionar atividade"
            value={novaAtividade}
            onChange={(e) => setNovaAtividade(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && adicionarAtividade()}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={adicionarAtividade}
            disabled={!novaAtividade.trim()}
          >
            Adicionar
          </Button>
        </Stack>
        {atividades.length > 0 && (
          <List dense>
            {atividades.map((item, index) => (
              <ListItem key={index}>
                <ListItemText primary={item} />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => removerAtividade(index)} size="small">
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Botão Salvar */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            startIcon={<Save />}
            onClick={salvarRelatorio}
            disabled={loading || !canCreate}
            size="large"
          >
            {loading ? 'Salvando...' : 'Salvar Relatório'}
          </Button>
        </Stack>
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
