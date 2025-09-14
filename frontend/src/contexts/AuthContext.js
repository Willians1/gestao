import React, { createContext, useContext, useState, useEffect } from 'react';

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
    if (!user || !user.nivel_acesso) {
      // Se não há usuário ou nível de acesso, permitir acesso básico para debug
      return true;
    }
    
    const userPermissions = PERMISSIONS[user.nivel_acesso];
    if (!userPermissions) {
      // Se o nível de acesso não está definido nas permissões, permitir acesso
      return true;
    }

    // Admin tem acesso a tudo
    if (userPermissions.pages.includes('*')) return true;

    // Verificar se tem permissão para a página
    const hasPageAccess = userPermissions.pages.some(allowedPage => 
      page.startsWith(allowedPage) || allowedPage === page
    );

    // Verificar se tem permissão para a ação
    const hasActionAccess = userPermissions.actions.includes(action);

    return hasPageAccess && hasActionAccess;
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
