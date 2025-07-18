"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Pencil, Trash2, Save, X } from "lucide-react";

export default function UserHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setLoading(false);
      const { data, error } = await supabase
        .from("History")
        .select("id, message, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setHistory(data || []);
      setLoading(false);
    }
    fetchHistory();
  }, []);

  const handleDelete = async (id: string) => {
    await supabase.from("History").delete().eq("id", id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEdit = (id: string, message: string) => {
    setEditId(id);
    setEditValue(message);
  };

  const handleEditSave = async (id: string) => {
    await supabase.from("History").update({ message: editValue }).eq("id", id);
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, message: editValue } : item
      )
    );
    setEditId(null);
    setEditValue("");
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditValue("");
  };

  if (loading) return <div>Loading...</div>;
  if (history.length === 0)
    return (
      <div className="text-muted-foreground text-lg">No history found.</div>
    );

  return (
    <div className="w-full max-w-2xl space-y-2">
      {history.map((item) => {
        const isOpen = openId === item.id;
        const isEditing = editId === item.id;
        return (
          <div
            key={item.id}
            className={`bg-card/80 border border-accent/20 rounded-xl p-3 shadow-sm cursor-pointer transition-all ${
              isOpen ? "ring-2 ring-primary" : "hover:bg-accent/10"
            }`}
            onClick={() => setOpenId(isOpen ? null : item.id)}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {new Date(item.created_at).toLocaleString()}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-1 hover:bg-accent/20 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(item.id, item.message);
                  }}
                  title="Edit"
                >
                  <Pencil className="w-4 h-4 text-primary" />
                </button>
                <button
                  className="p-1 hover:bg-destructive/20 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-destructive text-white" />
                </button>
                <div className="text-sm font-semibold text-primary">
                  {isOpen ? "Hide" : "Open"}
                </div>
              </div>
            </div>
            <div className="mt-1 text-base whitespace-pre-wrap">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="w-full rounded border p-2 text-base"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      className="px-3 py-1 bg-primary text-white rounded hover:bg-primary/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSave(item.id);
                      }}
                    >
                      <Save className="w-4 h-4 inline mr-1" /> Save
                    </button>
                    <button
                      className="px-3 py-1 bg-muted text-foreground rounded hover:bg-accent/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCancel();
                      }}
                    >
                      <X className="w-4 h-4 inline mr-1" /> Cancel
                    </button>
                  </div>
                </div>
              ) : isOpen ? (
                item.message
              ) : item.message.length > 60 ? (
                item.message.slice(0, 60) + "..."
              ) : (
                item.message
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
