"use client";

import { useState } from "react";
import { User, Activity, FileText, RefreshCw } from "lucide-react";
import { toEgyptDate, toEgyptTimeOnly } from "@/lib/utils/date";
import Link from "next/link";

export default function EmployeeProfileTabs({ employee }: { employee: any }) {
  const [activeTab, setActiveTab] = useState("basic");

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("basic")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "basic"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            }`}
          >
            <User className="h-4 w-4" /> Basic Info
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "attendance"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            }`}
          >
            <Activity className="h-4 w-4" /> Attendance Log
          </button>
          <button
            onClick={() => setActiveTab("payroll")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "payroll"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            }`}
          >
            <FileText className="h-4 w-4" /> Monthly Summaries
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {/* BASIC INFO TAB */}
        {activeTab === "basic" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2 mb-4">Employment Details</h3>
              
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-dashed sm:grid-cols-1 md:grid-cols-3">
                  <span className="font-medium text-muted-foreground col-span-1">Name</span>
                  <div className="col-span-2">{employee.name}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-dashed sm:grid-cols-1 md:grid-cols-3">
                  <span className="font-medium text-muted-foreground col-span-1">Email</span>
                  <div className="col-span-2">{employee.email}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-dashed sm:grid-cols-1 md:grid-cols-3">
                  <span className="font-medium text-muted-foreground col-span-1">Phone</span>
                  <div className="col-span-2">{employee.phone || "—"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-dashed sm:grid-cols-1 md:grid-cols-3">
                  <span className="font-medium text-muted-foreground col-span-1">Job Title</span>
                  <div className="col-span-2">{employee.jobTitle || "—"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-dashed sm:grid-cols-1 md:grid-cols-3">
                  <span className="font-medium text-muted-foreground col-span-1">Hire Date</span>
                  <div className="col-span-2">{employee.hireDate ? toEgyptDate(employee.hireDate) : "—"}</div>
              </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2 mb-4">System & Payroll Details</h3>
              
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-dashed sm:grid-cols-1 md:grid-cols-3">
                  <span className="font-medium text-muted-foreground col-span-1">Role</span>
                  <div className="col-span-2">
                     <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${employee.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                         {employee.role}
                     </span>
                  </div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-dashed sm:grid-cols-1 md:grid-cols-3">
                  <span className="font-medium text-muted-foreground col-span-1">Department</span>
                  <div className="col-span-2">{employee.department?.name || "General"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-dashed sm:grid-cols-1 md:grid-cols-3">
                  <span className="font-medium text-muted-foreground col-span-1">Shift</span>
                  <div className="col-span-2">{employee.shift?.name || "None"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-dashed sm:grid-cols-1 md:grid-cols-3">
                  <span className="font-medium text-muted-foreground col-span-1">Salary</span>
                  <div className="col-span-2 font-medium">{employee.salary ? `${employee.salary.toFixed(2)} EGP` : "—"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-dashed sm:grid-cols-1 md:grid-cols-3">
                  <span className="font-medium text-muted-foreground col-span-1">Status</span>
                  <div className="col-span-2">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === "attendance" && (
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
             <div className="bg-muted/30 p-4 border-b flex items-center justify-between">
                 <h3 className="font-semibold flex items-center gap-2">Attendance Log (Last 60 records)</h3>
             </div>
             <div className="overflow-auto w-full max-h-[600px]">
                 <table className="w-full text-sm text-left align-middle">
                     <thead className="sticky top-0 bg-muted z-10">
                         <tr>
                             <th className="h-10 px-6 font-medium text-muted-foreground">Date</th>
                             <th className="h-10 px-6 font-medium text-muted-foreground">Check-in</th>
                             <th className="h-10 px-6 font-medium text-muted-foreground">Check-out</th>
                             <th className="h-10 px-6 font-medium text-muted-foreground">Total Hours</th>
                             <th className="h-10 px-6 font-medium text-muted-foreground">Late (min)</th>
                             <th className="h-10 px-6 font-medium text-muted-foreground">Deduction</th>
                             <th className="h-10 px-6 font-medium text-muted-foreground">Status</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y bg-background">
                         {employee.attendances.map((record: any) => (
                             <tr key={record.id} className="hover:bg-muted/50">
                                 <td className="p-4 px-6 font-medium">{record.date ? toEgyptDate(record.date) : '-'}</td>
                                 <td className="p-4 px-6 tabular-nums">{record.checkIn ? toEgyptTimeOnly(record.checkIn) : '-'}</td>
                                 <td className="p-4 px-6 tabular-nums">{record.checkOut ? toEgyptTimeOnly(record.checkOut) : '-'}</td>
                                 <td className="p-4 px-6">{record.totalHours ? `${record.totalHours.toFixed(2)}h` : '-'}</td>
                                 <td className="p-4 px-6">
                                     {record.lateMinutes && record.lateMinutes > 0 ? (
                                         <span className="text-amber-600 font-medium">{record.lateMinutes}</span>
                                     ) : '-'}
                                 </td>
                                 <td className="p-4 px-6 font-mono text-red-600">
                                     {record.deductionValue ? `-${record.deductionValue.toFixed(2)}` : '-'}
                                 </td>
                                 <td className="p-4 px-6">
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                        record.status === 'LATE' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' : 
                                        record.status === 'ABSENT' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                        'bg-green-50 text-green-700 ring-green-600/20'
                                    }`}>
                                        {record.status}
                                    </span>
                                 </td>
                             </tr>
                         ))}
                         {employee.attendances.length === 0 && (
                             <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No attendance records found.</td></tr>
                         )}
                     </tbody>
                 </table>
             </div>
          </div>
        )}

        {/* PAYROLL TAB */}
        {activeTab === "payroll" && (
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
             <div className="bg-muted/30 p-4 border-b">
                 <h3 className="font-semibold">Monthly Summaries</h3>
             </div>
             <div className="overflow-auto w-full">
                 <table className="w-full text-sm text-left">
                     <thead className="bg-muted">
                         <tr>
                             <th className="h-10 px-4 font-medium text-muted-foreground">Month</th>
                             <th className="h-10 px-4 font-medium text-muted-foreground">Present/Absent</th>
                             <th className="h-10 px-4 font-medium text-muted-foreground text-right w-24">Late Days</th>
                             <th className="h-10 px-4 font-medium text-muted-foreground text-right">Base Salary</th>
                             <th className="h-10 px-4 font-medium text-muted-foreground text-right">Deductions</th>
                             <th className="h-10 px-4 font-medium text-muted-foreground text-right">Overtime</th>
                             <th className="h-10 px-4 font-medium text-primary text-right font-bold w-32">Net Salary</th>
                             <th className="h-10 px-4 font-medium text-muted-foreground text-center">Status</th>
                             <th className="h-10 px-4 font-medium text-muted-foreground">Actions</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y bg-background">
                         {employee.monthlySummaries?.map((summary: any) => (
                             <tr key={summary.id} className="hover:bg-muted/50">
                                 <td className="p-4 font-medium">{summary.year}-{summary.month.toString().padStart(2, '0')}</td>
                                 <td className="p-4">{summary.presentDays} / {summary.absentDays}</td>
                                 <td className="p-4 text-right text-amber-600">{summary.lateDays}</td>
                                 <td className="p-4 text-right">{summary.baseSalary.toFixed(2)}</td>
                                 <td className="p-4 text-right text-red-600">-{summary.totalDeductions.toFixed(2)}</td>
                                 <td className="p-4 text-right text-green-600">+{summary.overtimePay.toFixed(2)}</td>
                                 <td className="p-4 text-right font-bold text-base">{summary.finalSalary.toFixed(2)}</td>
                                 <td className="p-4 text-center">
                                     <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${summary.isFinalized ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                         {summary.isFinalized ? 'Finalized' : 'Draft'}
                                     </span>
                                 </td>
                                 <td className="p-4">
                                     <div className="flex items-center gap-2">
                                         <Link
                                           href={`/admin/payroll/${employee.id}/${summary.year}/${summary.month}`}
                                           className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-muted hover:bg-muted/80 transition"
                                         >
                                           <FileText className="h-3 w-3" /> Payslip
                                         </Link>
                                         {!summary.isFinalized && (
                                           <Link
                                             href="/admin/payroll"
                                             className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                                           >
                                             <RefreshCw className="h-3 w-3" /> Recalc
                                           </Link>
                                         )}
                                     </div>
                                 </td>
                             </tr>
                         ))}
                         {(!employee.monthlySummaries || employee.monthlySummaries.length === 0) && (
                             <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No monthly summaries generated yet.</td></tr>
                         )}
                     </tbody>
                 </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
