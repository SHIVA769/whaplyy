# WhatsStore SaaS - Current Project Report

**Report date:** 2026-09-05  
**Project:** WhatsStore SaaS  
**Version:** 1.0.0  
**Purpose:** Multi-tenant WhatsApp storefront and merchant management platform  
**Current status:** Feature-rich application in active MongoDB-to-PostgreSQL/Prisma migration; authentication is blocked by database/schema setup issues.

## 1. Executive Summary

WhatsStore is a full-stack SaaS platform for businesses that want to create branded online stores, manage products and orders, and receive customer orders through WhatsApp.

The repository contains:

- React/Vite frontend with public storefronts, authentication, merchant dashboard, and super-admin dashboard.
- Express REST API with JWT authentication and role-based authorization.
- Prisma schema targeting PostgreSQL/Supabase.
- Legacy Mongoose models and MongoDB seed script retained from the earlier implementation.
- Payment, email, SMS, Telegram, PDF invoice, webhook, referral, points, and media services.

The migration is incomplete. Current authentication controllers query Prisma, but the database was not successfully initialized and the Prisma schema declares UUID relation columns while generating CUID identifiers. This causes errors such as:

```text
The table `public.User` does not exist in the current database.
Inconsistent column data: Error creating UUID, invalid character ... found `m`
```

## 2. Technology Stack

### Frontend

- React 18, Vite 5, React Router DOM 6, Tailwind CSS 3.
- Axios, Lucide React, Recharts, React Hot Toast, `qrcode.react`, and `canvas-confetti`.

### Backend

- Node.js ES modules and Express 4.
- Prisma Client 5.22 targeting PostgreSQL/Supabase.
- JWT with `jsonwebtoken` and password hashing with `bcryptjs`.
- Multer uploads, Nodemailer/Resend email, PDFKit invoices.
- Twilio, Telegram, webhook, and payment services.
- Helmet, CORS, compression, and Morgan.

### Development

- Root `npm run dev` starts frontend and backend concurrently.
- Frontend: `http://localhost:5173`.
- Backend: `http://localhost:5000`.
- Health endpoint: `http://localhost:5000/api/health`.

## 3. Repository Structure

```text
project/
├── backend/
│   ├── config/                 # Constants, legacy DB config, Prisma client
│   ├── controllers/            # Auth, company, customer, storefront, admin logic
│   ├── middlewares/            # JWT auth, permissions, plan limits, uploads, errors
│   ├── models/                 # Legacy Mongoose models retained during migration
│   ├── prisma/schema.prisma    # PostgreSQL relational schema
│   ├── routes/                 # REST route definitions
│   ├── seeds/                  # Legacy MongoDB/Mongoose seed script
│   ├── services/               # Mail, payment, invoice, points, webhook integrations
│   ├── utils/                  # Cache, crypto, responses, templates
│   └── server.js               # Express entry point
├── frontend/
│   ├── src/api/                # Axios API client
│   ├── src/components/         # Shared UI components
│   ├── src/context/            # Auth, cart, language, and theme state
│   ├── src/layouts/            # Auth, company, storefront, admin layouts
│   ├── src/pages/              # Public, auth, company, storefront, admin pages
│   ├── src/themes/             # Store theme registry
│   └── vite.config.js          # Dev proxy and build configuration
├── docs/                       # Payment implementation documentation
├── MIGRATION_GUIDE.md          # MongoDB to PostgreSQL migration notes
└── PROJECT_REPORT.md           # This report
```

## 4. Implemented Product Areas

### Authentication and authorization

- Merchant and customer registration/login.
- JWT token generation and authenticated requests.
- Password hashing and password reset endpoints.
- Email verification fields and mail flow.
- Current-user profile, profile update, and password update.
- Company login enable/disable checks.
- Super admin, company owner, staff, and customer roles.
- Granular company permissions.
- Super-admin company impersonation.

### Merchant workspace

- Dashboard, notifications, stores, products, categories, taxes, inventory, variants, and images.
- Orders, fulfillment, payment status, invoices, and exports.
- Customers, coupons, shipping methods, analytics, staff, custom roles, plans, referrals, settings, messaging, and webhooks.

### Super-admin workspace

- Platform dashboard and company management.
- Media library, advertisements, plans, plan requests, plan orders, platform coupons, and currencies.
- Referral administration.
- Email and notification templates.
- System, brand, currency, email, payment, storage, recaptcha, ChatGPT, cookie, and SEO settings.

### Public storefront and customer experience

- Landing page and public stores.
- Catalog, product details, themes, cart, checkout, coupons, shipping, and order tracking.
- Customer account, orders, points, newsletter, contact forms, and WhatsApp ordering support.

## 5. API Surface

All API routes are mounted below `/api`.

### Authentication: `/api/auth`

- `POST /register`
- `POST /login`
- `POST /forgot-password`
- `POST /reset-password`
- `GET /me`
- `PUT /profile`
- `PUT /password`
- `POST /impersonate/:companyId`

### Company: `/api/company`

Protected CRUD and reporting endpoints cover dashboard, notifications, stores, products, categories, taxes, orders, customers, coupons, shipping, analytics, staff, roles, plans, referrals, settings, messaging, and webhooks.

### Customer: `/api/customer`

Customer registration/login, profile read/update, and order history.

### Storefront: `/api/storefront`

Public landing/custom pages, store lookup, catalogs, product details, coupons, shipping, checkout, payment confirmation, order tracking, invoices, newsletter, and contact forms.

### Super admin: `/api/super-admin`

Protected administration endpoints cover companies, media, advertisements, plans, plan requests, plan orders, platform coupons, currencies, referrals, templates, system settings, storage, email, payment configuration, and cache management.

## 6. Data Model

The Prisma schema contains relational models for users, companies, roles, plans, stores, products, categories, taxes, coupons, shipping, customers, orders, payments, referrals, payouts, points, notifications, settings, templates, media, advertisements, currencies, locations, and webhooks.

### Current identifier problem

Most primary keys use `String @default(cuid())`, but many foreign-key fields are annotated with `@db.Uuid`. A CUID such as `cm...` cannot be inserted into a PostgreSQL UUID column. This is the direct cause of the invalid UUID error during `prisma.user.create()`.

The schema must use one identifier strategy consistently:

1. Keep CUID strings and remove incompatible `@db.Uuid` annotations from matching relation fields; or
2. Change all related primary keys and generators to UUID values.

The first option is the smaller change for the current codebase, but it must be applied consistently across every related model before the schema is pushed.

## 7. Current Blocking Issues

### P0 - Database schema is not initialized

The API can start, but Prisma reports that `public.User` does not exist. Login and registration therefore fail before business logic completes.

After correcting the schema and confirming the database connection, run:

```powershell
cd backend
npx prisma format
npx prisma generate
npx prisma db push
```

### P0 - CUID and UUID types are mixed

The schema generates CUID identifiers but declares UUID database columns on relations. This must be corrected before creating users, companies, stores, and related records.

### P1 - Migration code paths are mixed

The active server and several controllers use Prisma, while `backend/models/` and `backend/seeds/seedData.js` still use Mongoose/MongoDB. The current seed command is not a Prisma seed and will not populate the PostgreSQL database used by the auth controllers.

Create a Prisma seed for plans, settings, demo company, and demo users, or finish the migration back to MongoDB/Mongoose. Production should use one database implementation.

### P1 - Frontend API configuration must include `/api`

The frontend Axios client uses `VITE_API_BASE_URL` or `VITE_API_URL`. The value must point to the mounted API path:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Without `/api`, requests go to `/auth/login` and return 404 instead of reaching the Express auth route.

### P1 - Environment secrets need rotation

The development environment contains database, SMTP, and other service credentials. Rotate any exposed credentials, keep them out of version control, and use placeholders in example files. Actual secrets are intentionally omitted from this report.

### P2 - Documentation is stale

The migration guide describes earlier dependency versions and says environment setup is complete even though the Prisma database is not ready. Update it after the schema strategy is finalized.

## 8. Recommended Completion Order

1. Back up the current database and rotate exposed credentials.
2. Choose CUID strings or UUIDs and make all Prisma primary/foreign-key fields consistent.
3. Run `prisma format`, `prisma generate`, and `prisma db push` against the intended database.
4. Add a Prisma seed for settings, plans, demo company, and demo users using bcrypt hashes.
5. Verify `GET /api/health` reports a connected database.
6. Verify merchant registration and login with a new account.
7. Verify seeded super-admin and company-owner login.
8. Run the frontend production build with `npm run build`.
9. Exercise company, storefront, customer, and super-admin smoke tests.
10. Remove or isolate unused Mongoose paths after the Prisma migration is complete.

## 9. Validation Checklist

- [ ] Backend starts without port or environment errors.
- [ ] `GET /api/health` reports `database: connected`.
- [ ] Prisma tables exist in the configured database.
- [ ] Prisma client is generated from the current schema.
- [ ] Registration creates a company and company-owner user.
- [ ] Login returns a JWT and user payload.
- [ ] `/api/auth/me` works with the returned JWT.
- [ ] Super-admin routes reject non-admin users.
- [ ] Company routes enforce tenant scope and permissions.
- [ ] Customer login and order history work.
- [ ] Public storefront catalog and checkout work.
- [ ] Frontend production build succeeds.
- [ ] Secrets are absent from committed files.

## 10. Useful Commands

```powershell
# Install all dependencies
npm run install:all

# Start frontend and backend
npm run dev

# Start backend only
cd backend
npm run dev

# Start frontend only
cd frontend
npm run dev

# Prisma workflow
cd backend
npx prisma format
npx prisma validate
npx prisma generate
npx prisma db push

# Build frontend
cd frontend
npm run build
```

## 11. Final Assessment

The project has a substantial feature set and a clear SaaS product structure. The frontend and route organization are far along, but the system is not production-ready because the persistence layer is between implementations. The immediate success criterion is to complete one consistent database path, initialize its schema, add a compatible seed process, and prove registration/login with smoke tests.
