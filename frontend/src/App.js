import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './Layout';
import Login from './pages/Login.js';
import DashboardHomeSimple from './pages/DashboardHomeSimple';
import FinanceiroPage from './pages/FinanceiroPage';
import GruposUsuarios from './pages/GruposUsuariosNovo';
import Clientes from './pages/Clientes';
import Contratos from './pages/Contratos';
import Admin from './pages/Admin';
import Despesas from './pages/Despesas';
import Fornecedores from './pages/Fornecedores';
import OrcamentoObra from './pages/OrcamentoObra';
import ResumoMensal from './pages/ResumoMensal';
import ValorMateriais from './pages/ValorMateriais';
import TestesLoja from './pages/TestesLoja';
import TestesArCondicionado from './pages/TestesArCondicionado';
import TestesLojaMenu from './pages/TestesLojaMenu';
import TestePage from './pages/TestePage';

// Criar tema do Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#3b82f6',
    },
    secondary: {
      main: '#f59e0b',
    },
  },
});

// Rota de login com verificações adicionais
const LoginRoute = () => {
  const authContext = useAuth();
  const { isAuthenticated, loading } = authContext;

  // Verificar se o contexto está disponível
  if (!authContext) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Inicializando...
      </div>
    );
  }

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Carregando…
      </div>
    );
  }

  // Se já está autenticado, redirecionar para home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Renderizar componente de login
  try {
    return <Login />;
  } catch (error) {
    console.error('Erro ao renderizar Login:', error);
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'red'
      }}>
        Erro ao carregar página de login. Tente recarregar a página.
      </div>
    );
  }
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <ErrorBoundary>
            <Routes>
              <Route path="/teste" element={<TestePage />} />
              <Route path="/login" element={<LoginRoute />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardHomeSimple />
                </ProtectedRoute>
              } />
              <Route path="/dashboard-home" element={
                <ProtectedRoute>
                  <Navigate to="/" replace />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Navigate to="/" replace />
                </ProtectedRoute>
              } />
              <Route path="/financeiro" element={
                <ProtectedRoute page="/financeiro">
                  <FinanceiroPage />
                </ProtectedRoute>
              } />
              <Route path="/grupos-usuarios" element={
                <ProtectedRoute page="/grupos-usuarios">
                  <Layout><GruposUsuarios /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/clientes" element={
                <ProtectedRoute page="/clientes">
                  <Clientes />
                </ProtectedRoute>
              } />
              <Route path="/contratos" element={
                <ProtectedRoute page="/contratos">
                  <Contratos />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute page="/admin">
                  <Layout><Admin /></Layout>
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
              <Route path="/orcamento-obra" element={
                <ProtectedRoute page="/orcamento-obra">
                  <OrcamentoObra />
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
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ErrorBoundary>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
