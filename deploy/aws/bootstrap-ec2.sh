#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]]; then
  printf 'Erro: este script exige Linux/Amazon Linux 2023.\n' >&2
  exit 1
fi

if [[ ! -f /etc/os-release ]]; then
  printf 'Erro: não foi possível verificar a distribuição Linux.\n' >&2
  exit 1
fi

# shellcheck disable=SC1091
source /etc/os-release

if [[ "${ID:-}" != "amzn" || "${VERSION_ID:-}" != "2023" ]]; then
  printf 'Erro: este script é destinado ao Amazon Linux 2023.\n' >&2
  exit 1
fi

printf 'Atualizando o sistema...\n'
sudo yum update -y

if ! command -v git >/dev/null 2>&1; then
  printf 'Instalando Git...\n'
  sudo yum install -y git
fi

if ! command -v docker >/dev/null 2>&1; then
  printf 'Instalando Docker...\n'
  sudo yum install -y docker
fi

sudo systemctl enable docker
sudo systemctl start docker

docker_user="${SUDO_USER:-${USER:-}}"
if [[ -z "${docker_user}" || "${docker_user}" == "root" ]]; then
  printf 'Erro: execute como o usuário não-root que utilizará Docker.\n' >&2
  exit 1
fi

sudo usermod -aG docker "${docker_user}"

if ! docker compose version >/dev/null 2>&1; then
  printf 'Instalando o plugin Docker Compose...\n'
  sudo yum install -y docker-compose-plugin
fi

if ! docker compose version >/dev/null 2>&1; then
  printf 'Erro: Docker Compose plugin não está disponível. Instale-o antes de continuar.\n' >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  printf 'Docker foi instalado, mas o usuário atual ainda não acessa o daemon.\n'
  printf 'Faça logout da sessão SSH e conecte novamente para aplicar o grupo docker.\n'
fi

printf 'Servidor preparado. Clone o repositório DomínioHub e configure deploy/aws/aws.env.\n'
