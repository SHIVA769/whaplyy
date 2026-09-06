# Deployment Guide

This project deploys as two services:

- Backend API: Render Web Service
- Frontend: Vercel project using the `frontend` directory
- Database: PostgreSQL, such as Supabase

## 1. Prepare the database

Create a PostgreSQL database and copy its connection strings. Run the Prisma schema setup locally from `backend` before the first production deploy:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

Use a migration instead of `db push` when your project has committed Prisma migrations:

```bash
npx prisma migrate deploy
```

## 2. Deploy the backend to Render

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint** and select the repository. Render will read `render.yaml`.
3. If creating the service manually, use these settings:
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`
   - Health Check Path: `/api/health`
4. Add these environment variables in Render:
   - `NODE_ENV=production`
   - `DATABASE_URL`: pooled PostgreSQL connection string
   - `DIRECT_URL`: direct PostgreSQL connection string, if used by Prisma
   - `JWT_SECRET`: a long random secret
   - `CORS_ORIGINS`: the final Vercel URL, for example `https://your-app.vercel.app`
5. Deploy and open:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/health
```

The response should have `status: "online"` and `database: "connected"`.

Add any features used by the application as Render environment variables too, such as `RESEND_API_KEY`, SMTP, payment, Twilio, Telegram, or storage credentials. Do not commit secrets or `.env` files.

## 3. Deploy the frontend to Vercel

1. In Vercel, import the same repository.
2. Set **Root Directory** to `frontend`.
3. Vercel should detect Vite automatically. Use:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add this environment variable in Vercel:

```text
VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
```

5. Deploy the frontend.
6. Copy the final Vercel URL into Render's `CORS_ORIGINS`, then redeploy the backend.

The existing `frontend/vercel.json` keeps React Router routes working after refresh.

## 4. Important production notes

- Render local disk is ephemeral. Files uploaded to `backend/uploads` can disappear after a redeploy or restart. Configure S3-compatible storage before relying on persistent uploads.
- Do not put `SUPABASE_SERVICE_ROLE_KEY`, database passwords, JWT secrets, or payment secrets in Vercel variables unless the frontend truly needs them. Vite variables are exposed to browser users.
- If you use a custom frontend domain, set `CORS_ORIGINS` to that domain as well. Multiple origins are comma-separated.
- After each deployment, test login, an authenticated API request, and an upload separately.
