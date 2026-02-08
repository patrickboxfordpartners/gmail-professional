import { Sparkles, Loader2, X, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// Summary panel shown in email reader
export function AISummaryPanel({
  summary,
  loading,
  onRequest,
  onClear,
}: {
  summary: string | null;
  loading: boolean;
  onRequest: () => void;
  onClear: () => void;
}) {
  if (summary) {
    return (
      <div className="mx-8 mb-4 p-3.5 rounded-lg border border-primary/20 bg-primary/5 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            AI Summary
          </div>
          <button onClick={onClear} className="p-0.5 rounded hover:bg-primary/10 transition-colors">
            <X className="h-3 w-3 text-primary" />
          </button>
        </div>
        <p className="text-[13px] text-foreground/90 leading-relaxed">{summary}</p>
      </div>
    );
  }

  return (
    <button
      onClick={onRequest}
      disabled={loading}
      className="mx-8 mb-4 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-primary/30 text-[12px] font-medium text-primary hover:bg-primary/5 transition-all disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
      {loading ? "Summarizing…" : "Summarize with AI"}
    </button>
  );
}

// Smart reply chips shown in email reader footer
export function SmartReplyChips({
  replies,
  loading,
  onRequest,
  onSelect,
}: {
  replies: string[];
  loading: boolean;
  onRequest: () => void;
  onSelect: (reply: string) => void;
}) {
  if (replies.length > 0) {
    return (
      <div className="flex flex-wrap gap-2 mb-2">
        {replies.map((r, i) => (
          <button
            key={i}
            onClick={() => onSelect(r)}
            className="px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-[12px] text-foreground hover:bg-primary/10 transition-all animate-fade-in"
          >
            {r}
          </button>
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={onRequest}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 text-[12px] font-medium text-primary hover:bg-primary/5 transition-all disabled:opacity-50 mb-2"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
      {loading ? "Generating…" : "Smart Reply"}
    </button>
  );
}

// Buying signals section header in email list
export function BuyingSignalBadge({ urgency, reason }: { urgency: string; reason: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide",
        urgency === "high"
          ? "bg-destructive/10 text-destructive"
          : urgency === "medium"
          ? "bg-accent/50 text-accent-foreground"
          : "bg-secondary text-muted-foreground"
      )}
      title={reason}
    >
      <AlertTriangle className="h-2.5 w-2.5" />
      {urgency === "high" ? "Urgent" : urgency === "medium" ? "Signal" : "Low"}
    </div>
  );
}

// Section divider for buying signals in email list
export function BuyingSignalHeader() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-destructive/5 border-b border-destructive/10">
      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
      <span className="text-[11px] font-bold text-destructive uppercase tracking-wider">Buying Signals Detected</span>
    </div>
  );
}
