import { X, Minus, Maximize2 } from "lucide-react";
import { useState } from "react";

interface ComposeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ComposeDialog({ open, onClose }: ComposeDialogProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  if (!open) return null;

  return (
    <div className="fixed bottom-0 right-6 w-[520px] bg-card border border-border rounded-t-xl shadow-2xl z-50 flex flex-col animate-slide-in">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-primary rounded-t-xl">
        <span className="text-sm font-medium text-primary-foreground">New Message</span>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-primary-foreground/10 transition-colors">
            <Minus className="h-4 w-4 text-primary-foreground" />
          </button>
          <button className="p-1 rounded hover:bg-primary-foreground/10 transition-colors">
            <Maximize2 className="h-3.5 w-3.5 text-primary-foreground" />
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-primary-foreground/10 transition-colors">
            <X className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="border-b border-divider">
        <div className="flex items-center border-b border-divider px-4">
          <span className="text-sm text-muted-foreground w-10">To</span>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="flex-1 py-2 text-sm bg-transparent outline-none text-foreground"
          />
        </div>
        <div className="flex items-center px-4">
          <span className="text-sm text-muted-foreground w-10">Subj</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 py-2 text-sm bg-transparent outline-none text-foreground"
          />
        </div>
      </div>

      {/* Body */}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your message..."
        className="flex-1 min-h-[200px] px-4 py-3 text-sm bg-transparent outline-none resize-none text-foreground placeholder:text-muted-foreground"
      />

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-divider">
        <button className="compose-btn px-5 py-1.5 rounded text-sm font-medium text-primary-foreground transition-all">
          Send
        </button>
      </div>
    </div>
  );
}
