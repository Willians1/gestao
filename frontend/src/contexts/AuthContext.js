import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../api';

// Tipos de usuário e suas permissões
export const USER_ROLES = {
  ADMIN: 'Admin',
  WILLIANS: 'Willians',
  MANUTENCAO: 'Manutenção',
  VISUALIZACAO: 'Visualização'
};

export const PERMISSIONS = {
  [USER_ROLES.ADMIN]: {
    pages: ['*'], // Acesso a todas as páginas
    actions: ['create', 'read', 'update', 'delete']
  },
  [USER_ROLES.WILLIANS]: {
    pages: ['*'], // Acesso a todas as páginas
    actions: ['create', 'read', 'update', 'delete']
  },
  [USER_ROLES.MANUTENCAO]: {
    pages: ['/testes-loja-menu', '/testes-loja', '/testes-ar-condicionado'],
    actions: ['create', 'read', 'update']
  },
  [USER_ROLES.VISUALIZACAO]: {
    pages: ['/testes-loja-menu', '/testes-loja', '/testes-ar-condicionado'],
    actions: ['read']
  }
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({ grupo_id: null, ids: new Set(), list: [] });

  // Verificar se há token salvo ao carregar a página
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      // carregar permissões do usuário logado
      fetch(`${API_BASE}/me/permissoes`, { headers: { Authorization: `Bearer ${savedToken}` } })
        .then(r => r.ok ? r.json() : Promise.resolve({ grupo_id: null, permissoes: [] }))
        .then(data => {
          const ids = new Set((data?.permissoes || []).map(p => p.id));
          setPermissions({ grupo_id: data?.grupo_id ?? null, ids, list: data?.permissoes || [] });
        })
        .catch(() => setPermissions({ grupo_id: null, ids: new Set(), list: [] }));
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    setToken(token);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    // carregar permissões imediatamente após login
    fetch(`${API_BASE}/me/permissoes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.resolve({ grupo_id: null, permissoes: [] }))
      .then(data => {
        const ids = new Set((data?.permissoes || []).map(p => p.id));
        setPermissions({ grupo_id: data?.grupo_id ?? null, ids, list: data?.permissoes || [] });
      })
      .catch(() => setPermissions({ grupo_id: null, ids: new Set(), list: [] }));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const hasPermission = (page, action = 'read') => {
    // Se for admin pelo nível, libera tudo
    if (user?.nivel_acesso && (user.nivel_acesso === USER_ROLES.ADMIN || user.nivel_acesso === USER_ROLES.WILLIANS)) return true;
    // Mapear páginas para IDs de permissão base
    const pageToPermId = {
      '/cadastro-usuarios': 1101,
      '/grupos-usuarios': 1004, // Administração do Sistema
      '/clientes': 1201,
      '/fornecedores': 1301,
      '/contratos': 1401,
      '/orcamento-obra': 1501,
      '/despesas': 1601,
      '/valor-materiais': 1701,
      '/resumo-mensal': 1801,
    };
    const baseId = pageToPermId[page];
    if (!baseId) return true; // se não mapeado, liberar por ora
    const ids = permissions.ids || new Set();
    const need = {
      read: baseId,
      update: baseId + 1, // seguir convenção: +2 editar, +3 excluir, +4 criar no layout atual, porém manter leitura no base
      delete: baseId + 2,
      create: baseId + 3,
    };
    // Ajuste para convenção do arquivo de grupos (base, +2 editar, +3 excluir, +4 criar)
    const actionMap = {
      read: baseId,
      update: Math.floor(baseId / 100) * 100 + 2,
      delete: Math.floor(baseId / 100) * 100 + 3,
      create: Math.floor(baseId / 100) * 100 + 4,
    };
    const required = actionMap[action] || baseId;
    return ids.has(required) || ids.has(baseId);
  };

  const getUserRoleLabel = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'Administrador';
      case USER_ROLES.WILLIANS:
        return 'Willians';
      case USER_ROLES.MANUTENCAO:
        return 'Manutenção';
      case USER_ROLES.VISUALIZACAO:
        return 'Visualização';
      default:
        return 'Indefinido';
    }
  };

  const isAdmin = () => {
    return user?.nivel_acesso === USER_ROLES.ADMIN || user?.nivel_acesso === USER_ROLES.WILLIANS;
  };

  const canAccessTests = () => {
    return hasPermission('/testes-loja-menu', 'read');
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    permissions,
    login,
    logout,
    hasPermission,
    getUserRoleLabel,
    isAdmin,
    canAccessTests,
    USER_ROLES
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
