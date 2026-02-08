import { X, Minus, Maximize2, Send, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import type { useAIEmail } from "@/hooks/useAIEmail";

interface ComposeDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, body: string) => Promise<void>;
  aiCtx?: ReturnType<typeof useAIEmail>;
}

export function ComposeDialog({ open, onClose, onSend, aiCtx }: ComposeDialogProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const isMobile = useIsMobile();

  if (!open) return null;

  const handleSend = async () => {
    if (!to) { toast.error("Please enter a recipient"); return; }
    if (!subject) { toast.error("Please enter a subject"); return; }
    setSending(true);
    try {
      await onSend(to, subject, `<p>${body.replace(/\n/g, "</p><p>")}</p>`);
      setTo(""); setSubject(""); setBody("");
      onClose();
    } finally { setSending(false); }
  };

  const handleAiAssist = async () => {
    if (!aiPrompt.trim() || !aiCtx) return;
    const result = await aiCtx.composeAssist(aiPrompt);
    if (result) { setBody(result); setShowAiPrompt(false); setAiPrompt(""); }
  };

  return (
    <div className={`fixed bottom-0 z-50 flex flex-col animate-slide-up bg-card border border-border rounded-t-xl shadow-stripe-lg ${
      isMobile ? "left-0 right-0 w-full h-[85vh]" : "right-6 w-[540px]"
    }`}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-foreground rounded-t-xl shrink-0">
        <span className="text-[13px] font-semibold text-background tracking-tight">New Message</span>
        <div className="flex items-center gap-0.5">
          {!isMobile && (
            <>
              <button className="p-1.5 rounded-md hover:bg-background/10 transition-colors">
                <Minus className="h-3.5 w-3.5 text-background/80" strokeWidth={2} />
              </button>
              <button className="p-1.5 rounded-md hover:bg-background/10 transition-colors">
                <Maximize2 className="h-3 w-3 text-background/80" strokeWidth={2} />
              </button>
            </>
          )}
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-background/10 transition-colors">
            <X className="h-3.5 w-3.5 text-background/80" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center border-b border-divider px-4">
          <span className="text-[12px] text-muted-foreground font-medium w-8">To</span>
          <input type="email" value={to} onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@boxfordpartners.com"
            className="flex-1 py-2.5 text-[13px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40" />
        </div>
        <div className="flex items-center border-b border-divider px-4">
          <span className="text-[12px] text-muted-foreground font-medium w-8">Sub</span>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
            className="flex-1 py-2.5 text-[13px] bg-transparent outline-none text-foreground" />
        </div>
      </div>

      {showAiPrompt && (
        <div className="px-4 py-2.5 border-b border-divider bg-primary/5 animate-fade-in">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">AI Compose</span>
          </div>
          <div className="flex gap-2">
            <input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAiAssist()}
              placeholder="e.g. Thank them for the proposal and ask for a meeting..."
              className="flex-1 px-3 py-2 text-[12px] bg-background border border-input rounded-md outline-none text-foreground placeholder:text-muted-foreground/50 focus:border-ring"
            />
            <button
              onClick={handleAiAssist}
              disabled={aiCtx?.composing || !aiPrompt.trim()}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50 flex items-center gap-1"
            >
              {aiCtx?.composing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Draft
            </button>
          </div>
        </div>
      )}

      <textarea value={body} onChange={(e) => setBody(e.target.value)}
        placeholder="Write your message..."
        className="flex-1 min-h-[120px] px-4 py-3 text-[13px] bg-transparent outline-none resize-none text-foreground placeholder:text-muted-foreground/60 leading-relaxed" />

      <div className="flex items-center gap-3 px-4 py-3 border-t border-divider shrink-0">
        <button onClick={handleSend} disabled={sending}
          className="compose-btn px-5 py-[7px] rounded-md text-[13px] font-semibold text-primary-foreground transition-all duration-200 flex items-center gap-2 disabled:opacity-50">
          <Send className="h-3.5 w-3.5" strokeWidth={2.5} />
          {sending ? "Sending..." : "Send"}
        </button>
        {aiCtx && (
          <button
            onClick={() => setShowAiPrompt(!showAiPrompt)}
            className={`flex items-center gap-1.5 px-3 py-[7px] rounded-md text-[12px] font-medium transition-all ${
              showAiPrompt ? "bg-primary/10 text-primary" : "hover:bg-secondary text-muted-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Assist
          </button>
        )}
      </div>
    </div>
  );
}
