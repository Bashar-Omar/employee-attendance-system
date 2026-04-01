'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type User = {
  id: string;
  name: string;
  employeeId: string;
};

export default function BulkSeeder() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [checkInFrom, setCheckInFrom] = useState<string>('09:00');
  const [checkInTo, setCheckInTo] = useState<string>('09:00');
  const [checkOutFrom, setCheckOutFrom] = useState<string>('17:00');
  const [checkOutTo, setCheckOutTo] = useState<string>('17:00');
  
  const [skipNonWorkingDays, setSkipNonWorkingDays] = useState<boolean>(true);
  const [skipExisting, setSkipExisting] = useState<boolean>(true);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number, skippedExisting: number, skippedNonWorking: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/console/ops/employees')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setUsers(data);
      })
      .catch(err => console.error("Failed to fetch employees", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !fromDate || !toDate || !checkInFrom || !checkInTo || !checkOutFrom || !checkOutTo) return;

    if (!confirm(`Are you sure you want to run the bulk seeder from ${fromDate} to ${toDate}?`)) return;

    setLoading(true);
    setResult(null);
    setError(null);

    const payload = {
      userId: selectedUserId,
      fromDate,
      toDate,
      checkInFrom,
      checkInTo,
      checkOutFrom,
      checkOutTo,
      skipExisting,
      skipNonWorkingDays,
    };

    try {
      const res = await fetch('/api/console/ops/bulk-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || 'Failed to seed');
      
      setResult(data);
    } catch(err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 border rounded-xl shadow-sm bg-white">
      <div className="flex flex-col space-y-1.5 p-6 pb-4 border-b">
        <h3 className="font-semibold leading-none tracking-tight text-xl">Bulk Attendance Seeder</h3>
        <p className="text-sm text-muted-foreground pt-1">Generate multiple attendance records at once. Automates calculation of late rules.</p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 flex flex-col">
               <label className="text-sm font-medium leading-none">Employee</label>
               <select 
                 className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                 value={selectedUserId} 
                 onChange={e => setSelectedUserId(e.target.value)}
                 required
               >
                 <option value="" disabled>Select Employee...</option>
                 {users.map(u => (
                   <option key={u.id} value={u.id}>
                     {u.name} ({u.employeeId})
                   </option>
                 ))}
               </select>
            </div>
            
            <div className="space-y-2"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                 <label className="text-sm font-medium leading-none">From Date</label>
                 <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
             </div>
             <div className="space-y-2">
                 <label className="text-sm font-medium leading-none">To Date</label>
                 <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-4">
             <div className="space-y-4">
                 <label className="text-sm font-medium leading-none text-muted-foreground">Check-in Range (HH:mm)</label>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs">Earliest</label>
                     <Input type="time" value={checkInFrom} onChange={(e) => setCheckInFrom(e.target.value)} required />
                   </div>
                   <div>
                     <label className="text-xs">Latest</label>
                     <Input type="time" value={checkInTo} onChange={(e) => setCheckInTo(e.target.value)} required />
                   </div>
                 </div>
             </div>
             <div className="space-y-4">
                 <label className="text-sm font-medium leading-none text-muted-foreground">Check-out Range (HH:mm)</label>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs">Earliest</label>
                     <Input type="time" value={checkOutFrom} onChange={(e) => setCheckOutFrom(e.target.value)} required />
                   </div>
                   <div>
                     <label className="text-xs">Latest</label>
                     <Input type="time" value={checkOutTo} onChange={(e) => setCheckOutTo(e.target.value)} required />
                   </div>
                 </div>
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
             <div className="flex items-center space-x-2">
                <input type="checkbox" id="skipNonWorking" checked={skipNonWorkingDays} onChange={e => setSkipNonWorkingDays(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                <label htmlFor="skipNonWorking" className="text-sm font-medium">Skip non-working days (based on Shift)</label>
             </div>
             
             <div className="flex items-center space-x-2">
                <input type="checkbox" id="skipExisting" checked={skipExisting} onChange={e => setSkipExisting(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                <label htmlFor="skipExisting" className="text-sm font-medium">Skip existing records</label>
             </div>
          </div>

          {error && (
             <div className="p-3 rounded text-sm font-medium bg-red-100 text-red-800">
                {error}
             </div>
          )}

          {result && (
             <div className="p-4 rounded text-sm font-medium bg-green-50 text-green-900 border border-green-200">
                <p className="font-bold mb-2">Done.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Created: {result.created} records</li>
                  <li>Skipped (existing): {result.skippedExisting} records</li>
                  <li>Skipped (non-working): {result.skippedNonWorking} days</li>
                </ul>
             </div>
          )}

          <div className="pt-4 border-t">
             <Button type="submit" disabled={loading || !selectedUserId || !fromDate || !toDate}>
                {loading ? 'Running...' : 'Run Seeder'}
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
