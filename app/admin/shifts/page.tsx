"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, Edit2 } from "lucide-react";
import Link from "next/link";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);

  const defaultForm = {
    name: "",
    startTime: "09:00",
    endTime: "17:00",
    gracePeriodMins: 15,
    overtimeAfterMins: 30,
    workDays: "0,1,2,3,4"
  };

  const [formData, setFormData] = useState(defaultForm);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/shifts");
      if (res.ok) {
        setShifts(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const openEditModal = (shift: any) => {
    setEditMode(shift.id);
    setFormData({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      gracePeriodMins: shift.gracePeriodMins,
      overtimeAfterMins: shift.overtimeAfterMins,
      workDays: shift.workDays
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditMode(null);
    setFormData(defaultForm);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editMode ? `/api/shifts/${editMode}` : "/api/shifts";
      const method = editMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        fetchShifts();
      } else {
        alert(`Failed to ${editMode ? 'update' : 'create'} shift`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;
    try {
      const res = await fetch(`/api/shifts/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchShifts();
      } else {
        alert("Failed to delete shift");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDay = (dayIndex: number) => {
    const currentDays = formData.workDays ? formData.workDays.split(",").map(Number) : [];
    let newDays;
    if (currentDays.includes(dayIndex)) {
      newDays = currentDays.filter(d => d !== dayIndex);
    } else {
      newDays = [...currentDays, dayIndex].sort();
    }
    setFormData({ ...formData, workDays: newDays.join(",") });
  };

  const daysLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Shifts</h1>
          <p className="text-muted-foreground">Manage employee working schedules and grace periods.</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          New Shift
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="h-10 px-6 align-middle font-semibold text-muted-foreground">Name</th>
                <th className="h-10 px-6 align-middle font-semibold text-muted-foreground">Time</th>
                <th className="h-10 px-6 align-middle font-semibold text-muted-foreground">Work Days</th>
                <th className="h-10 px-6 align-middle font-semibold text-muted-foreground">Rules</th>
                <th className="h-10 px-6 align-middle font-bold text-right text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading shifts...</td></tr>
              ) : shifts.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No shifts found.</td></tr>
              ) : (
                shifts.map((shift) => (
                  <tr key={shift.id} className="transition-colors hover:bg-muted/50">
                    <td className="p-6 align-middle font-medium text-foreground">{shift.name}</td>
                    <td className="p-6 align-middle text-muted-foreground">
                      {shift.startTime} - {shift.endTime}
                    </td>
                    <td className="p-6 align-middle">
                      <div className="flex gap-1">
                        {daysLabels.map((lbl, idx) => {
                          const isWorkDay = shift.workDays?.split(',').includes(idx.toString());
                          return (
                            <span key={idx} className={`text-xs px-1.5 py-0.5 rounded ${isWorkDay ? 'bg-primary/10 text-primary font-medium' : 'text-gray-300'}`}>
                              {lbl.charAt(0)}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td className="p-6 align-middle">
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold tracking-tight text-blue-700">
                         {shift.deductionRules?.length || 0} Rules
                      </span>
                    </td>
                    <td className="p-6 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => openEditModal(shift)}>
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Link href={`/admin/shifts/${shift.id}`}>
                          <Button variant="outline" size="sm" className="h-8 gap-1">
                            <Edit className="h-3.5 w-3.5" /> Configure Rules
                          </Button>
                        </Link>
                        <Button variant="destructive" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(shift.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{editMode ? 'Edit Shift' : 'Create New Shift'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Shift Name</label>
                <input 
                  type="text" required
                  className="w-full rounded-md border border-input px-3 py-2 text-sm"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time (HH:mm)</label>
                  <input 
                    type="time" required
                    className="w-full rounded-md border border-input px-3 py-2 text-sm"
                    value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time (HH:mm)</label>
                  <input 
                    type="time" required
                    className="w-full rounded-md border border-input px-3 py-2 text-sm"
                    value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Grace Period (min)</label>
                  <input 
                    type="number" required min="0"
                    className="w-full rounded-md border border-input px-3 py-2 text-sm"
                    value={formData.gracePeriodMins} onChange={e => setFormData({...formData, gracePeriodMins: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Overtime After (min)</label>
                  <input 
                    type="number" required min="0"
                    className="w-full rounded-md border border-input px-3 py-2 text-sm"
                    value={formData.overtimeAfterMins} onChange={e => setFormData({...formData, overtimeAfterMins: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Work Days</label>
                <div className="flex gap-2 flex-wrap">
                  {daysLabels.map((lbl, idx) => {
                    const isSelected = formData.workDays.split(',').includes(idx.toString());
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => toggleDay(idx)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                      >
                        {lbl}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">{editMode ? 'Save Changes' : 'Create Shift'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
