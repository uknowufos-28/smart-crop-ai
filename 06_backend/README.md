# Module 06: Enterprise Cloud Backend (`06_backend`)

TypeScript Express REST API server backed by MongoDB for user authentication, diagnostic log telemetry ingestion, and disease treatment master data distribution for SmartCropAI.

## Directory Layout
```
06_backend/
├── package.json          # Node.js dependencies & scripts (includes BCrypt & JWT)
├── tsconfig.json         # TypeScript compiler configuration
├── .env                  # Local environment file
├── README.md             # Module documentation
└── src/
    ├── app.ts            # Express application, security middleware & API route router
    ├── server.ts         # Server entry point & graceful shutdown handlers
    ├── config/
    │   ├── env.ts        # Zod environment variable schema & validator
    │   └── database.ts   # MongoDB Mongoose singleton connection manager
    ├── controllers/
    │   └── authController.ts # BCrypt password hashing & JWT registration/login
    ├── middleware/
    │   └── authMiddleware.ts # Bearer token verification & Role-Based Access Control (RBAC)
    ├── models/           # Domain data models (User, Crop, Treatment, DiagnosisLog)
    └── routes/
        └── authRoutes.ts # Auth router (/api/v1/auth)
```

## API Endpoints

### Public Endpoints
- `GET /health`: System health check status, uptime, and memory usage telemetry.
- `POST /api/v1/auth/register`: Register new user (`name`, `email`, `password`, `role`), returning JWT token.
- `POST /api/v1/auth/login`: Authenticate user credentials, returning JWT token.

### Protected Endpoints
- `GET /api/v1/auth/me` (Header: `Authorization: Bearer <token>`): Get authenticated user profile.
