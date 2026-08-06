# Module 06: Enterprise Cloud Backend (`06_backend`)

TypeScript Express REST API server backed by MongoDB for user authentication, diagnostic log telemetry ingestion, and disease treatment master data distribution for SmartCropAI.

## Directory Layout
```
06_backend/
├── package.json          # Node.js dependencies & scripts
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
    │   ├── authController.ts      # BCrypt password hashing & JWT registration/login
    │   ├── diagnosisController.ts # Bulk batch offline scan sync & log history
    │   └── treatmentController.ts # Organic & chemical treatment remedy guides
    ├── middleware/
    │   └── authMiddleware.ts # Bearer token verification & Role-Based Access Control (RBAC)
    ├── models/           # Domain data models (User, Crop, Treatment, DiagnosisLog)
    └── routes/
        ├── authRoutes.ts      # Auth router (/api/v1/auth)
        ├── diagnosisRoutes.ts # Diagnosis router (/api/v1/diagnoses)
        └── treatmentRoutes.ts # Treatment router (/api/v1/treatments)
```

## API Endpoints Summary

### 1. System & Authentication Endpoints
- `GET /health`: System health check status, uptime, and memory telemetry.
- `POST /api/v1/auth/register`: Register new user (`name`, `email`, `password`, `role`).
- `POST /api/v1/auth/login`: Authenticate user credentials, returning JWT.
- `GET /api/v1/auth/me` (Protected): Fetch authenticated user profile.

### 2. Diagnosis Telemetry Endpoints (Protected)
- `POST /api/v1/diagnoses/sync`: Bulk sync offline mobile scan logs to cloud DB (`DiagnosisLog.insertMany`).
- `GET /api/v1/diagnoses`: Fetch paginated diagnosis log history for authenticated user.
- `GET /api/v1/diagnoses/:id`: Fetch specific diagnosis record by ID.

### 3. Disease Treatment Remedy Endpoints
- `GET /api/v1/treatments`: Fetch all available disease treatment guides.
- `GET /api/v1/treatments/:diseaseName`: Fetch specific treatment remedy guide by disease name.
- `POST /api/v1/treatments` (Protected - Admin / Agronomist only): Create or update disease remedy guide.
