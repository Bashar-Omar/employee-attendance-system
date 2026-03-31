"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";

type Department = { id: string; name: string; description: string | null };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Edit form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        setDepartments(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null }),
      });
      if (res.ok) {
        setIsCreating(false);
        setNewName("");
        setNewDesc("");
        fetchDepartments();
      } else {
        alert("Failed to create department");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchDepartments();
      } else {
        alert("Failed to update department");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this department?")) return;
    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      if (res.ok) fetchDepartments();
      else alert("Failed to delete department");
    } catch (e) {
      console.error(e);
    }
  };

  const startEditing = (dept: Department) => {
    setEditingId(dept.id);
    setEditName(dept.name);
    setEditDesc(dept.description || "");
  };

  if (loading) return <div className="p-8">Loading departments...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Departments</h1>
          <p className="text-muted-foreground">Manage organization departments.</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Department
          </Button>
        )}
      </div>

      <div className="rounded-xl border shadow-sm overflow-hidden bg-card">
        <table className="w-full text-sm text-left align-top">
          <thead className="bg-muted">
            <tr>
              <th className="h-10 px-4 font-medium text-muted-foreground w-1/4">Name</th>
              <th className="h-10 px-4 font-medium text-muted-foreground">Description</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-background">
            {/* INLINE CREATE FORM */}
            {isCreating && (
              <tr className="bg-muted/30">
                <td className="p-4 align-middle">
                  <input
                    type="text"
                    required
                    placeholder="E.g. Engineering"
                    className="w-full rounded-md border border-input px-3 py-1.5 text-sm"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </td>
                <td className="p-4 align-middle">
                  <input
                    type="text"
                    placeholder="Optional description"
                    className="w-full rounded-md border border-input px-3 py-1.5 text-sm"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </td>
                <td className="p-4 text-right align-middle">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setIsCreating(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={handleCreate}>
                      <Check className="h-4 w-4 mr-2" /> Save
                    </Button>
                  </div>
                </td>
              </tr>
            )}

            {/* DEPARTMENTS LIST */}
            {departments.length === 0 && !isCreating ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-muted-foreground">
                  No departments found. Create one to get started.
                </td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-muted/50">
                  {editingId === dept.id ? (
                    <>
                      {/* EDIT ROW */}
                      <td className="p-4 align-middle">
                        <input
                          type="text"
                          required
                          className="w-full rounded-md border border-input px-3 py-1.5 text-sm"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </td>
                      <td className="p-4 align-middle">
                        <input
                          type="text"
                          className="w-full rounded-md border border-input px-3 py-1.5 text-sm"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                        />
                      </td>
                      <td className="p-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={(e) => handleUpdate(dept.id, e)}>
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      {/* VIEW ROW */}
                      <td className="p-4 font-medium align-middle">{dept.name}</td>
                      <td className="p-4 text-muted-foreground align-middle">{dept.description || "—"}</td>
                      <td className="p-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-2">
                           <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditing(dept)}>
                              <Edit2 className="h-4 w-4" />
                           </Button>
                           {dept.name !== "General" && (
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(dept.id)}>
                                <Trash2 className="h-4 w-4" />
                             </Button>
                           )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
