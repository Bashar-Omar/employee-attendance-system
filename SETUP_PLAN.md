# Employee Attendance System — Production Setup Plan

## Problem Summary
- App deploys successfully on Hostinger, login page loads
- Login returns "Invalid credentials" because MySQL database is EMPTY
- Prisma is NOT creating tables automatically
- Seed script is NOT running / crashes silently
- `prisma generate` runs AFTER build (too late — build imports fail)

---

## Execution Plan

### Step 1: Fix Build Script (CRITICAL)
**File:** `package.json`
- Move `prisma generate` to run BEFORE `next build` (was `postbuild`, too late)
- New build: `"build": "npx prisma generate && next build"`

**Expected Outcome:** Prisma client is generated before Next.js imports it during build.

---

### Step 2: Fix Start Script (CRITICAL)
**File:** `package.json`
- Run `prisma db push` → creates all MySQL tables
- Run `node prisma/seed.mjs` → creates admin user
- Then start the app
- Seed failure should NOT prevent app from starting

**Expected Outcome:** Tables and admin user exist before app serves requests.

---

### Step 3: Improve Seed Script (CRITICAL)
**File:** `prisma/seed.mjs`
- Add `dotenv/config` import for local dev compatibility
- Add comprehensive logging (DB connection, user creation)
- Make errors non-fatal (don't `process.exit(1)`)
- Use `upsert` instead of `create` for idempotency

**Expected Outcome:** Admin user (admin@company.com / admin123) created safely, no crashes.

---

### Step 4: Add Prisma Client Logging
**File:** `lib/db/prisma.ts`
- Log DB connection success/failure on startup
- Enable query logging in development

**Expected Outcome:** DB connection status visible in server logs.

---

### Step 5: Add Auth Logging
**File:** `lib/auth.ts`
- Log every login attempt (email, success/failure)
- Log if user was found, if password matched
- No silent failures

**Expected Outcome:** Every auth attempt is traceable in logs.

---

### Step 6: Add Health Check API
**File:** `app/api/health/route.ts`
- Test DB connection
- Report table existence
- Report user count

**Expected Outcome:** Deployable diagnostic endpoint at `/api/health`.

---

### Step 7: Push to GitHub
- `git add .`
- `git commit -m "fix: setup mysql db push + seed admin + production fixes"`
- `git push origin main`

**Expected Outcome:** Hostinger auto-deploys the latest version.

---

## Verification Checklist
- [ ] `npm run build` succeeds (prisma generate runs first)
- [ ] `npm start` creates tables via `prisma db push`
- [ ] `npm start` creates admin user via seed
- [ ] Login with `admin@company.com` / `admin123` works
- [ ] `/api/health` returns DB status and user count
- [ ] All changes pushed to GitHub
