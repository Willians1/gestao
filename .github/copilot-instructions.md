<!-- Use este arquivo para fornecer instruções específicas do workspace para o Copilot. Veja detalhes em https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

- [x] Verifique se o arquivo copilot-instructions.md existe no diretório .github.

- [x] Esclareça os requisitos do projeto
	- Frontend React com MUI e DataGrid, páginas: Cadastro de Usuários, Clientes, Contratos, Despesas, Fornecedores, Orçamento de Obra, Resumo Mensal, Valor Materiais.
	- Importação de Excel em todas as páginas, exibição em tabela e persistência de arquivos no backend para download posterior.
	- Backend FastAPI + SQLAlchemy + SQLite, endpoints CRUD básicos e endpoints de upload/listagem/download de arquivos.

- [x] Estruture o projeto
	- Pastas backend/ e frontend/ definidas. Layout com sidebar persistente aplicado às rotas de dados.

- [x] Personalize o projeto
	- UI em Português. Ações (Novo, Pesquisar, Importar Excel). DataGrid com busca e edição inline.

- [ ] Instale extensões necessárias (se houver)
	- Sugeridas: ms-python.python, ms-toolsai.jupyter, esbenp.prettier-vscode, dbaeumer.vscode-eslint.

- [ ] Compile o projeto
	- Backend: instalar requirements e iniciar uvicorn (porta 8000).
	- Frontend: instalar deps e iniciar dev server (porta 3001).

- [ ] Crie e execute tarefas
	- Adicionar tasks.json para start do backend e frontend em paralelo (opcional).

- [ ] Lance o projeto
	- Validar upload em todas as páginas e listagem de arquivos importados.

- [ ] Garanta documentação completa
	- Atualizar README com instruções de setup, execução e endpoints.

Notas de progresso:
- Integramos upload de Excel no frontend para as entidades: cadastro_usuarios, clientes, contratos, despesas, fornecedores, orcamento_obra, resumo_mensal, valor_materiais, apontando para http://localhost:8000.
- Backend possui endpoints /uploads/{entidade}, /uploads?entidade=, e /uploads/{id}/download com CORS liberado para http://localhost:3001.

MYSQL_PORT=8080
