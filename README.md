# UnCooked

**Provision. Configure. Deploy.**

Exam-slot scheduling and course administration need more than an app binary. They need repeatable cloud capacity, consistent host setup, containerized services, a reverse proxy with TLS, and a path from git to staging and production that does not depend on one engineer’s laptop.

## Motivation

The idea comes from how fragile student-facing systems become when deployment is manual. SSH into a box, copy files by hand, restart services, hope nginx still points at the right port, then discover staging and production drifted apart. After a bad deploy, recovery can take hours: wrong env files, unbound containers, expired certs, or a host that was never rebuilt the same way twice.

UnCooked shortens that loop: declare AWS infrastructure, configure hosts and runtimes as code, run the stack in Docker (and toward Kubernetes), terminate traffic at nginx, and keep environments aligned through GitOps-style promotion so what lands in production is what was already observed on staging.

| | |
|---|---|
| **Course** | Devops |
| **Institution** | National University of Computer and Emerging Sciences (FAST NUCES), Lahore |
| **Department** | Software Engineering |
| **Project Advisor** | Duraiz Waseem |

## Group Members

| Name | Roll Number |
|------|-------------|
| Muhammad Ahmad Butt | 23L-3059 |
| Ali Ahmed | 23L-3067 |
| Muhammad Zain Tahir | 23L-3078 |

## Goals (Cloud & DevOps)

| Pillar | Objective |
|--------|-----------|
| **Provision** | Terraform on **AWS** (EC2 stage/production, EIPs, S3, security groups) |
| **Configure** | **Ansible**-driven host bootstrap (Docker, runners, nginx, TLS) |
| **Contain** | **Docker** / Compose for app, MongoDB, Redis, RabbitMQ, agent |
| **Orchestrate** | **Kubernetes** path for portable scheduling and scaling |
| **Edge** | Host **nginx** reverse proxy + Let’s Encrypt TLS (DuckDNS) |
| **GitOps** | Desired state from git via **Argo CD** and **Flux** |
| **Observe** | GitHub Actions self-hosted runners: build, test, staging -> production |

## Stack

| Layer | Tools |
|-------|--------|
| IaC | Terraform |
| Cloud | AWS (ap-south-1) |
| Config mgmt | Ansible |
| Containers | Docker, Docker Compose |
| Orchestration | Kubernetes |
| GitOps | Argo CD, Flux |
| Edge / TLS | nginx, Certbot |
| CI/CD | GitHub Actions (self-hosted: `web-staging`, `web-production`) |
| App | React frontend, Node backend, FastAPI exam-slot agent |

## License / academic use

Prepared for **Devops** at FAST NUCES Lahore. Lab assets, cloud accounts, and deployment screenshots are for authorized coursework and demonstration only.
