// Centraliza a URL base da API
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper para construir URLs
export const apiUrl = (path = '') => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
