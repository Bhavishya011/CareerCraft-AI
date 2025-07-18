"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Pencil,
  Trash2,
  Save,
  X,
  ClipboardCopy,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function UserHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();

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
    toast({
      title: "Deleted!",
      description: "The message has been removed from your history.",
    });
  };

  const handleEdit = (id: string, message: string) => {
    setEditId(id);
    setEditValue(message);
    setOpenId(id); // Keep the item open when editing
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
    toast({
      title: "Saved!",
      description: "Your message has been updated.",
    });
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditValue("");
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: "The message has been copied successfully.",
    });
  };

  const handleDownloadPdf = async (text: string) => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 10, 10);
    doc.save("TypeWise-Message.pdf");
    toast({
      title: "Download Started",
      description: "Your PDF is being downloaded.",
    });
  };

  const handleDownloadWord = (text: string) => {
    const blob = new Blob([text], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "TypeWise-Message.doc";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Download Started",
      description: "Your Word document is being downloaded.",
    });
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
            className={`bg-card/80 border border-accent/20 rounded-xl p-3 shadow-sm transition-all duration-300 ${
              isOpen ? "ring-2 ring-primary" : "hover:bg-accent/10"
            }`}
          >
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => !isEditing && setOpenId(isOpen ? null : item.id)}
            >
              <div className="text-xs sm:text-sm text-muted-foreground">
                {new Date(item.created_at).toLocaleString()}
              </div>
              <div className="text-sm font-semibold text-primary">
                {isOpen ? "Hide" : "Show"}
              </div>
            </div>

            <div
              className={`mt-2 text-base whitespace-pre-wrap transition-all duration-300 overflow-hidden ${
                isOpen ? "max-h-screen" : "max-h-12"
              }`}
            >
              {isEditing ? (
                <div className="flex flex-col gap-2 mt-2">
                  <textarea
                    className="w-full rounded border border-input bg-background p-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={6}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleEditSave(item.id)}
                    >
                      <Save className="w-4 h-4 mr-2" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p>
                  {isOpen
                    ? item.message
                    : item.message.slice(0, 100) +
                      (item.message.length > 100 ? "..." : "")}
                </p>
              )}
            </div>

            {isOpen && !isEditing && (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-accent/10 mt-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(item.message)}
                  title="Copy"
                  className="transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-accent/20"
                >
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Copy</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(item.id, item.message)}
                  title="Edit"
                  className="transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-accent/20"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      title="Download"
                      className="transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-accent/20"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleDownloadPdf(item.message)}
                    >
                      PDF Document (.pdf)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDownloadWord(item.message)}
                    >
                      Word Document (.doc)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  title="Delete"
                  className="transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
