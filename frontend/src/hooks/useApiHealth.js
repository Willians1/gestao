import { useEffect, useState } from 'react';
import { API_BASE } from '../api';

export default function useApiHealth({ intervalMs = 30000 } = {}) {
  const [state, setState] = useState({ status: 'checking', latencyMs: null, message: '', lastCheck: null });

  useEffect(() => {
    let mounted = true;
    let timer = null;
    const check = async () => {
      try {
        const start = performance.now();
        const res = await fetch(`${API_BASE}/healthz`, { method: 'GET', cache: 'no-store' });
        const latency = Math.round(performance.now() - start);
        if (!mounted) return;
        const base = { latencyMs: latency, lastCheck: new Date(), message: '' };
        if (res.ok) setState({ status: 'ok', ...base });
        else setState({ status: 'degraded', ...base, message: `HTTP ${res.status}` });
      } catch (e) {
        if (!mounted) return;
        setState({ status: 'offline', latencyMs: null, lastCheck: new Date(), message: e?.message || 'Falha ao conectar' });
      }
    };
    check();
    timer = setInterval(check, intervalMs);
    return () => { mounted = false; if (timer) clearInterval(timer); };
  }, [intervalMs]);

  return state;
}
