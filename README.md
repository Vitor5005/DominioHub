# DomínioHub

SaaS multi-tenant para agências que gerenciam domínios de clientes e suas operações. O MVP do desafio técnico reúne usuários, integrações, eventos externos, webhooks e suporte assistido por IA.

## Funcionalidades

- Autenticação com JWT, usuários vinculados a organizações e controle de acesso por roles `ADMIN`, `OPERATOR` e `SUPPORT`.
- Isolamento por organização nas consultas e alterações; conversas do assistente também são isoladas por usuário.
- Listagem, consulta individual e sincronização de domínios com provider mock.
- Recebimento autenticado de eventos externos, deduplicação e acompanhamento do processamento.
- Filas BullMQ e processos independentes `event-worker` e `webhook-worker`, com tentativas e backoff exponencial.
- Cadastro e configuração de endpoints de webhook, histórico de entregas e assinatura HMAC SHA-256.
- Cache de domínios por organização e invalidação após sincronização.
- Chat com Gemini, persistência de mensagens e envio de histórico recente como contexto.
- Logs estruturados, correlação por request ID, tratamento central de erros e healthcheck.

As organizações são entidades persistidas e delimitam o contexto de acesso; não há CRUD público de organizações. O provider de domínio disponível é mock, sem chamadas reais à Namecheap.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Backend | Node.js 26, TypeScript, Express 5, Prisma 7, PostgreSQL, Redis/ioredis e BullMQ |
| Frontend | React, TypeScript, Vite e React Router |
| Segurança e testes | Argon2, JWT via jose, Zod, Helmet, CORS, rate limiting e Vitest |
| Infraestrutura | Docker, Docker Compose e Nginx |
| Produção/demo | AWS EC2, HTTPS e certificados Let's Encrypt |

## Arquitetura

```text
Navegador → Nginx → React / Backend API
                           ↓
                   Services / Repositories → PostgreSQL
                           ↓
                    Redis: cache e filas
                           ↓
                 event-worker / webhook-worker
```

O Nginx serve a SPA e encaminha `/api/*` para a API. API e workers usam a mesma imagem backend, com comandos separados. PostgreSQL e Redis ficam internos à rede Docker; a API é publicada somente em loopback para diagnóstico local.

## Multi-tenancy

Recursos pertencem a organizações. As consultas e alterações relevantes recebem `organizationId` a partir do contexto autenticado, e cada usuário opera na organização à qual pertence. O chat utiliza também `userId` para restringir listagem, consulta e envio às próprias conversas.

Os testes críticos verificam o escopo das consultas e o bloqueio de escrita por ID fora da organização.

## RBAC

| Role | Acesso implementado |
| --- | --- |
| `ADMIN` | Leitura e gerenciamento de usuários, domínios e webhooks; leitura de eventos; uso do chat |
| `OPERATOR` | Leitura e gerenciamento de domínios e webhooks; leitura de eventos; uso do chat; sem acesso à gestão de usuários |
| `SUPPORT` | Leitura de domínios, eventos e webhooks; uso do chat; sem permissões de gerenciamento |

Os middlewares da API aplicam as permissões; os controles do frontend acompanham essas mesmas permissões.

## Estrutura do projeto

```text
backend/
  prisma/             # Schema, migrations e seed
  src/
    common/           # Middlewares, erros, logging e tipos compartilhados
    config/           # Configuração por ambiente
    modules/          # Regras, services e repositories por domínio
    infrastructure/   # Banco, cache, filas e providers
    workers/          # Consumidores de eventos e webhooks
    tests/critical/   # Suítes locais dos fluxos críticos
frontend/
  src/                # Páginas, componentes, features e estilos
  nginx/              # SPA, proxy da API e configuração HTTPS
deploy/aws/           # Exemplos de ambiente, scripts e operação da EC2
docker-compose.yml
```

## Pré-requisitos

- Git, Node.js 26 e npm para desenvolvimento e testes locais.
- Docker Engine/Docker Desktop, Docker Compose com suporte a `attach: false` e Buildx para builds das imagens.
- Para o deploy documentado: Amazon Linux 2023 x86_64. Os requisitos de certificados e ferramentas da EC2 estão no [guia AWS](deploy/aws/README.md).

## Configuração local

### API e dependências em Docker, frontend em desenvolvimento

Este fluxo usa o Compose existente para PostgreSQL, Redis, migrations, seed, API e workers. O frontend usa o servidor Vite, pois a configuração Nginx versionada depende dos certificados HTTPS da demo.

1. Clone o repositório e entre na pasta:

   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd DominioHub
   ```

2. Copie os exemplos, sem versionar os arquivos reais:

   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   ```

3. Preencha no `.env` os segredos de PostgreSQL, JWT, webhooks e Gemini. Mantenha a senha de `DATABASE_URL` consistente com `POSTGRES_PASSWORD`, usando o hostname `postgres`. A conexão Redis usa `redis`. Ajuste estas URLs para o Vite local:

   ```dotenv
   FRONTEND_URL=http://localhost:5173
   API_PUBLIC_URL=http://localhost:3000
   CORS_ALLOWED_ORIGINS=http://localhost:5173
   DEMO_SEED_ENABLED=true
   ```

   No `frontend/.env`, mantenha `VITE_API_URL=http://localhost:3000/api/v1`. Para `WEBHOOK_SECRET_ENCRYPTION_KEY`, gere uma chave privada com `openssl rand -base64 32`: são exatamente 32 bytes em Base64. Os valores públicos dos exemplos devem ser substituídos.

4. Na raiz, inicie os serviços backend:

   ```bash
   docker compose up -d --build backend-api event-worker webhook-worker
   ```

   As dependências iniciam automaticamente: PostgreSQL saudável → `backend-migrate` (`prisma migrate deploy`) → `backend-seed` → API/workers. Redis também precisa estar saudável. Com `DEMO_SEED_ENABLED=true`, o seed cria/atualiza os dados demo; com `false`, essa etapa termina sem semear dados.

5. Inicie o frontend em outro terminal:

   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

Acesse `http://localhost:5173`; a API local fica em `http://localhost:3000`, e o healthcheck em `http://localhost:3000/api/v1/health`. Se o Vite selecionar outra porta, ajuste as URLs/CORS correspondentes.

O Compose recebe o ambiente do `.env` da raiz. `backend/.env.example` é a referência para execução direta dos scripts backend, que exige conexões de banco/Redis acessíveis ao processo local.

### Ambiente completo com Nginx

O comando `docker compose up --build` inclui o frontend Nginx. A configuração atual publica HTTP/HTTPS, redireciona para HTTPS e referencia certificados específicos da demo em `/etc/letsencrypt`. Sem esses arquivos previamente provisionados, o container frontend não inicia. As portas e URLs dos exemplos, por si só, não provisionam TLS; consulte o [procedimento AWS](deploy/aws/README.md) para o ambiente completo.

Para acompanhar e encerrar o ambiente local:

```bash
docker compose logs -f backend-api
docker compose down
```

PostgreSQL, Redis, migrations, seed e workers ficam ocultos apenas da saída anexada padrão; seus logs continuam disponíveis:

```bash
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f backend-migrate
docker compose logs -f backend-seed
docker compose logs -f event-worker
docker compose logs -f webhook-worker
```

Se for necessário reaplicar migrations manualmente, use `docker compose run --rm backend-migrate`. Preserve os volumes: não utilize `docker compose down -v` quando precisar manter os dados.

## Variáveis de ambiente

| Categoria | Variáveis principais |
| --- | --- |
| Banco | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DATABASE_URL` |
| Redis/cache | `REDIS_URL`, `CACHE_TTL_SECONDS` |
| Autenticação | `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_ISSUER`, `JWT_AUDIENCE` |
| Domínios | `DOMAIN_PROVIDER` (atualmente `mock`) |
| IA | `AI_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `AI_HISTORY_LIMIT`, `AI_REQUEST_TIMEOUT_MS` |
| URLs, portas e proxy | `PORT`, `BACKEND_PORT`, `FRONTEND_PORT`, `HTTPS_PORT`, `FRONTEND_URL`, `API_PUBLIC_URL`, `VITE_API_URL`, `CORS_ALLOWED_ORIGINS`, `TRUST_PROXY` |
| Webhooks/demo | `WEBHOOK_SECRET_ENCRYPTION_KEY`, `DEMO_SEED_ENABLED` |

Use os exemplos da raiz, `backend`, `frontend` e `deploy/aws` conforme o modo de execução. Segredos reais ficam apenas nos arquivos locais ignorados pelo Git. `JWT_SECRET` exige pelo menos 32 caracteres; a chave de webhooks exige Base64 de exatamente 32 bytes.

`VITE_API_URL` é pública e incorporada ao build do frontend. Alterá-la em um ambiente compilado exige novo build. Nunca use `backend-api` como hostname em uma URL consumida diretamente pelo navegador.

## Dados de demonstração

Os usuários abaixo são definidos em `backend/prisma/seed.ts` e compartilham a senha de demonstração `DominioHubDemo123!`.

| E-mail | Role | Organização |
| --- | --- | --- |
| `admin@dominiohub.com` | `ADMIN` | DomínioHub Demo |
| `operator@dominiohub.com` | `OPERATOR` | DomínioHub Demo |
| `support@dominiohub.com` | `SUPPORT` | DomínioHub Demo |
| `admin@agencianorte.com` | `ADMIN` | Agência Norte |

São credenciais intencionais de desenvolvimento/demo. Na AWS, `DEMO_SEED_ENABLED=false` é o padrão; a carga opcional é feita manualmente com `./deploy/aws/seed-demo.sh`.

## Testes

Na pasta `backend`, instale as dependências e execute os scripts existentes:

```bash
cd backend
npm ci
npm test
```

Para executar somente a suíte crítica complementada na Fase 38:

```bash
npm test -- --run src/tests/critical
```

A suíte utiliza Vitest e mocks locais para autenticação, RBAC, isolamento multi-tenant, domínios/cache, eventos, filas, webhooks, workers e IA. Inclui histórico/contexto do chat, assinatura HMAC e proteção de escrita entre tenants. Não depende de chamadas reais a Gemini, Namecheap ou webhooks externos.

O frontend não possui infraestrutura de testes automatizados configurada.

## Integrações externas

### Provider de domínio

`DOMAIN_PROVIDER=mock` seleciona o provider disponível, que permite sincronizar dados de demonstração sem depender da Namecheap. A sincronização persiste os domínios e invalida o cache da organização. Cadastro, atualização e exclusão manual de domínios não são expostos como CRUD na API atual.

### IA

O provider atual é Gemini, configurado por ambiente. O chat envia o histórico recente de mensagens USER/ASSISTANT como contexto e persiste a troca após a resposta. As conversas pertencem ao usuário e à organização; o assistente não consulta automaticamente os demais recursos da organização.

### Webhooks

Os endpoints recebem entregas assíncronas pelo `webhook-worker`. A autenticação usa HMAC SHA-256 sobre `timestamp.body`; o segredo do endpoint é armazenado criptografado. A fila aplica retries com backoff e IDs de job determinísticos para deduplicação. Isso não constitui garantia de entrega exatamente uma vez.

## Deploy

O [guia AWS](deploy/aws/README.md) concentra preparação, configuração, HTTPS, atualização e diagnóstico da EC2.

O ambiente de demonstração usa Internet → HTTP/HTTPS → Nginx → frontend/API → serviços internos Docker. Apenas Nginx recebe tráfego público da aplicação; PostgreSQL e Redis permanecem internos. Certificados, `deploy/aws/aws.env`, Certbot e suas rotinas locais de renovação não são provisionados pelos scripts do repositório.

## Segurança

- Senhas com hash Argon2, autenticação JWT e autorização RBAC.
- Escopo por organização e, no chat, também por usuário.
- CORS configurável, Helmet, validação de entrada e rate limiting.
- Chaves externas de eventos verificadas por hash; webhooks assinados, segredos criptografados e validação de URLs de destino.
- Segredos injetados por ambiente, request IDs e tratamento central de erros.
- HTTPS no Nginx da demo, API em loopback e PostgreSQL/Redis sem portas públicas.

## Decisões técnicas

- TypeScript no frontend e backend para contratos e manutenção.
- PostgreSQL relacional com Prisma para persistência e migrations.
- Redis para cache e infraestrutura assíncrona; BullMQ com workers separados da API.
- Provider mock para execução de domínios sem dependência externa.
- Docker Compose para organizar processos, dependências e volumes.
- EC2 única com serviços em containers para reduzir complexidade e custo da demonstração.

## Trade-offs e limitações do MVP

- EC2, PostgreSQL e Redis compartilham uma máquina; não há alta disponibilidade.
- A infraestrutura atende ao desafio/demo e não foi dimensionada para grande escala.
- A integração de domínio disponível opera apenas em modo mock.
- O IPv4 público pode mudar após parar/iniciar a EC2. O certificado associado ao IP precisa ser reemitido, e a configuração de host/URLs precisa acompanhar a mudança.
- Emissão e renovação HTTPS exigem configuração local de Certbot/timer/hook, fora do bootstrap versionado.
- O Nginx versionado depende dos certificados da demo, por isso o fluxo local sem TLS usa Vite com os serviços backend em Compose.
- Não há suíte automatizada de frontend; os testes backend utilizam dependências mockadas.

## Status do projeto

O MVP do desafio técnico está implementado e possui testes locais dos fluxos críticos. Este repositório reúne a documentação técnica e as instruções de execução e entrega.
