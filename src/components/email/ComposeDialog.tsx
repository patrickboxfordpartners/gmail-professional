import { X, Minus, Maximize2, Send, Sparkles, Loader2, Clock, FileText, Pen, ChevronDown, Undo2 } from "lucide-react";
import DOMPurify from "dompurify";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import type { useAIEmail } from "@/hooks/useAIEmail";
import type { useSignatures } from "@/hooks/useSignatures";
import type { useTemplates } from "@/hooks/useTemplates";

interface ComposeDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, body: string, scheduledAt?: string) => Promise<void>;
  aiCtx?: ReturnType<typeof useAIEmail>;
  sigCtx?: ReturnType<typeof useSignatures>;
  tplCtx?: ReturnType<typeof useTemplates>;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
}

export function ComposeDialog({ open, onClose, onSend, aiCtx, sigCtx, tplCtx, initialTo, initialSubject, initialBody }: ComposeDialogProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedSigId, setSelectedSigId] = useState<string | null>(null);
  const [showSigPicker, setShowSigPicker] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const undoRef = useRef<{ to: string; subject: string; body: string } | null>(null);
  const isMobile = useIsMobile();

  // Auto-select default signature
  useEffect(() => {
    if (sigCtx && !selectedSigId) {
      const def = sigCtx.getDefaultSignature();
      if (def) setSelectedSigId(def.id);
    }
  }, [sigCtx, selectedSigId]);

  // Set initial values when opening compose
  useEffect(() => {
    if (open) {
      setTo(initialTo || "");
      setSubject(initialSubject || "");
      setBody(initialBody || "");
    }
  }, [open, initialTo, initialSubject, initialBody]);

  if (!open) return null;

  const selectedSig = sigCtx?.signatures.find((s) => s.id === selectedSigId) || null;

  const handleSend = async () => {
    if (!to) { toast.error("Please enter a recipient"); return; }
    if (!subject) { toast.error("Please enter a subject"); return; }

    // Build body with signature
    let fullBody = `<p>${body.replace(/\n/g, "</p><p>")}</p>`;
    if (selectedSig && sigCtx) {
      fullBody += `<br/><div style="margin-top:12px;border-top:1px solid #e5e5e5;padding-top:12px;">${sigCtx.renderSignatureHtml(selectedSig)}</div>`;
    }

    const scheduledAt = showSchedule && scheduleDate && scheduleTime
      ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
      : undefined;

    // Undo send: 5 second delay
    if (!scheduledAt) {
      undoRef.current = { to, subject, body: fullBody };
      setUndoCountdown(5);

      const interval = setInterval(() => {
        setUndoCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const timer = setTimeout(async () => {
        clearInterval(interval);
        setUndoCountdown(0);
        setSending(true);
        try {
          await onSend(undoRef.current!.to, undoRef.current!.subject, undoRef.current!.body);
          resetForm();
          onClose();
          toast.success("Email sent");
        } catch (e) {
          console.error("Send error:", e);
          toast.error(e instanceof Error ? e.message : "Failed to send");
        } finally {
          setSending(false);
          undoRef.current = null;
        }
      }, 5000);

      setUndoTimer(timer);
      return;
    }

    // Scheduled send - no undo
    setSending(true);
    try {
      await onSend(to, subject, fullBody, scheduledAt);
      resetForm();
      onClose();
      toast.success(scheduledAt ? "Email scheduled" : "Email sent");
    } catch (e) {
      console.error("Send error:", e);
      toast.error(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleUndo = () => {
    if (undoTimer) {
      clearTimeout(undoTimer);
      setUndoTimer(null);
      setUndoCountdown(0);
      undoRef.current = null;
      toast.info("Send cancelled");
    }
  };

  const resetForm = () => {
    setTo(""); setSubject(""); setBody("");
    setShowSchedule(false); setScheduleDate(""); setScheduleTime("");
  };

  const handleAiAssist = async () => {
    if (!aiPrompt.trim() || !aiCtx) return;
    const result = await aiCtx.composeAssist(aiPrompt);
    if (result) { setBody(result); setShowAiPrompt(false); setAiPrompt(""); }
  };

  const handleLoadTemplate = (tpl: { subject: string; body: string }) => {
    setSubject(tpl.subject);
    setBody(tpl.body.replace(/<[^>]*>/g, ""));
    setShowTemplates(false);
  };

  const handleSaveTemplate = async () => {
    if (!tplCtx || !subject) { toast.error("Enter a subject first"); return; }
    setSavingTemplate(true);
    const name = prompt("Template name:");
    if (name) {
      await tplCtx.createTemplate(name, subject, `<p>${body.replace(/\n/g, "</p><p>")}</p>`);
    }
    setSavingTemplate(false);
  };

  return (
    <div className={`fixed z-50 flex flex-col animate-slide-up bg-card border border-border rounded-xl shadow-stripe-lg ${
      isMobile ? "left-0 right-0 bottom-0 w-full h-[85vh] rounded-b-none" : "bottom-6 right-6 w-[calc(50vw-3rem)] h-[calc(65vh-3rem)]"
    }`}>
      {/* Undo bar */}
      {undoCountdown > 0 && (
        <div className="absolute inset-0 z-10 bg-card/95 rounded-t-xl flex flex-col items-center justify-center gap-3 animate-fade-in">
          <div className="text-[14px] font-semibold text-foreground">Sending in {undoCountdown}s...</div>
          <button
            onClick={handleUndo}
            className="px-5 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-destructive/90 transition-colors"
          >
            <Undo2 className="h-4 w-4" /> Undo Send
          </button>
        </div>
      )}

      {/* Title bar */}
      <div className={`flex items-center justify-between px-4 py-2.5 bg-foreground shrink-0 ${
        isMobile ? "rounded-t-xl" : "rounded-t-xl"
      }`}>
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

      {/* Fields */}
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

      {/* Template picker */}
      {showTemplates && tplCtx && (
        <div className="px-4 py-2.5 border-b border-divider bg-secondary/50 animate-fade-in max-h-[200px] overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-3 w-3 text-primary" />
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Templates</span>
          </div>
          {tplCtx.templates.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No templates saved yet</p>
          ) : (
            <div className="space-y-1">
              {tplCtx.templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleLoadTemplate(tpl)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-[12px] transition-colors"
                >
                  <div className="font-medium text-foreground">{tpl.name}</div>
                  <div className="text-muted-foreground truncate">{tpl.subject}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule picker */}
      {showSchedule && (
        <div className="px-4 py-2.5 border-b border-divider bg-primary/5 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-3 w-3 text-primary" />
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Schedule Send</span>
          </div>
          <div className="flex gap-2">
            <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
              className="flex-1 px-3 py-2 text-[12px] bg-background border border-input rounded-md outline-none text-foreground focus:border-ring" />
            <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}
              className="w-28 px-3 py-2 text-[12px] bg-background border border-input rounded-md outline-none text-foreground focus:border-ring" />
          </div>
        </div>
      )}

      {/* AI prompt */}
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

      {/* Body */}
      <textarea value={body} onChange={(e) => setBody(e.target.value)}
        placeholder="Write your message..."
        className="flex-1 min-h-[80px] px-4 py-3 text-[13px] bg-transparent outline-none resize-none text-foreground placeholder:text-muted-foreground/60 leading-relaxed" />

      {/* Signature preview */}
      {selectedSig && sigCtx && (
        <div className="px-4 pb-2 shrink-0">
          <div className="relative group">
            <div
              className="p-2 rounded-md border border-divider bg-secondary/30 overflow-hidden max-h-[80px] text-[11px]"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sigCtx.renderSignatureHtml(selectedSig)) }}
            />
            <button
              onClick={() => setShowSigPicker(!showSigPicker)}
              className="absolute top-1 right-1 p-1 rounded bg-background/80 border border-divider opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          {showSigPicker && (
            <div className="mt-1 border border-divider rounded-md bg-card shadow-sm overflow-hidden animate-fade-in">
              <button
                onClick={() => { setSelectedSigId(null); setShowSigPicker(false); }}
                className="w-full text-left px-3 py-2 text-[11px] text-muted-foreground hover:bg-secondary transition-colors"
              >
                No signature
              </button>
              {sigCtx.signatures.map((sig) => (
                <button
                  key={sig.id}
                  onClick={() => { setSelectedSigId(sig.id); setShowSigPicker(false); }}
                  className="w-full text-left px-3 py-2 text-[11px] text-foreground hover:bg-secondary transition-colors border-t border-divider"
                >
                  {sig.name} {sig.is_default && "⭐"}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-t border-divider shrink-0 flex-wrap">
        <button onClick={handleSend} disabled={sending || undoCountdown > 0}
          className="compose-btn px-5 py-[7px] rounded-md text-[13px] font-semibold text-primary-foreground transition-all duration-200 flex items-center gap-2 disabled:opacity-50">
          <Send className="h-3.5 w-3.5" strokeWidth={2.5} />
          {sending ? "Sending..." : "Send"}
        </button>

        <button
          onClick={() => { setShowSchedule(!showSchedule); setShowTemplates(false); setShowAiPrompt(false); }}
          className={`flex items-center gap-1 px-2.5 py-[7px] rounded-md text-[11px] font-medium transition-all ${
            showSchedule ? "bg-primary/10 text-primary" : "hover:bg-secondary text-muted-foreground"
          }`}
          title="Schedule send"
        >
          <Clock className="h-3.5 w-3.5" />
        </button>

        {tplCtx && (
          <>
            <button
              onClick={() => { setShowTemplates(!showTemplates); setShowSchedule(false); setShowAiPrompt(false); }}
              className={`flex items-center gap-1 px-2.5 py-[7px] rounded-md text-[11px] font-medium transition-all ${
                showTemplates ? "bg-primary/10 text-primary" : "hover:bg-secondary text-muted-foreground"
              }`}
              title="Templates"
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleSaveTemplate}
              disabled={savingTemplate || !subject}
              className="flex items-center gap-1 px-2.5 py-[7px] rounded-md text-[11px] font-medium hover:bg-secondary text-muted-foreground transition-all disabled:opacity-50"
              title="Save as template"
            >
              <Pen className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {aiCtx && (
          <button
            onClick={() => { setShowAiPrompt(!showAiPrompt); setShowTemplates(false); setShowSchedule(false); }}
            className={`flex items-center gap-1 px-2.5 py-[7px] rounded-md text-[11px] font-medium transition-all ${
              showAiPrompt ? "bg-primary/10 text-primary" : "hover:bg-secondary text-muted-foreground"
            }`}
            title="AI Assist"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
