#!/usr/bin/env bash
set -euo pipefail

script_dir="$(
  cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1
  pwd -P
)"
project_root="$(
  cd -- "${script_dir}/../.." >/dev/null 2>&1
  pwd -P
)"
env_file="${project_root}/deploy/aws/aws.env"

if [[ ! -f "${env_file}" ]]; then
  printf 'Erro: arquivo de ambiente não encontrado: %s\n' "${env_file}" >&2
  printf 'Copie deploy/aws/aws.env.example para deploy/aws/aws.env e preencha os valores.\n' >&2
  exit 1
fi

cd "${project_root}"

docker compose --env-file deploy/aws/aws.env ps

if ! command -v curl >/dev/null 2>&1; then
  printf 'curl não está disponível; testes HTTP foram pulados.\n'
  exit 0
fi

api_failed=0
frontend_failed=0

if curl --fail --silent --output /dev/null http://127.0.0.1:3000/api/v1/health; then
  printf 'API: OK\n'
else
  printf 'API: FALHOU\n' >&2
  api_failed=1
fi

if curl --fail --silent --output /dev/null http://127.0.0.1/; then
  printf 'Frontend: OK\n'
else
  printf 'Frontend: FALHOU\n' >&2
  frontend_failed=1
fi

if ((api_failed || frontend_failed)); then
  exit 1
fi
