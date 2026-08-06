# Module 06: Enterprise Cloud Backend (`06_backend`)

TypeScript Express REST API server backed by MongoDB for user authentication, diagnostic log telemetry ingestion, and disease treatment master data distribution for SmartCropAI.

## Directory Layout
```
06_backend/
├── package.json          # Node.js dependencies & scripts
├── tsconfig.json         # TypeScript compiler configuration
├── .env.example          # Environment variable template
├── .env                  # Local environment file (Git-ignored)
├── README.md             # Module documentation
└── src/
    ├── app.ts            # Express application, security middleware & health check route
    ├── server.ts         # Server entry point & graceful shutdown handlers
    └── config/
        └── env.ts        # Zod environment variable schema & validator
```

## Getting Started

```bash
# 1. Install Node.js dependencies
cd 06_backend
npm install

# 2. Run dev server with hot reload
npm run dev

# 3. Test Health Check endpoint
curl http://localhost:5000/health
```

### Features Included:
- **Security Headers**: `helmet` security protection for HTTP headers.
- **CORS Support**: Configurable cross-origin resource sharing.
- **Strict Environment Validation**: Zod schema validation ensuring `PORT`, `MONGODB_URI`, and `JWT_SECRET` are validated before startup.
- **Health Check Route**: `GET /health` returning service status, uptime, and memory usage telemetry.
- **Graceful Shutdown**: Intercepts `SIGINT` and `SIGTERM` signals for clean HTTP socket termination.
