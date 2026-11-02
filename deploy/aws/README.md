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

O Nginx é o único ponto de entrada público, nas portas 80 e 443: `/` entrega
o frontend React e `/api/*` é encaminhado para `backend-api:3000`. A API é
publicada no host somente em `127.0.0.1:${BACKEND_PORT}`. PostgreSQL e Redis
ficam acessíveis somente pela rede Docker, e os workers não possuem portas
públicas. API e workers reutilizam a mesma imagem backend.

## EC2 planejada

O plano de MVP/demo usa uma única EC2 `t3.small`, arquitetura `x86_64`, com
volume `gp3` planejado de 20 GB. A elegibilidade, a disponibilidade e o custo
real devem ser confirmados manualmente no Console AWS antes da criação. A Fase
35 não cria nenhuma EC2.

## Security Group

| Regra | Porta/protocolo | Origem |
| --- | --- | --- |
| HTTP | `80/TCP` | `0.0.0.0/0` |
| HTTPS | `443/TCP` | `0.0.0.0/0` |
| SSH | `22/TCP` | IP público atual do usuário, em `/32` |

Nunca exponha `22/TCP` para `0.0.0.0/0`. Também não exponha publicamente a API
na porta 3000, PostgreSQL na 5432 ou Redis na 6379.

## HTTPS e certificados

A configuração atual usa HTTPS com certificado Let's Encrypt para o IPv4
do ambiente demo. HTTP redireciona para HTTPS, exceto
`/.well-known/acme-challenge/`, que permanece acessível para emissão e renovação.
O Compose publica `${FRONTEND_PORT}:80` e `${HTTPS_PORT:-443}:443`.

O diretório ACME no host é `deploy/certbot/www`, montado em `/var/www/certbot`
no frontend. `/etc/letsencrypt` também é montado em modo de leitura. O Nginx
espera `fullchain.pem` e `privkey.pem` em `/etc/letsencrypt/live/<IPv4>/`;
o arquivo versionado referencia especificamente o IPv4 `3.17.25.68`.
Uma instalação em outro endereço precisa da configuração e do certificado
correspondentes antes de iniciar esse Nginx. Em uma máquina nova, o frontend
não inicia com essa configuração enquanto os arquivos de certificado não
estiverem provisionados nos caminhos esperados.

A instalação do Certbot, a emissão inicial e a configuração de renovação são
passos administrativos na EC2; `bootstrap-ec2.sh` e `deploy.sh` não os executam.
Para renovação automática, o ambiente local da EC2 precisa de um timer systemd
que execute o Certbot e de um hook de sucesso que recarregue o Nginx do
container frontend. As unidades, o agendamento e o hook não estão versionados
neste repositório; confirme seus nomes e funcionamento na EC2, sem presumir que
o bootstrap os tenha instalado. O hook deve recarregar o Nginx somente após
uma renovação bem-sucedida.

Os certificados, as chaves privadas e `deploy/aws/aws.env` permanecem locais
na EC2 e não devem ser versionados. Se o IPv4 público mudar, o certificado do
IP antigo não cobre o novo: é necessário reemitir o certificado e atualizar
as referências do Nginx e as URLs do ambiente, incluindo o build do frontend.

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

Antes de criar ou manter a instância, confirme no Console AWS o Free Tier/Free Plan,
créditos disponíveis e válidos, elegibilidade da instância e a estimativa de
custo. Não assuma preços fixos nem gratuidade permanente.

## Endereço público

Nenhum Elastic IP é criado pelos scripts. O demo atual usa IPv4 público e
certificado associado ao IP. Esse endereço pode mudar ao parar/iniciar a EC2.
Após criar a instância, preencha `deploy/aws/aws.env` e substitua
`CHANGE_ME_PUBLIC_HOST` pelo endereço coberto pelo certificado.

## Configuração do ambiente

No repositório clonado na EC2, crie o arquivo local de ambiente:

```bash
cp deploy/aws/aws.env.example deploy/aws/aws.env
```

Preencha o host público, senha do PostgreSQL e a senha correspondente em
`DATABASE_URL`, segredo JWT, chave de criptografia de webhooks, chave do Gemini
e os demais segredos. Para o ambiente HTTPS, ajuste as URLs de frontend/API,
CORS e `VITE_API_URL` para `https://<host>`. `VITE_API_URL` é incorporada no build.
O exemplo de ambiente é um modelo e não substitui esses ajustes. `aws.env`
não deve ser commitado.

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

A criação e configuração da EC2 são manuais pelo Console AWS. Os scripts
preparam o servidor e executam o Compose; não criam recursos na conta AWS nem
solicitam credenciais AWS.

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
| HTTPS | `443/TCP` | `0.0.0.0/0` |
| SSH | `22/TCP` | `MEU_IP/32` |

Não exponha `3000`, `5432` ou `6379` à Internet. Restrinja SSH a `MEU_IP/32`,
nunca a `0.0.0.0/0`.

Conecte-se com:

```bash
ssh -i caminho/chave.pem ec2-user@ENDERECO_PUBLICO
```

### Preparar a EC2 e obter o código

O Docker Engine é instalado pelos pacotes do Amazon Linux. Caso `docker compose`
ainda não esteja disponível, o bootstrap instala o plugin oficial do projeto
[`docker/compose`](https://github.com/docker/compose), na versão fixa `v5.6.1`
definida no script, e valida a integridade do download com SHA-256.

O alvo é Amazon Linux 2023 x86_64, com o usuário `ec2-user`. O bootstrap
atualiza o sistema, instala Git/Docker se ausentes, inicia Docker e associa
o usuário ao grupo Docker. Ele não clona o repositório. Se Git ainda não
estiver disponível, envie o projeto/script à EC2 para executar o bootstrap.

Docker Buildx deve estar disponível para os builds de imagem. O bootstrap
não o instala nem o verifica: sua instalação/configuração, se necessária,
continua manual na EC2. Certbot, certificados, timer systemd e hook de
renovação também dependem da preparação local descrita acima.

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
docker buildx version
```

### Configurar o ambiente e publicar

Crie o arquivo local e substitua todos os placeholders, sem registrar esse
arquivo no Git:

```bash
cp deploy/aws/aws.env.example deploy/aws/aws.env
```

Configure o host público conceitualmente assim:

```dotenv
FRONTEND_URL=https://EC2_PUBLIC_HOST
API_PUBLIC_URL=https://EC2_PUBLIC_HOST
CORS_ALLOWED_ORIGINS=https://EC2_PUBLIC_HOST
VITE_API_URL=https://EC2_PUBLIC_HOST/api/v1
BACKEND_PORT=3000
FRONTEND_PORT=80
HTTPS_PORT=443
```

Defina valores fortes e exclusivos para os segredos. Para senha PostgreSQL e
JWT, pode gerar valores com `openssl rand -hex 32`. A chave de criptografia
de webhooks exige exatamente 32 bytes codificados em base64: use
`openssl rand -base64 32` para `WEBHOOK_SECRET_ENCRYPTION_KEY`. Preencha
`GEMINI_API_KEY` com sua chave real. Não publique esses valores nem os imprima
em logs.

Antes de iniciar containers, execute a verificação e depois o deploy:

```bash
./deploy/aws/preflight.sh
./deploy/aws/deploy.sh
./deploy/aws/status.sh
```

O preflight verifica ferramentas, daemon Docker, ambiente sem placeholders,
arquitetura, memória, disco, configuração Compose e ocupação das portas 80/3000.
Ocupação pelos serviços do Compose atual é aceita para redeploy. Ele não
valida certificados, Buildx ou a porta 443. O deploy executa o preflight antes
de buildar/subir os serviços; migrations precedem o seed condicional, a API e
os workers. Os volumes permanecem preservados.

O status verifica a API em `http://127.0.0.1:3000/api/v1/health` e o frontend
em `http://127.0.0.1/` se houver curl. O teste do frontend aceita o redirect
HTTP e não valida o certificado TLS; confira HTTPS também pelo navegador.

Abra `https://EC2_PUBLIC_HOST` no navegador. A API deve ser acessada somente
por `https://EC2_PUBLIC_HOST/api/v1` através do Nginx; não exponha nem use
publicamente `:3000`. Teste também o login. Após a saúde do ambiente, dados de demonstração são
opcionais e manuais:

```bash
./deploy/aws/seed-demo.sh
```

## Atualização da aplicação

Na branch de deploy, atualize o código e execute:

```bash
git pull origin deploy
./deploy/aws/preflight.sh
./deploy/aws/deploy.sh
./deploy/aws/status.sh
```

O arquivo `deploy/aws/aws.env` e os certificados permanecem locais na EC2 e
não devem ser versionados. Deploy não executa `git pull` automaticamente,
não remove volumes e não emite nem renova certificados.

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

Permanecem fora desta arquitetura: domínio próprio, Elastic IP automatizado,
backup automatizado, RDS, ElastiCache, balanceador, autoscaling e múltiplas
instâncias. HTTPS é parte da configuração atual; seu provisionamento e a
automação de renovação pertencem à configuração local da EC2.
