"use client";

import { useState, useEffect } from "react";
import { toEgyptTimeOnly } from "@/lib/utils/date";

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function EmployeePayrollPage() {
  const currentDate = new Date();
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchPayroll() {
      setLoading(true);
      try {
        const res = await fetch(`/api/employee/payroll?year=${year}&month=${month}`);
        if (res.ok) {
          setData(await res.json());
        } else {
          setData(null);
        }
      } catch (err) {
        console.error(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchPayroll();
  }, [year, month]);

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  };

  if (!data && !loading) {
    return <div className="p-8 text-center text-muted-foreground">No data found.</div>;
  }

  const { summary, attendances, user } = data || {};
  const workDays = user?.shift?.workDays?.split(',').map(Number) ?? [0, 1, 2, 3, 4];

  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyRecords = [];
  
  if (data) {
    for (let d = 1; d <= daysInMonth; d++) {
      const currentDay = new Date(year, month - 1, d);
      const dayOfWeek = currentDay.getDay(); // 0 is Sunday
      const dateStr = currentDay.toLocaleDateString('en-CA');
      const record = attendances?.find((a: any) => new Date(a.date).toLocaleDateString('en-CA') === dateStr);

      const isWorkDay = workDays.includes(dayOfWeek);
      let status = record?.status || (isWorkDay ? 'ABSENT' : 'OFF');

      dailyRecords.push({
        dateObj: currentDay,
        dayNumber: d,
        dayName: currentDay.toLocaleDateString('en-US', { weekday: 'short' }),
        isWorkDay,
        record: record || null,
        status
      });
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Payroll</h1>
          <p className="text-muted-foreground">View your finalized monthly payslips and daily attendance breakdowns.</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={month} 
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {MONTH_NAMES.map((m, idx) => {
              if (idx === 0) return null;
              return <option key={m} value={idx}>{m}</option>;
            })}
          </select>
          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {generateYearOptions().map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading your payroll data...</div>
      ) : !summary ? (
        <div className="py-20 text-center rounded-xl border bg-card/50 text-muted-foreground shadow-sm">
          <p className="text-lg font-medium text-foreground">No Finalized Payslip Yet</p>
          <p className="mt-1">Your payroll for {MONTH_NAMES[month]} {year} has not been finalized or processed.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col items-center text-center">
              <span className="text-sm font-medium text-muted-foreground">Base Salary</span>
              <span className="text-3xl font-bold mt-2 text-foreground">
                {summary.baseSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-muted-foreground">EGP</span>
              </span>
            </div>
            
            <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between">
               <span className="text-sm font-medium text-muted-foreground text-center">Breakdown</span>
               <div className="space-y-2 mt-4 text-sm font-medium">
                  <div className="flex justify-between">
                    <span className="text-red-500">Deductions</span>
                    <span className="text-red-600">-{summary.totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-500">Overtime Pay</span>
                    <span className="text-blue-600">+{summary.overtimePay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
               </div>
            </div>

            <div className="rounded-xl border bg-primary/5 border-primary/20 p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-primary">Final Net Salary</span>
              <span className="text-4xl font-extrabold mt-2 text-green-600">
                {summary.finalSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-base font-normal text-muted-foreground">EGP</span>
              </span>
              {summary.isFinalized ? (
                <span className="mt-3 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Finalized and Sent</span>
              ) : (
                <span className="mt-3 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Pending Review</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
             <InfoCard label="Working Days" value={summary.workingDays} color="text-gray-700" />
             <InfoCard label="Present Days" value={summary.presentDays} color="text-green-600" />
             <InfoCard label="Absent Days" value={summary.absentDays} color="text-red-600" />
             <InfoCard label="Late Days" value={summary.lateDays} color="text-amber-600" />
             <InfoCard label="Total Late (min)" value={summary.totalLateMinutes} color="text-amber-600" />
             <InfoCard label="Overtime (hrs)" value={summary.totalOvertimeHours.toFixed(2)} color="text-blue-600" />
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden mt-8">
            <div className="p-4 bg-muted/30 border-b">
              <h2 className="font-semibold">Daily Attendance Log</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left align-middle tabular-nums">
                <thead className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Check-in</th>
                    <th className="py-3 px-4">Check-out</th>
                    <th className="py-3 px-4 text-center">Hrs</th>
                    <th className="py-3 px-4 text-center">Late (m)</th>
                    <th className="py-3 px-4 text-center">Overtime (m)</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {dailyRecords.map((d, i) => {
                    const r = d.record;
                    let bgClass = '';
                    let highlightClass = '';

                    if (d.status === 'ABSENT') {
                      bgClass = 'bg-red-50/50';
                      highlightClass = 'border-l-4 border-l-red-500';
                    } else if (d.status === 'LATE') {
                      bgClass = 'bg-amber-50/50';
                      highlightClass = 'border-l-4 border-l-amber-400';
                    } else if (d.status === 'OFF') {
                      bgClass = 'bg-gray-50/50 text-gray-400';
                    } else {
                      highlightClass = 'border-l-4 border-l-transparent';
                    }

                    return (
                      <tr key={i} className={`hover:bg-muted/50 transition-colors ${bgClass}`}>
                        <td className={`py-3 px-4 whitespace-nowrap ${highlightClass}`}>
                          <span className="font-medium mr-1">{d.dayName}</span> 
                          {d.dayNumber.toString().padStart(2, '0')} {d.dateObj.toLocaleDateString('en-US', { month: 'short' })}
                        </td>
                        <td className="py-3 px-4">{r?.checkIn ? toEgyptTimeOnly(r.checkIn) : '—'}</td>
                        <td className="py-3 px-4">{r?.checkOut ? toEgyptTimeOnly(r.checkOut) : '—'}</td>
                        <td className="py-3 px-4 text-center font-medium">{r?.totalHours ? `${r.totalHours.toFixed(2)}` : '—'}</td>
                        <td className="py-3 px-4 text-center">{r?.lateMinutes ? `${r.lateMinutes}` : '0'}</td>
                        <td className="py-3 px-4 text-center">{r?.overtimeMinutes ? `${r.overtimeMinutes}` : '0'}</td>
                        <td className="py-3 px-4 text-right text-xs font-bold uppercase">
                           <span className={
                             d.status === 'ABSENT' ? 'text-red-600' :
                             d.status === 'LATE' ? 'text-amber-600' :
                             d.status === 'OFF' ? 'text-gray-400' :
                             'text-green-600'
                           }>
                             {d.status}
                           </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div className="rounded-lg bg-card border p-3 text-center shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
