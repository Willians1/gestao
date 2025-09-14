import React, { useState } from 'react';
import { API_BASE } from './api';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  InputAdornment
} from '@mui/material';
import { Email, Lock, Person } from '@mui/icons-material';
import DashboardHomeSimple from './pages/DashboardHomeSimple';
import Contratos from './pages/Contratos';
import Clientes from './pages/Clientes';
import FinanceiroPage from './pages/FinanceiroPage';
import TestesLojaMenu from './pages/TestesLojaMenu';
import TestesLoja from './pages/TestesLoja';
import TestesArCondicionado from './pages/TestesArCondicionado';
import Despesas from './pages/Despesas';
import Fornecedores from './pages/Fornecedores';
import ResumoMensal from './pages/ResumoMensal';
import ValorMateriais from './pages/ValorMateriais';

// Componente Login inline para evitar problemas de import
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error('Usuário ou senha inválidos');
      const data = await res.json();
      login(data.access_token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, background: 'rgba(255, 255, 255, 0.95)' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' }}>
              <Person sx={{ fontSize: 28, color: 'white' }} />
            </Avatar>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#1f2937' }}>
              Login
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            <TextField
              margin="normal"
              required
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              placeholder="usuário@empresa.com"
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#64748b' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="senha"
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#64748b' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !username || !password}
              sx={{ py: 1.8, borderRadius: 3, fontSize: '1rem', fontWeight: 600 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

const theme = createTheme({
  palette: {
    primary: { main: '#3b82f6' },
    secondary: { main: '#f59e0b' },
  },
});

const LoginRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Carregando…</div>;
  if (isAuthenticated) return <Navigate to="/" replace />;
  
  return <Login />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<LoginRoute />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardHomeSimple />
                </ProtectedRoute>
              } />
              <Route path="/contratos" element={
                <ProtectedRoute page="/contratos">
                  <Contratos />
                </ProtectedRoute>
              } />
              <Route path="/clientes" element={
                <ProtectedRoute page="/clientes">
                  <Clientes />
                </ProtectedRoute>
              } />
              <Route path="/despesas" element={
                <ProtectedRoute page="/despesas">
                  <Despesas />
                </ProtectedRoute>
              } />
              <Route path="/fornecedores" element={
                <ProtectedRoute page="/fornecedores">
                  <Fornecedores />
                </ProtectedRoute>
              } />
              <Route path="/resumo-mensal" element={
                <ProtectedRoute page="/resumo-mensal">
                  <ResumoMensal />
                </ProtectedRoute>
              } />
              <Route path="/valor-materiais" element={
                <ProtectedRoute page="/valor-materiais">
                  <ValorMateriais />
                </ProtectedRoute>
              } />
              <Route path="/financeiro" element={
                <ProtectedRoute page="/financeiro">
                  <FinanceiroPage />
                </ProtectedRoute>
              } />
              <Route path="/testes-loja-menu" element={
                <ProtectedRoute page="/testes-loja-menu">
                  <TestesLojaMenu />
                </ProtectedRoute>
              } />
              <Route path="/testes-loja" element={
                <ProtectedRoute page="/testes-loja" requiredPermission="update">
                  <TestesLoja />
                </ProtectedRoute>
              } />
              <Route path="/testes-ar-condicionado" element={
                <ProtectedRoute page="/testes-ar-condicionado" requiredPermission="update">
                  <TestesArCondicionado />
                </ProtectedRoute>
              } />
              {/* Rota de cadastro-usuarios removida; cadastro agora é feito via PHP */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ErrorBoundary>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
