#!/usr/bin/env bash
set -euo pipefail

COMPOSE_VERSION="v5.6.1"

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
  printf 'Instalando Docker Compose %s...\n' "${COMPOSE_VERSION}"

  if ! command -v curl >/dev/null 2>&1; then
    printf 'Instalando curl...\n'
    sudo yum install -y curl
  fi

  temp_dir="$(mktemp -d)"
  trap 'rm -rf "${temp_dir}"' EXIT

  compose_asset="docker-compose-linux-x86_64"
  compose_url="https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/${compose_asset}"
  compose_binary="${temp_dir}/${compose_asset}"
  compose_checksum="${compose_binary}.sha256"

  curl --fail --location --silent --show-error \
    --output "${compose_binary}" \
    "${compose_url}"
  curl --fail --location --silent --show-error \
    --output "${compose_checksum}" \
    "${compose_url}.sha256"

  expected_checksum="$(awk '{print $1}' "${compose_checksum}")"
  actual_checksum="$(sha256sum "${compose_binary}" | awk '{print $1}')"

  if [[ ! "${expected_checksum}" =~ ^[[:xdigit:]]{64}$ ]] || \
    [[ "${actual_checksum}" != "${expected_checksum}" ]]; then
    printf 'Erro: a verificação SHA-256 do Docker Compose falhou.\n' >&2
    exit 1
  fi

  sudo mkdir -p /usr/local/lib/docker/cli-plugins
  sudo install -m 0755 \
    "${compose_binary}" \
    /usr/local/lib/docker/cli-plugins/docker-compose

  if ! docker compose version >/dev/null 2>&1; then
    printf 'Erro: Docker Compose foi instalado, mas o comando "docker compose" não está disponível.\n' >&2
    exit 1
  fi

  printf 'Docker Compose instalado com sucesso.\n'
  docker compose version
fi

if ! docker info >/dev/null 2>&1; then
  printf 'Docker foi instalado, mas o usuário atual ainda não acessa o daemon.\n'
  printf 'Faça logout da sessão SSH e conecte novamente para aplicar o grupo docker.\n'
fi

printf 'Servidor preparado. Clone o repositório DomínioHub e configure deploy/aws/aws.env.\n'
