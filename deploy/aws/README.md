# Deploy na AWS

## Arquitetura

```text
Internet
  ↓
EC2 única
  ↓
Docker Compose
  ├─ Nginx + React
  ├─ backend-api
  ├─ event-worker
  ├─ webhook-worker
  ├─ PostgreSQL
  └─ Redis
```

O Nginx é o único ponto de entrada público: `/` entrega o frontend React e
`/api/*` é encaminhado para `backend-api:3000`. A API não é exposta
publicamente na porta 3000. PostgreSQL e Redis ficam acessíveis somente pela
rede Docker, e os workers não possuem portas públicas; eles não precisam de
tráfego direto da Internet.

## EC2 planejada

O plano de MVP/demo usa uma única EC2 `t3.small`, arquitetura `x86_64`, com
volume `gp3` planejado de 20 GB. A elegibilidade, a disponibilidade e o custo
real devem ser confirmados manualmente no Console AWS antes da criação. A Fase
35 não cria nenhuma EC2.

## Security Group

| Regra | Porta/protocolo | Origem |
| --- | --- | --- |
| HTTP | `80/TCP` | `0.0.0.0/0` |
| SSH | `22/TCP` | IP público atual do usuário, em `/32` |

Nunca exponha `22/TCP` para `0.0.0.0/0`. Também não exponha publicamente a API
na porta 3000, PostgreSQL na 5432 ou Redis na 6379.

## HTTPS

O acesso planejado nesta etapa é HTTP pela porta 80. HTTPS na porta 443,
domínio e certificado serão configurados posteriormente; não configure HTTPS
na Fase 35.

## Persistência

O Compose usa os volumes Docker `postgres_data` e `redis_data`, armazenados
fisicamente no disco EBS da EC2. Destruir a EC2 com o volume EBS pode causar
perda de dados. Não execute `docker compose down -v` no servidor. Os scripts
existentes não removem volumes; uma estratégia de backups será tratada depois.

## PostgreSQL e Redis

PostgreSQL e Redis rodam como containers Docker na EC2 para reduzir custo e
complexidade no MVP/demo. Não há RDS nem ElastiCache nesta topologia.

## Controle de custos

Não são usados: RDS, ElastiCache, ALB, NLB, NAT Gateway, ECS, Fargate, EKS,
múltiplas EC2, ECR obrigatório ou autoscaling.

Antes da Fase 36, confirme manualmente no Console AWS o Free Tier/Free Plan,
créditos disponíveis e válidos, elegibilidade da instância e a estimativa de
custo. Não assuma preços fixos nem gratuidade permanente.

## Endereço público

Nenhum Elastic IP é criado. Inicialmente, use o IPv4 público ou o DNS público
da EC2; um endereço estável e domínio serão definidos depois. Após criar a
EC2, preencha `deploy/aws/aws.env` e substitua os valores
`CHANGE_ME_PUBLIC_HOST`.

## Configuração do ambiente

No repositório clonado na EC2, crie o arquivo local de ambiente:

```bash
cp deploy/aws/aws.env.example deploy/aws/aws.env
```

Preencha o host público, senha do PostgreSQL, segredo JWT, chave de criptografia
de webhooks, chave do Gemini e os demais segredos. `aws.env` não deve ser
commitado e não deve conter valores reais no repositório.

## Dados de demonstração

Na AWS, o padrão é `DEMO_SEED_ENABLED=false`. Para carregar dados de demonstração
manualmente, execute `./deploy/aws/seed-demo.sh`; o seed não é automático a cada
deploy.

## Comandos operacionais

```bash
./deploy/aws/deploy.sh
./deploy/aws/status.sh
./deploy/aws/logs.sh
./deploy/aws/logs.sh redis
./deploy/aws/seed-demo.sh
```

## Deploy real — Fase 36

Esta etapa prepara uma única EC2 manualmente pelo Console AWS; ela não cria
recursos AWS, não usa credenciais AWS e não executa AWS CLI.

### Criar a instância

No Console AWS, crie uma instância com o nome `dominiohub`, AMI **Amazon Linux
2023**, arquitetura **x86_64**, volume raiz **20 GB gp3** e tipo `t3.small`
somente se ele for elegível e atender às condições/custos aplicáveis à conta.
Não escolha automaticamente outra instância paga. Use uma VPC e subnet com
acesso à Internet e associe um IP público. Esse IP pode mudar ao parar/iniciar
a instância; não configure Elastic IP nesta fase.

Crie ou selecione uma Key Pair e guarde o arquivo `.pem` em local seguro, fora
do repositório. No Security Group, mantenha a saída normal para a Internet e
crie somente estas entradas de entrada:

| Regra | Porta/protocolo | Origem |
| --- | --- | --- |
| HTTP | `80/TCP` | `0.0.0.0/0` |
| SSH | `22/TCP` | `MEU_IP/32` |

Nunca exponha `3000`, `5432`, `6379` ou SSH para a Internet pública.

Conecte-se com:

```bash
ssh -i caminho/chave.pem ec2-user@ENDERECO_PUBLICO
```

### Preparar a EC2 e obter o código

O Docker Engine é instalado pelos pacotes do Amazon Linux. Caso `docker compose`
ainda não esteja disponível, o bootstrap instala o plugin oficial do projeto
[`docker/compose`](https://github.com/docker/compose), na versão fixa `v5.6.1`
definida no script, e valida a integridade do download com SHA-256.

Clone o repositório sem incluir token/PAT na URL e sem fixar branch no comando:

```bash
git clone <URL_DO_REPOSITORIO>
cd DominioHub
```

Caso permissões de execução não tenham sido preservadas, ajuste-as. Em seguida,
execute o bootstrap:

```bash
chmod +x deploy/aws/*.sh
./deploy/aws/bootstrap-ec2.sh
```

Se o script solicitar, saia e reconecte a sessão SSH para que o grupo Docker
seja aplicado. Confirme a preparação com:

```bash
docker info
docker compose version
```

### Configurar o ambiente e publicar

Crie o arquivo local e substitua todos os placeholders, sem registrar esse
arquivo no Git:

```bash
cp deploy/aws/aws.env.example deploy/aws/aws.env
```

Configure o host público conceitualmente assim:

```dotenv
FRONTEND_URL=http://EC2_PUBLIC_HOST
API_PUBLIC_URL=http://EC2_PUBLIC_HOST
CORS_ALLOWED_ORIGINS=http://EC2_PUBLIC_HOST
VITE_API_URL=http://EC2_PUBLIC_HOST/api/v1
BACKEND_PORT=3000
FRONTEND_PORT=80
```

Defina valores fortes e exclusivos para `POSTGRES_PASSWORD`, `JWT_SECRET` e
`WEBHOOK_SECRET_ENCRYPTION_KEY`; por exemplo, gere-os localmente com
`openssl rand -hex 32` ou `openssl rand -base64 48`. Nunca publique os valores,
peça-os ao Codex ou os imprima em logs. Informe também uma chave Gemini real em
`GEMINI_API_KEY`.

Antes de iniciar containers, execute a verificação e depois o deploy:

```bash
./deploy/aws/preflight.sh
./deploy/aws/deploy.sh
./deploy/aws/status.sh
```

Abra `http://EC2_PUBLIC_HOST` no navegador. A API deve ser acessada somente
por `http://EC2_PUBLIC_HOST/api/v1` através do Nginx; não exponha nem use
publicamente `:3000`. Teste também o login. Após a saúde do ambiente, dados de demonstração são
opcionais e manuais:

```bash
./deploy/aws/seed-demo.sh
```

Para atualizar o código, revise a alteração, execute `git pull` e repita o
deploy manualmente:

```bash
git pull
./deploy/aws/deploy.sh
```

Logs operacionais:

```bash
./deploy/aws/logs.sh
./deploy/aws/logs.sh backend-api
./deploy/aws/logs.sh event-worker
./deploy/aws/logs.sh webhook-worker
./deploy/aws/logs.sh postgres
./deploy/aws/logs.sh redis
```

### Custos e limites desta fase

Confira continuamente Free Tier / Free Plan, créditos, a EC2 em execução, o
volume EBS, o IPv4 público, custos e elegibilidade no Console AWS. Parar a
EC2 reduz custos de computação, mas volumes EBS e outros recursos associados
podem continuar cobrando. Nunca execute `docker compose down -v`, pois isso
remove os volumes de dados.

Ficam fora desta fase: domínio próprio, HTTPS/certificado, Elastic IP, backup
automatizado, RDS, ElastiCache, balanceador, autoscaling e qualquer arquitetura
multi-instância.
