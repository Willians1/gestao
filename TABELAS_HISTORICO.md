# Tabelas de Histórico para Autocompletar

## 📋 Visão Geral

Este documento descreve as novas tabelas criadas para armazenar históricos e permitir autocompletar no formulário de **Relatório de Obras**.

## 🗃️ Tabelas Criadas

### 1. **mao_de_obra_historico**
Armazena histórico de funcionários/mão de obra cadastrados.

**Campos:**
- `id` - ID único
- `nome` - Nome do trabalhador
- `cargo` - Cargo/função (ex: Pedreiro, Eletricista, Encarregado)
- `cliente_id` - ID do cliente (opcional, para filtrar por obra)
- `criado_em` - Data/hora de criação
- `criado_por` - ID do usuário que criou

**Endpoints:**
- `GET /mao-de-obra-historico/` - Lista todos (filtro opcional: `?cliente_id=123`)
- `POST /mao-de-obra-historico/` - Cria novo (previne duplicatas por nome+cargo)
- `DELETE /mao-de-obra-historico/{id}` - Remove item

### 2. **equipamentos_historico**
Armazena histórico de equipamentos utilizados.

**Campos:**
- `id` - ID único
- `nome` - Nome do equipamento (ex: Betoneira, Guindaste, Martelete)
- `descricao` - Descrição opcional
- `cliente_id` - ID do cliente (opcional)
- `criado_em` - Data/hora de criação
- `criado_por` - ID do usuário que criou

**Endpoints:**
- `GET /equipamentos-historico/` - Lista todos (filtro opcional: `?cliente_id=123`)
- `POST /equipamentos-historico/` - Cria novo (previne duplicatas por nome)
- `DELETE /equipamentos-historico/{id}` - Remove item

### 3. **atividades_historico**
Armazena histórico de atividades executadas.

**Campos:**
- `id` - ID único
- `descricao` - Descrição da atividade (ex: Concretagem da laje, Alvenaria 2º pavimento)
- `categoria` - Categoria opcional (ex: Estrutura, Acabamento, Instalações, Fundação)
- `cliente_id` - ID do cliente (opcional)
- `criado_em` - Data/hora de criação
- `criado_por` - ID do usuário que criou

**Endpoints:**
- `GET /atividades-historico/` - Lista todos (filtros opcionais: `?cliente_id=123&categoria=Estrutura`)
- `POST /atividades-historico/` - Cria novo (previne duplicatas por descrição)
- `DELETE /atividades-historico/{id}` - Remove item

### 4. **condicoes_climaticas_historico**
Armazena histórico de condições climáticas registradas.

**Campos:**
- `id` - ID único
- `data_registro` - Data/hora do registro
- `horario_dia` - Período do dia (manha, tarde, noite)
- `tempo` - Condição do tempo (ensolarado, nublado, chuvoso)
- `condicao` - Condição do solo (seco, umido, molhado)
- `indice_pluviometrico` - Quantidade de chuva em mm (opcional)
- `temperatura` - Temperatura em °C (opcional)
- `cliente_id` - ID do cliente (opcional)
- `criado_em` - Data/hora de criação
- `criado_por` - ID do usuário que criou

**Endpoints:**
- `GET /condicoes-climaticas-historico/` - Lista todos (filtros opcionais: `?cliente_id=123&data_inicio=2025-01-01&data_fim=2025-12-31`)
- `POST /condicoes-climaticas-historico/` - Cria novo registro
- `DELETE /condicoes-climaticas-historico/{id}` - Remove item

## 🔧 Como Usar

### Exemplo 1: Cadastrar Mão de Obra no Histórico

```javascript
// Frontend React
const cadastrarMaoDeObra = async (nome, cargo) => {
  const response = await fetch('http://localhost:8000/mao-de-obra-historico/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      nome: nome,
      cargo: cargo,
      cliente_id: clienteId // opcional
    })
  });
  return await response.json();
};
```

### Exemplo 2: Listar Equipamentos para Autocompletar

```javascript
// Frontend React
const carregarEquipamentos = async () => {
  const response = await fetch('http://localhost:8000/equipamentos-historico/', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  
  // Usar em Autocomplete do MUI
  setEquipamentosOpcoes(data.map(e => e.nome));
};
```

### Exemplo 3: Filtrar Atividades por Categoria

```javascript
// Frontend React
const carregarAtividades = async (categoria) => {
  const url = categoria 
    ? `http://localhost:8000/atividades-historico/?categoria=${categoria}`
    : 'http://localhost:8000/atividades-historico/';
    
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

### Exemplo 4: Buscar Condições Climáticas Recentes

```javascript
// Frontend React
const carregarCondicoesRecentes = async (clienteId, diasPassados = 7) => {
  const dataFim = new Date();
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - diasPassados);
  
  const url = `http://localhost:8000/condicoes-climaticas-historico/?cliente_id=${clienteId}&data_inicio=${dataInicio.toISOString().split('T')[0]}&data_fim=${dataFim.toISOString().split('T')[0]}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

## 📝 Schema Pydantic (Request/Response)

### MaoDeObraHistoricoCreate
```python
{
  "nome": "João Silva",
  "cargo": "Pedreiro",
  "cliente_id": 123  // opcional
}
```

### EquipamentoHistoricoCreate
```python
{
  "nome": "Betoneira 400L",
  "descricao": "Betoneira elétrica",  // opcional
  "cliente_id": 123  // opcional
}
```

### AtividadeHistoricoCreate
```python
{
  "descricao": "Concretagem da laje do 2º pavimento",
  "categoria": "Estrutura",  // opcional
  "cliente_id": 123  // opcional
}
```

### CondicaoClimaticaHistoricoCreate
```python
{
  "data_registro": "2025-10-21T14:30:00",  // opcional (default: now)
  "horario_dia": "tarde",  // opcional
  "tempo": "ensolarado",  // opcional
  "condicao": "seco",  // opcional
  "indice_pluviometrico": 0.0,  // opcional
  "temperatura": 28.5,  // opcional
  "cliente_id": 123  // opcional
}
```

## 🎯 Casos de Uso

### 1. **Autocompletar no Formulário**
Ao digitar o nome de um trabalhador, equipamento ou atividade, o sistema busca no histórico e sugere opções previamente cadastradas.

### 2. **Histórico de Condições Climáticas**
Permite visualizar padrões climáticos de uma obra ao longo do tempo, útil para planejamento e justificativas de atrasos.

### 3. **Gestão de Equipe Recorrente**
Facilita cadastro rápido de funcionários que trabalham frequentemente nas obras do cliente.

### 4. **Padronização de Atividades**
Ajuda a manter nomenclatura consistente de atividades entre diferentes relatórios.

## 🔒 Segurança

- Todos os endpoints exigem autenticação (Bearer token)
- Apenas usuários autenticados podem criar/listar/deletar
- O campo `criado_por` registra quem cadastrou cada item
- Timestamps automáticos em `criado_em`

## 🚀 Migração

**Arquivo:** `backend/migrate_add_historico_tables.py`

**Executar localmente:**
```bash
.venv\Scripts\Activate.ps1
python backend/migrate_add_historico_tables.py
```

**Executar no Render** (via shell):
```bash
python backend/migrate_add_historico_tables.py
```

## ✅ Status

- ✅ Tabelas criadas no SQLite local
- ✅ Models SQLAlchemy definidos
- ✅ Schemas Pydantic criados
- ✅ Endpoints CRUD implementados
- ✅ Migração testada e funcionando
- ✅ Commit e push para GitHub (66a66dfbb)
- ⏳ Deploy no Render (automático via Git)

## 📚 Próximos Passos

1. **Integrar Autocomplete no frontend** em `RelatorioObras.js`:
   - Usar MUI `<Autocomplete>` para mão de obra
   - Usar MUI `<Autocomplete>` para equipamentos
   - Usar MUI `<Autocomplete>` para atividades
   - Buscar condições climáticas recentes ao selecionar cliente

2. **Dashboard de Estatísticas**:
   - Gráfico de frequência de uso de equipamentos
   - Ranking de trabalhadores mais alocados
   - Timeline de condições climáticas

3. **Export/Import**:
   - Exportar históricos para Excel
   - Importar listas de funcionários/equipamentos em lote
