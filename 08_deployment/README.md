# Module 08: Production Deployment & Containerization (`08_deployment`)

Production Docker multi-stage containerization, Docker Compose orchestration, and GitHub Actions CI/CD pipeline configurations for SmartCropAI.

## Directory Layout
```
08_deployment/
├── Dockerfile            # Multi-stage production Dockerfile (Builder -> Runner)
├── docker-compose.yml    # Orchestration config for Node.js REST service & MongoDB 7.0
└── README.md             # Module documentation
```

## Running Containerized Services

```bash
# 1. Start backend service and MongoDB database in containerized mode
cd 08_deployment
docker compose up --build -d

# 2. Verify container status and healthcheck
docker compose ps

# 3. View live server container logs
docker compose logs -f backend
```

### Features Included:
- **Multi-Stage Build**: Separates TypeScript build dependencies (`builder` stage) from execution dependencies (`runner` stage), producing lean production Docker images ($<120\text{ MB}$).
- **Non-Root Security Context**: Enforces `USER node` security compliance.
- **Automated Healthchecks**: Built-in container healthcheck querying `http://localhost:5000/health` every 30 seconds.
- **GitHub Actions CI/CD Pipeline (`.github/workflows/ci.yml`)**: Automated pull request and push quality gates verifying TypeScript compilation, Python system integration test execution, and Docker build validation.
