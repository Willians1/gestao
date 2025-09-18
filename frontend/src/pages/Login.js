import React, { useState } from 'react';
import { API_BASE } from '../api';
import { useAuth } from '../contexts/AuthContext';
import ApiStatusBadge from '../components/ApiStatusBadge';

// Componente de Login totalmente isolado, sem dependências externas complexas
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // ApiStatusBadge já faz o ping periódico de /healthz, então removemos a lógica local de ping.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Usuário ou senha inválidos' }));
        throw new Error(errorData.detail);
      }

      const data = await response.json();
      login(data.access_token, data.user);
      window.location.href = '/'; // Redirecionamento direto para a home
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Estilos inline para evitar dependência de arquivos .css
  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f0f2f5',
    },
    formContainer: {
      padding: '40px',
      borderRadius: '8px',
      backgroundColor: 'white',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      width: '100%',
      maxWidth: '400px',
      position: 'relative',
    },
    title: {
      textAlign: 'center',
      marginBottom: '24px',
      fontSize: '24px',
      fontWeight: 'bold',
    },
    inputGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600',
    },
    input: {
      width: '100%',
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      boxSizing: 'border-box',
    },
    button: {
      width: '100%',
      padding: '12px',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: '#007bff',
      color: 'white',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
    },
    buttonDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    },
    error: {
      color: 'red',
      textAlign: 'center',
      marginBottom: '16px',
    },
    footer: {
      marginTop: '16px',
      fontSize: '12px',
      color: '#666',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    statusRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
    },
    badge: (bg) => ({
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '999px',
      fontWeight: 600,
      color: '#fff',
      backgroundColor: bg,
      fontSize: '11px',
    }),
    apiBadgeWrap: {
      position: 'absolute',
      right: 12,
      bottom: 12,
    },
  };

  // Badge reutilizável com tooltip de detalhes

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <h2 style={styles.title}>Acessar Sistema</h2>
        <form onSubmit={handleSubmit}>
          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.inputGroup}>
            <label htmlFor="username" style={styles.label}>Usuário</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
          >
            {loading ? 'Aguarde...' : 'Entrar'}
          </button>
        </form>

        {/* Badge de status da API no canto inferior do card (modo compacto e ícone no xs) */}
        <div style={styles.apiBadgeWrap}>
          <ApiStatusBadge compact />
        </div>
      </div>
    </div>
  );
}
