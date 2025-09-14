import { useEffect, useState } from 'react';
import { API_BASE } from '../api';

export default function useApiHealth({ intervalMs = 30000 } = {}) {
  const [state, setState] = useState({ 
    status: 'checking', 
    latencyMs: null, 
    message: '', 
    lastCheck: null,
    version: null,
    commit_sha: null,
    build_time: null,
    uptime_seconds: null,
  });

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
        if (res.ok) {
          let info = {};
          try {
            info = await res.json();
          } catch (_) {}
          setState({ 
            status: 'ok', 
            ...base,
            version: info?.version ?? null,
            commit_sha: info?.commit_sha ?? null,
            build_time: info?.build_time ?? null,
            uptime_seconds: typeof info?.uptime_seconds === 'number' ? info.uptime_seconds : null,
          });
        } else {
          setState({ status: 'degraded', ...base, message: `HTTP ${res.status}` });
        }
      } catch (e) {
        if (!mounted) return;
        setState({ 
          status: 'offline', 
          latencyMs: null, 
          lastCheck: new Date(), 
          message: e?.message || 'Falha ao conectar',
          version: null,
          commit_sha: null,
          build_time: null,
          uptime_seconds: null,
        });
      }
    };
    check();
    timer = setInterval(check, intervalMs);
    return () => { mounted = false; if (timer) clearInterval(timer); };
  }, [intervalMs]);

  return state;
}
