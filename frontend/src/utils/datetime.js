// Utilitários de data/hora com fuso de Brasília
// Sempre renderiza no formato dd/MM/yyyy HH:mm:ss

const TZ = 'America/Sao_Paulo';

export function formatDateTimeBr(dateLike, timeStr) {
  if (!dateLike) return '';
  try {
    let d;
    // Tratar strings apenas de data (YYYY-MM-DD) como data local para evitar deslocamento de fuso
    if (typeof dateLike === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateLike)) {
      const [y, m, dStr] = dateLike.split('-').map((n) => parseInt(n, 10));
      d = new Date(y, (m || 1) - 1, dStr || 1);
    } else {
      d = dateLike instanceof Date ? dateLike : new Date(dateLike);
    }
    if (timeStr && typeof timeStr === 'string') {
      // Combina a data com um horário HH:mm[:ss]
      const [hh = '00', mm = '00', ss = '00'] = timeStr.split(':');
      d = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        parseInt(hh, 10) || 0,
        parseInt(mm, 10) || 0,
        parseInt(ss, 10) || 0
      );
    }
    // Usa Intl para forçar timezone de Brasília
    const opts = {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    return new Intl.DateTimeFormat('pt-BR', opts).format(d);
  } catch (e) {
    return '';
  }
}

export function formatDateBr(dateLike) {
  return formatDateTimeBr(dateLike).split(' ')[0] || '';
}

export function nowBr() {
  return formatDateTimeBr(new Date());
}
