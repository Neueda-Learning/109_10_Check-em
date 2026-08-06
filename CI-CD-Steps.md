# Check-em — End-to-End CI/CD Setup Guide

## Spring Boot (PayFlow) & MySQL Backend + TanStack Start Frontend (Monorepo)

### GitHub Actions (CI) + Jenkins (CD) + Docker + GHCR + ngrok

---

# 1. Solution Overview

Monorepo CI/CD pipeline:

- **Backend** (`109_10_Check-em/backend/`): Spring Boot (Java 25) — PayFlow gateway
- **Frontend** (`109_10_Check-em/frontend/shopflow-payments-main/`): TanStack Start (React) — baked `VITE_API_BASE_URL`
- **Database**: MySQL (`payflow`) in Docker; H2 in-memory for local dev (`application.properties`)

> **Note:** Local dev uses H2 (`jdbc:h2:mem:payflow`). Production/CI/CD uses MySQL via `SPRING_DATASOURCE_*` env vars. `schema.sql` creates the `payflow` database and tables on MySQL first-start (`/docker-entrypoint-initdb.d/`) and in CI via `docker exec`.

---

# 2. Repo Layout (CI/CD files)

```
109_10_Check-em-main/
│
├── .github/
│      └── workflows/
│              backend-ci.yml
│              frontend-ci.yml
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

# 3. CI — Backend

`.github/workflows/backend-ci.yml` — push/PR to `main`.

```
Checkout → JDK 25 → MySQL 8.4 service (payflow)
    → chmod +x mvnw → apply schema.sql via docker exec → ./mvnw clean verify
    → (push only) build/push ghcr.io/neueda-learning/checkem-api:latest
    → Trigger Jenkins checkem-api-deploy-job
```

Local `application.properties` uses H2; CI overrides with MySQL via `SPRING_DATASOURCE_*` env vars.

### GitHub secrets required

| Secret | Value |
|--------|-------|
| `JENKINS_URL` | `https://<your-subdomain>.ngrok-free.app` |
| `JENKINS_TOKEN` | Jenkins build token (e.g. `deploy1234`) |

---

# 4. CI — Frontend

`.github/workflows/frontend-ci.yml` — push/PR to `main`.

```
Checkout → Node 22 → npm ci → npm run build (NITRO_PRESET=node-server)
    → (push only) build/push ghcr.io/neueda-learning/checkem-ui:latest
    → Trigger Jenkins checkem-ui-deploy-job
```

The Dockerfile bakes `VITE_API_BASE_URL=http://localhost:8082` so browser calls reach the API on the compose-mapped port (`8082`).

TanStack Start builds with `NITRO_PRESET=node-server` for Docker (Node server on port 80 inside the container).

---

# 5. CD — Jenkins

## 5.1 Install Jenkins (deployment server)

```bash
# Ubuntu/Debian example
sudo apt update
sudo apt install -y docker.io docker-compose-plugin openjdk-21-jre
sudo usermod -aG docker jenkins   # after installing Jenkins
sudo systemctl enable --now docker
```

Install Jenkins from https://www.jenkins.io/download/ and ensure the `jenkins` user can run `docker` commands.

## 5.2 Create two Freestyle jobs with **Trigger builds remotely**

| Job | Trigger URL |
|-----|-------------|
| `checkem-api-deploy-job` | `{JENKINS_URL}/buildByToken/build?job=checkem-api-deploy-job&token=<TOKEN>` |
| `checkem-ui-deploy-job` | `{JENKINS_URL}/buildByToken/build?job=checkem-ui-deploy-job&token=<TOKEN>` |

In each job:

1. Check **Trigger builds remotely** and set an authentication token (same value as `JENKINS_TOKEN` GitHub secret).
2. Add a **Execute shell** build step:

```bash
cd /opt/checkem
docker compose pull
docker compose down
docker compose up -d
docker compose ps
```

## 5.3 Prepare deployment directory on the server

```bash
sudo mkdir -p /opt/checkem
sudo cp docker-compose.yml /opt/checkem/
# Log in to GHCR on the server so compose can pull private images
echo "<GITHUB_PAT>" | docker login ghcr.io -u <github-user> --password-stdin
```

Replace `ghcr.io/neueda-learning/checkem-*` in `docker-compose.yml` with your GitHub org/user if different.

---

# 6. ngrok (expose Jenkins to GitHub Actions)

On the Jenkins server:

```bash
ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>
ngrok http 8080
```

Use the `https://xxxx.ngrok-free.app` URL as the `JENKINS_URL` GitHub secret (no trailing slash).

In Jenkins: **Manage Jenkins → Configure Global Security** → enable **Allow anonymous read access** or configure the build token root URL as needed.

---

# 7. Docker Architecture & Credentials

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

### H2 → MySQL switch

| Environment | Database | How |
|-------------|----------|-----|
| Local dev | H2 in-memory | Default `application.properties` |
| CI | MySQL 8.4 | `SPRING_DATASOURCE_*` in GitHub Actions |
| Production | MySQL 8.4 | `SPRING_DATASOURCE_*` in `docker-compose.yml` |

No code change is required to switch; only environment variables.

---

# 8. Verification

```bash
# UI
open http://<server-ip>:8081

# API health (Swagger)
curl -I http://<server-ip>:8082/swagger-ui.html

# Sample API call
curl http://<server-ip>:8082/api/merchants/dashboard

# Containers
docker ps
docker compose -f /opt/checkem/docker-compose.yml logs -f api
```

---

# 9. End-to-End Flow

```
Developer → git push (main)
  → GitHub Actions (build + test + docker)
  → GHCR (checkem-api / checkem-ui)
  → curl (ngrok) → Jenkins (api / ui deploy jobs)
  → docker compose up -d
  → Running Application (MySQL + API + UI)
```

---

# 10. Summary

- Monorepo: TanStack Start (React) frontend + Spring Boot (Java 25) backend.
- Images: `checkem-api:latest`, `checkem-ui:latest` on GHCR.
- Jenkins: `checkem-api-deploy-job`, `checkem-ui-deploy-job`.
- Docker Compose deployment: MySQL + API + UI.
- Local dev: H2; deployed: MySQL via env vars.

---

# 11. Quick local Docker test (before Jenkins)

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

# Update docker-compose.yml image tags to checkem-api:local / checkem-ui:local, then:
docker compose up -d
```
