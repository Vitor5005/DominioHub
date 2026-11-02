#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd -P)"
project_root="$(cd -- "${script_dir}/../.." >/dev/null 2>&1 && pwd -P)"
env_file="${project_root}/deploy/aws/aws.env"
compose_file="${project_root}/docker-compose.yml"

cd "${project_root}"

for command_name in docker git; do
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    printf 'Erro: %s não está disponível no PATH.\n' "${command_name}" >&2
    exit 1
  fi
done

if ! docker compose version >/dev/null 2>&1; then
  printf 'Erro: Docker Compose plugin não está disponível.\n' >&2
  exit 1
fi

if [[ ! -f "${env_file}" ]]; then
  printf 'Erro: deploy/aws/aws.env não foi encontrado.\n' >&2
  exit 1
fi

if [[ ! -f "${compose_file}" ]]; then
  printf 'Erro: docker-compose.yml não foi encontrado na raiz do projeto.\n' >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  printf 'Erro: o usuário atual não acessa o daemon Docker. Faça logout/login na sessão SSH ou verifique o serviço Docker.\n' >&2
  exit 1
fi

architecture="$(uname -m)"
printf 'Arquitetura: %s\n' "${architecture}"
if [[ "${architecture}" != "x86_64" ]]; then
  printf 'Erro: este deploy requer arquitetura x86_64.\n' >&2
  exit 1
fi

if command -v free >/dev/null 2>&1; then
  printf 'Memória (MB):\n'
  free -m
  memory_total_mb="$(free -m | awk '/^Mem:/ {print $2}')"
  if [[ "${memory_total_mb}" =~ ^[0-9]+$ ]] && (( memory_total_mb < 1500 )); then
    printf 'Aviso: memória total abaixo de 1500 MB.\n' >&2
  fi
else
  printf 'Aviso: free não está disponível; não foi possível verificar a memória.\n' >&2
fi

printf 'Espaço em disco:\n'
df -h /
available_kb="$(df -Pk / | awk 'NR == 2 {print $4}')"
if [[ ! "${available_kb}" =~ ^[0-9]+$ ]]; then
  printf 'Erro: não foi possível determinar o espaço livre em disco.\n' >&2
  exit 1
fi

if (( available_kb < 5 * 1024 * 1024 )); then
  printf 'Erro: menos de 5 GiB livres no disco.\n' >&2
  exit 1
fi

if grep -q 'CHANGE_ME_PUBLIC_HOST' "${env_file}" || grep -q 'CHANGE_ME' "${env_file}"; then
  printf 'Erro: deploy/aws/aws.env ainda contém placeholders CHANGE_ME.\n' >&2
  exit 1
fi

docker compose --env-file deploy/aws/aws.env config --quiet

is_compose_service_running() {
  local service_name="$1"
  local container_id
  local running

  container_id="$(
    docker compose --env-file deploy/aws/aws.env \
      ps -q "${service_name}"
  )"

  if [[ -z "${container_id}" ]]; then
    return 1
  fi

  running="$(
    docker inspect -f '{{.State.Running}}' \
      "${container_id}" 2>/dev/null || true
  )"

  [[ "${running}" == "true" ]]
}

if command -v ss >/dev/null 2>&1; then
  if ss -ltnH "sport = :80" | grep -q .; then
    if is_compose_service_running frontend; then
      printf 'Porta 80 já utilizada pelo frontend atual do DomínioHub; redeploy permitido.\n'
    else
      printf 'Erro: porta 80 está ocupada por outro processo.\n' >&2
      exit 1
    fi
  fi

  if ss -ltnH "sport = :3000" | grep -q .; then
    if is_compose_service_running backend-api; then
      printf 'Porta 3000 já utilizada pelo backend atual do DomínioHub; redeploy permitido.\n'
    else
      printf 'Erro: porta 3000 está ocupada por outro processo.\n' >&2
      exit 1
    fi
  fi
else
  printf 'Aviso: ss não está disponível; verificação de portas foi pulada.\n' >&2
fi

printf 'Preflight concluído.\n'
