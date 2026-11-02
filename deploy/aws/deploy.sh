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

docker compose --env-file deploy/aws/aws.env config --quiet
./deploy/aws/preflight.sh
docker compose --env-file deploy/aws/aws.env up -d --build --remove-orphans
docker compose --env-file deploy/aws/aws.env ps

printf 'DomínioHub implantado.\n'
