"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Edit2, Plus, Save } from "lucide-react";
import Link from "next/link";

export default function ShiftDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [shift, setShift] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRuleModal, setShowRuleModal] = useState(false);
  
  const [ruleData, setRuleData] = useState({
    type: "LATE",
    lateMinutesFrom: 0,
    lateMinutesTo: "" as number | string,
    deductionType: "PERCENTAGE",
    deductionValue: 0,
    label: ""
  });

  const fetchShift = async () => {
    try {
      const res = await fetch("/api/shifts");
      if (res.ok) {
        const shifts = await res.json();
        const found = shifts.find((s: any) => s.id === id);
        if (found) setShift(found);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShift();
  }, [id]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...ruleData,
        lateMinutesTo: ruleData.lateMinutesTo === "" ? null : Number(ruleData.lateMinutesTo),
        lateMinutesFrom: Number(ruleData.lateMinutesFrom),
        deductionValue: Number(ruleData.deductionValue)
      };

      const res = await fetch(`/api/shifts/${id}/deduction-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowRuleModal(false);
        fetchShift();
      } else {
        alert("Failed to create rule");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Delete this rule?")) return;
    try {
      const res = await fetch(`/api/shifts/${id}/deduction-rules/${ruleId}`, { method: "DELETE" });
      if (res.ok) fetchShift();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!shift) return <div>Shift not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/shifts">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{shift.name} Configuration</h1>
          <p className="text-muted-foreground">{shift.startTime} - {shift.endTime} | Grace: {shift.gracePeriodMins} min</p>
        </div>
      </div>

      {/* Deduction Rules Section */}
      <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Deduction Rules Engine</h2>
          <Button onClick={() => {
            setRuleData({ type: "LATE", lateMinutesFrom: 0, lateMinutesTo: "", deductionType: "PERCENTAGE", deductionValue: 0, label: "" });
            setShowRuleModal(true);
          }} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Add Rule
          </Button>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Rules are evaluated in order. If multiple rules match, the most specific (highest lower bound) applies.
        </p>

        <div className="border rounded-md overflow-hidden mt-4">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted">
              <tr>
                <th className="h-10 px-4 font-medium text-muted-foreground">Type</th>
                <th className="h-10 px-4 font-medium text-muted-foreground">Condition</th>
                <th className="h-10 px-4 font-medium text-muted-foreground">Deduction</th>
                <th className="h-10 px-4 font-medium text-muted-foreground">Label</th>
                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-background">
              {shift.deductionRules?.map((rule: any) => (
                <tr key={rule.id} className="hover:bg-muted/50">
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${rule.type === 'ABSENT' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                      {rule.type}
                    </span>
                  </td>
                  <td className="p-4">
                    {rule.type === 'LATE' ? (
                      <>{rule.lateMinutesFrom} to {rule.lateMinutesTo ?? '∞'} mins</>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4 font-medium">
                    {rule.deductionValue}{rule.deductionType === 'PERCENTAGE' ? '%' : ' EGP'}
                  </td>
                  <td className="p-4 text-muted-foreground">{rule.label || "—"}</td>
                  <td className="p-4 text-right">
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteRule(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                     </Button>
                  </td>
                </tr>
              ))}
              {(!shift.deductionRules || shift.deductionRules.length === 0) && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No deduction rules configured.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal matching PLAN 3.2 Add Rule Form Fields */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Add Deduction Rule</h2>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select 
                  className="w-full rounded-md border border-input px-3 py-2 text-sm"
                  value={ruleData.type} onChange={e => setRuleData({...ruleData, type: e.target.value})}
                >
                  <option value="LATE">Late Check-In</option>
                  <option value="ABSENT">Full Day Absent</option>
                  <option value="EARLY_LEAVE">Early Leave</option>
                </select>
              </div>

              {ruleData.type !== 'ABSENT' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">From (minutes)</label>
                    <input 
                      type="number" required min="0"
                      className="w-full rounded-md border border-input px-3 py-2 text-sm"
                      value={ruleData.lateMinutesFrom} onChange={e => setRuleData({...ruleData, lateMinutesFrom: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">To (optional)</label>
                    <input 
                      type="number" min="0" placeholder="No limit"
                      className="w-full rounded-md border border-input px-3 py-2 text-sm"
                      value={ruleData.lateMinutesTo} onChange={e => setRuleData({...ruleData, lateMinutesTo: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Deduction Method</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="dType" value="PERCENTAGE" checked={ruleData.deductionType === 'PERCENTAGE'} onChange={() => setRuleData({...ruleData, deductionType: "PERCENTAGE"})} />
                    Percentage (%)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="dType" value="FIXED_AMOUNT" checked={ruleData.deductionType === 'FIXED_AMOUNT'} onChange={() => setRuleData({...ruleData, deductionType: "FIXED_AMOUNT"})} />
                    Fixed Amount (EGP)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Value {ruleData.deductionType === 'PERCENTAGE' ? '(%)' : '(EGP)'}</label>
                <input 
                  type="number" required min="0" step="0.5"
                  className="w-full rounded-md border border-input px-3 py-2 text-sm"
                  value={ruleData.deductionValue} onChange={e => setRuleData({...ruleData, deductionValue: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Label (Optional)</label>
                <input 
                  type="text" placeholder="e.g. Minor Late"
                  className="w-full rounded-md border border-input px-3 py-2 text-sm"
                  value={ruleData.label} onChange={e => setRuleData({...ruleData, label: e.target.value})}
                />
              </div>

              <div className="bg-muted p-3 rounded text-xs text-muted-foreground">
                {ruleData.deductionType === 'PERCENTAGE' 
                  ? "Deducted percentage is applied to the employee's daily salary (monthly salary divided by working days in the month)."
                  : "A fixed EGP amount deducted regardless of salary."}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowRuleModal(false)}>Cancel</Button>
                <Button type="submit">Save Rule</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
