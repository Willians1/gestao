import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../api';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add, Delete, Edit, Save, Close, LockReset } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';

const NIVEL_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'visualizacao', label: 'Visualização' },
  { value: 'willians', label: 'Willians' },
];

export default function CadastroUsuarios() {
  const { token, hasPermission } = useAuth();
  const canCreate = hasPermission('/cadastro-usuarios', 'create');
  const canUpdate = hasPermission('/cadastro-usuarios', 'update');
  const canDelete = hasPermission('/cadastro-usuarios', 'delete');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  // Edição inline
  const [editRowId, setEditRowId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  // Dialog de novo usuário
  const [openNew, setOpenNew] = useState(false);
  const [newData, setNewData] = useState({
    username: '',
    nome: '',
    email: '',
    password: '',
    confirm: '',
    nivel_acesso: 'visualizacao',
    ativo: true,
  });

  // Diálogo de Alteração de Senha
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdUser, setPwdUser] = useState(null);
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const headers = useMemo(
    () =>
      token
        ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' },
    [token]
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/usuarios/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Falha ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleDownloadTemplate = async () => {
    try {
      const resp = await fetch(`${API_BASE}/templates/usuarios`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error('Erro ao baixar modelo');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_usuarios.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      setSnack({ open: true, message: 'Falha ao baixar modelo de usuários', severity: 'error' });
    }
  };

  // Carrega usuários apenas quando houver token para evitar 401 na primeira renderização
  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token, fetchUsers]);

  const openPasswordDialog = (user) => {
    setPwdUser(user);
    setPwdNew('');
    setPwdConfirm('');
    setPwdOpen(true);
  };

  const submitPasswordChange = async () => {
    if (!pwdUser) {
      setPwdOpen(false);
      return;
    }
    if (!pwdNew || !pwdConfirm) {
      setSnack({
        open: true,
        message: 'Informe a nova senha e a confirmação',
        severity: 'warning',
      });
      return;
    }
    if (pwdNew !== pwdConfirm) {
      setSnack({ open: true, message: 'Senhas não conferem', severity: 'warning' });
      return;
    }
    if (pwdNew.length < 4) {
      setSnack({
        open: true,
        message: 'Senha muito curta (mínimo 4 caracteres)',
        severity: 'warning',
      });
      return;
    }
    setPwdLoading(true);
    try {
      const payload = { password: pwdNew };
      const res = await fetch(`${API_BASE}/usuarios/${pwdUser.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = `Falha ao alterar senha (HTTP ${res.status})`;
        try {
          const j = await res.json();
          if (j?.detail) msg = j.detail;
        } catch {}
        throw new Error(msg);
      }
      setSnack({ open: true, message: 'Senha alterada com sucesso', severity: 'success' });
      setPwdOpen(false);
    } catch (e) {
      setSnack({ open: true, message: e.message || 'Erro ao alterar senha', severity: 'error' });
    } finally {
      setPwdLoading(false);
    }
  };

  const startEdit = (row) => {
    setEditRowId(row.id);
    setEditDraft({ ...row, password: '' });
  };

  const cancelEdit = () => {
    setEditRowId(null);
    setEditDraft({});
  };

  const saveEdit = async () => {
    const id = editRowId;
    if (id == null) return;
    const payload = {
      username: editDraft.username || '',
      nome: editDraft.nome || '',
      email: editDraft.email || null,
      nivel_acesso: editDraft.nivel_acesso || 'visualizacao',
      ativo: !!editDraft.ativo,
      ...(editDraft.password ? { password: editDraft.password } : {}),
    };
    try {
      const res = await fetch(`${API_BASE}/usuarios/${id}`, {
        method: 'PUT',
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
      const updated = await res.json();
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setSnack({ open: true, message: 'Usuário atualizado', severity: 'success' });
      cancelEdit();
    } catch (e) {
      setSnack({ open: true, message: e.message || 'Erro ao salvar', severity: 'error' });
    }
  };

  const openNewDialog = () => {
    setNewData({
      username: '',
      nome: '',
      email: '',
      password: '',
      confirm: '',
      nivel_acesso: 'visualizacao',
      ativo: true,
    });
    setOpenNew(true);
  };

  const createUser = async () => {
    const { username, nome, email, password, confirm, nivel_acesso, ativo } = newData;
    if (!username || !nome || !password || !confirm) {
      setSnack({ open: true, message: 'Preencha os campos obrigatórios', severity: 'warning' });
      return;
    }
    if (password !== confirm) {
      setSnack({ open: true, message: 'Senhas não conferem', severity: 'warning' });
      return;
    }
    const payload = {
      username,
      password,
      nome,
      email: email || null,
      nivel_acesso,
      ativo: !!ativo,
    };
    try {
      const res = await fetch(`${API_BASE}/usuarios/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = `Falha ao criar (HTTP ${res.status})`;
        try {
          const j = await res.json();
          if (j?.detail) msg = j.detail;
        } catch {}
        throw new Error(msg);
      }
      const created = await res.json();
      setRows((prev) => [created, ...prev]);
      setSnack({ open: true, message: 'Usuário criado', severity: 'success' });
      setOpenNew(false);
    } catch (e) {
      setSnack({ open: true, message: e.message || 'Erro ao criar', severity: 'error' });
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Remover este usuário?')) return;
    try {
      const res = await fetch(`${API_BASE}/usuarios/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error(`Falha ao remover (HTTP ${res.status})`);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setSnack({ open: true, message: 'Usuário removido', severity: 'success' });
    } catch (e) {
      setSnack({ open: true, message: e.message || 'Erro ao remover', severity: 'error' });
    }
  };

  const importExcel = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
      // Espera colunas: username, nome, email, nivel_acesso, password, ativo
      let created = 0,
        failed = 0;
      for (const row of json) {
        const payload = {
          username: String(row.username || '').trim(),
          nome: String(row.nome || '').trim(),
          email: row.email ? String(row.email).trim() : null,
          nivel_acesso: String(row.nivel_acesso || 'visualizacao').toLowerCase(),
          password: String(row.password || '').trim(),
          ativo:
            String(row.ativo || '1')
              .toString()
              .trim()
              .toLowerCase() !== '0',
        };
        if (!payload.username || !payload.nome || !payload.password) {
          failed++;
          continue;
        }
        try {
          const res = await fetch(`${API_BASE}/usuarios/`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error();
          const createdUser = await res.json();
          setRows((prev) => [createdUser, ...prev]);
          created++;
        } catch {
          failed++;
        }
      }
      setSnack({
        open: true,
        message: `Importação concluída: ${created} criado(s), ${failed} falha(s)`,
        severity: failed ? 'warning' : 'success',
      });
    } catch (e) {
      setSnack({ open: true, message: 'Falha ao importar Excel', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Cadastro de Usuários
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie usuários do sistema (mesma base de login admin/admin)
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {canCreate && (
            <Button variant="contained" startIcon={<Add />} onClick={openNewDialog}>
              Novo
            </Button>
          )}
          <Button variant="text" onClick={handleDownloadTemplate}>
            Baixar modelo
          </Button>
          <Button variant="outlined" component="label">
            Importar Excel
            <input
              hidden
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importExcel(f);
                e.target.value = '';
              }}
            />
          </Button>
          <Button variant="text" onClick={fetchUsers}>
            Recarregar
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Usuário</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Nível</TableCell>
              <TableCell>Ativo</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.id}</TableCell>
                <TableCell>
                  {editRowId === r.id ? (
                    <TextField
                      size="small"
                      value={editDraft.username || ''}
                      onChange={(e) => setEditDraft((d) => ({ ...d, username: e.target.value }))}
                    />
                  ) : (
                    r.username
                  )}
                </TableCell>
                <TableCell>
                  {editRowId === r.id ? (
                    <TextField
                      size="small"
                      value={editDraft.nome || ''}
                      onChange={(e) => setEditDraft((d) => ({ ...d, nome: e.target.value }))}
                    />
                  ) : (
                    r.nome
                  )}
                </TableCell>
                <TableCell>
                  {editRowId === r.id ? (
                    <TextField
                      size="small"
                      value={editDraft.email || ''}
                      onChange={(e) => setEditDraft((d) => ({ ...d, email: e.target.value }))}
                    />
                  ) : (
                    r.email || ''
                  )}
                </TableCell>
                <TableCell>
                  {editRowId === r.id ? (
                    <TextField
                      size="small"
                      select
                      value={editDraft.nivel_acesso || 'visualizacao'}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, nivel_acesso: e.target.value }))
                      }
                    >
                      {NIVEL_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    (() => {
                      const opt = NIVEL_OPTIONS.find(
                        (o) => o.value.toLowerCase() === String(r.nivel_acesso || '').toLowerCase()
                      );
                      return opt ? opt.label : r.nivel_acesso;
                    })()
                  )}
                </TableCell>
                <TableCell>
                  {editRowId === r.id ? (
                    <Switch
                      checked={!!editDraft.ativo}
                      onChange={(e) => setEditDraft((d) => ({ ...d, ativo: e.target.checked }))}
                    />
                  ) : (
                    <Switch checked={!!r.ativo} disabled />
                  )}
                </TableCell>
                <TableCell align="right">
                  {editRowId === r.id ? (
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton color="primary" onClick={saveEdit} title="Salvar">
                        <Save />
                      </IconButton>
                      <IconButton onClick={cancelEdit} title="Cancelar">
                        <Close />
                      </IconButton>
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {canUpdate && (
                        <IconButton onClick={() => openPasswordDialog(r)} title="Alterar senha">
                          <LockReset />
                        </IconButton>
                      )}
                      {canUpdate && (
                        <IconButton onClick={() => startEdit(r)} title="Editar">
                          <Edit />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton color="error" onClick={() => deleteUser(r.id)} title="Remover">
                          <Delete />
                        </IconButton>
                      )}
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && !loading && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Novo Usuário */}
      <Dialog open={openNew} onClose={() => setOpenNew(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Usuário</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Usuário"
              value={newData.username}
              onChange={(e) => setNewData((d) => ({ ...d, username: e.target.value }))}
              required
            />
            <TextField
              label="Nome"
              value={newData.nome}
              onChange={(e) => setNewData((d) => ({ ...d, nome: e.target.value }))}
              required
            />
            <TextField
              label="Email"
              type="email"
              value={newData.email}
              onChange={(e) => setNewData((d) => ({ ...d, email: e.target.value }))}
            />
            <TextField
              label="Senha"
              type="password"
              value={newData.password}
              onChange={(e) => setNewData((d) => ({ ...d, password: e.target.value }))}
              required
            />
            <TextField
              label="Confirmar Senha"
              type="password"
              value={newData.confirm}
              onChange={(e) => setNewData((d) => ({ ...d, confirm: e.target.value }))}
              required
            />
            <TextField
              select
              label="Nível de acesso"
              value={newData.nivel_acesso}
              onChange={(e) => setNewData((d) => ({ ...d, nivel_acesso: e.target.value }))}
            >
              {NIVEL_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNew(false)}>Cancelar</Button>
          <Button onClick={createUser} variant="contained">
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Alterar Senha */}
      <Dialog open={pwdOpen} onClose={() => setPwdOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Alterar Senha {pwdUser ? `(${pwdUser.username})` : ''}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nova Senha"
              type="password"
              value={pwdNew}
              onChange={(e) => setPwdNew(e.target.value)}
              required
            />
            <TextField
              label="Confirmar Senha"
              type="password"
              value={pwdConfirm}
              onChange={(e) => setPwdConfirm(e.target.value)}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwdOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={submitPasswordChange} disabled={pwdLoading}>
            {pwdLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

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
