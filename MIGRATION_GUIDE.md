# WhatsStore MongoDB → PostgreSQL/Prisma Migration Guide

**Status:** Step 2 Complete (Environment Configuration) | **Next:** Step 3 (Prisma Setup)

---

## ✅ Step 0-2: COMPLETED

### What was created:
1. **`backend/prisma/schema.prisma`** - Complete relational schema (19 enums, 30+ models)
2. **`backend/config/prisma.js`** - Prisma client singleton
3. **`backend/.env.example`** & **`frontend/.env.example`** - Environment templates
4. **`backend/.env`** & **`frontend/.env`** - Development environment files
5. **`.gitignore`** files in both `backend/` and `frontend/` (includes `.env`)

**Dependencies installed:**
- ✅ `@prisma/client` (v7.10.0)
- ✅ `prisma` (v8.0.0-rc.12 dev dependency)

**Note:** Minor Node.js version warnings (your Node is v20.15.1) - these are non-blocking but you may want to upgrade Node to v20.19+ or v22.12+ for full compatibility.

---

## ⚠️ CRITICAL: Fill in these values BEFORE proceeding

Your `.env` file requires these Supabase connection details. **DO NOT COMMIT THESE VALUES TO GIT.**

Get these from your **Supabase Dashboard → Project Settings → Database**:

```
DATABASE_URL = postgresql://[postgres.user]:[password]@[host]:[port]/postgres?sslmode=require
DIRECT_URL = postgresql://[postgres.user]:[password]@db.[random].supabase.co:6543/postgres

SUPABASE_URL = https://[project-ref].supabase.co
SUPABASE_ANON_KEY = [your-anon-public-key]
SUPABASE_SERVICE_ROLE_KEY = [your-service-role-key]
```

### How to get these values:

1. **Open Supabase Dashboard** → Your Project
2. **Go to Settings → Database**
3. Look for the **Connection String** section:
   - **URI** = your `DATABASE_URL` (includes pooler connection)
   - **Direct connection** = your `DIRECT_URL` (optional, for migrations)
4. **Go to Settings → API** for:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (Public Anonymous Key)
   - `SUPABASE_SERVICE_ROLE_KEY` (Service Role Key)

📝 **Paste these values now into `backend/.env` before continuing.**

---

## 📋 Step 3: Prisma Setup & Migration

Run these commands in `backend/` directory:

```bash
cd backend

# Generate Prisma client from schema
npx prisma generate

# Create initial migration (requires DATABASE_URL to be set)
npx prisma migrate dev --name init

# Verify schema was created successfully
npx prisma db push --skip-generate
```

### Expected output:
```
✔ Parsed schema
✔ Created database
✔ Executed migration
✔ Generated Prisma client
✔ Generated Prisma Client (9.234ms)
```

### If you get connection errors:

**Error: `Can't reach database server`**
- Verify `DATABASE_URL` is correct in `.env`
- Check Supabase is accessible from your IP
- Verify VPN/firewall doesn't block PostgreSQL (port 5432)

**Error: `role "postgres" does not exist`**
- Use the correct `postgres` superuser credentials from Supabase
- Do NOT use `postgres` as a custom role

**Error: `database "postgres" does not exist`**
- Your DATABASE_URL might be pointing to wrong database
- Supabase provides a default `postgres` database - use that

---

## 🔄 Step 4: Replace Mongoose with Prisma in Code

### 4.1 Update `backend/server.js`

**Remove:**
```javascript
import { connectDB } from './config/db.js';
import mongoose from 'mongoose';

// ... remove:
await connectDB();
```

**Keep:**
```javascript
import { prisma } from './config/prisma.js';
// Prisma doesn't need explicit "connect" - it connects on first query
```

### 4.2 Delete `backend/config/db.js`
```bash
rm backend/config/db.js
```

### 4.3 Remove Mongoose imports from models

All files in `backend/models/*.js` currently have:
```javascript
import mongoose from 'mongoose';
```

**Keep these files for now** - they're needed for the data migration script (Step 7). Do NOT delete yet.

---

## 🔀 Step 5: Port Controllers to Prisma

### Mongoose → Prisma Mapping

| Mongoose | Prisma |
|----------|--------|
| `Model.find(filter)` | `prisma.model.findMany({ where: filter })` |
| `Model.findById(id)` | `prisma.model.findUnique({ where: { id } })` |
| `Model.findOne(filter)` | `prisma.model.findFirst({ where: filter })` |
| `Model.create(data)` | `prisma.model.create({ data })` |
| `Model.findByIdAndUpdate(id, data)` | `prisma.model.update({ where: { id }, data })` |
| `Model.findByIdAndDelete(id)` | `prisma.model.delete({ where: { id } })` |
| `Model.countDocuments(filter)` | `prisma.model.count({ where: filter })` |
| `model.populate('field')` | `include: { field: true }` (in findMany/findUnique) |
| `model.save()` | `prisma.model.update(...)` or `.create(...)` |

### Critical changes for your codebase:

**Order/Item Creation (embedded documents → separate table)**

Mongoose (embedded):
```javascript
const order = new Order({
  items: [
    { productId, quantity, price }
  ]
});
await order.save();
```

Prisma (atomic write):
```javascript
const order = await prisma.order.create({
  data: {
    orderNumber: 'ORD-123',
    items: {
      create: [
        { productId, quantity, price }
      ]
    }
  }
});
```

**Points/Balance Updates (atomicity required)**

Mongoose (NOT atomic):
```javascript
company.pointsBalance += 100;
await company.save();
await PointsTransaction.create({ companyId, amount: 100 });
```

Prisma (atomic transaction):
```javascript
await prisma.$transaction([
  prisma.company.update({
    where: { id: companyId },
    data: { pointsBalance: { increment: 100 } }
  }),
  prisma.pointsTransaction.create({
    data: { companyId, amount: 100, balanceAfter: newBalance }
  })
]);
```

### Sample controller conversion:

**Before (Mongoose):**
```javascript
export const getCompanyDashboard = async (req, res) => {
  try {
    const company = await Company.findById(req.companyId)
      .populate('plan')
      .populate('stores');
    
    const stores = await Store.find({ companyId: req.companyId });
    const orders = await Order.find({ companyId: req.companyId })
      .limit(10)
      .sort({ createdAt: -1 });
    
    res.json({ company, stores, orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**After (Prisma):**
```javascript
import { prisma } from '../config/prisma.js';

export const getCompanyDashboard = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.companyId },
      include: {
        plan: true,
        stores: true
      }
    });
    
    const stores = await prisma.store.findMany({
      where: { companyId: req.companyId }
    });
    
    const orders = await prisma.order.findMany({
      where: { companyId: req.companyId },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ company, stores, orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Files to update (in order):

1. `backend/controllers/authController.js` - User auth, registration
2. `backend/controllers/companyController.js` - Stores, products, orders (majority of queries)
3. `backend/controllers/customerController.js` - Customer profile, orders
4. `backend/controllers/storefrontRoutes.js` - Public store browsing
5. `backend/controllers/superAdminController.js` - Platform management
6. `backend/middlewares/auth.js` - User lookup
7. `backend/middlewares/planLimits.js` - Count queries
8. `backend/services/*.js` - Email, payment, points handling

---

## 💾 Step 7: Data Migration Script

Write `backend/scripts/migrateMongoToPostgres.js` to migrate existing data:

### Key principles:
1. Read from MongoDB (old models)
2. Write to PostgreSQL (Prisma)
3. Maintain ID mapping for foreign keys
4. Migrate in dependency order

### Dependency order for migration:
```
Plan
  ↓
Company (depends on Plan)
  ↓
User (depends on Company)
  ↓
Store (depends on Company)
  ↓
Category, Tax (depends on Store)
  ↓
Product (depends on Category, Tax)
  ↓
Customer, ShippingMethod (depends on Store)
  ↓
Order + OrderItem (depends on Product, Customer, ShippingMethod)
  ↓
StoreCoupon, PlatformCoupon, Role, Notification
  ↓
PointsTransaction, Referral, PlanOrder, PlanRequest
  ↓
Settings, Advertisement, Currency, EmailTemplate, etc.
```

### Template for migration script:

```javascript
// backend/scripts/migrateMongoToPostgres.js
import { prisma } from '../config/prisma.js';

async function migrate() {
  console.log('Starting MongoDB → PostgreSQL migration...');
  
  try {
    // 1. Read from MongoDB (keep old models for this)
    // const plansFromMongo = await Plan.find();
    
    // 2. Map old IDs to new UUIDs
    // const idMap = {};
    
    // 3. Create in Prisma
    // for (const plan of plansFromMongo) {
    //   const newPlan = await prisma.plan.create({ data: { ... } });
    //   idMap[plan._id.toString()] = newPlan.id;
    // }
    
    // 4. Use idMap for foreign key resolution in subsequent tables
    
    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
```

Run after all controllers are ported (Step 5):
```bash
node scripts/migrateMongoToPostgres.js
```

---

## ✅ Step 8: Verification Checklist

After porting all controllers:

- [ ] All `backend/controllers/*.js` files use Prisma (no Mongoose)
- [ ] All `backend/middlewares/*.js` files use Prisma
- [ ] All `backend/services/*.js` files use Prisma
- [ ] `backend/config/db.js` deleted
- [ ] `backend/server.js` has no `connectDB()` or `mongoose.connect()`
- [ ] `.env` has valid DATABASE_URL and SUPABASE keys
- [ ] `npx prisma generate` runs without errors
- [ ] `npx prisma db push` syncs schema to Supabase
- [ ] Backend starts: `npm run dev` in `backend/`
- [ ] No "Cannot find module 'mongoose'" errors
- [ ] Data migrated successfully (if migrating from existing MongoDB)

---

## 🚀 Next Immediate Steps

1. **Fill in `.env` with Supabase credentials** (DATABASE_URL, DIRECT_URL, keys)
2. **Run Step 3 commands** to set up Prisma
3. **Start porting controllers** (Step 5)
4. **Run migration script** if you have existing data (Step 7)
5. **Test backend** with `npm run dev`

---

## 📖 Useful Prisma Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)

---

## ❓ Common Issues & Solutions

**Issue:** `PrismaClientInitializationError: Can't reach database`
**Solution:** Verify DATABASE_URL in .env, check Supabase is running

**Issue:** `Error: Field "id" can't be empty`
**Solution:** Prisma auto-generates UUIDs - don't pass `id` in create()

**Issue:** Foreign key violation
**Solution:** Ensure parent records exist before creating related records; use transaction for multi-table inserts

**Issue:** Unique constraint violation
**Solution:** Check for duplicate values before migration; use `findUnique()` correctly

---

## 📞 Support

- Stuck on a step? Re-read that section carefully
- Check Supabase logs: Supabase Dashboard → Logs
- Verify all Prisma models match your business logic
- Test queries with `npx prisma studio` to inspect data

Good luck! 🚀
