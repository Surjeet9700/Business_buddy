# Railway Deployment Configuration

## Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

## Manual Setup

1. Create a new project on [Railway](https://railway.app)

2. Add a PostgreSQL database from the Railway dashboard

3. Connect your GitHub repository

4. Set the following environment variables:

```env
# Database (auto-configured by Railway if you use their PostgreSQL)
DATABASE_URL=postgresql://...

# JWT Configuration
JWT_SECRET=your-super-secure-secret-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=another-secure-secret
REFRESH_TOKEN_EXPIRES_IN=30d

# Server
PORT=3000
NODE_ENV=production
```

5. Set build command: `bun install && bunx prisma generate && bunx prisma migrate deploy && bun run build`

6. Set start command: `bun run start`

## railway.json (Optional)

Create this file in your backend directory for custom Railway configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "bun install && bunx prisma generate && bunx prisma migrate deploy"
  },
  "deploy": {
    "startCommand": "bun run start",
    "healthcheckPath": "/api/v1/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```
