# Execução Local e Teste Manual

Este guia mostra como subir frontend e backend no seu PC e como validar, manualmente, cada parte do sistema.

## O que precisa estar instalado

- Node.js 20 ou superior
- PHP 8.2 ou superior
- Composer 2 ou superior
- Python 3.11 ou superior
- VS Code com Live Server, se quiser abrir o frontend sem configurar outro servidor estático

## Estrutura do sistema

O projeto tem 4 partes:

- frontend: tela do sistema
- backend/task-service: autenticação e CRUD de tarefas com Prisma
- backend/log-service: logs com Eloquent
- backend/analytics-service: estatísticas com SQLAlchemy

## Primeira preparação

Faça isso uma vez só.

### Serviço 1: task-service

Entre em [backend/task-service](backend/task-service) e execute:

```powershell
npm install
npm run prisma:generate
npm run prisma:push
```

### Serviço 2: log-service

Entre em [backend/log-service](backend/log-service) e execute:

```powershell
composer install
```

### Serviço 3: analytics-service

Entre em [backend/analytics-service](backend/analytics-service) e execute:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Como subir o backend

Abra 3 terminais separados. Pode ser no VS Code ou no Windows Terminal. O importante é deixar os 3 serviços rodando ao mesmo tempo.

### Terminal 1: serviço de tarefas

Na pasta [backend/task-service](backend/task-service), execute:

```powershell
npm start
```

Resultado esperado:

```text
Task service listening on port 3001
```

### Terminal 2: serviço de logs

Na pasta [backend/log-service](backend/log-service), execute:

```powershell
php -S localhost:8000 -t public
```

Resultado esperado: o PHP informa que o servidor foi iniciado na porta 8000.

### Terminal 3: serviço analítico

Na pasta [backend/analytics-service](backend/analytics-service), ative o ambiente virtual e execute:

```powershell
.venv\Scripts\activate
uvicorn main:app --reload --port 8001
```

Resultado esperado: o Uvicorn informa que a aplicação está rodando na porta 8001.

## Como abrir o frontend

O frontend está em [frontend/index.html](frontend/index.html).

Forma mais simples no VS Code:

1. Instale a extensão Live Server, se ainda não tiver.
2. Clique com o botão direito em [frontend/index.html](frontend/index.html).
3. Escolha `Open with Live Server`.
4. O navegador vai abrir uma URL parecida com `http://127.0.0.1:5500/frontend/`.

Se a porta mudar, ajuste o `.env` dos serviços se necessário, mas no seu projeto atual a configuração esperada é a porta 5500.

## Como verificar se o backend está no ar

Com os 3 serviços rodando, abra estas URLs no navegador:

- `http://127.0.0.1:3001/health`
- `http://localhost:8000/health`
- `http://127.0.0.1:8001/health`

Cada uma deve retornar um JSON com `status: ok`.

## Roteiro de teste manual

Os passos abaixo validam tudo que a atividade pede.

### 1. Teste de cadastro

No frontend:

1. Abra a aba `Cadastrar`.
2. Crie um usuário com nome, email e senha.

Resultado esperado:

- o usuário entra no sistema automaticamente
- a área de tarefas aparece
- o nome do usuário aparece no topo

### 2. Teste de login

1. Clique em `Sair`.
2. Vá para a aba `Entrar`.
3. Faça login com o mesmo email e senha.

Resultado esperado:

- login realizado com sucesso
- a lista de tarefas do usuário é carregada

### 3. Teste de criação de tarefa

1. Preencha o título e a descrição.
2. Clique em `Adicionar`.

Resultado esperado:

- a tarefa aparece na lista
- a tarefa começa como pendente
- a estatística `Total` aumenta

### 4. Teste de conclusão de tarefa

1. Clique no botão `✔` da tarefa.

Resultado esperado:

- a tarefa muda para concluída
- o estilo visual muda na lista
- a estatística `Concluídas` aumenta
- a estatística `Pendentes` diminui

### 5. Teste de exclusão de tarefa

1. Clique no botão `✖` da tarefa.

Resultado esperado:

- a tarefa some da lista
- o total de tarefas diminui

### 6. Teste de isolamento entre usuários

Esse é o teste principal de autorização.

1. Cadastre o usuário A.
2. Crie uma ou mais tarefas com o usuário A.
3. Faça logout.
4. Cadastre o usuário B.
5. Entre com o usuário B.

Resultado esperado:

- o usuário B não vê nenhuma tarefa do usuário A
- as estatísticas do usuário B começam zeradas

### 7. Teste de estatísticas por usuário

Ainda com o usuário B:

1. Crie uma tarefa.
2. Conclua essa tarefa.

Resultado esperado:

- `Total` deve mostrar apenas tarefas do usuário B
- `Concluídas` deve refletir apenas o que o usuário B concluiu
- `Pendentes` deve refletir apenas o que resta para o usuário B

Depois faça logout e volte para o usuário A.

Resultado esperado:

- o usuário A vê apenas os próprios números
- os números do usuário A não se misturam com os do usuário B

### 8. Teste de logs

Abra no navegador:

- `http://localhost:8000/api/logs`

Resultado esperado:

- aparecem registros com ações como `task_created`, `task_toggled`, `task_deleted`
- cada ação deve trazer detalhe e, quando aplicável, `usuarioId`

### 9. Teste de acesso indevido

Pela interface normal, um usuário não consegue nem ver a tarefa do outro. Para provar a autorização no backend, faça um teste direto na API.

Você pode usar Postman, Insomnia ou Thunder Client.

Fluxo sugerido:

1. Faça login com o usuário A em `POST http://127.0.0.1:3001/api/auth/login`.
2. Guarde o token retornado.
3. Crie uma tarefa com o usuário A em `POST http://127.0.0.1:3001/api/tasks`.
4. Faça login com o usuário B.
5. Tente concluir a tarefa do usuário A em `PATCH http://127.0.0.1:3001/api/tasks/{id}/toggle` usando o token do usuário B.

Resultado esperado:

- a API responde `403`
- a tarefa não é alterada
- o serviço de logs registra `access_denied`

## O que conferir em cada serviço

### Task service

Verifica:

- cadastro e login
- hash de senha
- token JWT
- CRUD de tarefas
- filtro por usuário

### Log service

Verifica:

- persistência dos logs
- logs de criação, conclusão, exclusão e acesso negado

### Analytics service

Verifica:

- total de tarefas por usuário
- concluídas por usuário
- pendentes por usuário

## Sinais de que tudo está funcionando

O sistema está correto se:

- os 3 endpoints `/health` responderem `ok`
- o frontend abrir sem erro
- cadastro e login funcionarem
- cada usuário enxergar apenas as próprias tarefas
- estatísticas mudarem conforme as ações do usuário logado
- `http://localhost:8000/api/logs` mostrar eventos do sistema
- a API devolver `403` quando um usuário tentar alterar tarefa de outro

## Problemas comuns

### A página abre, mas não carrega tarefas

Verifique:

- se o task-service está rodando na porta 3001
- se o analytics-service está rodando na porta 8001
- se o frontend foi aberto via servidor local, e não só clicando no arquivo HTML direto

### O login funciona, mas as estatísticas não aparecem

Verifique:

- se o analytics-service está ativo
- se o `.env` do task-service e do analytics-service usam o mesmo `JWT_SECRET`

### Os logs não aparecem

Verifique:

- se o log-service está ativo na porta 8000
- se o `LOG_SERVICE_TOKEN` do task-service é igual ao `SERVICE_TOKEN` do log-service

### Erro de CORS

Verifique:

- se o frontend está aberto em `http://127.0.0.1:5500`
- se os `.env` estão com a origem correta

### Erro no `npm run prisma:generate`

Se aparecer algo como `EPERM: operation not permitted, rename ... query_engine-windows.dll.node`, a causa mais comum no Windows é arquivo travado por um processo Node ainda em execução.

No seu projeto, isso normalmente acontece quando o `task-service` já está rodando em outro terminal.

Como resolver:

1. Pare o serviço de tarefas no terminal onde está rodando `npm start`.
2. Feche qualquer terminal ou processo Node que esteja usando a pasta `backend/task-service`.
3. Na pasta [backend/task-service](backend/task-service), execute de novo:

```powershell
npm run prisma:generate
```

Se ainda falhar, limpe o client gerado e tente novamente:

```powershell
Remove-Item -Recurse -Force .\node_modules\.prisma\client
npm run prisma:generate
```

Se o arquivo continuar travado, encerre os processos Node do Windows e repita:

```powershell
Get-Process node | Stop-Process -Force
npm run prisma:generate
```

Depois que o generate funcionar, rode também:

```powershell
npm run prisma:push
```

## Arquivos mais importantes

- [frontend/index.html](frontend/index.html)
- [frontend/js/app.js](frontend/js/app.js)
- [backend/task-service/src/server.js](backend/task-service/src/server.js)
- [backend/task-service/src/routes/authRoutes.js](backend/task-service/src/routes/authRoutes.js)
- [backend/task-service/src/routes/taskRoutes.js](backend/task-service/src/routes/taskRoutes.js)
- [backend/log-service/public/index.php](backend/log-service/public/index.php)
- [backend/analytics-service/main.py](backend/analytics-service/main.py)