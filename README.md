# UnCooked

Exam-slot microservices app for FAST NUCES DevOps final project (Fall 2026, BSE 7B).  
DevSecOps CI (stages 1–10) on every push/PR; CD (11–12) on merge to `main`.

## Live link

http://uncooked-alb-1680261338.ap-south-1.elb.amazonaws.com

## Group

| Name | Roll |
|------|------|
| Muhammad Ahmad Butt | 23L-3059 |
| Ali Ahmed | 23L-3067 |
| Saim Arif Khan | 23L-3071 |
| Muhammad Zain Tahir | 23L-3078 |
| Abd Ur Rehman | 23L-3105 |

Branching: feature branches → PR (group reviewer) → protected `main` (CI jobs 02–10 required). No direct pushes to `main`.

## Architecture (short)

```text
Internet → ALB (public 2 AZ)
              → App ASG (private 2 AZ): frontend / backend / agent
              → Data EC2 (private): Mongo, Redis, RabbitMQ
Outbound from private → NAT → IGW
```

Full diagram and CIDRs: [`docs/architecture.md`](docs/architecture.md).  
Phase 02 runbook: [`docs/PHASE02.md`](docs/PHASE02.md).  
Security / accepted findings: [`SECURITY.md`](SECURITY.md).

## Local run

```bash
cd web
docker compose up --build
```

| Service | Folder | Health |
|---------|--------|--------|
| Frontend | `web/frontend` | `/` on `:8080` |
| Backend | `web/backend` | API `:3001` |
| Agent | `web/agent` | `:8002/health` |
| Data | Compose data services | Mongo / Redis / Rabbit |

Production on AWS uses `web/docker-compose.app.yml` (app) + `web/docker-compose.data.yml` (data).

## Shell scripts (pipeline)

| Script | Role |
|--------|------|
| `web/scripts/cd/deploy.sh` | Rolling SSM deploy (`set -euo pipefail`, ShellCheck in CI) |
| `web/scripts/cd/smoke.sh` | Stage 12 smoke against ALB |
| `web/scripts/cd/rollback.sh` | Auto/manual rollback to previous image tag |

## Deploy from scratch

1. **Bootstrap remote state** (once): `cd terraform/bootstrap && terraform init && terraform apply`
2. **Main stack**: `cd terraform && terraform init -migrate-state && terraform apply`  
   Optional: set `alarm_email` / `budget_email` in `terraform.tfvars` (see example).
3. **GitHub**: secret `AWS_ROLE_ARN`; vars `AWS_REGION`, `ALB_URL`, `ASG_NAME`, `DATA_HOST`, `ECR_REGISTRY` from `terraform output` / `docs/github-cd-vars.example.txt`.
4. **JWT in SSM** (SecureString): `/uncooked/app/jwt_private_key`, `/uncooked/app/jwt_public_key`.
5. **Data node**: bootstrap Docker + `docker-compose.data.yml` via SSM helper or Ansible (`docs/PHASE02.md`).
6. **App**: merge to `main` (CD pushes SHA + semver tags to ECR, rolling deploy, smoke). Manual: Actions → `cd` → Run workflow → `deploy` / `rollback`.

App instances self-heal on replace (launch template installs Docker, pulls last CD tag from SSM).

## Tear down

```bash
cd terraform && terraform destroy
```

Leave `terraform/bootstrap` if you still need the S3/DynamoDB state backend.  
Set an AWS Budget alert (`budget_email` in tfvars). Scale ASG desired to 0 when not demoing; keep the stack until grading is done.

## Evidence

Screenshots: `images/final_ss/` (and Phase 01 under `images/P0/`).  
Findings + post-incident: `docs/findings.md`, `docs/post-incident.md`.  
Submission: `UnCooked.pdf` and `UnCooked.docx` (BSE 7B).
