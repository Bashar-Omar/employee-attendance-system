# Fixes & Additions — Plan v3

**For AI Agent:** Standalone plan. Assumes MASTER_DEV_PLAN.md and SUPER_ADMIN_PLAN.md
are fully implemented. All tasks are self-contained with exact files and expected behavior.

---

## TASK 1 — Fix: Single Attendance Record Does Not Load Existing Records

**Location:** `app/console/ops/_components/AttendanceEditor.tsx`

**Problem:** When an employee and date are selected, the form always shows "Ready for new record"
even if an attendance record already exists for that employee on that date.

**Root cause to check:** The fetch call to look up an existing record is either not firing,
using the wrong date format, or the API is not matching correctly.

**Fix — Frontend:**

When both `userId` and `date` are selected, immediately fetch the existing record:

```typescript
useEffect(() => {
  if (!userId || !date) return;
  setLoading(true);

  fetch(`/api/console/ops/attendance?userId=${userId}&date=${date}`)
    .then((res) => res.json())
    .then((data) => {
      if (data && data.id) {
        setMode('edit');
        setForm(data); // pre-fill all form fields
      } else {
        setMode('insert');
        setForm(defaultForm); // reset to empty
      }
    })
    .finally(() => setLoading(false));
}, [userId, date]);
```

Show a clear status label above the form:
- Edit mode: `Loaded existing record — {date}` (green badge)
- Insert mode: `No record found — creating new` (gray badge)

**Fix — API (add GET handler):**

**File:** `app/api/console/ops/attendance/route.ts`

Add a GET handler alongside the existing POST and DELETE:

```typescript
export async function GET(req: Request) {
  const denied = await guardSuperAdminApi();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const date = searchParams.get('date'); // "2024-03-15"

  if (!userId || !date) {
    return Response.json({ error: 'userId and date are required' }, { status: 400 });
  }

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const record = await prisma.attendance.findFirst({
    where: {
      userId,
      date: { gte: dayStart, lte: dayEnd },
    },
  });

  // Return null body (not 404) so the frontend can distinguish "not found" from "error"
  return Response.json(record ?? null);
}
```

---

## TASK 2 — Fix: Remove Unnecessary Location Fields, Auto-Generate Based on Status

**Location:** `app/console/ops/_components/AttendanceEditor.tsx`

**Problem:** The form shows `In Latitude`, `In Longitude`, `In Distance (m)` as manual inputs
which are unnecessary for manual data entry.

**Fix:** Replace all raw location inputs with a single status dropdown per event:

**Check-in section — keep only:**
```
Check-in time    [time input]
In Status        [dropdown: INSIDE / OUTSIDE]
```

**Check-out section — keep only:**
```
Check-out time   [time input]
Out Status       [dropdown: INSIDE / OUTSIDE]
```

**Auto-generate location data on save** based on the selected status:

```typescript
function generateLocationData(status: 'INSIDE' | 'OUTSIDE') {
  if (status === 'INSIDE') {
    // Simulate being inside the office — near-zero distance, fixed coords with minor noise
    return {
      latitude: 30.0444 + (Math.random() - 0.5) * 0.001,
      longitude: 31.2357 + (Math.random() - 0.5) * 0.001,
      distance: Math.random() * 50, // 0-50 meters
    };
  } else {
    // Simulate being outside
    return {
      latitude: 30.0444 + (Math.random() - 0.5) * 0.01,
      longitude: 31.2357 + (Math.random() - 0.5) * 0.01,
      distance: 200 + Math.random() * 800, // 200-1000 meters
    };
  }
}
```

Before calling the API, build the full payload:

```typescript
const inLocation = generateLocationData(form.inStatus);
const outLocation = form.outStatus ? generateLocationData(form.outStatus) : null;

const payload = {
  userId,
  date,
  checkInTime: form.checkInTime,
  checkOutTime: form.checkOutTime,
  inStatus: form.inStatus,
  inLatitude: inLocation.latitude,
  inLongitude: inLocation.longitude,
  inDistance: inLocation.distance,
  outStatus: form.outStatus ?? null,
  outLatitude: outLocation?.latitude ?? null,
  outLongitude: outLocation?.longitude ?? null,
  outDistance: outLocation?.distance ?? null,
  // ... rest of fields
};
```

---

## TASK 3 — Fix: Late Minutes and Overtime Not Auto-Calculating

**Location:** `app/console/ops/_components/AttendanceEditor.tsx`
**Also check:** `app/api/console/ops/attendance/route.ts`

**Problem:** When `lateMinutes` and `overtimeMinutes` are left empty, they are supposed to be
calculated automatically from the employee's shift, but they come through as 0 or null.

**Fix — Frontend:**

Add a visible toggle: `Auto-calculate late & overtime from shift` (default: on).

When the toggle is ON and check-in/check-out times are entered, immediately show a preview:

```typescript
useEffect(() => {
  if (!autoCalculate || !selectedEmployee?.shift || !form.checkInTime) return;

  const lateMin = calculateLateMinutesClient(
    form.checkInTime,
    selectedEmployee.shift.startTime,
    selectedEmployee.shift.gracePeriodMins
  );

  const overtimeMin =
    form.checkOutTime
      ? calculateOvertimeMinutesClient(
          form.checkOutTime,
          selectedEmployee.shift.endTime,
          selectedEmployee.shift.overtimeAfterMins
        )
      : 0;

  setForm((prev) => ({ ...prev, lateMinutes: lateMin, overtimeMinutes: overtimeMin }));
}, [form.checkInTime, form.checkOutTime, autoCalculate]);
```

Implement these client-side helpers (same logic as the server-side versions in
`lib/payroll/calculateLate.ts` but working with plain HH:mm strings):

```typescript
function calculateLateMinutesClient(
  checkInTime: string,   // "09:35"
  shiftStart: string,    // "09:00"
  gracePeriodMins: number
): number {
  const [inH, inM] = checkInTime.split(':').map(Number);
  const [shH, shM] = shiftStart.split(':').map(Number);
  const diff = (inH * 60 + inM) - (shH * 60 + shM);
  return diff <= gracePeriodMins ? 0 : diff;
}

function calculateOvertimeMinutesClient(
  checkOutTime: string,  // "18:15"
  shiftEnd: string,      // "17:00"
  overtimeAfterMins: number
): number {
  const [outH, outM] = checkOutTime.split(':').map(Number);
  const [shH, shM] = shiftEnd.split(':').map(Number);
  const diff = (outH * 60 + outM) - (shH * 60 + shM);
  return diff <= overtimeAfterMins ? 0 : diff;
}
```

Show a live preview below the time inputs when auto-calculate is on:
```
Late: 35 minutes  |  Overtime: 0 minutes
```

**Fix — API:**

In `app/api/console/ops/attendance/route.ts`, the POST handler must also calculate
late/overtime server-side when `autoCalculate: true` is passed in the body,
as a safety net in case the frontend value is wrong:

```typescript
if (body.autoCalculate && employee.shift) {
  const checkInDate = new Date(`${date}T${body.checkInTime}:00+02:00`);
  lateMinutes = calculateLateMinutes(checkInDate, employee.shift.startTime, employee.shift.gracePeriodMins);

  if (body.checkOutTime) {
    const checkOutDate = new Date(`${date}T${body.checkOutTime}:00+02:00`);
    overtimeMinutes = calculateOvertimeMinutes(checkOutDate, employee.shift.endTime, employee.shift.overtimeAfterMins);
  }
}
```

---

## TASK 4 — Fix: Bulk Seeder — Replace ±30min Toggle with Custom Time Ranges

**Location:** `app/console/ops/_components/BulkSeeder.tsx`
**Also:** `app/api/console/ops/bulk-seed/route.ts`

**Change:** Remove the `Randomize times (±30 min)` checkbox.
Replace with two range inputs — one for check-in, one for check-out:

**New form fields:**

```
Check-in range:
  Earliest  [time input]   Latest  [time input]
  Example:  08:45           09:30

Check-out range:
  Earliest  [time input]   Latest  [time input]
  Example:  17:00           18:30
```

Each generated day picks a random time within the given range.
If Earliest == Latest, all days get the exact same time (no randomness).

**Update API body schema:**

```typescript
// OLD
{ checkInTime: string, checkOutTime: string, randomize: boolean }

// NEW
{
  checkInFrom: string,  // "08:45"
  checkInTo: string,    // "09:30"
  checkOutFrom: string, // "17:00"
  checkOutTo: string,   // "18:30"
}
```

**Update random time generation in the API:**

```typescript
function randomTimeBetween(from: string, to: string): string {
  const [fH, fM] = from.split(':').map(Number);
  const [tH, tM] = to.split(':').map(Number);
  const fromMins = fH * 60 + fM;
  const toMins = tH * 60 + tM;
  const randomMins = fromMins + Math.floor(Math.random() * (toMins - fromMins + 1));
  return `${String(Math.floor(randomMins / 60)).padStart(2, '0')}:${String(randomMins % 60).padStart(2, '0')}`;
}

// Usage per day:
const finalIn = randomTimeBetween(checkInFrom, checkInTo);
const finalOut = randomTimeBetween(checkOutFrom, checkOutTo);
```

---

## TASK 5 — Fix: Employee Dropdown Shows Only EMPLOYEE Role

**Applies to:** Both `AttendanceEditor.tsx` and `BulkSeeder.tsx`

**Problem:** The employee dropdown currently fetches all users including admins.

**Fix — API:**

Create a dedicated endpoint that returns only employees:

**File:** `app/api/console/ops/employees/route.ts`

```typescript
import { guardSuperAdminApi } from '@/lib/auth/superAdmin';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const denied = await guardSuperAdminApi();
  if (denied) return denied;

  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE', isActive: true },
    select: { id: true, name: true, employeeId: true },
    orderBy: { name: 'asc' },
  });

  return Response.json(employees);
}
```

**Fix — Frontend:**

Both components fetch from `/api/console/ops/employees` instead of any general users endpoint.

---

## TASK 6 — Fix: Add Edit Functionality to Shifts

**Location:** `app/admin/shifts/page.tsx` and `app/admin/shifts/[id]/page.tsx`

**Problem:** Shifts can only be deleted or have deduction rules configured.
There is no way to edit the shift's name, times, grace period, overtime threshold, or work days.

**Fix:** Add an Edit button to each shift in the list that opens an edit form pre-filled
with the existing values. The form fields are identical to the create form:

- Name
- Start time
- End time
- Grace period (minutes)
- Overtime starts after (minutes)
- Work days (checkboxes)

On submit, call `PUT /api/shifts/[id]` — this route already exists from MASTER_DEV_PLAN TASK 3.1.
Make sure the PUT handler accepts and updates all fields:

```typescript
// app/api/shifts/[id]/route.ts — PUT handler
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!hasAdminAccess(session?.user?.role)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const { name, startTime, endTime, gracePeriodMins, overtimeAfterMins, workDays } = await req.json();
  const shift = await prisma.shift.update({
    where: { id: params.id },
    data: { name, startTime, endTime, gracePeriodMins, overtimeAfterMins, workDays },
  });
  return Response.json(shift);
}
```

---

## TASK 7 — Fix: Verify and Repair Deduction Calculation Pipeline

**Problem:** Late minutes and overtime are not being calculated or applied correctly
in the payroll flow. This task is a full audit and fix of the calculation pipeline.

### Step 1 — Verify check-in API saves lateMinutes correctly

**File:** The attendance check-in API route (find it under `app/api/attendance/`)

Confirm this logic exists and works:
1. Fetch the employee with their shift and shift's deduction rules.
2. Call `calculateLateMinutes(checkInTime, shift.startTime, shift.gracePeriodMins)`.
3. Call `findApplicableRule(lateMinutes, false, rules)`.
4. Call `calculateDailyDeductionAmount(rule, employee.salary, workingDaysInMonth)`.
5. Save `lateMinutes`, `deductionRuleId`, and `deductionValue` on the attendance record.

If any of these steps are missing or not saving to DB, add them.

### Step 2 — Verify check-out API saves overtimeMinutes correctly

**File:** The attendance check-out API route

Confirm this logic exists:
1. Fetch the employee with their shift.
2. Call `calculateOvertimeMinutes(checkOutTime, shift.endTime, shift.overtimeAfterMins)`.
3. Save `overtimeMinutes` on the attendance record.
4. Recalculate `totalHours = (checkOut - checkIn) / 3600000`.

### Step 3 — Add a debug endpoint (temporary, super admin only)

**Create:** `app/api/console/ops/debug/attendance/[id]/route.ts`

Returns the full breakdown for a single attendance record to help verify calculations:

```typescript
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const denied = await guardSuperAdminApi();
  if (denied) return denied;

  const record = await prisma.attendance.findUnique({
    where: { id: params.id },
    include: {
      user: {
        include: {
          shift: { include: { deductionRules: true } },
        },
      },
    },
  });

  if (!record) return Response.json({ error: 'Not found' }, { status: 404 });

  const shift = record.user.shift;
  const expectedLate = shift && record.checkIn
    ? calculateLateMinutes(record.checkIn, shift.startTime, shift.gracePeriodMins)
    : null;
  const expectedOvertime = shift && record.checkOut
    ? calculateOvertimeMinutes(record.checkOut, shift.endTime, shift.overtimeAfterMins)
    : null;
  const matchedRule = shift && expectedLate !== null
    ? findApplicableRule(expectedLate, false, shift.deductionRules)
    : null;

  return Response.json({
    record,
    debug: {
      shiftStart: shift?.startTime,
      shiftEnd: shift?.endTime,
      gracePeriod: shift?.gracePeriodMins,
      expectedLateMinutes: expectedLate,
      storedLateMinutes: record.lateMinutes,
      lateMinutesMismatch: expectedLate !== record.lateMinutes,
      expectedOvertimeMinutes: expectedOvertime,
      storedOvertimeMinutes: record.overtimeMinutes,
      overtimeMismatch: expectedOvertime !== record.overtimeMinutes,
      matchedRule: matchedRule ?? 'none',
      storedDeductionValue: record.deductionValue,
    },
  });
}
```

Use this endpoint to diagnose any mismatch between expected and stored values.

---

## TASK 8 — New: Employee Payroll View (Read-Only)

**Location:** `app/employee/dashboard/` or a new route `app/employee/payroll/`

**Purpose:** Employees can see their own payroll summary and deduction breakdown —
read-only, no edit controls, no other employees' data.

### 8a — API Route

**Create:** `app/api/employee/payroll/route.ts`

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()));

  // Employee can only see their own data
  const summary = await prisma.monthlySummary.findUnique({
    where: { userId_month_year: { userId: session.user.id, month, year } },
  });

  const attendances = await prisma.attendance.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month, 0, 23, 59, 59),
      },
    },
    include: {
      // Include the matched deduction rule label for display
    },
    orderBy: { date: 'asc' },
  });

  return Response.json({ summary, attendances });
}
```

### 8b — Page

**Create:** `app/employee/payroll/page.tsx`

**UI sections:**

**Section 1 — Month selector:** dropdown to pick month and year (defaults to current month).

**Section 2 — Summary cards (read-only):**

```
Working Days: 22  |  Present: 20  |  Absent: 2  |  Late Days: 5
Base Salary: 10,000 EGP
Deductions:  -850 EGP
Overtime:    +200 EGP
Net Salary:  9,350 EGP
```

**Section 3 — Daily attendance detail table:**

| Date | Check-in | Check-out | Hours | Late (min) | Deduction | Overtime (min) | Status |
|------|----------|-----------|-------|-----------|-----------|----------------|--------|
| Mon 01 Jan | 09:15 | 17:30 | 8.25h | 15 min | -45 EGP | 0 | LATE |
| Tue 02 Jan | 09:00 | 17:00 | 8.00h | 0 | — | 0 | PRESENT |

- Show times in Egypt timezone using the `toEgyptTimeOnly` utility.
- Highlight late days with a soft amber row background.
- Highlight absent days with a soft red row background.
- If no summary exists yet for the selected month, show: "Payroll for this month has not been calculated yet."

---

## TASK 9 — New: Enhanced Payslip with Daily Attendance Detail

**Location:** `app/admin/payroll/[userId]/[year]/[month]/page.tsx`

**Current state:** Payslip shows salary summary only.

**Add below the salary breakdown: a full daily attendance table for that month.**

### Table columns:

| Date | Day | Check-in | Check-out | Total Hours | Late (min) | Deduction Applied | Overtime (min) | Status |
|------|-----|----------|-----------|-------------|-----------|-------------------|----------------|--------|

**Formatting rules:**
- All times shown in Egypt timezone.
- Late rows: amber/yellow left border or row tint.
- Absent rows: red left border or row tint.
- Present on time: no special styling.
- Working days with no record at all (employee didn't check in): show as ABSENT automatically.

**At the bottom of the table, show totals row:**
```
Total  |  —  |  —  |  —  |  186.5h  |  145 min  |  -680 EGP  |  90 min  |  —
```

### Data fetching:

In the page server component, fetch both the `MonthlySummary` and all `Attendance` records
for that employee in that month:

```typescript
const [summary, attendances] = await Promise.all([
  prisma.monthlySummary.findUnique({
    where: { userId_month_year: { userId, month: Number(month), year: Number(year) } },
    include: { user: { include: { shift: true } } },
  }),
  prisma.attendance.findMany({
    where: {
      userId,
      date: {
        gte: new Date(Number(year), Number(month) - 1, 1),
        lte: new Date(Number(year), Number(month), 0, 23, 59, 59),
      },
    },
    orderBy: { date: 'asc' },
  }),
]);
```

Then build a complete list of all working days in the month (based on shift.workDays),
merge with attendance records, and fill gaps as ABSENT.

### Print behavior:

The daily table must also print. Add to print CSS:

```css
@media print {
  .no-print { display: none; }
  table { page-break-inside: auto; }
  tr { page-break-inside: avoid; }
  body { font-size: 10pt; }
}
```
