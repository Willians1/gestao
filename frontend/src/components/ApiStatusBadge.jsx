import React from 'react';
import { Tooltip } from '@mui/material';
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

  const details = (
    <div>
      <div><strong>Status:</strong> {h.status}</div>
      {h.latencyMs != null && (<div><strong>Latência:</strong> {h.latencyMs} ms</div>)}
      <div><strong>API:</strong> {API_BASE}</div>
      {h.version && (<div><strong>Versão:</strong> {h.version}</div>)}
      {h.commit_sha && (
        <div>
          <strong>Commit:</strong> <span style={{ fontFamily: 'monospace' }}>{String(h.commit_sha).slice(0, 7)}</span>
        </div>
      )}
      {h.build_time && (<div><strong>Build:</strong> {h.build_time}</div>)}
      {typeof h.uptime_seconds === 'number' && (
        <div><strong>Uptime:</strong> {Math.floor(h.uptime_seconds / 3600)}h {Math.floor((h.uptime_seconds % 3600) / 60)}m</div>
      )}
  {h.lastCheck && (<div><strong>Último check:</strong> {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(h.lastCheck)}</div>)}
      {h.message && (<div style={{ color: '#b91c1c' }}><strong>Obs:</strong> {h.message}</div>)}
    </div>
  );

  return (
    <Tooltip title={details} arrow disableInteractive>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'default' }}>
        {badge()}
        {!compact && (
          <div style={{ opacity: 0.8 }}>
            <small>{API_BASE}</small>
            {h.lastCheck && (
              <div><small style={{ opacity: 0.8 }}>Último check: {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(h.lastCheck)}</small></div>
            )}
            {h.message && (
              <div><small style={{ color: '#b91c1c' }}>{h.message}</small></div>
            )}
          </div>
        )}
      </div>
    </Tooltip>
  );
}
