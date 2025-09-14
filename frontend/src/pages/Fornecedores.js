
import React from 'react';
import { Box, Button, Paper, Typography, Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useMediaQuery } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function Fornecedores() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const { token, hasPermission } = useAuth();
  const canCreate = hasPermission('/fornecedores', 'create');
  const [rows, setRows] = React.useState([]);
  const [selectedFornecedor, setSelectedFornecedor] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [total, setTotal] = React.useState(0);
  const [openModal, setOpenModal] = React.useState(false);
  const [form, setForm] = React.useState({ nome: '', cnpj: '', telefone: '' });
  const [saving, setSaving] = React.useState(false);
  const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const loadPersisted = async () => {
    try {
      const resp = await fetch(`${API}/fornecedores/`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!resp.ok) return;
      const data = await resp.json();
      if (!data) return;
      setRows((data || []).map((r, i) => ({ id: r.id ?? i + 1, ...r })));
      setTotal((data || []).length);
    } catch (e) { console.error(e); }
  };

  React.useEffect(() => { loadPersisted(); }, []);

  return (
    <Box sx={{ 
      background: theme.palette.background.default, 
      minHeight: '100vh', 
      p: { xs: 1, sm: 2, md: 3, lg: 4 } 
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: { xs: 1, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 3 } }}>
          <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mr: 2 }}>Voltar</Button>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            sx={{ 
              fontWeight: 700, 
              mb: 0,
              fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.125rem' }
            }}
          >
            Fornecedores
          </Typography>
        </Box>
        
        {/* Controls Section */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' }, 
          gap: { xs: 2, sm: 1 },
          mb: { xs: 2, md: 3 }
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            gap: 1
          }}>
            <Typography 
              variant={isMobile ? "body2" : "subtitle1"} 
              sx={{ mr: 1 }}
            >
              Total de resultados:
            </Typography>
            <Chip 
              label={total} 
              color="primary" 
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: 12, sm: 14, md: 16 }
              }} 
            />
          </Box>
          
          <Box sx={{ 
            flex: { sm: 1 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            ml: { sm: 'auto' }
          }}>
            <Button 
              variant="contained" 
              color="success" 
              size={isMobile ? "small" : "medium"}
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 }
              }}
            >
              Filtrar
            </Button>
            {canCreate && (
            <Button 
              variant="contained" 
              color="primary" 
              size={isMobile ? "small" : "medium"}
              onClick={() => setOpenModal(true)}
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 }
              }}
            >
              {isMobile ? "Novo" : "Criar novo fornecedor"}
            </Button>
            )}
          </Box>
        </Box>
        
        {/* Chips de filtro */}
        <Stack 
          direction="row" 
          spacing={1} 
          sx={{ 
            mb: { xs: 2, md: 3 },
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          <Chip 
            label="CNPJ" 
            onDelete={() => {}} 
            size={isMobile ? "small" : "medium"}
          />
          <Chip 
            label="Telefone" 
            onDelete={() => {}} 
            size={isMobile ? "small" : "medium"}
          />
        </Stack>
        {/* Tabela Responsiva */}
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
          <Table>
            <TableHead>
              <TableRow sx={{ 
                background: '#f4f6f8' 
              }}>
                <TableCell sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 1, sm: 1.5 }
                }}>
                  Nome
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 1, sm: 1.5 },
                  display: { xs: 'none', sm: 'table-cell' }
                }}>
                  CNPJ
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 1, sm: 1.5 },
                  display: { xs: 'none', md: 'table-cell' }
                }}>
                  Telefone
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 1, sm: 1.5 }
                }}>
                  Ações
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                <TableRow 
                  key={row.id || idx} 
                  hover 
                  sx={{ 
                    borderBottom: '1px solid #e0e0e0',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                >
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 },
                    wordBreak: 'break-word'
                  }}>
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      >
                        {row.nome || row.Nome || row.name || ''}
                      </Typography>
                      {/* Mostrar informações adicionais no mobile */}
                      {isMobile && (
                        <Box sx={{ mt: 0.5 }}>
                          {row.cnpj && (
                            <Typography variant="caption" color="text.secondary">
                              CNPJ: {row.cnpj}
                            </Typography>
                          )}
                          {row.telefone && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Tel: {row.telefone}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 },
                    display: { xs: 'none', sm: 'table-cell' }
                  }}>
                    {row.cnpj || ''}
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 },
                    display: { xs: 'none', md: 'table-cell' }
                  }}>
                    {row.telefone || ''}
                  </TableCell>
                  <TableCell sx={{ 
                    py: { xs: 1, sm: 1.5 }
                  }}>
                    <Button 
                      size={isMobile ? "small" : "medium"}
                      variant="text" 
                      onClick={() => setSelectedFornecedor(row)}
                      sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        minWidth: { xs: 'auto', sm: 'auto' },
                        px: { xs: 1, sm: 2 }
                      }}
                    >
                      {isMobile ? "Ver" : "Ver detalhes"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={rows.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage={isMobile ? "Por página:" : "Linhas por página:"}
            sx={{
              '& .MuiTablePagination-toolbar': {
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 },
                py: { xs: 1, sm: 2 }
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
          onClose={() => setOpenModal(false)}
          fullScreen={isMobile}
          maxWidth="sm"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              margin: { xs: 0, sm: 2 },
              maxHeight: { xs: '100vh', sm: 'calc(100vh - 64px)' }
            }
          }}
        >
          <DialogTitle sx={{ 
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            py: { xs: 2, sm: 3 }
          }}>
            Novo Fornecedor
          </DialogTitle>
          <DialogContent sx={{ 
            px: { xs: 2, sm: 3 },
            py: { xs: 1, sm: 2 }
          }}>
            <TextField
              label="Nome do Fornecedor"
              fullWidth
              margin="normal"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                },
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            />
            <TextField
              label="CNPJ"
              fullWidth
              margin="normal"
              value={form.cnpj}
              onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                },
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            />
            <TextField
              label="Telefone"
              fullWidth
              margin="normal"
              value={form.telefone}
              onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                },
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ 
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 },
            gap: 1,
            flexDirection: { xs: 'column-reverse', sm: 'row' }
          }}>
            <Button 
              onClick={() => setOpenModal(false)} 
              disabled={saving}
              size={isMobile ? "medium" : "large"}
              sx={{ 
                width: { xs: '100%', sm: 'auto' },
                fontSize: { xs: '0.875rem', sm: '0.9rem' }
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              onClick={async () => {
                setSaving(true);
                try {
                  const resp = await fetch(`${API}/fornecedores/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                  });
                  if (!resp.ok) throw new Error('Erro ao criar fornecedor');
                  setOpenModal(false);
                  setForm({ nome: '', cnpj: '', telefone: '' });
                  await loadPersisted();
                } catch (e) {
                  alert('Erro ao criar fornecedor.');
                } finally {
                  setSaving(false);
                }
              }} 
              disabled={saving || !form.nome || !form.cnpj}
              size={isMobile ? "medium" : "large"}
              sx={{ 
                width: { xs: '100%', sm: 'auto' },
                fontSize: { xs: '0.875rem', sm: '0.9rem' }
              }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogActions>
        </Dialog>
        {/* Modal de detalhes responsivo */}
        <Dialog 
          open={!!selectedFornecedor} 
          onClose={() => setSelectedFornecedor(null)}
          fullScreen={isMobile}
          maxWidth="sm"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              margin: { xs: 0, sm: 2 },
              maxHeight: { xs: '100vh', sm: 'calc(100vh - 64px)' }
            }
          }}
        >
          <DialogTitle sx={{ 
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            py: { xs: 2, sm: 3 }
          }}>
            Detalhes do Fornecedor
          </DialogTitle>
          <DialogContent sx={{ 
            px: { xs: 2, sm: 3 },
            py: { xs: 1, sm: 2 }
          }}>
            {selectedFornecedor && (
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 1.5, sm: 2 }
              }}>
                <Typography sx={{ 
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}>
                  <Box component="span" sx={{ fontWeight: 600 }}>Nome:</Box> {selectedFornecedor.nome}
                </Typography>
                <Typography sx={{ 
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}>
                  <Box component="span" sx={{ fontWeight: 600 }}>ID:</Box> {selectedFornecedor.id}
                </Typography>
                <Typography sx={{ 
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}>
                  <Box component="span" sx={{ fontWeight: 600 }}>CNPJ:</Box> {selectedFornecedor.cnpj}
                </Typography>
                <Typography sx={{ 
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}>
                  <Box component="span" sx={{ fontWeight: 600 }}>Telefone:</Box> {selectedFornecedor.telefone}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ 
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 }
          }}>
            <Button 
              onClick={() => setSelectedFornecedor(null)}
              size={isMobile ? "medium" : "large"}
              sx={{ 
                width: { xs: '100%', sm: 'auto' },
                fontSize: { xs: '0.875rem', sm: '0.9rem' }
              }}
            >
              Fechar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
