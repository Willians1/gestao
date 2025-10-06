import React, { createContext, useContext, useState, useEffect } from 'react';

// Tipos de usuário e suas permissões
export const USER_ROLES = {
  ADMIN: 'Admin',
  WILLIANS: 'Willians',
  MANUTENCAO: 'Manutenção',
  VISUALIZACAO: 'Visualização',
};

export const PERMISSIONS = {
  [USER_ROLES.ADMIN]: {
    pages: ['*'], // Acesso a todas as páginas
    actions: ['create', 'read', 'update', 'delete'],
  },
  [USER_ROLES.WILLIANS]: {
    pages: ['*'], // Acesso a todas as páginas
    actions: ['create', 'read', 'update', 'delete'],
  },
  [USER_ROLES.MANUTENCAO]: {
    pages: ['/testes-loja-menu', '/testes-loja', '/testes-ar-condicionado'],
    actions: ['create', 'read', 'update'],
  },
  [USER_ROLES.VISUALIZACAO]: {
    pages: ['/testes-loja-menu', '/testes-loja', '/testes-ar-condicionado'],
    actions: ['read'],
  },
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

  // Verificar se há token salvo ao carregar a página
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    setToken(token);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const hasPermission = (page, action = 'read') => {
    // Sistema simplificado baseado apenas em nivel_acesso
    const role = (user?.nivel_acesso || '').toString().toLowerCase();
    
    // Admin e Willians: acesso total
    if (
      role === 'admin' ||
      role === 'willians' ||
      role === USER_ROLES.ADMIN.toLowerCase() ||
      role === USER_ROLES.WILLIANS.toLowerCase()
    ) {
      return true;
    }
    
    // Manutenção: acesso apenas a /testes-loja e própria loja
    if (role === 'manutencao' || role === USER_ROLES.MANUTENCAO.toLowerCase()) {
      // Permitir leitura em /testes-loja
      if (page === '/testes-loja' || page === '/testes-loja-menu') {
        return true;
      }
      // Negar acesso a outras páginas administrativas
      return false;
    }
    
    // Visualização: apenas leitura em todas as páginas
    if (role === 'visualizacao' || role === USER_ROLES.VISUALIZACAO.toLowerCase()) {
      // Permitir apenas ação 'read'
      return action === 'read';
    }
    
    // Caso não reconhecido: negar acesso
    return false;
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
    const role = (user?.nivel_acesso || '').toString().toLowerCase();
    return (
      role === 'admin' ||
      role === 'willians' ||
      role === USER_ROLES.ADMIN.toLowerCase() ||
      role === USER_ROLES.WILLIANS.toLowerCase()
    );
  };

  const canAccessTests = () => {
    return hasPermission('/testes-loja-menu', 'read');
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    hasPermission,
    getUserRoleLabel,
    isAdmin,
    canAccessTests,
    USER_ROLES,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
