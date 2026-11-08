#!/usr/bin/env bash
# Write GitHub Actions secret contents to temp files and export paths via GITHUB_ENV.
# Expects BACKEND_ENV_CONTENT / FRONTEND_ENV_CONTENT / AGENT_ENV_CONTENT (and optional *_STAGING_CONTENT).
set -euo pipefail

if [ -z "${GITHUB_ENV:-}" ]; then
  echo "GITHUB_ENV is not set — run this from a GitHub Actions step." >&2
  exit 1
fi

TMP="${RUNNER_TEMP:-/tmp}/gha-ci-env"
mkdir -p "${TMP}"

write_content() {
  local content="$1"
  local dest="$2"
  local label="$3"
  if [ -z "${content}" ]; then
    echo "Missing secret ${label}." >&2
    exit 1
  fi
  printf '%s\n' "${content}" > "${dest}"
  chmod 600 "${dest}"
}

write_content "${BACKEND_ENV_CONTENT:-}" "${TMP}/backend.env" "BACKEND_ENV"
write_content "${FRONTEND_ENV_CONTENT:-}" "${TMP}/frontend.env" "FRONTEND_ENV"
write_content "${AGENT_ENV_CONTENT:-}" "${TMP}/agent.env" "AGENT_ENV"

{
  echo "BACKEND_ENV=${TMP}/backend.env"
  echo "FRONTEND_ENV=${TMP}/frontend.env"
  echo "AGENT_ENV=${TMP}/agent.env"
} >> "${GITHUB_ENV}"

if [ -n "${BACKEND_ENV_STAGING_CONTENT:-}" ]; then
  write_content "${BACKEND_ENV_STAGING_CONTENT}" "${TMP}/backend.staging.env" "BACKEND_ENV_STAGING"
  echo "BACKEND_ENV_STAGING=${TMP}/backend.staging.env" >> "${GITHUB_ENV}"
fi
if [ -n "${FRONTEND_ENV_STAGING_CONTENT:-}" ]; then
  write_content "${FRONTEND_ENV_STAGING_CONTENT}" "${TMP}/frontend.staging.env" "FRONTEND_ENV_STAGING"
  echo "FRONTEND_ENV_STAGING=${TMP}/frontend.staging.env" >> "${GITHUB_ENV}"
fi
if [ -n "${AGENT_ENV_STAGING_CONTENT:-}" ]; then
  write_content "${AGENT_ENV_STAGING_CONTENT}" "${TMP}/agent.staging.env" "AGENT_ENV_STAGING"
  echo "AGENT_ENV_STAGING=${TMP}/agent.staging.env" >> "${GITHUB_ENV}"
fi

echo "Materialized env files under ${TMP}"
