# Check-em — Jenkins CI/CD Setup Guide

## Spring Boot (PayFlow) & MySQL Backend + TanStack Start Frontend (Monorepo)

### Jenkins (build + deploy) + Docker + GHCR

---

# 1. Solution Overview

Monorepo pipeline — Jenkins checks out from GitHub, runs tests, builds Docker images, pushes to GHCR, and deploys with Docker Compose.

- **Backend** (`109_10_Check-em/backend/`): Spring Boot (Java 25) — PayFlow gateway
- **Frontend** (`109_10_Check-em/frontend/shopflow-payments-main/`): TanStack Start (React) — baked `VITE_API_BASE_URL`
- **Database**: MySQL (`payflow`) in Docker; H2 in-memory for local dev (`application.properties`)

> **Note:** Local dev uses H2 (`jdbc:h2:mem:payflow`). CI/CD and production use MySQL via `SPRING_DATASOURCE_*` env vars. `schema.sql` creates the `payflow` database and tables on MySQL first-start (`/docker-entrypoint-initdb.d/`).

---

# 2. Repo Layout (CI/CD files)

```
109_10_Check-em/
│
├── Jenkinsfile                          ← Jenkins Pipeline (build + deploy)
│
├── 109_10_Check-em/backend/
│      ├── Dockerfile
│      └── .dockerignore
│
├── 109_10_Check-em/frontend/shopflow-payments-main/
│      ├── Dockerfile
│      └── .dockerignore
│
├── docker-compose.yml
└── CI-CD-Steps.md
```

---

# 3. Jenkins Pipeline Stages

The root `Jenkinsfile` runs on every build:

```
Checkout (GitHub)
  → Backend Tests (MySQL container + ./mvnw clean verify)
  → Frontend Tests (npm ci + npm run build)
  → Login to GHCR
  → Build & Push checkem-api image
  → Build & Push checkem-ui image
  → Deploy (docker compose pull / down / up -d)
```

Images pushed:

- `ghcr.io/neueda-learning/checkem-api:latest` (+ git commit tag)
- `ghcr.io/neueda-learning/checkem-ui:latest` (+ git commit tag)

---

# 4. Jenkins Server Prerequisites

Install on the Jenkins host (Ubuntu/Debian example):

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker jenkins
sudo systemctl enable --now docker
```

Install Jenkins from https://www.jenkins.io/download/, then install these **plugins**:

| Plugin | Purpose |
|--------|---------|
| Pipeline | Declarative pipeline support |
| Git / GitHub | Source checkout from GitHub |
| Credentials Binding | GHCR login in pipeline |
| Docker Pipeline (optional) | Docker-aware steps |

Install these **tools** on the agent (Manage Jenkins → Tools, or system packages):

| Tool | Version |
|------|---------|
| JDK | 25 (Temurin) |
| Node.js | 22 |
| Docker | Latest (jenkins user in `docker` group) |
| Docker Compose | v2 plugin |

The pipeline agent must be **Linux** with shell access (`sh`). Windows-only agents are not supported by this Jenkinsfile.

---

# 5. Jenkins Job Setup

## 5.1 Create a Pipeline job

1. **New Item** → name: `checkem-pipeline` → **Pipeline**
2. Under **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: your GitHub repo URL
   - Credentials: GitHub PAT or SSH key (if private repo)
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
3. Save.

## 5.2 GHCR credentials

1. **Manage Jenkins → Credentials → System → Global credentials → Add Credentials**
2. Kind: **Username with password**
3. ID: `ghcr-credentials` (must match Jenkinsfile)
4. Username: your GitHub username
5. Password: GitHub PAT with `write:packages` (and `read:packages` for deploy pull)

## 5.3 GitHub webhook (automatic builds on push)

In your GitHub repo → **Settings → Webhooks → Add webhook**:

| Field | Value |
|-------|-------|
| Payload URL | `https://<jenkins-host>/github-webhook/` |
| Content type | `application/json` |
| Events | Just the push event |

In the Jenkins job, enable **Build when a change is pushed to GitHub** (or **GitHub hook trigger for GITScm polling**).

Alternatively, use **Poll SCM** (`H/5 * * * *`) if webhooks are not available.

---

# 6. Docker Architecture

```
      Docker Network
+---------------------------------------+
| checkem-mysql  (MySQL 8.4, payflow)   |
|        ^                              |
|        | JDBC (root/n3u3da!)          |
| checkem-api  (Spring Boot, 8082:8080) |
|        ^                              |
| checkem-ui  (Node SSR, 8081:80)       |
+---------------------------------------+
```

`backend/schema.sql` is mounted into MySQL's `docker-entrypoint-initdb.d` so the `payflow` schema is created on first start.

Deploy runs `docker compose` from the checked-out workspace so the relative `schema.sql` volume path resolves correctly.

### H2 → MySQL switch

| Environment | Database | How |
|-------------|----------|-----|
| Local dev | H2 in-memory | Default `application.properties` |
| Jenkins CI | MySQL 8.4 (ephemeral container) | `SPRING_DATASOURCE_*` in Jenkinsfile |
| Production | MySQL 8.4 | `SPRING_DATASOURCE_*` in `docker-compose.yml` |

---

# 7. Verification

```bash
# UI
open http://<server-ip>:8081

# API health (Swagger)
curl -I http://<server-ip>:8082/swagger-ui.html

# Sample API call
curl http://<server-ip>:8082/api/merchants/dashboard

# Containers
docker ps
docker compose logs -f api
```

---

# 8. End-to-End Flow

```
Developer → git push (main)
  → GitHub webhook → Jenkins (checkem-pipeline)
  → Test backend + frontend
  → docker build + push → GHCR
  → docker compose up -d
  → Running Application (MySQL + API + UI)
```

---

# 9. Quick Local Docker Test (before Jenkins)

From the repo root, after building images locally:

```bash
# Backend
cd 109_10_Check-em/backend
./mvnw clean package -DskipTests
docker build -t checkem-api:local .

# Frontend
cd ../frontend/shopflow-payments-main
docker build \
  --build-arg VITE_API_BASE_URL=http://localhost:8082 \
  --build-arg NITRO_PRESET=node-server \
  -t checkem-ui:local .

# Update docker-compose.yml image tags to checkem-api:local / checkem-ui:local, then from repo root:
docker compose up -d
```

---

# 10. Summary

- Monorepo: TanStack Start (React) frontend + Spring Boot (Java 25) backend.
- **Jenkins** checks out from GitHub, tests, builds, pushes, and deploys.
- Images: `checkem-api:latest`, `checkem-ui:latest` on GHCR.
- Docker Compose deployment: MySQL + API + UI.
- Local dev: H2; deployed: MySQL via env vars.
