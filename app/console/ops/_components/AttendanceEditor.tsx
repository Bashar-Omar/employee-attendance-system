'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type User = {
  id: string;
  name: string;
  employeeId: string;
};

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
  
  const [inLatitude, setInLatitude] = useState('');
  const [inLongitude, setInLongitude] = useState('');
  const [inStatus, setInStatus] = useState('');
  const [inDistance, setInDistance] = useState('');

  const [outLatitude, setOutLatitude] = useState('');
  const [outLongitude, setOutLongitude] = useState('');
  const [outStatus, setOutStatus] = useState('');
  const [outDistance, setOutDistance] = useState('');

  const [lateMinutes, setLateMinutes] = useState('');
  const [overtimeMinutes, setOvertimeMinutes] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch users on mount
  useEffect(() => {
    fetch('/api/console/ops/users')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setUsers(data);
      })
      .catch(err => console.error("Failed to fetch users", err));
  }, []);

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
          
          // Helper to extract HH:mm from ISO
          const extTime = (iso: string | null) => {
             if (!iso) return '';
             // Assumes UTC is closely aligned or format is simple enough; better: convert to locale properly if needed, 
             // but we'll extract directly. Based on previous spec: "Egypt local time strings ("09:15") to UTC Date objects"
             // in storing. Here we format it back. The date object is returned in UTC representing Egypt time.
             const d = new Date(iso);
             return d.toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' });
          };

          setCheckInTime(extTime(data.checkIn));
          setCheckOutTime(extTime(data.checkOut));
          
          setInLatitude(data.inLatitude?.toString() ?? '');
          setInLongitude(data.inLongitude?.toString() ?? '');
          setInStatus(data.inStatus ?? '');
          setInDistance(data.inDistance?.toString() ?? '');

          setOutLatitude(data.outLatitude?.toString() ?? '');
          setOutLongitude(data.outLongitude?.toString() ?? '');
          setOutStatus(data.outStatus ?? '');
          setOutDistance(data.outDistance?.toString() ?? '');

          setLateMinutes(data.lateMinutes?.toString() ?? '');
          setOvertimeMinutes(data.overtimeMinutes?.toString() ?? '');
          setNotes(data.notes ?? '');
          
          setMessage({ type: 'success', text: 'Loaded existing record.' });
        } else {
          // Insert mode
          resetForm();
          setMessage({ type: 'success', text: 'Ready for new record.' });
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
    setInLatitude('');
    setInLongitude('');
    setInStatus('');
    setInDistance('');
    setOutLatitude('');
    setOutLongitude('');
    setOutStatus('');
    setOutDistance('');
    setLateMinutes('');
    setOvertimeMinutes('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !date) return;

    setLoading(true);
    setMessage(null);

    const payload = {
      userId: selectedUserId,
      date,
      checkInTime,
      checkOutTime,
      status,
      inLatitude,
      inLongitude,
      inStatus,
      inDistance,
      outLatitude,
      outLongitude,
      outStatus,
      outDistance,
      lateMinutes,
      overtimeMinutes,
      notes,
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
             <div className={`p-3 rounded text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
             </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
            {/* Times & Status */}
            <div className="space-y-4">
               <div className="flex flex-col space-y-2">
                 <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Status</label>
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
                   <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Check-in Time (HH:mm)</label>
                   <Input type="time" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} className="mt-1" />
                 </div>
                 <div>
                   <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Check-out Time (HH:mm)</label>
                   <Input type="time" value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)} className="mt-1" />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Late Minutes</label>
                    <Input type="number" min="0" value={lateMinutes} onChange={e => setLateMinutes(e.target.value)} placeholder="Auto-calculate if empty" className="mt-1" />
                 </div>
                 <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Overtime Minutes</label>
                    <Input type="number" min="0" value={overtimeMinutes} onChange={e => setOvertimeMinutes(e.target.value)} placeholder="Auto-calculate if empty" className="mt-1" />
                 </div>
               </div>
               
               <div>
                 <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Notes</label>
                 <textarea 
                   value={notes} 
                   onChange={e => setNotes(e.target.value)} 
                   className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1" 
                 />
               </div>
            </div>

            {/* GPS & Status */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
               <h3 className="font-semibold text-sm mb-2">Check-in Details</h3>
               <div className="grid grid-cols-2 gap-2">
                 <div><label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">In Latitude</label><Input type="number" step="any" value={inLatitude} onChange={e => setInLatitude(e.target.value)} /></div>
                 <div><label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">In Longitude</label><Input type="number" step="any" value={inLongitude} onChange={e => setInLongitude(e.target.value)} /></div>
                 <div><label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">In Status</label><Input value={inStatus} onChange={e => setInStatus(e.target.value)} placeholder="INSIDE" /></div>
                 <div><label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">In Distance (m)</label><Input type="number" value={inDistance} onChange={e => setInDistance(e.target.value)} /></div>
               </div>
               
               <h3 className="font-semibold text-sm mt-4 mb-2 pt-4 border-t border-gray-200">Check-out Details</h3>
               <div className="grid grid-cols-2 gap-2">
                 <div><label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Out Latitude</label><Input type="number" step="any" value={outLatitude} onChange={e => setOutLatitude(e.target.value)} /></div>
                 <div><label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Out Longitude</label><Input type="number" step="any" value={outLongitude} onChange={e => setOutLongitude(e.target.value)} /></div>
                 <div><label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Out Status</label><Input value={outStatus} onChange={e => setOutStatus(e.target.value)} placeholder="INSIDE" /></div>
                 <div><label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Out Distance (m)</label><Input type="number" value={outDistance} onChange={e => setOutDistance(e.target.value)} /></div>
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
