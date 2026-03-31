'use client';
import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition"
    >
      <Printer className="h-4 w-4" /> Print Payslip
    </button>
  );
}
