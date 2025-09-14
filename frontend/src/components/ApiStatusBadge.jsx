import React from 'react';
import useApiHealth from '../hooks/useApiHealth';
import { API_BASE } from '../api';

export default function ApiStatusBadge({ compact = false, intervalMs = 30000 }) {
  const h = useApiHealth({ intervalMs });

  const badge = () => {
    const base = {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 999,
      fontWeight: 600,
      color: '#fff',
      fontSize: 11,
      lineHeight: '16px',
    };
    const text = (label, color) => (
      <span style={{ ...base, backgroundColor: color }}>
        {label}{h.latencyMs != null ? ` • ${h.latencyMs} ms` : ''}
      </span>
    );
    switch (h.status) {
      case 'ok': return text('API OK', '#16a34a');
      case 'degraded': return text('API Lenta', '#eab308');
      case 'offline': return text('API Offline', '#dc2626');
      default: return text('Verificando…', '#6b7280');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {badge()}
      {!compact && (
        <div style={{ opacity: 0.8 }}>
          <small>{API_BASE}</small>
          {h.lastCheck && (
            <div><small style={{ opacity: 0.8 }}>Último check: {h.lastCheck.toLocaleString()}</small></div>
          )}
          {h.message && (
            <div><small style={{ color: '#b91c1c' }}>{h.message}</small></div>
          )}
        </div>
      )}
    </div>
  );
}
