import React, { useEffect, useMemo, useState } from 'react';
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
	FormGroup,
	FormControlLabel,
	Checkbox,
	Divider
} from '@mui/material';
import { Add, Delete, Edit, Save, Close, Security } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';

const NIVEL_OPTIONS = [
	{ value: 'admin', label: 'Admin' },
	{ value: 'manutencao', label: 'Manutenção' },
	{ value: 'visualizacao', label: 'Visualização' },
	{ value: 'willians', label: 'Willians' },
];

export default function CadastroUsuarios() {
	const { token } = useAuth();
	const [rows, setRows] = useState([]);
	const [grupos, setGrupos] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

	// Edição inline
	const [editRowId, setEditRowId] = useState(null);
	const [editDraft, setEditDraft] = useState({});

	// Dialog de novo usuário
	const [openNew, setOpenNew] = useState(false);
	const [newData, setNewData] = useState({ username: '', nome: '', email: '', password: '', confirm: '', nivel_acesso: 'visualizacao', ativo: true, grupo_id: null });

	// Diálogo de Permissões (por página via grupo do usuário)
	const [permOpen, setPermOpen] = useState(false);
	const [permLoading, setPermLoading] = useState(false);
	const [permUser, setPermUser] = useState(null);
	const [permGroup, setPermGroup] = useState(null); // detalhes do grupo
	const [permChecked, setPermChecked] = useState(new Set());

	// Mapa das páginas x IDs base de permissão (leitura/acesso)
	const PAGE_FLAGS = [
		{ id: 1101, label: 'Usuários', route: '/cadastro-usuarios' },
		{ id: 1201, label: 'Clientes', route: '/clientes' },
		{ id: 1301, label: 'Fornecedores', route: '/fornecedores' },
		{ id: 1401, label: 'Contratos', route: '/contratos' },
		{ id: 1501, label: 'Orçamento de Obra', route: '/orcamento-obra' },
		{ id: 1601, label: 'Despesas', route: '/despesas' },
		{ id: 1701, label: 'Valor Materiais', route: '/valor-materiais' },
		{ id: 1801, label: 'Resumo Mensal', route: '/resumo-mensal' },
	];

	const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }), [token]);

	const fetchUsers = async () => {
		setLoading(true);
		setError('');
		try {
			const [res, resGrupos] = await Promise.all([
				fetch(`${API_BASE}/usuarios/`),
				fetch(`${API_BASE}/grupos/`)
			]);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			setRows(Array.isArray(data) ? data : []);
			if (resGrupos.ok) {
				const gs = await resGrupos.json();
				setGrupos(Array.isArray(gs) ? gs : []);
			}
		} catch (e) {
			setError(e.message || 'Falha ao carregar usuários');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { fetchUsers(); }, []);

	const openPermissionsDialog = async (user) => {
		if (!user.grupo_id) {
			setSnack({ open: true, message: 'Defina um Grupo para o usuário antes de ajustar permissões.', severity: 'warning' });
			return;
		}
		setPermUser(user);
		setPermOpen(true);
		setPermLoading(true);
		try {
			// Buscar detalhes do grupo e suas permissões atuais
			const [resGroup, resPerms] = await Promise.all([
				fetch(`${API_BASE}/grupos/${user.grupo_id}`),
				fetch(`${API_BASE}/grupos/${user.grupo_id}/permissoes/`)
			]);
			let g = null;
			if (resGroup.ok) g = await resGroup.json();
			setPermGroup(g);
			let currentIds = new Set();
			if (resPerms.ok) {
				const data = await resPerms.json();
				const ids = (data?.permissoes || []).map(p => p.id);
				currentIds = new Set(ids);
			}
			// Se nível admin, tudo marcado
			const isAdminLevel = String(user.nivel_acesso || '').toLowerCase() === 'admin' || String(user.nivel_acesso || '').toLowerCase() === 'willians';
			if (isAdminLevel) {
				setPermChecked(new Set(PAGE_FLAGS.map(p => p.id)));
			} else {
				const baseChecked = new Set(PAGE_FLAGS.filter(p => currentIds.has(p.id)).map(p => p.id));
				setPermChecked(baseChecked);
			}
		} catch (e) {
			setSnack({ open: true, message: 'Falha ao carregar permissões', severity: 'error' });
		} finally {
			setPermLoading(false);
		}
	};

	const toggleFlag = (permId) => {
		setPermChecked(prev => {
			const n = new Set(prev);
			if (n.has(permId)) n.delete(permId); else n.add(permId);
			return n;
		});
	};

	const savePermissions = async () => {
		if (!permUser || !permGroup) { setPermOpen(false); return; }
		const isAdminLevel = String(permUser.nivel_acesso || '').toLowerCase() === 'admin' || String(permUser.nivel_acesso || '').toLowerCase() === 'willians';
		if (isAdminLevel) { setPermOpen(false); return; }
		setPermLoading(true);
		try {
			// Montar payload preservando campos do grupo; atualizar apenas permissoes
			const payload = {
				nome: permGroup.nome,
				descricao: permGroup.descricao ?? null,
				status: permGroup.status ?? 'Aprovado',
				motivo: permGroup.motivo ?? null,
				valor_maximo_diario_financeiro: permGroup.valor_maximo_diario_financeiro ?? 0,
				preco_venda: permGroup.preco_venda ?? 0,
				plano_contas: permGroup.plano_contas ?? 0,
				valor_maximo_movimentacao: permGroup.valor_maximo_movimentacao ?? 0,
				valor_maximo_solicitacao_compra: permGroup.valor_maximo_solicitacao_compra ?? 0,
				valor_maximo_diario_solicitacao_compra: permGroup.valor_maximo_diario_solicitacao_compra ?? 0,
				permissoes: Array.from(permChecked),
			};
			const res = await fetch(`${API_BASE}/grupos/${permUser.grupo_id}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
			if (!res.ok) {
				let msg = `Falha ao salvar permissões (HTTP ${res.status})`;
				try { const j = await res.json(); if (j?.detail) msg = j.detail; } catch {}
				throw new Error(msg);
			}
			setSnack({ open: true, message: 'Permissões atualizadas', severity: 'success' });
			setPermOpen(false);
		} catch (e) {
			setSnack({ open: true, message: e.message || 'Erro ao atualizar permissões', severity: 'error' });
		} finally {
			setPermLoading(false);
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
			grupo_id: editDraft.grupo_id ?? null,
			...(editDraft.password ? { password: editDraft.password } : {}),
		};
		try {
			const res = await fetch(`${API_BASE}/usuarios/${id}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
			if (!res.ok) {
				let msg = `Falha ao salvar (HTTP ${res.status})`;
				try { const j = await res.json(); if (j?.detail) msg = j.detail; } catch {}
				throw new Error(msg);
			}
			const updated = await res.json();
			setRows(prev => prev.map(r => (r.id === id ? updated : r)));
			setSnack({ open: true, message: 'Usuário atualizado', severity: 'success' });
			cancelEdit();
		} catch (e) {
			setSnack({ open: true, message: e.message || 'Erro ao salvar', severity: 'error' });
		}
	};

	const openNewDialog = () => {
		setNewData({ username: '', nome: '', email: '', password: '', confirm: '', nivel_acesso: 'visualizacao', ativo: true, grupo_id: null });
		setOpenNew(true);
	};

	const createUser = async () => {
		const { username, nome, email, password, confirm, nivel_acesso, ativo, grupo_id } = newData;
		if (!username || !nome || !password || !confirm) {
			setSnack({ open: true, message: 'Preencha os campos obrigatórios', severity: 'warning' });
			return;
		}
		if (password !== confirm) {
			setSnack({ open: true, message: 'Senhas não conferem', severity: 'warning' });
			return;
		}
		const payload = { username, password, nome, email: email || null, nivel_acesso, ativo: !!ativo, grupo_id: grupo_id ?? null };
		try {
			const res = await fetch(`${API_BASE}/usuarios/`, { method: 'POST', headers, body: JSON.stringify(payload) });
			if (!res.ok) {
				let msg = `Falha ao criar (HTTP ${res.status})`;
				try { const j = await res.json(); if (j?.detail) msg = j.detail; } catch {}
				throw new Error(msg);
			}
			const created = await res.json();
			setRows(prev => [created, ...prev]);
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
			setRows(prev => prev.filter(r => r.id !== id));
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
			// Opcionalmente: grupo_id ou grupo (nome)
			let created = 0, failed = 0;
			for (const row of json) {
				const payload = {
					username: String(row.username || '').trim(),
					nome: String(row.nome || '').trim(),
					email: row.email ? String(row.email).trim() : null,
					nivel_acesso: String(row.nivel_acesso || 'visualizacao').toLowerCase(),
					password: String(row.password || '').trim(),
					ativo: String(row.ativo || '1').toString().trim().toLowerCase() !== '0',
				};
				// Mapear grupo opcional
				let gid = null;
				if (row.grupo_id !== undefined && row.grupo_id !== null && row.grupo_id !== '') {
					const parsed = Number(row.grupo_id);
					if (!Number.isNaN(parsed)) gid = parsed;
				} else if (row.grupo || row.grupo_nome) {
					const nomeGrupo = String(row.grupo || row.grupo_nome || '').trim().toLowerCase();
					const g = grupos.find(x => String(x.nome || '').trim().toLowerCase() === nomeGrupo);
					if (g) gid = g.id;
				}
				if (gid !== null) {
					payload.grupo_id = gid;
				}
				if (!payload.username || !payload.nome || !payload.password) { failed++; continue; }
				try {
					const res = await fetch(`${API_BASE}/usuarios/`, { method: 'POST', headers, body: JSON.stringify(payload) });
					if (!res.ok) throw new Error();
					const createdUser = await res.json();
					setRows(prev => [createdUser, ...prev]);
					created++;
				} catch {
					failed++;
				}
			}
			setSnack({ open: true, message: `Importação concluída: ${created} criado(s), ${failed} falha(s)`, severity: failed ? 'warning' : 'success' });
		} catch (e) {
			setSnack({ open: true, message: 'Falha ao importar Excel', severity: 'error' });
		}
	};

	return (
		<Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
				<Box>
					<Typography variant="h5" sx={{ fontWeight: 700 }}>Cadastro de Usuários</Typography>
					<Typography variant="body2" color="text.secondary">Gerencie usuários do sistema (mesma base de login admin/admin)</Typography>
				</Box>
				<Stack direction="row" spacing={1}>
					<Button variant="contained" startIcon={<Add />} onClick={openNewDialog}>Novo</Button>
					<Button variant="outlined" component="label">
						Importar Excel
						<input hidden type="file" accept=".xlsx,.xls" onChange={(e) => { const f = e.target.files?.[0]; if (f) importExcel(f); e.target.value = ''; }} />
					</Button>
					<Button variant="text" onClick={fetchUsers}>Recarregar</Button>
				</Stack>
			</Stack>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
			)}

			<TableContainer component={Paper}>
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell>ID</TableCell>
							<TableCell>Usuário</TableCell>
							<TableCell>Nome</TableCell>
							<TableCell>Email</TableCell>
								<TableCell>Grupo</TableCell>
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
										<TextField size="small" value={editDraft.username || ''} onChange={(e) => setEditDraft(d => ({ ...d, username: e.target.value }))} />
									) : r.username}
								</TableCell>
								<TableCell>
									{editRowId === r.id ? (
										<TextField size="small" value={editDraft.nome || ''} onChange={(e) => setEditDraft(d => ({ ...d, nome: e.target.value }))} />
									) : r.nome}
								</TableCell>
								<TableCell>
									{editRowId === r.id ? (
										<TextField size="small" value={editDraft.email || ''} onChange={(e) => setEditDraft(d => ({ ...d, email: e.target.value }))} />
									) : (r.email || '')}
								</TableCell>
								<TableCell>
									{editRowId === r.id ? (
										<TextField size="small" select value={editDraft.grupo_id ?? ''} onChange={(e) => setEditDraft(d => ({ ...d, grupo_id: e.target.value ? Number(e.target.value) : null }))}>
											<MenuItem value="">
												<em>Sem grupo</em>
											</MenuItem>
											{grupos.map(g => (
												<MenuItem key={g.id} value={g.id}>{g.nome}</MenuItem>
											))}
										</TextField>
									) : (
										(() => {
											const g = grupos.find(x => x.id === r.grupo_id);
											return g ? g.nome : '-';
										})()
									)}
								</TableCell>
								<TableCell>
									{editRowId === r.id ? (
										<TextField size="small" select value={editDraft.nivel_acesso || 'visualizacao'} onChange={(e) => setEditDraft(d => ({ ...d, nivel_acesso: e.target.value }))}>
											{NIVEL_OPTIONS.map(o => (<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>))}
										</TextField>
									) : (
										(() => {
											const opt = NIVEL_OPTIONS.find(o => o.value.toLowerCase() === String(r.nivel_acesso || '').toLowerCase());
											return opt ? opt.label : r.nivel_acesso;
										})()
									)}
								</TableCell>
								<TableCell>
									{editRowId === r.id ? (
										<Switch checked={!!editDraft.ativo} onChange={(e) => setEditDraft(d => ({ ...d, ativo: e.target.checked }))} />
									) : (
										<Switch checked={!!r.ativo} disabled />
									)}
								</TableCell>
								<TableCell align="right">
									{editRowId === r.id ? (
										<Stack direction="row" spacing={1} justifyContent="flex-end">
											<IconButton color="primary" onClick={saveEdit} title="Salvar"><Save /></IconButton>
											<IconButton onClick={cancelEdit} title="Cancelar"><Close /></IconButton>
										</Stack>
									) : (
										<Stack direction="row" spacing={1} justifyContent="flex-end">
											<IconButton onClick={() => openPermissionsDialog(r)} title="Permissões"><Security /></IconButton>
											<IconButton onClick={() => startEdit(r)} title="Editar"><Edit /></IconButton>
											<IconButton color="error" onClick={() => deleteUser(r.id)} title="Remover"><Delete /></IconButton>
										</Stack>
									)}
								</TableCell>
							</TableRow>
						))}
							{!rows.length && !loading && (
							<TableRow>
									<TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>Nenhum usuário encontrado</TableCell>
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
						<TextField label="Usuário" value={newData.username} onChange={(e) => setNewData(d => ({ ...d, username: e.target.value }))} required />
						<TextField label="Nome" value={newData.nome} onChange={(e) => setNewData(d => ({ ...d, nome: e.target.value }))} required />
						<TextField label="Email" type="email" value={newData.email} onChange={(e) => setNewData(d => ({ ...d, email: e.target.value }))} />
						<TextField label="Senha" type="password" value={newData.password} onChange={(e) => setNewData(d => ({ ...d, password: e.target.value }))} required />
						<TextField label="Confirmar Senha" type="password" value={newData.confirm} onChange={(e) => setNewData(d => ({ ...d, confirm: e.target.value }))} required />
						<TextField select label="Nível de acesso" value={newData.nivel_acesso} onChange={(e) => setNewData(d => ({ ...d, nivel_acesso: e.target.value }))}>
							{NIVEL_OPTIONS.map(o => (<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>))}
						</TextField>
							<TextField select label="Grupo" value={newData.grupo_id ?? ''} onChange={(e) => setNewData(d => ({ ...d, grupo_id: e.target.value ? Number(e.target.value) : null }))}>
								<MenuItem value=""><em>Sem grupo</em></MenuItem>
								{grupos.map(g => (<MenuItem key={g.id} value={g.id}>{g.nome}</MenuItem>))}
							</TextField>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenNew(false)}>Cancelar</Button>
					<Button onClick={createUser} variant="contained">Criar</Button>
				</DialogActions>
			</Dialog>

			{/* Dialog Permissões por Página */}
			<Dialog open={permOpen} onClose={() => setPermOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle>Permissões de Acesso por Página</DialogTitle>
				<DialogContent dividers>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						As permissões são aplicadas ao Grupo do usuário selecionado. Ajustes aqui afetam todos os usuários deste grupo.
					</Typography>
					{permUser && (String(permUser.nivel_acesso || '').toLowerCase() === 'admin' || String(permUser.nivel_acesso || '').toLowerCase() === 'willians') && (
						<Alert severity="info" sx={{ mb: 2 }}>
							Nível de acesso Admin: todas as páginas estão habilitadas por padrão.
						</Alert>
					)}
					{permLoading ? (
						<Typography>Carregando permissões…</Typography>
					) : (
						<FormGroup>
							{PAGE_FLAGS.map(p => {
								const isAdminLevel = permUser && (String(permUser.nivel_acesso || '').toLowerCase() === 'admin' || String(permUser.nivel_acesso || '').toLowerCase() === 'willians');
								return (
									<FormControlLabel
										key={p.id}
										control={<Checkbox checked={permChecked.has(p.id)} onChange={() => toggleFlag(p.id)} disabled={isAdminLevel} />}
										label={p.label}
									/>
								);
							})}
						</FormGroup>
					)}
					<Divider sx={{ mt: 1 }} />
					{permGroup && (
						<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
							Grupo: {permGroup?.nome} (ID {permGroup?.id})
						</Typography>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setPermOpen(false)}>Fechar</Button>
					<Button onClick={savePermissions} disabled={permLoading || (permUser && (String(permUser.nivel_acesso || '').toLowerCase() === 'admin' || String(permUser.nivel_acesso || '').toLowerCase() === 'willians'))} variant="contained">Salvar</Button>
				</DialogActions>
			</Dialog>

			<Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
				<Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
					{snack.message}
				</Alert>
			</Snackbar>
		</Box>
	);
}
