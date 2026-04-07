# TODO List Distribuído

Grupo:
- Rodrigo Secundo Araújo
- Kevin de Sousa Andrade
- Paulo Guilherme Abreu Bruçó

Projeto com três serviços independentes e frontend estático:

- Serviço 1: API de tarefas e autenticação em Node.js + Express + Prisma
- Serviço 2: gerador de logs em PHP + Eloquent
- Serviço 3: analisador de tarefas em Python + FastAPI + SQLAlchemy

## Arquitetura

- O serviço de tarefas mantém usuários e tarefas no banco principal via Prisma.
- O serviço de logs recebe eventos internos protegidos por `X-Service-Token` e persiste em SQLite via Eloquent.
- O serviço analítico mantém um espelho das tarefas para gerar estatísticas por usuário via SQLAlchemy.
- O frontend consome diretamente:
  - autenticação e tarefas no serviço 1
  - estatísticas no serviço 3

## Requisitos

- Node.js 20+
- PHP 8.2+
- Composer 2+
- Python 3.11+

## Configuração

### 1. Serviço de tarefas

Diretório: `backend/task-service`

1. Copie `.env.example` para `.env`
2. Instale dependências:

```bash
npm install
```

3. Gere o client Prisma e crie o banco:

```bash
npm run prisma:generate
npm run prisma:push
```

4. Inicie o serviço:

```bash
npm start
```

### 2. Serviço de logs

Diretório: `backend/log-service`

1. Copie `.env.example` para `.env`
2. Instale dependências:

```bash
composer install
```

3. Inicie com o servidor embutido do PHP:

```bash
php -S localhost:8000 -t public
```

### 3. Serviço analítico

Diretório: `backend/analytics-service`

1. Copie `.env.example` para `.env`
2. Crie um ambiente virtual e instale dependências:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

3. Inicie a API:

```bash
uvicorn main:app --reload --port 8001
```

### 4. Frontend

Abra `frontend/index.html` com um servidor estático. Exemplo com VS Code Live Server ou equivalente.

## Fluxo

1. Usuário cria conta ou faz login.
2. O frontend armazena o JWT no navegador.
3. Toda rota de tarefas exige token.
4. Cada consulta de tarefas filtra por `usuarioId`.
5. Ao criar, concluir ou excluir uma tarefa, o serviço 1:
   - grava no banco principal
   - envia log para o serviço 2
   - sincroniza o espelho no serviço 3
6. As estatísticas retornam apenas os dados do usuário autenticado.

## Rotas principais

Esta seção documenta os endpoints expostos pelos três serviços com base no código atual do projeto.

### Convenções gerais

- Base URL do serviço de tarefas: `http://localhost:3001`
- Base URL do serviço de logs: `http://localhost:8000`
- Base URL do serviço analítico: `http://localhost:8001`
- Endpoints autenticados usam o cabeçalho `Authorization: Bearer <jwt>`
- Endpoints internos entre serviços usam o cabeçalho `X-Service-Token: <token-interno>`
- Quando um endpoint retorna `204 No Content`, a resposta não possui corpo

### 1. Serviço de tarefas e autenticação - Node.js + Express

#### `GET /health`

Endpoint de verificação rápida do serviço.

Resposta `200 OK`:

```json
{
  "service": "task-service",
  "status": "ok"
}
```

#### `POST /api/auth/register`

Cria um novo usuário e devolve a sessão autenticada.

Request body:

```json
{
  "nome": "Rodrigo Araujo",
  "email": "rodrigo@example.com",
  "senha": "123456"
}
```

Resposta `201 Created`:

```json
{
  "user": {
    "id": 1,
    "nome": "Rodrigo Araujo",
    "email": "rodrigo@example.com"
  },
  "token": "<jwt>"
}
```

Erros esperados:

- `400 Bad Request`: nome com menos de 2 caracteres, email inválido ou senha com menos de 6 caracteres
- `409 Conflict`: email já cadastrado
- `500 Internal Server Error`: falha inesperada no servidor

Exemplo de erro `400`:

```json
{
  "message": "Senha deve ter ao menos 6 caracteres."
}
```

Exemplo de erro `409`:

```json
{
  "message": "Email já cadastrado."
}
```

#### `POST /api/auth/login`

Autentica um usuário existente e devolve um JWT.

Request body:

```json
{
  "email": "rodrigo@example.com",
  "senha": "123456"
}
```

Resposta `200 OK`:

```json
{
  "user": {
    "id": 1,
    "nome": "Rodrigo Araujo",
    "email": "rodrigo@example.com"
  },
  "token": "<jwt>"
}
```

Erros esperados:

- `400 Bad Request`: payload inválido
- `401 Unauthorized`: credenciais inválidas

Exemplo de erro `401`:

```json
{
  "message": "Credenciais inválidas."
}
```

#### `GET /api/tasks`

Lista apenas as tarefas do usuário autenticado.

Cabeçalho obrigatório:

```http
Authorization: Bearer <jwt>
```

Resposta `200 OK`:

```json
[
  {
    "id": 3,
    "titulo": "Finalizar documentação",
    "descricao": "Detalhar endpoints no README",
    "concluida": false,
    "usuarioId": 1
  },
  {
    "id": 2,
    "titulo": "Subir serviço analítico",
    "descricao": "",
    "concluida": true,
    "usuarioId": 1
  }
]
```

Erros esperados:

- `401 Unauthorized`: token ausente ou inválido

Exemplo de erro `401`:

```json
{
  "message": "Token não informado."
}
```

#### `POST /api/tasks`

Cria uma tarefa vinculada ao usuário autenticado. Ao criar, o serviço também envia um log para o serviço 2 e sincroniza o espelho no serviço 3.

Cabeçalhos obrigatórios:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

Request body:

```json
{
  "titulo": "Preparar apresentação",
  "descricao": "Revisar arquitetura distribuída"
}
```

Resposta `201 Created`:

```json
{
  "id": 4,
  "titulo": "Preparar apresentação",
  "descricao": "Revisar arquitetura distribuída",
  "concluida": false,
  "usuarioId": 1,
  "createdAt": "2026-04-06T19:30:00.000Z",
  "updatedAt": "2026-04-06T19:30:00.000Z"
}
```

Erros esperados:

- `400 Bad Request`: título vazio
- `401 Unauthorized`: token ausente ou inválido

Exemplo de erro `400`:

```json
{
  "message": "Título é obrigatório."
}
```

#### `PATCH /api/tasks/:id/toggle`

Alterna o status da tarefa entre pendente e concluída. Também gera log e atualiza o espelho do serviço analítico.

Cabeçalho obrigatório:

```http
Authorization: Bearer <jwt>
```

Exemplo de rota:

```http
PATCH /api/tasks/4/toggle
```

Resposta `200 OK`:

```json
{
  "id": 4,
  "titulo": "Preparar apresentação",
  "descricao": "Revisar arquitetura distribuída",
  "concluida": true,
  "usuarioId": 1,
  "createdAt": "2026-04-06T19:30:00.000Z",
  "updatedAt": "2026-04-06T19:45:00.000Z"
}
```

Erros esperados:

- `400 Bad Request`: id não numérico
- `401 Unauthorized`: token ausente ou inválido
- `403 Forbidden`: usuário tentando alterar tarefa de outro usuário
- `404 Not Found`: tarefa inexistente

Exemplo de erro `403`:

```json
{
  "message": "Acesso negado."
}
```

#### `DELETE /api/tasks/:id`

Exclui uma tarefa do usuário autenticado. Também gera log e remove o espelho no serviço analítico.

Cabeçalho obrigatório:

```http
Authorization: Bearer <jwt>
```

Exemplo de rota:

```http
DELETE /api/tasks/4
```

Resposta `204 No Content`

Erros esperados:

- `400 Bad Request`: id não numérico
- `401 Unauthorized`: token ausente ou inválido
- `403 Forbidden`: usuário tentando excluir tarefa de outro usuário
- `404 Not Found`: tarefa inexistente

### 2. Serviço de logs - PHP + Eloquent

#### `GET /health`

Endpoint de verificação do serviço de logs.

Resposta `200 OK`:

```json
{
  "service": "log-service",
  "status": "ok"
}
```

#### `GET /api/logs`

Lista os 100 logs mais recentes em ordem decrescente de id. Este endpoint não exige autenticação no código atual.

Resposta `200 OK`:

```json
[
  {
    "id": 12,
    "acao": "task_created",
    "detalhe": "Tarefa Preparar apresentação criada.",
    "usuarioId": 1,
    "timestamp": "2026-04-06T19:30:00+00:00"
  },
  {
    "id": 11,
    "acao": "user_registered",
    "detalhe": "Usuário rodrigo@example.com cadastrado.",
    "usuarioId": 1,
    "timestamp": "2026-04-06T19:20:00+00:00"
  }
]
```

#### `POST /api/logs`

Endpoint interno usado principalmente pelo serviço de tarefas para persistir eventos técnicos e de negócio.

Cabeçalhos obrigatórios:

```http
Content-Type: application/json
X-Service-Token: <token-interno>
```

Request body:

```json
{
  "action": "task_created",
  "detail": "Tarefa Preparar apresentação criada.",
  "usuarioId": 1
}
```

Resposta `201 Created`:

```json
{
  "id": 12,
  "acao": "task_created",
  "detalhe": "Tarefa Preparar apresentação criada.",
  "usuarioId": 1,
  "timestamp": "2026-04-06T19:30:00+00:00"
}
```

Erros esperados:

- `401 Unauthorized`: token interno inválido ou ausente
- `422 Unprocessable Entity`: campos `action` ou `detail` ausentes ou vazios

Exemplo de erro `401`:

```json
{
  "message": "Não autorizado."
}
```

Exemplo de erro `422`:

```json
{
  "message": "Campos action e detail são obrigatórios."
}
```

### 3. Serviço analítico - Python + FastAPI

#### `GET /health`

Endpoint de verificação do serviço analítico.

Resposta `200 OK`:

```json
{
  "service": "analytics-service",
  "status": "ok"
}
```

#### `GET /api/stats`

Retorna estatísticas agregadas apenas do usuário autenticado com base no espelho mantido pelo serviço analítico.

Cabeçalho obrigatório:

```http
Authorization: Bearer <jwt>
```

Resposta `200 OK`:

```json
{
  "usuarioId": 1,
  "total": 8,
  "concluidas": 5,
  "pendentes": 3
}
```

Erros esperados:

- `401 Unauthorized`: token ausente ou inválido

Exemplo de erro `401`:

```json
{
  "detail": "Token não informado."
}
```

#### `POST /internal/tasks/upsert`

Endpoint interno chamado pelo serviço de tarefas para criar ou atualizar o espelho de uma tarefa no banco analítico.

Cabeçalhos obrigatórios:

```http
Content-Type: application/json
X-Service-Token: <token-interno>
```

Request body:

```json
{
  "id": 4,
  "titulo": "Preparar apresentação",
  "concluida": false,
  "usuarioId": 1
}
```

Resposta `200 OK`:

```json
{
  "status": "ok"
}
```

Erros esperados:

- `401 Unauthorized`: token interno inválido ou ausente
- `422 Unprocessable Entity`: payload fora do schema esperado

Exemplo de erro `401`:

```json
{
  "detail": "Não autorizado."
}
```

#### `DELETE /internal/tasks/{id}`

Endpoint interno chamado pelo serviço de tarefas para remover uma tarefa do espelho analítico.

Cabeçalho obrigatório:

```http
X-Service-Token: <token-interno>
```

Exemplo de rota:

```http
DELETE /internal/tasks/4
```

Resposta `204 No Content`

Erros esperados:

- `401 Unauthorized`: token interno inválido ou ausente

### Resumo de integração entre serviços

- O frontend chama diretamente `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id/toggle`, `DELETE /api/tasks/:id` e `GET /api/stats`
- O serviço de tarefas chama internamente `POST /api/logs`, `POST /internal/tasks/upsert` e `DELETE /internal/tasks/{id}`
- O serviço de logs centraliza eventos como cadastro, falha de login, criação de tarefa, alternância de status, exclusão e tentativas de acesso negado
- O serviço analítico mantém um espelho simplificado das tarefas para calcular total, concluídas e pendentes sem consultar o banco principal

## Regras atendidas

- 3 linguagens diferentes
- 3 ORMs diferentes
- senha com hash
- autenticação com JWT
- autorização por proprietário da tarefa
- comunicação entre serviços
- isolamento de dados por usuário
