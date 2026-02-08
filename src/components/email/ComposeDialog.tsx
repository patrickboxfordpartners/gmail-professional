import { X, Minus, Maximize2, Send } from "lucide-react";
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
    <div className="fixed bottom-0 right-6 w-[540px] bg-card border border-border rounded-t-xl shadow-stripe-lg z-50 flex flex-col animate-slide-up">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-foreground rounded-t-xl">
        <span className="text-[13px] font-semibold text-background tracking-tight">New Message</span>
        <div className="flex items-center gap-0.5">
          <button className="p-1.5 rounded-md hover:bg-background/10 transition-colors">
            <Minus className="h-3.5 w-3.5 text-background/80" strokeWidth={2} />
          </button>
          <button className="p-1.5 rounded-md hover:bg-background/10 transition-colors">
            <Maximize2 className="h-3 w-3 text-background/80" strokeWidth={2} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-background/10 transition-colors">
            <X className="h-3.5 w-3.5 text-background/80" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div>
        <div className="flex items-center border-b border-divider px-4">
          <span className="text-[12px] text-muted-foreground font-medium w-8">To</span>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="flex-1 py-2.5 text-[13px] bg-transparent outline-none text-foreground"
          />
        </div>
        <div className="flex items-center border-b border-divider px-4">
          <span className="text-[12px] text-muted-foreground font-medium w-8">Sub</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 py-2.5 text-[13px] bg-transparent outline-none text-foreground"
          />
        </div>
      </div>

      {/* Body */}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your message..."
        className="flex-1 min-h-[220px] px-4 py-3 text-[13px] bg-transparent outline-none resize-none text-foreground placeholder:text-muted-foreground/60 leading-relaxed"
      />

      {/* Actions */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-divider">
        <button className="compose-btn px-5 py-[7px] rounded-md text-[13px] font-semibold text-primary-foreground transition-all duration-200 flex items-center gap-2">
          <Send className="h-3.5 w-3.5" strokeWidth={2.5} />
          Send
        </button>
      </div>
    </div>
  );
}
