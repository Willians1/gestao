// Centraliza a URL base da API
// Em produção tudo-em-um, usamos same-origin (window.location.origin).
// Em dev, pode usar REACT_APP_API_URL ou cair no localhost:8000.
const defaultBase =
  (typeof window !== 'undefined' && window.location && window.location.origin) ||
  'http://localhost:8000';

export const API_BASE = process.env.REACT_APP_API_URL || defaultBase;

// Helper para construir URLs
export const apiUrl = (path = '') => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
