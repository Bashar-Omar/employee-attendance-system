# Super Admin — Development Plan

**For AI Agent:** This is a standalone plan. It assumes the main MASTER_DEV_PLAN.md
has already been fully implemented. All tasks here are self-contained.

---

## Context

**Stack:** Next.js 16, Prisma 5.22, PostgreSQL (Neon), NextAuth v5, TypeScript, Tailwind CSS v4
**Repo:** github.com/Bashar-Omar/employee-attendance-system

A hidden power layer for the system owner only. The `SUPER_ADMIN` role never appears in any
UI dropdown or form. The only way to grant it is by editing the DB directly:

```sql
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'your@email.com';
```

---

## Security Design

- Every super admin route returns **404** (not 401 or 403) for anyone who is not a super admin.
  A 403 would reveal the route exists. A 404 makes it look like a missing page.
- The route path is non-obvious. Use `/console/ops` — do not use `/super`, `/superadmin`,
  or `/admin/super`.
- No link to this route exists anywhere in the UI. Access is by direct URL only.
- The string `SUPER_ADMIN` must never appear in any `<select>`, role picker, or visible UI element.
- Regular admin pages and API routes must also accept `SUPER_ADMIN` (see TASK 2).

---

## Implementation Order

```
TASK 1  Add @@unique([userId, date]) to Attendance model -> prisma db push
TASK 2  Auth guard utility
TASK 3  Update existing admin guards to allow SUPER_ADMIN through
TASK 4  Console page (the hidden route)
TASK 5  Single attendance record insert/edit UI + API
TASK 6  Bulk attendance seeder UI + API
```

---

## TASK 1 — Add Unique Constraint to Attendance

**File:** `prisma/schema.prisma`

Add a compound unique constraint to the `Attendance` model to prevent duplicate records
for the same employee on the same day. This is required before the bulk seeder can use upsert.

```prisma
model Attendance {
  // ... all existing fields unchanged ...

  @@unique([userId, date])  // ADD THIS LINE
}
```

**After editing, run:**
```bash
npx prisma db push
npx prisma generate
```

---

## TASK 2 — Auth Guard Utility

**Create:** `lib/auth/superAdmin.ts`

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';

/**
 * Use in super admin SERVER COMPONENTS (pages).
 * Calls notFound() for anyone who is not SUPER_ADMIN -> renders the standard 404 page.
 * The caller never sees a 401 or 403 — the route appears to not exist.
 */
export async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'SUPER_ADMIN') {
    notFound();
  }
  return session;
}

/**
 * Use in super admin API ROUTES.
 * Returns a 404 Response for anyone who is not SUPER_ADMIN.
 * Returns null if the user is authorized (meaning: proceed normally).
 *
 * Usage:
 *   const denied = await guardSuperAdminApi();
 *   if (denied) return denied;
 */
export async function guardSuperAdminApi(): Promise<Response | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return new Response('Not Found', { status: 404 });
  }
  return null;
}
```

---

## TASK 3 — Update Existing Admin Guards

**Problem:** Every existing admin page and API route checks:
```typescript
if (session?.user?.role !== 'ADMIN') { ... }
```
This blocks `SUPER_ADMIN` from accessing regular admin pages.

**Fix:** Create a shared helper and replace all existing checks.

**Create:** `lib/auth/adminGuard.ts`

```typescript
/**
 * Returns true if the role has admin-level access (ADMIN or SUPER_ADMIN).
 */
export function hasAdminAccess(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}
```

**Then search the entire codebase** for this pattern:
```typescript
session?.user?.role !== 'ADMIN'
```

Replace every occurrence with:
```typescript
!hasAdminAccess(session?.user?.role)
```

And add the import at the top of each file:
```typescript
import { hasAdminAccess } from '@/lib/auth/adminGuard';
```

---

## TASK 4 — Console Page (Hidden Route)

**Create:** `app/console/ops/page.tsx`

```typescript
import { requireSuperAdmin } from '@/lib/auth/superAdmin';

export default async function OpsConsolePage() {
  await requireSuperAdmin(); // returns 404 for everyone else

  return (
    <div>
      <h1>Ops Console</h1>
      {/* Section 1: Manual Attendance Insert/Edit */}
      {/* Section 2: Bulk Attendance Seeder */}
    </div>
  );
}
```

**Important:** Do NOT add this route to:
- The admin sidebar or any navigation component
- Any breadcrumb
- Any sitemap or robots.txt
- Any link anywhere in the codebase

---

## TASK 5 — Single Attendance Record Insert / Edit

### 5a — API Route

**Create:** `app/api/console/ops/attendance/route.ts`

```typescript
import { prisma } from '@/lib/db/prisma';
import { guardSuperAdminApi } from '@/lib/auth/superAdmin';

// Upsert a single attendance record
export async function POST(req: Request) {
  const denied = await guardSuperAdminApi();
  if (denied) return denied;

  const body = await req.json();
  const { userId, date, checkInTime, checkOutTime, ...rest } = body;

  // Convert Egypt local time strings ("09:15") to UTC Date objects
  const checkIn = checkInTime
    ? new Date(`${date}T${checkInTime}:00+02:00`)
    : null;
  const checkOut = checkOutTime
    ? new Date(`${date}T${checkOutTime}:00+02:00`)
    : null;

  const totalHours =
    checkIn && checkOut
      ? (checkOut.getTime() - checkIn.getTime()) / 3600000
      : null;

  const record = await prisma.attendance.upsert({
    where: { userId_date: { userId, date: new Date(date) } },
    create: { userId, date: new Date(date), checkIn, checkOut, totalHours, ...rest },
    update: { checkIn, checkOut, totalHours, ...rest },
  });

  return Response.json(record);
}

// Delete a single attendance record by ID
export async function DELETE(req: Request) {
  const denied = await guardSuperAdminApi();
  if (denied) return denied;

  const { id } = await req.json();
  await prisma.attendance.delete({ where: { id } });
  return Response.json({ ok: true });
}
```

### 5b — UI Component

**Create:** `app/console/ops/_components/AttendanceEditor.tsx`

A client component with these elements:

**Step 1 — Select employee and date:**
- Employee dropdown (fetch all users from `GET /api/users` or a new super admin endpoint)
- Date picker

**Step 2 — When both are selected, auto-fetch existing record:**
- If a record exists for that employee+date, pre-fill the form fields (edit mode).
- If no record exists, show empty form (insert mode).

**Form fields:**

| Field | Input | Notes |
|---|---|---|
| Status | Dropdown | PRESENT / ABSENT / LATE / HOLIDAY / LEAVE |
| Check-in time | Time input HH:mm | Egypt local time |
| Check-out time | Time input HH:mm | Optional |
| In latitude | Number | Optional |
| In longitude | Number | Optional |
| In status | Text | e.g. INSIDE / OUTSIDE |
| In distance (m) | Number | Optional |
| Out latitude | Number | Optional |
| Out longitude | Number | Optional |
| Out status | Text | Optional |
| Out distance (m) | Number | Optional |
| Late minutes | Number | Optional — leave blank to auto-calculate |
| Overtime minutes | Number | Optional — leave blank to auto-calculate |
| Notes | Textarea | Optional |

**Auto-calculate toggle:**
When enabled, late minutes and overtime are calculated automatically from the employee's
shift after the times are entered. When disabled, the admin enters them manually.

**On submit:** POST to `/api/console/ops/attendance`.
Show confirmation: `Record saved for [Name] on [Date].`

**Delete button:** visible only in edit mode. Calls DELETE on `/api/console/ops/attendance`.

---

## TASK 6 — Bulk Attendance Seeder

### 6a — API Route

**Create:** `app/api/console/ops/bulk-seed/route.ts`

```typescript
import { prisma } from '@/lib/db/prisma';
import { guardSuperAdminApi } from '@/lib/auth/superAdmin';
import { calculateLateMinutes, calculateOvertimeMinutes } from '@/lib/payroll/calculateLate';
import { findApplicableRule, calculateDailyDeductionAmount } from '@/lib/payroll/calculateDeduction';
import { countWorkingDays } from '@/lib/payroll/calculateMonthlySummary';

export async function POST(req: Request) {
  const denied = await guardSuperAdminApi();
  if (denied) return denied;

  const {
    userId,
    fromDate,        // "2024-01-01"
    toDate,          // "2024-03-31"
    checkInTime,     // "09:00"
    checkOutTime,    // "17:00"
    randomize,       // boolean — adds ±30 min variation per day
    skipExisting,    // boolean — skip days that already have a record
    skipNonWorkingDays, // boolean — respect employee's shift workDays
  } = await req.json();

  const employee = await prisma.user.findUnique({
    where: { id: userId },
    include: { shift: { include: { deductionRules: true } } },
  });
  if (!employee) return Response.json({ error: 'Employee not found' }, { status: 404 });

  const workDays = employee.shift?.workDays?.split(',').map(Number) ?? [0, 1, 2, 3, 4];
  const start = new Date(fromDate);
  const end = new Date(toDate);

  let created = 0;
  let skippedExisting = 0;
  let skippedNonWorking = 0;

  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }); // "2024-01-15"
    const dayOfWeek = d.getDay();

    if (skipNonWorkingDays && !workDays.includes(dayOfWeek)) {
      skippedNonWorking++;
      continue;
    }

    if (skipExisting) {
      const existing = await prisma.attendance.findUnique({
        where: { userId_date: { userId, date: new Date(dateStr) } },
      });
      if (existing) {
        skippedExisting++;
        continue;
      }
    }

    // Apply random variation if enabled (±30 minutes)
    const variance = randomize ? Math.floor(Math.random() * 61) - 30 : 0;

    const [inH, inM] = checkInTime.split(':').map(Number);
    const [outH, outM] = checkOutTime.split(':').map(Number);

    const inTotalMins = Math.max(0, inH * 60 + inM + variance);
    const outTotalMins = Math.max(0, outH * 60 + outM + variance);

    const finalIn = `${String(Math.floor(inTotalMins / 60)).padStart(2, '0')}:${String(inTotalMins % 60).padStart(2, '0')}`;
    const finalOut = `${String(Math.floor(outTotalMins / 60)).padStart(2, '0')}:${String(outTotalMins % 60).padStart(2, '0')}`;

    const checkIn = new Date(`${dateStr}T${finalIn}:00+02:00`);
    const checkOut = new Date(`${dateStr}T${finalOut}:00+02:00`);
    const totalHours = (checkOut.getTime() - checkIn.getTime()) / 3600000;

    let lateMinutes = 0;
    let overtimeMinutes = 0;
    let deductionRuleId: string | null = null;
    let deductionValue: number | null = null;

    if (employee.shift) {
      lateMinutes = calculateLateMinutes(checkIn, employee.shift.startTime, employee.shift.gracePeriodMins);
      overtimeMinutes = calculateOvertimeMinutes(checkOut, employee.shift.endTime, employee.shift.overtimeAfterMins);

      if (lateMinutes > 0 && employee.salary && employee.shift.deductionRules.length > 0) {
        const workingDaysCount = countWorkingDays(d.getFullYear(), d.getMonth() + 1, employee.shift.workDays);
        const rule = findApplicableRule(lateMinutes, false, employee.shift.deductionRules);
        if (rule) {
          deductionRuleId = rule.id;
          deductionValue = calculateDailyDeductionAmount(rule, employee.salary, workingDaysCount);
        }
      }
    }

    await prisma.attendance.upsert({
      where: { userId_date: { userId, date: new Date(dateStr) } },
      create: {
        userId,
        date: new Date(dateStr),
        checkIn,
        checkOut,
        totalHours,
        lateMinutes,
        overtimeMinutes,
        deductionRuleId,
        deductionValue,
        status: lateMinutes > 0 ? 'LATE' : 'PRESENT',
      },
      update: {
        checkIn,
        checkOut,
        totalHours,
        lateMinutes,
        overtimeMinutes,
        deductionRuleId,
        deductionValue,
        status: lateMinutes > 0 ? 'LATE' : 'PRESENT',
      },
    });

    created++;
  }

  return Response.json({ created, skippedExisting, skippedNonWorking });
}
```

### 6b — UI Component

**Create:** `app/console/ops/_components/BulkSeeder.tsx`

A client component with a single form:

**Form fields:**

| Field | Input | Default |
|---|---|---|
| Employee | Dropdown (all users) | — |
| From date | Date picker | — |
| To date | Date picker | — |
| Default check-in | Time input HH:mm | 09:00 |
| Default check-out | Time input HH:mm | 17:00 |
| Randomize times (±30 min) | Checkbox | off |
| Skip non-working days | Checkbox | on |
| Skip existing records | Checkbox | on |

**On submit:** POST to `/api/console/ops/bulk-seed`.

**Result display:**
```
Done.
  Created:              47 records
  Skipped (existing):    3 records
  Skipped (non-working): 12 days
```

---

## How to Activate Super Admin

1. Deploy the app.
2. Open your Neon DB console (console.neon.tech -> your project -> SQL Editor).
3. Run:
   ```sql
   UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'your@email.com';
   ```
4. Log out and log back in (session needs to refresh).
5. Navigate directly to `/console/ops`.
6. Everyone else who visits that URL gets a standard 404 page.
