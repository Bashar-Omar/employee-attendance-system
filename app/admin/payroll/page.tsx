'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  RefreshCw,
  Lock,
  FileText,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

/* ─────────────────────────────────────────── types ── */
interface MonthlySummary {
  id: string;
  userId: string;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalLateMinutes: number;
  totalOvertimeHours: number;
  baseSalary: number;
  totalDeductions: number;
  overtimePay: number;
  finalSalary: number;
  isFinalized: boolean;
  user: { id: string; name: string; employeeId: string; jobTitle: string | null; department: { name: string } | null };
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const now = new Date();

/* ─────────────────────────────────────────── component ── */
export default function PayrollPage() {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summaries, setSummaries] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [actionRow, setActionRow] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── fetch summaries ── */
  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/summaries?month=${month}&year=${year}`);
      if (res.ok) setSummaries(await res.json());
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchSummaries(); }, [fetchSummaries]);

  /* ── calculate all ── */
  const calculateAll = async () => {
    setCalculating(true);
    try {
      const res = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      });
      const data = await res.json();
      showToast(`Done — ${data.succeeded} calculated, ${data.failed} failed`);
      await fetchSummaries();
    } catch {
      showToast('Calculation failed', 'err');
    } finally {
      setCalculating(false);
    }
  };

  /* ── recalculate single ── */
  const recalculate = async (userId: string) => {
    setActionRow(userId + '-calc');
    try {
      const res = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, month, year }),
      });
      if (!res.ok) throw new Error();
      showToast('Recalculated successfully');
      await fetchSummaries();
    } catch {
      showToast('Recalculation failed', 'err');
    } finally {
      setActionRow(null);
    }
  };

  /* ── finalize ── */
  const finalize = async (userId: string) => {
    if (!confirm('Finalize this payroll? This cannot be undone.')) return;
    setActionRow(userId + '-fin');
    try {
      const res = await fetch('/api/payroll/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, month, year }),
      });
      if (!res.ok) throw new Error();
      showToast('Payroll finalized');
      await fetchSummaries();
    } catch {
      showToast('Finalization failed', 'err');
    } finally {
      setActionRow(null);
    }
  };

  /* ── year options ── */
  const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i);

  /* ── totals ── */
  const totals = summaries.reduce(
    (acc, s) => ({
      base: acc.base + s.baseSalary,
      deductions: acc.deductions + s.totalDeductions,
      overtime: acc.overtime + s.overtimePay,
      net: acc.net + s.finalSalary,
    }),
    { base: 0, deductions: 0, overtime: 0, net: 0 }
  );

  return (
    <div className="space-y-8">
      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === 'ok' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monthly salary summaries for all employees
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month */}
          <div className="relative">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="appearance-none rounded-lg border bg-card px-3 py-2 pr-8 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {MONTH_NAMES.slice(1).map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          {/* Year */}
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="appearance-none rounded-lg border bg-card px-3 py-2 pr-8 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          {/* Calculate All */}
          <button
            onClick={calculateAll}
            disabled={calculating}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60 transition"
          >
            {calculating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Calculate All
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Base Salary', value: totals.base, color: 'text-foreground' },
          { label: 'Total Deductions', value: totals.deductions, color: 'text-red-500' },
          { label: 'Total Overtime Pay', value: totals.overtime, color: 'text-blue-500' },
          { label: 'Total Net Salary', value: totals.net, color: 'text-green-600' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className={`mt-1 text-xl font-bold ${card.color}`}>
              {card.value.toLocaleString('en-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} EGP
            </p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center text-muted-foreground">
            <DollarSign className="h-10 w-10 opacity-30" />
            <p className="font-medium">No payroll data for {MONTH_NAMES[month]} {year}</p>
            <p className="text-sm">Click &quot;Calculate All&quot; to generate summaries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-center">Work Days</th>
                  <th className="px-4 py-3 text-center">Present</th>
                  <th className="px-4 py-3 text-center">Absent</th>
                  <th className="px-4 py-3 text-center">Late</th>
                  <th className="px-4 py-3 text-center">Late (min)</th>
                  <th className="px-4 py-3 text-right">Base Salary</th>
                  <th className="px-4 py-3 text-right">Deductions</th>
                  <th className="px-4 py-3 text-right">Overtime</th>
                  <th className="px-4 py-3 text-right font-bold text-foreground">Net Salary</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summaries.map((s) => {
                  const isCalcing = actionRow === s.userId + '-calc';
                  const isFinalizing = actionRow === s.userId + '-fin';

                  return (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                      {/* Employee */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{s.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.user.employeeId}
                          {s.user.department && ` · ${s.user.department.name}`}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-center">{s.workingDays}</td>
                      <td className="px-4 py-3 text-center text-green-600 font-medium">{s.presentDays}</td>
                      <td className="px-4 py-3 text-center text-red-500 font-medium">{s.absentDays}</td>
                      <td className="px-4 py-3 text-center text-amber-500 font-medium">{s.lateDays}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{s.totalLateMinutes}</td>

                      <td className="px-4 py-3 text-right">
                        {s.baseSalary.toLocaleString('en-EG')} EGP
                      </td>
                      <td className="px-4 py-3 text-right text-red-500">
                        -{s.totalDeductions.toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                      </td>
                      <td className="px-4 py-3 text-right text-blue-500">
                        +{s.overtimePay.toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">
                        {s.finalSalary.toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {s.isFinalized ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            <CheckCircle2 className="h-3 w-3" /> Finalized
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                            <Clock className="h-3 w-3" /> Draft
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {/* Recalculate */}
                          {!s.isFinalized && (
                            <button
                              onClick={() => recalculate(s.userId)}
                              disabled={isCalcing || isFinalizing}
                              title="Recalculate"
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition disabled:opacity-40"
                            >
                              {isCalcing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </button>
                          )}

                          {/* Payslip */}
                          <Link
                            href={`/admin/payroll/${s.userId}/${year}/${month}`}
                            title="View Payslip"
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                          >
                            <FileText className="h-4 w-4" />
                          </Link>

                          {/* Finalize */}
                          {!s.isFinalized && (
                            <button
                              onClick={() => finalize(s.userId)}
                              disabled={isCalcing || isFinalizing}
                              title="Finalize"
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-green-600 hover:text-white transition disabled:opacity-40"
                            >
                              {isFinalizing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Lock className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
