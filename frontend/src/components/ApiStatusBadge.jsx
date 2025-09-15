import React from 'react';
import { Tooltip, Chip, Stack, Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useApiHealth from '../hooks/useApiHealth';
import { API_BASE } from '../api';

export default function ApiStatusBadge({ compact = false, intervalMs = 30000 }) {
  const h = useApiHealth({ intervalMs });
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isCompact = compact || isXs;
  const isIconOnly = isXs; // no mobile, exibir apenas um indicador visual compacto

  const labelBase = () => {
    const suffix = h.latencyMs != null ? ` • ${h.latencyMs} ms` : '';
    switch (h.status) {
      case 'ok': return `API OK${suffix}`;
      case 'degraded': return `API Lenta${suffix}`;
      case 'offline': return `API Offline${suffix}`;
      default: return `Verificando…${suffix}`;
    }
  };

  const chipColor = () => {
    switch (h.status) {
      case 'ok': return 'success';
      case 'degraded': return 'warning';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  const dotColor = () => {
    switch (h.status) {
      case 'ok': return '#16a34a';
      case 'degraded': return '#eab308';
      case 'offline': return '#dc2626';
      default: return '#6b7280';
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
      <Stack direction="row" alignItems="center" spacing={1} sx={{ cursor: 'default', flexWrap: 'wrap' }}>
        {isIconOnly ? (
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: dotColor(), boxShadow: '0 0 0 2px rgba(0,0,0,0.08)' }} />
        ) : (
          <Chip
            label={labelBase()}
            color={chipColor()}
            size={isCompact ? 'small' : 'medium'}
            sx={{ fontWeight: 600 }}
          />
        )}
        {!isCompact && (
          <Box sx={{ opacity: 0.8 }}>
            <small>{API_BASE}</small>
            {h.lastCheck && (
              <div><small style={{ opacity: 0.8 }}>Último check: {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(h.lastCheck)}</small></div>
            )}
            {h.message && (
              <div><small style={{ color: '#b91c1c' }}>{h.message}</small></div>
            )}
          </Box>
        )}
      </Stack>
    </Tooltip>
  );
}
