# DominioHub

Plataforma SaaS para gerenciamento de domínios e operações desenvolvida
como desafio técnico Full Stack.

## Stack

### Backend

- Node.js
- TypeScript
- Express

### Frontend

- React
- TypeScript

## Estrutura

- `backend/` — API e regras de negócio
- `frontend/` — aplicação web
- `docs/` — documentação técnica

## Desenvolvimento

A documentação completa de execução será adicionada durante o desenvolvimento.

## Docker Compose

1. Crie o arquivo de ambiente e preencha os segredos obrigatórios:

   ```powershell
   Copy-Item .env.example .env
   ```

   Atualize `POSTGRES_PASSWORD` e o `DATABASE_URL` correspondente, além de
   `JWT_SECRET`, `WEBHOOK_SECRET_ENCRYPTION_KEY` e `GEMINI_API_KEY`.

2. Compile e inicie o ambiente completo:

   ```powershell
   docker compose up --build -d
   ```

   As migrations Prisma são aplicadas uma única vez pelo serviço
   `backend-migrate` antes da API e dos workers. Para executá-las manualmente:

   ```powershell
   docker compose run --rm backend-migrate
   ```

3. Acompanhe os logs e pare os serviços quando necessário:

   ```powershell
   docker compose logs -f
   docker compose down
   ```
