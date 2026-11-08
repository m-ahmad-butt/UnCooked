# AWS — manual bootstrap (both servers)

Host nginx / TLS is done by CI `init:*` — not here.

| Item | Staging | Production  |
|------|----------------|--------------------|
| EIP | `13.206.228.118` | `3.6.107.156` |
| Deploy dir | `/opt/web-comp-stage` | `/opt/web-comp` |
| Runner label | `web-staging` | `web-production` |
| Domain | `web-comp-stage.duckdns.org` | `web-comp.duckdns.org` |
| SSH key | `terraform/server-web.pem` | same |

```powershell
.\ssh.ps1    # staging
.\ssh-p.ps1          # production
```

---

## 0) Terraform (once)

```bash
cd terraform && terraform init && terraform apply
```

---

## 1) System + Docker (both)

```bash
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git rsync ufw
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"

sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

Log out / SSH back in for docker group.

---

## 2) Deploy dir (stage / prod)

**Staging**

```bash
sudo mkdir -p /opt/web-comp-stage
```

**Production**

```bash
sudo mkdir -p /opt/web-comp
```

---

## 3) GitHub Actions self-hosted runner (both)

Create a runner in the repo: **Settings → Actions → Runners → New self-hosted runner**.

Use the Linux / x64 install commands GitHub shows, then configure labels:

| | Staging | Production |
|--|---------|------------|
| Labels | `web-staging` | `web-production` |
| Deploy dir owner | `ubuntu` (or the user that runs the runner) | same |

```bash
# after ./config.sh --url https://github.com/m-ahmad-butt/UnCooked --token <TOKEN>
# add label when prompted, or:
./config.sh --url https://github.com/m-ahmad-butt/UnCooked --token <TOKEN> --labels web-staging
# production host:
./config.sh --url https://github.com/m-ahmad-butt/UnCooked --token <TOKEN> --labels web-production

sudo ./svc.sh install
sudo ./svc.sh start
```

```bash
sudo chown -R ubuntu:ubuntu /opt/web-comp-stage   # staging
sudo chown -R ubuntu:ubuntu /opt/web-comp         # production
```

Repo secrets (Settings → Secrets and variables → Actions) — paste former GitLab **File** variable contents:

| Secret | Required |
|--------|----------|
| `BACKEND_ENV` | yes |
| `FRONTEND_ENV` | yes |
| `AGENT_ENV` | yes |
| `BACKEND_ENV_STAGING` | optional |
| `FRONTEND_ENV_STAGING` | optional |
| `AGENT_ENV_STAGING` | optional |
| `CERTBOT_EMAIL` | for `init-*` |
| `DUCKDNS_TOKEN` | for `init-*` |

Run jobs from **Actions → CI → Run workflow** (pick `action`).

DuckDNS: `web-comp-stage` → `3.108.49.218`, `web-comp` → `3.7.93.239`.

---

## 4) After first deploy — passwordless sudo for init (once per server)

Run this **once** after `deploy-*`, then run `init-staging` / `init-production` in Actions:

**Staging**

```bash
sudo bash /opt/web-comp-stage/scripts/ci/install-runner-sudoers.sh
```

**Production**

```bash
sudo bash /opt/web-comp/scripts/ci/install-runner-sudoers.sh
```

---

