// Helper para padronizar exibição do nome das lojas
// Preferir o nome do cliente vindo do backend quando disponível; caso contrário, usar mapeamento por ID

export function getLojaNome(clienteId, clientes = []) {
  const idNum = Number(clienteId);
  const suf = String(idNum || '').toString().padStart(2, '0');
  try {
    if (Array.isArray(clientes) && clientes.length > 0) {
      const c = clientes.find(x => Number(x.id) === idNum);
      if (c && c.nome) {
        // Remove qualquer sufixo existente "LOJA NN" do nome vindo do backend para evitar duplicação
        let base = String(c.nome).toUpperCase().trim();
        // Exemplos a tratar: "PEREQUE LOJA 01", "COTIA LOJA 02 LOJA 02"
        base = base.replace(/\s+LOJA\s+\d{1,3}(\s+LOJA\s+\d{1,3})?\s*$/i, '');
        return `${base} LOJA ${suf}`;
      }
    }
  } catch (_) { /* noop */ }
  const map = {
    1: 'PEREQUE',
    2: 'COTIA',
    3: 'GUARUJA',
    4: 'PERUIBE',
    5: 'PRAIA GRANDE',
    6: 'SANTOS',
    7: 'PIRAJUSSARA',
  8: 'ITANHAÉM',
    9: 'MBOI',
    10: 'MONGAGUA',
    11: 'MORUMBI',
    12: 'REGISTRO',
    13: 'ENSEADA',
    14: 'BERTIOGA',
    15: 'BARUERI',
    16: 'CAMPO LIMPO',
  };
  const base = map[idNum] || 'LOJA';
  return `${base} LOJA ${suf}`;
}
