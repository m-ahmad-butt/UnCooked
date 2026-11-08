#!/usr/bin/env bash
# Run once on the EC2 host (SSH as ubuntu):
#   sudo bash scripts/ci/install-runner-sudoers.sh [runner-user]
# Default user matches a typical GitHub Actions self-hosted install as ubuntu.
set -euo pipefail

RUNNER_USER="${1:-${RUNNER_USER:-ubuntu}}"
SUDOERS_FILE=/etc/sudoers.d/github-runner-hackathon

cat >"${SUDOERS_FILE}" <<EOF
${RUNNER_USER} ALL=(ALL) NOPASSWD: /usr/bin/true, /bin/true, /usr/bin/chown, /usr/bin/mkdir, /usr/bin/rsync, /usr/bin/docker, /usr/bin/docker-compose, /usr/local/bin/docker-compose, /usr/bin/systemctl, /usr/bin/apt-get, /usr/bin/nginx, /usr/sbin/nginx, /usr/bin/certbot, /usr/bin/ln, /usr/bin/cp, /usr/bin/tee, /usr/bin/chmod, /usr/bin/bash, /bin/bash
EOF

chmod 440 "${SUDOERS_FILE}"
visudo -cf "${SUDOERS_FILE}"
usermod -aG docker "${RUNNER_USER}" || true

echo "Installed ${SUDOERS_FILE} for user ${RUNNER_USER}"
