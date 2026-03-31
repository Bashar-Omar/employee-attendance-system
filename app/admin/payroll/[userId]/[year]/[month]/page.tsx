import prisma from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PrintButton from './PrintButton';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default async function PayslipPage({
  params,
}: {
  params: Promise<{ userId: string; year: string; month: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') redirect('/admin/dashboard');

  const { userId, year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const summary = await prisma.monthlySummary.findUnique({
    where: { userId_month_year: { userId, month, year } },
    include: {
      user: {
        include: {
          department: true,
          shift: true,
        },
      },
    },
  });

  if (!summary) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold">Payslip Not Found</h2>
        <p className="text-muted-foreground">
          No payroll summary found for this employee for {MONTH_NAMES[month]} {year}.
          <br />
          Please run the calculation first from the Payroll page.
        </p>
        <Link
          href="/admin/payroll"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Payroll
        </Link>
      </div>
    );
  }

  const { user } = summary;

  return (
    <>
      {/* Print button — hidden when printing */}
      <div className="no-print mb-6 flex items-center gap-3">
        <Link
          href="/admin/payroll"
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Payroll
        </Link>
        <PrintButton />
      </div>

      {/* ── Payslip Document ── */}
      <div className="payslip mx-auto max-w-2xl rounded-2xl border bg-white p-10 shadow-lg print:shadow-none print:border-none print:p-8">
        {/* Company Header */}
        <div className="flex items-start justify-between border-b pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Employee Attendance System
            </h1>
            <p className="text-sm text-gray-500 mt-1">Payroll Department</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700">PAYSLIP</p>
            <p className="text-lg font-bold text-primary">{MONTH_NAMES[month]} {year}</p>
            {summary.isFinalized && (
              <span className="inline-block mt-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                ✓ Finalized
              </span>
            )}
          </div>
        </div>

        {/* Employee Info */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Employee Details
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Row label="Full Name" value={user.name} />
            <Row label="Employee ID" value={user.employeeId} />
            <Row label="Job Title" value={user.jobTitle ?? '—'} />
            <Row label="Department" value={user.department?.name ?? '—'} />
            <Row label="Shift" value={user.shift?.name ?? '—'} />
            <Row label="Email" value={user.email} />
          </div>
        </section>

        {/* Attendance Summary */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Attendance Summary
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Working Days', value: summary.workingDays, color: 'gray' },
              { label: 'Present Days', value: summary.presentDays, color: 'green' },
              { label: 'Absent Days', value: summary.absentDays, color: 'red' },
              { label: 'Late Days', value: summary.lateDays, color: 'amber' },
              { label: 'Total Late (min)', value: summary.totalLateMinutes, color: 'amber' },
              { label: 'Overtime Hours', value: summary.totalOvertimeHours.toFixed(2), color: 'blue' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-lg bg-${color}-50 border border-${color}-100 p-3 text-center`}>
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-xl font-bold text-${color}-600 mt-1`}>{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Salary Breakdown */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Salary Breakdown
          </h2>
          <div className="rounded-xl border overflow-hidden text-sm">
            <div className="divide-y">
              <SalaryRow label="Base Monthly Salary" value={summary.baseSalary} />
              <SalaryRow label="Total Deductions" value={-summary.totalDeductions} negative />
              <SalaryRow label="Overtime Pay" value={summary.overtimePay} positive />
            </div>
            {/* Net */}
            <div className="bg-primary/5 border-t-2 border-primary/20 flex items-center justify-between px-4 py-4">
              <span className="text-base font-bold text-gray-900">Net Salary</span>
              <span className="text-2xl font-extrabold text-green-600">
                {summary.finalSalary.toLocaleString('en-EG', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                EGP
              </span>
            </div>
          </div>
        </section>

        {/* Notes */}
        {summary.notes && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Notes
            </h2>
            <p className="text-sm text-gray-600 rounded-lg bg-gray-50 border px-4 py-3">
              {summary.notes}
            </p>
          </section>
        )}

        {/* Footer */}
        <div className="border-t pt-4 text-xs text-gray-400 flex justify-between">
          <span>Generated: {new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo' })}</span>
          <span>This is a system-generated payslip</span>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 12pt; background: white; }
          .payslip { box-shadow: none !important; border: none !important; max-width: 100% !important; }
        }
      `}</style>
    </>
  );
}

/* ── Small helper components ── */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

function SalaryRow({
  label,
  value,
  negative,
  positive,
}: {
  label: string;
  value: number;
  negative?: boolean;
  positive?: boolean;
}) {
  const fmt = Math.abs(value).toLocaleString('en-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const display = negative ? `- ${fmt} EGP` : positive ? `+ ${fmt} EGP` : `${fmt} EGP`;
  const color = negative ? 'text-red-500' : positive ? 'text-blue-500' : 'text-gray-800';

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white">
      <span className="text-gray-600">{label}</span>
      <span className={`font-semibold ${color}`}>{display}</span>
    </div>
  );
}
