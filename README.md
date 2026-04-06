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

### Serviço 1

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id/toggle`
- `DELETE /api/tasks/:id`

### Serviço 2

- `POST /api/logs`
- `GET /api/logs`

### Serviço 3

- `GET /api/stats`
- `POST /internal/tasks/upsert`
- `DELETE /internal/tasks/{id}`

## Regras atendidas

- 3 linguagens diferentes
- 3 ORMs diferentes
- senha com hash
- autenticação com JWT
- autorização por proprietário da tarefa
- comunicação entre serviços
- isolamento de dados por usuário