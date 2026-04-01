'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type User = {
  id: string;
  name: string;
  employeeId: string;
  shift?: {
    startTime: string;
    endTime: string;
    gracePeriodMins: number;
    overtimeAfterMins: number;
  };
};

function calculateLateMinutesClient(
  checkInTime: string,
  shiftStart: string,
  gracePeriodMins: number
): number {
  const [inH, inM] = checkInTime.split(':').map(Number);
  const [shH, shM] = shiftStart.split(':').map(Number);
  const diff = (inH * 60 + inM) - (shH * 60 + shM);
  return diff <= gracePeriodMins ? 0 : diff;
}

function calculateOvertimeMinutesClient(
  checkOutTime: string,
  shiftEnd: string,
  overtimeAfterMins: number
): number {
  const [outH, outM] = checkOutTime.split(':').map(Number);
  const [shH, shM] = shiftEnd.split(':').map(Number);
  const diff = (outH * 60 + outM) - (shH * 60 + shM);
  return diff <= overtimeAfterMins ? 0 : diff;
}

function generateLocationData(status: 'INSIDE' | 'OUTSIDE') {
  if (status === 'INSIDE') {
    return {
      latitude: 30.0444 + (Math.random() - 0.5) * 0.001,
      longitude: 31.2357 + (Math.random() - 0.5) * 0.001,
      distance: Math.random() * 50, // 0-50 meters
    };
  } else {
    return {
      latitude: 30.0444 + (Math.random() - 0.5) * 0.01,
      longitude: 31.2357 + (Math.random() - 0.5) * 0.01,
      distance: 200 + Math.random() * 800, // 200-1000 meters
    };
  }
}

export default function AttendanceEditor() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form state
  const [recordId, setRecordId] = useState<string | null>(null); // To track if we're editing
  const [status, setStatus] = useState('PRESENT');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  
  const [inStatus, setInStatus] = useState<'INSIDE' | 'OUTSIDE'>('INSIDE');
  const [outStatus, setOutStatus] = useState<'INSIDE' | 'OUTSIDE' | ''>('');

  const [lateMinutes, setLateMinutes] = useState('');
  const [overtimeMinutes, setOvertimeMinutes] = useState('');
  const [notes, setNotes] = useState('');
  
  const [autoCalculate, setAutoCalculate] = useState(true);

  // Fetch users on mount
  useEffect(() => {
    fetch('/api/console/ops/employees')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setUsers(data);
      })
      .catch(err => console.error("Failed to fetch employees", err));
  }, []);

  const selectedEmployee = users.find(u => u.id === selectedUserId);

  useEffect(() => {
    if (!autoCalculate || !selectedEmployee?.shift || !checkInTime) return;

    if (autoCalculate) {
      const lateMin = calculateLateMinutesClient(
        checkInTime,
        selectedEmployee.shift.startTime,
        selectedEmployee.shift.gracePeriodMins
      );

      const overtimeMin = checkOutTime
        ? calculateOvertimeMinutesClient(
            checkOutTime,
            selectedEmployee.shift.endTime,
            selectedEmployee.shift.overtimeAfterMins
          )
        : 0;

      setLateMinutes(lateMin.toString());
      setOvertimeMinutes(overtimeMin.toString());
    }
  }, [checkInTime, checkOutTime, autoCalculate, selectedEmployee]);

  // Fetch record when userId or date changes
  useEffect(() => {
    if (!selectedUserId || !date) {
      resetForm();
      return;
    }

    const fetchRecord = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch(`/api/console/ops/attendance?userId=${selectedUserId}&date=${date}`);
        if (!res.ok) throw new Error('Failed to fetch');
        
        const data = await res.json();
        if (data && data.id) {
          // Record exists (Edit mode)
          setRecordId(data.id);
          setStatus(data.status || 'PRESENT');
          
          const extTime = (iso: string | null) => {
             if (!iso) return '';
             const d = new Date(iso);
             return d.toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' });
          };

          setCheckInTime(extTime(data.checkIn));
          setCheckOutTime(extTime(data.checkOut));
          
          setInStatus((data.inStatus as any) || 'INSIDE');
          setOutStatus((data.outStatus as any) || '');

          setLateMinutes(data.lateMinutes?.toString() ?? '');
          setOvertimeMinutes(data.overtimeMinutes?.toString() ?? '');
          setNotes(data.notes ?? '');
          
          setMessage({ type: 'success', text: `Loaded existing record — ${date}` });
        } else {
          // Insert mode
          resetForm();
          setMessage({ type: 'success', text: 'No record found — creating new' });
        }
      } catch(err) {
        console.error(err);
        resetForm();
        setMessage({ type: 'error', text: 'Failed to load record.' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecord();
  }, [selectedUserId, date]);

  const resetForm = () => {
    setRecordId(null);
    setStatus('PRESENT');
    setCheckInTime('');
    setCheckOutTime('');
    setInStatus('INSIDE');
    setOutStatus('');
    setLateMinutes('');
    setOvertimeMinutes('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !date) return;

    setLoading(true);
    setMessage(null);
    
    const inLoc = generateLocationData(inStatus);
    const outLoc = outStatus ? generateLocationData(outStatus as 'INSIDE' | 'OUTSIDE') : null;

    const payload = {
      userId: selectedUserId,
      date,
      checkInTime,
      checkOutTime,
      status,
      inLatitude: inLoc.latitude,
      inLongitude: inLoc.longitude,
      inStatus,
      inDistance: inLoc.distance,
      outLatitude: outLoc?.latitude,
      outLongitude: outLoc?.longitude,
      outStatus: outStatus || null,
      outDistance: outLoc?.distance,
      lateMinutes,
      overtimeMinutes,
      notes,
      autoCalculate
    };

    try {
      const res = await fetch('/api/console/ops/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || 'Failed to save');
      
      setRecordId(data.id);
      const userName = users.find(u => u.id === selectedUserId)?.name || 'Employee';
      setMessage({ type: 'success', text: `Record saved for ${userName} on ${date}.` });
    } catch(err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!recordId) return;
    if (!confirm('Are you sure you want to delete this record?')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/console/ops/attendance', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId })
      });
      if(!res.ok) throw new Error('Failed to delete');
      
      resetForm();
      setMessage({ type: 'success', text: 'Record deleted.' });
    } catch(err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 border rounded-xl shadow-sm bg-white">
      <div className="flex flex-col space-y-1.5 p-6 pb-4 border-b">
        <h3 className="font-semibold leading-none tracking-tight text-xl">Single Attendance Record (Insert / Edit)</h3>
        <p className="text-sm text-muted-foreground pt-1">Manually override attendance records. Bypasses all normal constraints.</p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Selection */}
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
            
            <div className="space-y-2">
               <label className="text-sm font-medium leading-none">Date</label>
               <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          {/* Messages */}
          {message && (
             <div className={`p-3 rounded-md text-sm font-medium ${message.type === 'success' ? (message.text.includes('No record') ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800') : 'bg-red-100 text-red-800'}`}>
                {message.text}
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
            {/* Times & Status */}
            <div className="space-y-4">
               <div className="flex flex-col space-y-2">
                 <label className="text-sm font-medium leading-none">Status</label>
                 <select 
                   className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                   value={status} 
                   onChange={e => setStatus(e.target.value)}
                 >
                   <option value="PRESENT">PRESENT</option>
                   <option value="ABSENT">ABSENT</option>
                   <option value="LATE">LATE</option>
                   <option value="HOLIDAY">HOLIDAY</option>
                   <option value="LEAVE">LEAVE</option>
                 </select>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm font-medium leading-none">Check-in Time (HH:mm)</label>
                   <Input type="time" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} className="mt-1" />
                 </div>
                 <div className="flex flex-col space-y-2">
                   <label className="text-sm mt-3 font-medium leading-none">In Status</label>
                   <select 
                     className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                     value={inStatus} 
                     onChange={e => setInStatus(e.target.value as any)}
                   >
                     <option value="INSIDE">INSIDE</option>
                     <option value="OUTSIDE">OUTSIDE</option>
                   </select>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm font-medium leading-none">Check-out Time (HH:mm)</label>
                   <Input type="time" value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)} className="mt-1" />
                 </div>
                 <div className="flex flex-col space-y-2">
                   <label className="text-sm mt-3 font-medium leading-none">Out Status</label>
                   <select 
                     className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                     value={outStatus} 
                     onChange={e => setOutStatus(e.target.value as any)}
                   >
                     <option value="">(None)</option>
                     <option value="INSIDE">INSIDE</option>
                     <option value="OUTSIDE">OUTSIDE</option>
                   </select>
                 </div>
               </div>

               <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                     <input type="checkbox" id="autoCalculate" checked={autoCalculate} onChange={e => setAutoCalculate(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                     <label htmlFor="autoCalculate" className="text-sm font-medium">Auto-calculate late & overtime from shift</label>
                  </div>
                  {autoCalculate && checkInTime && (
                     <p className="text-sm text-muted-foreground font-mono">
                       Late: {lateMinutes || 0} minutes | Overtime: {overtimeMinutes || 0} minutes
                     </p>
                  )}
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-sm font-medium leading-none">Late Minutes</label>
                    <Input type="number" min="0" value={lateMinutes} onChange={e => setLateMinutes(e.target.value)} placeholder="0" className="mt-1" disabled={autoCalculate} />
                 </div>
                 <div>
                    <label className="text-sm font-medium leading-none">Overtime Minutes</label>
                    <Input type="number" min="0" value={overtimeMinutes} onChange={e => setOvertimeMinutes(e.target.value)} placeholder="0" className="mt-1" disabled={autoCalculate} />
                 </div>
               </div>
               
               <div>
                 <label className="text-sm font-medium leading-none">Notes</label>
                 <textarea 
                   value={notes} 
                   onChange={e => setNotes(e.target.value)} 
                   className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1" 
                 />
               </div>
            </div>
          </div>
          
          <div className="flex gap-4 pt-4 border-t">
             <Button type="submit" disabled={loading || !selectedUserId || !date}>
                {recordId ? 'Update Record' : 'Insert Record'}
             </Button>
             
             {recordId && (
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                   Delete Record
                </Button>
             )}
          </div>
        </form>
      </div>
    </div>
  );
}
