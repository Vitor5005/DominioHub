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
  printf 'curl não está disponível; teste HTTP do healthcheck foi pulado.\n'
  exit 0
fi

if curl --fail --silent --show-error http://127.0.0.1:3000/api/v1/health; then
  printf '\nHealthcheck local da API: OK.\n'
else
  printf '\nHealthcheck local da API falhou.\n' >&2
  exit 1
fi
