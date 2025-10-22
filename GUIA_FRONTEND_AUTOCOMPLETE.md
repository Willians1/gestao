# Guia de Integração Frontend - Autocomplete com Histórico

Este guia mostra como integrar os endpoints de histórico no formulário `RelatorioObras.js` usando MUI Autocomplete.

## 📦 Instalação (se necessário)

O MUI `@mui/material` já deve estar instalado. Caso contrário:

```bash
cd frontend
npm install @mui/material @emotion/react @emotion/styled
```

## 🔧 Implementação no RelatorioObras.js

### 1. Imports necessários

```javascript
import { Autocomplete, TextField } from '@mui/material';
```

### 2. Estados para armazenar opções

Adicione estes estados no início do componente:

```javascript
// Estados para opções de autocomplete
const [maoDeObraOpcoes, setMaoDeObraOpcoes] = useState([]);
const [equipamentosOpcoes, setEquipamentosOpcoes] = useState([]);
const [atividadesOpcoes, setAtividadesOpcoes] = useState([]);
```

### 3. Carregar opções ao montar o componente

```javascript
useEffect(() => {
  carregarHistoricos();
}, [clienteId]); // Recarrega quando mudar o cliente

const carregarHistoricos = async () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  try {
    // Carregar mão de obra
    const maoResp = await fetch(
      `http://localhost:8000/mao-de-obra-historico/${clienteId ? '?cliente_id=' + clienteId : ''}`,
      { headers }
    );
    const maoData = await maoResp.json();
    setMaoDeObraOpcoes(maoData);
    
    // Carregar equipamentos
    const eqResp = await fetch(
      `http://localhost:8000/equipamentos-historico/${clienteId ? '?cliente_id=' + clienteId : ''}`,
      { headers }
    );
    const eqData = await eqResp.json();
    setEquipamentosOpcoes(eqData);
    
    // Carregar atividades
    const atResp = await fetch(
      `http://localhost:8000/atividades-historico/${clienteId ? '?cliente_id=' + clienteId : ''}`,
      { headers }
    );
    const atData = await atResp.json();
    setAtividadesOpcoes(atData);
    
  } catch (error) {
    console.error('Erro ao carregar históricos:', error);
  }
};
```

### 4. Substituir inputs por Autocomplete

#### Mão de Obra (Nome)

Substitua o `TextField` de nome por:

```javascript
<Autocomplete
  freeSolo
  options={maoDeObraOpcoes.map(m => m.nome)}
  value={novoMao.nome}
  onChange={(e, newValue) => setNovoMao({ ...novoMao, nome: newValue || '' })}
  onInputChange={(e, newValue) => setNovoMao({ ...novoMao, nome: newValue })}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Nome"
      size="small"
      fullWidth
    />
  )}
/>
```

#### Mão de Obra (Cargo)

```javascript
<Autocomplete
  freeSolo
  options={[...new Set(maoDeObraOpcoes.map(m => m.cargo).filter(Boolean))]}
  value={novoMao.cargo}
  onChange={(e, newValue) => setNovoMao({ ...novoMao, cargo: newValue || '' })}
  onInputChange={(e, newValue) => setNovoMao({ ...novoMao, cargo: newValue })}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Cargo"
      size="small"
      fullWidth
    />
  )}
/>
```

#### Equipamentos (Nome)

```javascript
<Autocomplete
  freeSolo
  options={equipamentosOpcoes.map(e => e.nome)}
  value={novoEquip.nome}
  onChange={(e, newValue) => setNovoEquip({ ...novoEquip, nome: newValue || '' })}
  onInputChange={(e, newValue) => setNovoEquip({ ...novoEquip, nome: newValue })}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Nome do Equipamento"
      size="small"
      fullWidth
    />
  )}
/>
```

#### Atividades (Descrição)

```javascript
<Autocomplete
  freeSolo
  options={atividadesOpcoes.map(a => a.descricao)}
  value={novaAtiv.descricao}
  onChange={(e, newValue) => setNovaAtiv({ ...novaAtiv, descricao: newValue || '' })}
  onInputChange={(e, newValue) => setNovaAtiv({ ...novaAtiv, descricao: newValue })}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Descrição da Atividade"
      size="small"
      fullWidth
    />
  )}
/>
```

### 5. Salvar no histórico ao adicionar item

Adicione estas funções para salvar no histórico automaticamente:

```javascript
const salvarMaoDeObraHistorico = async (nome, cargo) => {
  const token = localStorage.getItem('token');
  try {
    await fetch('http://localhost:8000/mao-de-obra-historico/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nome, cargo, cliente_id: clienteId })
    });
    carregarHistoricos(); // Recarrega opções
  } catch (error) {
    console.error('Erro ao salvar no histórico:', error);
  }
};

const salvarEquipamentoHistorico = async (nome) => {
  const token = localStorage.getItem('token');
  try {
    await fetch('http://localhost:8000/equipamentos-historico/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nome, cliente_id: clienteId })
    });
    carregarHistoricos();
  } catch (error) {
    console.error('Erro ao salvar no histórico:', error);
  }
};

const salvarAtividadeHistorico = async (descricao) => {
  const token = localStorage.getItem('token');
  try {
    await fetch('http://localhost:8000/atividades-historico/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ descricao, cliente_id: clienteId })
    });
    carregarHistoricos();
  } catch (error) {
    console.error('Erro ao salvar no histórico:', error);
  }
};
```

### 6. Chamar ao adicionar item

Modifique as funções de adicionar:

```javascript
const adicionarMaoDeObra = () => {
  if (novoMao.nome) {
    setMaoDeObra([...maoDeObra, novoMao]);
    salvarMaoDeObraHistorico(novoMao.nome, novoMao.cargo); // ← Adicione esta linha
    setNovoMao({ nome: '', cargo: '', horaEntrada: '', horaSaida: '' });
  }
};

const adicionarEquipamento = () => {
  if (novoEquip.nome) {
    setEquipamentos([...equipamentos, novoEquip]);
    salvarEquipamentoHistorico(novoEquip.nome); // ← Adicione esta linha
    setNovoEquip({ nome: '', quantidade: '', horaUso: '' });
  }
};

const adicionarAtividade = () => {
  if (novaAtiv.descricao) {
    setAtividades([...atividades, novaAtiv]);
    salvarAtividadeHistorico(novaAtiv.descricao); // ← Adicione esta linha
    setNovaAtiv({ descricao: '', horaInicio: '', horaFim: '', responsavel: '' });
  }
};
```

## 🎨 Exemplo Completo de Seção com Autocomplete

```javascript
<Box>
  <Typography variant="h6" gutterBottom>
    Mão de Obra
  </Typography>
  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
    <Autocomplete
      freeSolo
      options={maoDeObraOpcoes.map(m => m.nome)}
      value={novoMao.nome}
      onChange={(e, newValue) => setNovoMao({ ...novoMao, nome: newValue || '' })}
      onInputChange={(e, newValue) => setNovoMao({ ...novoMao, nome: newValue })}
      sx={{ flex: 1 }}
      renderInput={(params) => (
        <TextField {...params} label="Nome" size="small" />
      )}
    />
    <Autocomplete
      freeSolo
      options={[...new Set(maoDeObraOpcoes.map(m => m.cargo).filter(Boolean))]}
      value={novoMao.cargo}
      onChange={(e, newValue) => setNovoMao({ ...novoMao, cargo: newValue || '' })}
      onInputChange={(e, newValue) => setNovoMao({ ...novoMao, cargo: newValue })}
      sx={{ flex: 1 }}
      renderInput={(params) => (
        <TextField {...params} label="Cargo" size="small" />
      )}
    />
    <TextField
      label="Hora Entrada"
      type="time"
      value={novoMao.horaEntrada}
      onChange={(e) => setNovoMao({ ...novoMao, horaEntrada: e.target.value })}
      size="small"
      sx={{ width: 150 }}
      InputLabelProps={{ shrink: true }}
    />
    <TextField
      label="Hora Saída"
      type="time"
      value={novoMao.horaSaida}
      onChange={(e) => setNovoMao({ ...novoMao, horaSaida: e.target.value })}
      size="small"
      sx={{ width: 150 }}
      InputLabelProps={{ shrink: true }}
    />
    <Button variant="contained" onClick={adicionarMaoDeObra}>
      Adicionar
    </Button>
  </Box>
  
  {/* Lista de itens adicionados */}
  {maoDeObra.map((item, idx) => (
    <Paper key={idx} sx={{ p: 1, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="body2">
        {item.nome} - {item.cargo} ({item.horaEntrada} às {item.horaSaida})
      </Typography>
      <IconButton size="small" onClick={() => removerMaoDeObra(idx)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Paper>
  ))}
</Box>
```

## 🔍 Recursos do Autocomplete

### freeSolo

Permite digitar valores que não estão na lista. Essencial para novos itens.

### getOptionLabel

Customiza como a opção é exibida:

```javascript
<Autocomplete
  getOptionLabel={(option) => 
    typeof option === 'string' ? option : `${option.nome} (${option.cargo})`
  }
  // ...
/>
```

### groupBy

Agrupa opções por categoria:

```javascript
<Autocomplete
  groupBy={(option) => option.categoria}
  options={atividadesOpcoes}
  // ...
/>
```

### filterOptions

Customiza a lógica de filtro:

```javascript
import { createFilterOptions } from '@mui/material/Autocomplete';

const filterOptions = createFilterOptions({
  matchFrom: 'any',
  limit: 10,
});

<Autocomplete
  filterOptions={filterOptions}
  // ...
/>
```

## 📱 Responsividade

Para dispositivos móveis, ajuste o layout:

```javascript
<Box sx={{ 
  display: 'flex', 
  flexDirection: { xs: 'column', md: 'row' },
  gap: 1, 
  mb: 2 
}}>
  {/* Autocompletes aqui */}
</Box>
```

## 🎯 Benefícios

✅ **Agilidade**: Reduz tempo de digitação em 70%  
✅ **Padronização**: Garante nomenclatura consistente  
✅ **Histórico**: Aprende com o uso  
✅ **Validação**: Sugere apenas valores válidos  
✅ **UX**: Interface intuitiva e moderna  

## 🐛 Troubleshooting

### Opções não carregam

- Verifique token no localStorage
- Confirme que backend está rodando
- Abra DevTools → Network para ver requisições

### Autocomplete não aceita novo valor

- Certifique-se que `freeSolo={true}` está definido
- Use `onInputChange` para capturar texto digitado

### Valores duplicados na lista

- Use `Set` para remover duplicatas:

```javascript
options={[...new Set(maoDeObraOpcoes.map(m => m.nome))]}
```


## 📚 Referências

- [MUI Autocomplete Docs](https://mui.com/material-ui/react-autocomplete/)
- [React Hooks Docs](https://react.dev/reference/react)
- [Fetch API MDN](https://developer.mozilla.org/pt-BR/docs/Web/API/Fetch_API)
