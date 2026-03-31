# Employee Attendance System — Master Development Plan

**For AI Agent:** This file is the single source of truth. Every task is self-contained.
Start from any task directly without needing prior context.

---

## Project Context

**Stack:** Next.js 16, Prisma 5.22, PostgreSQL (Neon), NextAuth v5, TypeScript, Tailwind CSS v4
**Deploy:** Vercel (free plan) + Neon DB
**Repo:** github.com/Bashar-Omar/employee-attendance-system
**Current Schema:** `User` + `Attendance` models only (see prisma/schema.prisma)
**Timezone:** Egypt — always use `Africa/Cairo` for all date/time display

---

## Current File Structure (known)

```
app/
  api/
    auth/[...nextauth]/
    health/route.ts
  admin/
    dashboard/
    employees/
      [id]/
        edit/
      new/
  employee/
    dashboard/
  login/
lib/
  auth.ts
  db/prisma.ts
prisma/
  schema.prisma
  seed.mjs
```

---

## PHASE 1 — Bug Fixes

### TASK 1.1 — Fix Timezone Display Bug (CRITICAL — fix this first)

**Problem:** Check-in and check-out times are stored correctly as UTC in the DB, but displayed
as raw UTC strings in the UI. Result: an employee who checks in at 10:00 AM Cairo time sees
08:00 AM or 07:00 AM on screen.

**Step 1 — Create a date utility file:**

File to create: `lib/utils/date.ts`

```typescript
export function toEgyptTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-GB', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function toEgyptTimeOnly(date: Date | string): string {
  return new Date(date).toLocaleString('en-GB', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function toEgyptDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
```

**Step 2 — Find and replace every raw date display:**

Search the entire codebase for any of these patterns and replace with the utility functions above:
- `new Date(checkIn).toLocaleString()`
- `new Date(checkOut).toLocaleString()`
- `new Date(date).toLocaleDateString()`
- `.toISOString()` used for display (not for DB storage — keep ISO for DB)

**Step 3 — Fix "already checked in today" logic:**

When checking if an employee already has an attendance record for today, the comparison must
use Egypt date, not UTC date. Example fix:

```typescript
// WRONG — compares UTC midnight
const today = new Date();
today.setHours(0, 0, 0, 0);

// CORRECT — get Egypt local date as a string and compare
function getEgyptDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }); // "2024-03-15"
}
```

**Test:** Employee checks in at 10:00 AM Cairo time -> UI must show 10:00, not 08:00 or 07:00.

---

### TASK 1.2 — Fix Admin Cannot Create Other Admins

**Problem:** No UI option to set a user role as ADMIN when creating or editing an employee.

**Files to edit:**
- `app/admin/employees/new/page.tsx` — add role dropdown to the create form
- `app/admin/employees/[id]/edit/page.tsx` — add role dropdown to the edit form
- The API route that handles employee creation and update — make sure it accepts and saves the `role` field

**Fix:** Add a role selector field:

```tsx
<select name="role" defaultValue="EMPLOYEE">
  <option value="EMPLOYEE">Employee</option>
  <option value="ADMIN">Admin</option>
</select>
```

---

## PHASE 2 — Schema Expansion

### TASK 2.1 — Update Prisma Schema

**File:** `prisma/schema.prisma`

Replace the entire content with:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id             String     @id @default(cuid())
  employeeId     String     @unique
  email          String     @unique
  password       String
  name           String     @default("User")
  role           String     @default("EMPLOYEE")
  isActive       Boolean    @default(true)
  spreadsheetId  String?

  salary         Float?
  jobTitle       String?
  phone          String?
  hireDate       DateTime?

  shiftId        String?
  shift          Shift?     @relation(fields: [shiftId], references: [id])
  departmentId   String?
  department     Department? @relation(fields: [departmentId], references: [id])

  attendances      Attendance[]
  monthlySummaries MonthlySummary[]

  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @default(now()) @updatedAt
}

model Department {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  users       User[]
  createdAt   DateTime @default(now())
}

model Shift {
  id                String          @id @default(cuid())
  name              String          @unique
  startTime         String          // "09:00" HH:mm Egypt local time
  endTime           String          // "17:00" HH:mm Egypt local time
  gracePeriodMins   Int             @default(15)
  overtimeAfterMins Int             @default(0)
  workDays          String          @default("0,1,2,3,4") // 0=Sun,1=Mon,...,6=Sat
  deductionRules    DeductionRule[]
  users             User[]
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @default(now()) @updatedAt
}

// Fully admin-configurable deduction rules.
// Each rule belongs to a shift and defines what to deduct under a given condition.
// Admins manage these entirely through the UI — no code changes needed to update rules.
model DeductionRule {
  id                String   @id @default(cuid())
  shiftId           String
  shift             Shift    @relation(fields: [shiftId], references: [id], onDelete: Cascade)

  // LATE | ABSENT | EARLY_LEAVE
  type              String   @default("LATE")

  // For LATE rules: range of late minutes that triggers this rule
  // lateMinutesTo = null means "no upper limit"
  lateMinutesFrom   Int      @default(0)
  lateMinutesTo     Int?

  // PERCENTAGE | FIXED_AMOUNT — admin chooses
  deductionType     String   @default("PERCENTAGE")
  deductionValue    Float    // if PERCENTAGE: 0-100, if FIXED_AMOUNT: EGP value

  label             String?  // optional human-readable label e.g. "Minor late (1-30 min)"
  createdAt         DateTime @default(now())
}

model Attendance {
  id               String    @id @default(cuid())
  userId           String
  date             DateTime
  status           String    @default("PRESENT") // PRESENT | ABSENT | LATE | HOLIDAY | LEAVE
  checkIn          DateTime?
  checkOut         DateTime?
  inLatitude       Float?
  inLongitude      Float?
  inStatus         String?
  inDistance       Float?
  outLatitude      Float?
  outLongitude     Float?
  outStatus        String?
  outDistance      Float?
  totalHours       Float?
  lateMinutes      Int?
  overtimeMinutes  Int?
  deductionRuleId  String?   // which rule was matched (for audit trail)
  deductionValue   Float?    // actual EGP amount deducted that day (stored for audit)
  notes            String?
  user             User      @relation(fields: [userId], references: [id])
}

model MonthlySummary {
  id                  String    @id @default(cuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id])
  month               Int
  year                Int
  workingDays         Int       @default(0)
  presentDays         Int       @default(0)
  absentDays          Int       @default(0)
  lateDays            Int       @default(0)
  totalLateMinutes    Int       @default(0)
  totalOvertimeHours  Float     @default(0)
  baseSalary          Float     @default(0)
  totalDeductions     Float     @default(0)
  overtimePay         Float     @default(0)
  finalSalary         Float     @default(0)
  notes               String?
  isFinalized         Boolean   @default(false)
  finalizedAt         DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @default(now()) @updatedAt

  @@unique([userId, month, year])
}
```

**After editing the schema, always run:**
```bash
npx prisma db push
npx prisma generate
```

---

### TASK 2.2 — Update Seed Script

**File:** `prisma/seed.mjs`

After the existing admin user upsert, add:

```javascript
// Default department
await prisma.department.upsert({
  where: { name: 'General' },
  update: {},
  create: { name: 'General', description: 'Default department' },
});
console.log('Default department ready');

// Default shift
const defaultShift = await prisma.shift.upsert({
  where: { name: 'Default Shift' },
  update: {},
  create: {
    name: 'Default Shift',
    startTime: '09:00',
    endTime: '17:00',
    gracePeriodMins: 15,
    overtimeAfterMins: 30,
    workDays: '0,1,2,3,4', // Sun-Thu (Egyptian work week)
  },
});
console.log('Default shift ready');

// Starter deduction rules — admin can edit/delete/add any of these from the UI
const defaultRules = [
  { type: 'LATE',   lateMinutesFrom: 1,   lateMinutesTo: 30,   deductionType: 'PERCENTAGE', deductionValue: 5,   label: 'Minor late (1-30 min)' },
  { type: 'LATE',   lateMinutesFrom: 31,  lateMinutesTo: 60,   deductionType: 'PERCENTAGE', deductionValue: 10,  label: 'Late (31-60 min)' },
  { type: 'LATE',   lateMinutesFrom: 61,  lateMinutesTo: 120,  deductionType: 'PERCENTAGE', deductionValue: 15,  label: 'Very late (1-2 hrs)' },
  { type: 'LATE',   lateMinutesFrom: 121, lateMinutesTo: null, deductionType: 'PERCENTAGE', deductionValue: 25,  label: 'Severely late (2+ hrs)' },
  { type: 'ABSENT', lateMinutesFrom: 0,   lateMinutesTo: null, deductionType: 'PERCENTAGE', deductionValue: 100, label: 'Full day absent' },
];

for (const rule of defaultRules) {
  await prisma.deductionRule.create({ data: { shiftId: defaultShift.id, ...rule } });
}
console.log('Default deduction rules ready (admin can modify these from the UI)');
```

---

## PHASE 3 — Shifts & Deduction Rules Management

### TASK 3.1 — Shifts List & Create Page

**Create:** `app/admin/shifts/page.tsx`

Display a table of all shifts. Include a "New Shift" button that opens a form (inline or modal).

**Fields per shift:**
- Name
- Start time (time input, HH:mm)
- End time (time input, HH:mm)
- Grace period in minutes (number input)
- Overtime starts after X minutes past end time (number input)
- Work days (checkboxes: Sun / Mon / Tue / Wed / Thu / Fri / Sat)

**API routes to create:**

`app/api/shifts/route.ts`
```typescript
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const shifts = await prisma.shift.findMany({
    include: { deductionRules: { orderBy: { lateMinutesFrom: 'asc' } } },
    orderBy: { name: 'asc' },
  });
  return Response.json(shifts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const body = await req.json();
  const shift = await prisma.shift.create({ data: body });
  return Response.json(shift, { status: 201 });
}
```

`app/api/shifts/[id]/route.ts`
```typescript
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const body = await req.json();
  const shift = await prisma.shift.update({ where: { id: params.id }, data: body });
  return Response.json(shift);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  await prisma.shift.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
```

---

### TASK 3.2 — Deduction Rules Manager (Fully Admin-Configurable)

**Add to:** `app/admin/shifts/[id]/page.tsx` as a section within the shift detail/edit page.

This is the core of the configurable deduction system. The admin can add, edit, and delete rules
at any time without any code changes. The calculation engine reads whatever rules exist in the DB.

**UI: rules table**

| Type | From (min) | To (min) | Deduction Type | Value | Label | Actions |
|------|-----------|---------|----------------|-------|-------|---------|
| LATE | 1 | 30 | Percentage | 5% | Minor late | Edit / Delete |
| LATE | 31 | 60 | Percentage | 10% | Late | Edit / Delete |
| ABSENT | — | — | Percentage | 100% | Full day absent | Edit / Delete |

**"Add Rule" form fields:**
- Type: dropdown — Late / Absent / Early Leave
- From (minutes): number input — visible only for Late and Early Leave
- To (minutes): number input — optional, leave blank for no upper limit
- Deduction type: radio toggle — Percentage (%) / Fixed Amount (EGP)
- Value: number input
- Label: text input — optional, shown only in admin UI for reference

**Helper text under the form:**
- When Percentage is selected: "Deducted percentage is applied to the employee's daily salary (monthly salary divided by working days in the month)."
- When Fixed Amount is selected: "A fixed EGP amount deducted regardless of salary."

**API routes to create:**

`app/api/shifts/[id]/deduction-rules/route.ts`
```typescript
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const body = await req.json();
  const rule = await prisma.deductionRule.create({ data: { ...body, shiftId: params.id } });
  return Response.json(rule, { status: 201 });
}
```

`app/api/shifts/[id]/deduction-rules/[ruleId]/route.ts`
```typescript
export async function PUT(req: Request, { params }: { params: { id: string; ruleId: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const body = await req.json();
  const rule = await prisma.deductionRule.update({ where: { id: params.ruleId }, data: body });
  return Response.json(rule);
}

export async function DELETE(_: Request, { params }: { params: { id: string; ruleId: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  await prisma.deductionRule.delete({ where: { id: params.ruleId } });
  return Response.json({ ok: true });
}
```

---

## PHASE 4 — Departments Management

### TASK 4.1 — Departments CRUD Page

**Create:** `app/admin/departments/page.tsx`

Simple table of all departments with an inline "Add Department" form.

**Fields:** Name, Description (optional)

**API routes to create:**

`app/api/departments/route.ts`
```typescript
export async function GET() {
  const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
  return Response.json(departments);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const body = await req.json();
  const dept = await prisma.department.create({ data: body });
  return Response.json(dept, { status: 201 });
}
```

`app/api/departments/[id]/route.ts` — PUT and DELETE, same auth-check pattern as shifts.

---

## PHASE 5 — Enhanced Employee Profile

### TASK 5.1 — Update Employee Edit Form

**Files to edit:**
- `app/admin/employees/[id]/edit/page.tsx`
- `app/admin/employees/new/page.tsx`

**New fields to add to both forms:**
- `salary` — number input, monthly salary in EGP
- `jobTitle` — text input
- `phone` — text input
- `hireDate` — date input
- `role` — dropdown: Employee / Admin
- `shiftId` — dropdown, populated by fetching `GET /api/shifts`
- `departmentId` — dropdown, populated by fetching `GET /api/departments`

Update the API routes that handle create and update to accept and save these fields.

---

### TASK 5.2 — Employee Profile Tabs

**File:** `app/admin/employees/[id]/page.tsx`

Add a three-tab layout:

**Tab 1: Basic Info**
Name, email, phone, job title, department, shift, salary, hire date, role, active status.

**Tab 2: Attendance Log**
The existing attendance table, with timezone fix applied (TASK 1.1).
Columns: Date | Check-in | Check-out | Total Hours | Late Minutes | Deduction Applied | Status

**Tab 3: Monthly Summaries**
Table of MonthlySummary records for this employee.
Columns: Month/Year | Present | Absent | Late Days | Base Salary | Deductions | Overtime | Net Salary | Status | Actions
Actions per row: Recalculate | View Payslip

---

## PHASE 6 — Deduction Calculation Engine

### TASK 6.1 — Late and Overtime Calculator

**Create:** `lib/payroll/calculateLate.ts`

```typescript
/**
 * Returns how many minutes late the employee checked in.
 * Returns 0 if within grace period.
 * Comparison is done in Egypt local time.
 */
export function calculateLateMinutes(
  checkInUtc: Date,
  shiftStartTime: string, // "09:00"
  gracePeriodMins: number
): number {
  const egyptTime = new Date(checkInUtc).toLocaleTimeString('en-GB', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const [checkInH, checkInM] = egyptTime.split(':').map(Number);
  const [shiftH, shiftM] = shiftStartTime.split(':').map(Number);
  const diff = (checkInH * 60 + checkInM) - (shiftH * 60 + shiftM);
  return diff <= gracePeriodMins ? 0 : diff;
}

/**
 * Returns how many overtime minutes the employee worked past shift end.
 * Returns 0 if within the overtime threshold.
 */
export function calculateOvertimeMinutes(
  checkOutUtc: Date,
  shiftEndTime: string, // "17:00"
  overtimeAfterMins: number
): number {
  const egyptTime = new Date(checkOutUtc).toLocaleTimeString('en-GB', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const [outH, outM] = egyptTime.split(':').map(Number);
  const [shiftH, shiftM] = shiftEndTime.split(':').map(Number);
  const diff = (outH * 60 + outM) - (shiftH * 60 + shiftM);
  return diff <= overtimeAfterMins ? 0 : diff;
}
```

---

### TASK 6.2 — Deduction Calculator (Reads Admin Rules from DB)

**Create:** `lib/payroll/calculateDeduction.ts`

```typescript
import type { DeductionRule } from '@prisma/client';

/**
 * Finds the best matching deduction rule from the DB for a given attendance event.
 * Returns null if no rule applies.
 * Rules are defined by the admin in the UI — never hardcoded here.
 */
export function findApplicableRule(
  lateMinutes: number,
  isAbsent: boolean,
  rules: DeductionRule[]
): DeductionRule | null {
  const matches = rules.filter((r) => {
    if (isAbsent) return r.type === 'ABSENT';
    if (r.type !== 'LATE') return false;
    if (lateMinutes < r.lateMinutesFrom) return false;
    if (r.lateMinutesTo !== null && lateMinutes > r.lateMinutesTo) return false;
    return true;
  });
  if (matches.length === 0) return null;
  // If multiple rules match, use the most specific (highest lower bound)
  return matches.sort((a, b) => b.lateMinutesFrom - a.lateMinutesFrom)[0];
}

/**
 * Calculates the actual EGP deduction amount for one day.
 * Handles both PERCENTAGE and FIXED_AMOUNT rule types.
 */
export function calculateDailyDeductionAmount(
  rule: DeductionRule,
  monthlySalary: number,
  workingDaysInMonth: number
): number {
  if (rule.deductionType === 'FIXED_AMOUNT') {
    return rule.deductionValue;
  }
  const dailySalary = monthlySalary / workingDaysInMonth;
  return (dailySalary * rule.deductionValue) / 100;
}
```

---

### TASK 6.3 — Update Check-in API to Apply Rules

**File:** The API route that handles employee check-in (find it under `app/api/attendance/` or similar).

When saving an attendance record, calculate late minutes, find the matching rule, and store the deduction:

```typescript
import { calculateLateMinutes } from '@/lib/payroll/calculateLate';
import { findApplicableRule, calculateDailyDeductionAmount } from '@/lib/payroll/calculateDeduction';
import { countWorkingDays } from '@/lib/payroll/calculateMonthlySummary';

// After verifying employee and shift:
const shift = employee.shift;
const lateMinutes = shift
  ? calculateLateMinutes(checkInTime, shift.startTime, shift.gracePeriodMins)
  : 0;

let deductionRuleId: string | null = null;
let deductionValue: number | null = null;

if (shift && lateMinutes > 0 && employee.salary) {
  const rules = await prisma.deductionRule.findMany({ where: { shiftId: shift.id } });
  const now = new Date();
  const workingDays = countWorkingDays(now.getFullYear(), now.getMonth() + 1, shift.workDays);
  const matchedRule = findApplicableRule(lateMinutes, false, rules);
  if (matchedRule) {
    deductionRuleId = matchedRule.id;
    deductionValue = calculateDailyDeductionAmount(matchedRule, employee.salary, workingDays);
  }
}

await prisma.attendance.create({
  data: {
    userId,
    date: todayMidnight,
    checkIn: checkInTime,
    status: lateMinutes > 0 ? 'LATE' : 'PRESENT',
    lateMinutes,
    deductionRuleId,
    deductionValue,
    // ... rest of existing fields
  },
});
```

---

## PHASE 7 — Monthly Payroll Closing

### TASK 7.1 — Monthly Summary Calculator

**Create:** `lib/payroll/calculateMonthlySummary.ts`

```typescript
import { PrismaClient } from '@prisma/client';

export async function calculateMonthlySummary(
  userId: string,
  month: number, // 1-12
  year: number,
  prisma: PrismaClient
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { shift: true },
  });
  if (!user) throw new Error('User not found');

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  const attendances = await prisma.attendance.findMany({
    where: { userId, date: { gte: startDate, lte: endDate } },
  });

  const workDays = user.shift?.workDays ?? '0,1,2,3,4';
  const workingDays = countWorkingDays(year, month, workDays);
  const presentDays = attendances.filter((a) => a.status !== 'ABSENT').length;
  const absentDays = Math.max(0, workingDays - presentDays);
  const lateDays = attendances.filter((a) => (a.lateMinutes ?? 0) > 0).length;
  const totalLateMinutes = attendances.reduce((s, a) => s + (a.lateMinutes ?? 0), 0);
  const totalOvertimeMins = attendances.reduce((s, a) => s + (a.overtimeMinutes ?? 0), 0);

  const baseSalary = user.salary ?? 0;
  const dailySalary = workingDays > 0 ? baseSalary / workingDays : 0;

  // Deductions already computed per-day and stored on each attendance record
  const deductionsFromAttendance = attendances.reduce((s, a) => s + (a.deductionValue ?? 0), 0);
  // Add absent day deductions on top
  const totalDeductions = deductionsFromAttendance + absentDays * dailySalary;

  // Overtime pay: 1.5x hourly rate (8-hour workday assumed)
  const overtimePay = ((totalOvertimeMins / 60) * (dailySalary / 8)) * 1.5;
  const finalSalary = Math.max(0, baseSalary - totalDeductions + overtimePay);

  return prisma.monthlySummary.upsert({
    where: { userId_month_year: { userId, month, year } },
    create: {
      userId, month, year, workingDays, presentDays, absentDays, lateDays,
      totalLateMinutes, totalOvertimeHours: totalOvertimeMins / 60,
      baseSalary, totalDeductions, overtimePay, finalSalary,
    },
    update: {
      workingDays, presentDays, absentDays, lateDays, totalLateMinutes,
      totalOvertimeHours: totalOvertimeMins / 60,
      baseSalary, totalDeductions, overtimePay, finalSalary,
    },
  });
}

export function countWorkingDays(year: number, month: number, workDaysCsv: string): number {
  const workDays = workDaysCsv.split(',').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (workDays.includes(new Date(year, month - 1, d).getDay())) count++;
  }
  return count;
}
```

---

### TASK 7.2 — Payroll Overview Page

**Create:** `app/admin/payroll/page.tsx`

**UI elements:**
- Month and year dropdowns at the top
- "Calculate All" button — triggers recalculation for all active employees for that month
- Table of employees and their monthly summary

**Table columns:**
Name | Working Days | Present | Absent | Late Days | Total Late (min) | Base Salary | Deductions | Overtime | Net Salary | Status | Actions

**Status:** Draft (gray badge) or Finalized (green badge)

**Row actions:** Recalculate | View Payslip | Finalize (sets `isFinalized = true`, disables recalculate)

**API route to create:** `app/api/payroll/calculate/route.ts`
```typescript
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const { userId, month, year } = await req.json();
  const summary = await calculateMonthlySummary(userId, month, year, prisma);
  return Response.json(summary);
}
```

---

### TASK 7.3 — Payslip Print View

**Create:** `app/admin/payroll/[userId]/[year]/[month]/page.tsx`

A clean printable page layout:
- Company name header
- Employee: name, ID, job title, department
- Period: Month Year
- Attendance summary: working days, present, absent, late days, total late minutes
- Salary breakdown:
  - Base salary
  - Total deductions
  - Overtime pay
  - **Net salary** (highlighted)
- Notes field
- "Print" button triggering `window.print()`

Print styles:
```css
@media print {
  .no-print { display: none; }
  body { font-size: 12pt; }
}
```

---

## PHASE 8 — Navigation

### TASK 8.1 — Update Admin Sidebar

**File:** admin layout or shared navigation component (check `app/admin/layout.tsx`)

Add menu items:
- Employees (existing) -> `/admin/employees`
- **Shifts** -> `/admin/shifts`
- **Departments** -> `/admin/departments`
- **Payroll** -> `/admin/payroll`

---

## Recommended Implementation Order

```
STEP 1 — Bugs (deploy immediately after):
  TASK 1.1  Timezone fix
  TASK 1.2  Admin role creation

STEP 2 — Foundation (do before all other phases):
  TASK 2.1  Schema update -> run: npx prisma db push && npx prisma generate
  TASK 2.2  Seed update

STEP 3 — Admin configuration UI:
  TASK 4.1  Departments CRUD
  TASK 3.1  Shifts CRUD
  TASK 3.2  Deduction rules manager (admin-configurable)
  TASK 8.1  Navigation update

STEP 4 — Employee profile:
  TASK 5.1  Employee edit form
  TASK 5.2  Employee profile tabs

STEP 5 — Calculation engine:
  TASK 6.1  Late/overtime calculators
  TASK 6.2  Deduction calculator (reads rules from DB)
  TASK 6.3  Update check-in API

STEP 6 — Payroll:
  TASK 7.1  Monthly summary calculator
  TASK 7.2  Payroll overview page
  TASK 7.3  Payslip print view
```

---

## General Notes for Agent

1. **Auth guard:** Every admin API route must check `session.user.role === 'ADMIN'`. Follow the pattern used in existing admin routes.
2. **Schema changes:** After any edit to `prisma/schema.prisma`, always run `npx prisma db push && npx prisma generate` before writing code that uses new models.
3. **Timezone:** Never display raw UTC timestamps. Always use `lib/utils/date.ts` utilities created in TASK 1.1.
4. **Deduction rules are DB-driven:** The calculation engine must always read rules from the DB. Never hardcode percentages, thresholds, or amounts anywhere in the application logic.
5. **Daily salary formula:** `dailySalary = monthlySalary / workingDaysInMonth`. Working days are determined by the shift's `workDays` field, not calendar days.
6. **Existing patterns:** Before creating any new page or API route, look at an existing one (e.g. `app/admin/employees/`) and follow the same structure, imports, and auth pattern.
