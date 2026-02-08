import { Reply, ReplyAll, Forward, MoreHorizontal, Star, Paperclip, ArrowLeft, Mail } from "lucide-react";
import type { Email } from "@/data/mockEmails";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }) + " at " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

interface EmailReaderProps {
  email: Email | null;
  onToggleStar: (id: string) => void;
  onBack?: () => void;
}

export function EmailReader({ email, onToggleStar, onBack }: EmailReaderProps) {
  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4 shadow-stripe-sm">
            <Mail className="h-7 w-7 text-muted-foreground/40" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Select a message to read</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Choose from your inbox on the left</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in bg-background">
      {/* Header toolbar */}
      <div className="flex items-center gap-0.5 px-4 py-2.5 border-b border-divider">
        {onBack && (
          <button onClick={onBack} className="p-1.5 rounded-md hover:bg-secondary transition-all duration-150 mr-1">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
          </button>
        )}
        <button className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group" title="Reply">
          <Reply className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
        </button>
        <button className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group" title="Reply All">
          <ReplyAll className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
        </button>
        <button className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group" title="Forward">
          <Forward className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => onToggleStar(email.id)}
          className="p-2 rounded-md hover:bg-secondary transition-all duration-150"
        >
          <Star className={cn("h-4 w-4 transition-all duration-200", email.starred ? "star-active" : "text-muted-foreground")} strokeWidth={email.starred ? 2.5 : 1.8} />
        </button>
        <button className="p-2 rounded-md hover:bg-secondary transition-all duration-150">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
        </button>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6">
          <h1 className="text-lg font-semibold text-foreground tracking-tight mb-6">{email.subject}</h1>

          <div className="flex items-start gap-3.5 mb-8">
            <div className="h-10 w-10 rounded-full bg-avatar flex items-center justify-center shrink-0 shadow-stripe-sm">
              <span className="text-[11px] font-bold text-avatar-foreground tracking-wide">{getInitials(email.from.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-[13px] text-foreground">{email.from.name}</span>
                <span className="text-[11px] text-muted-foreground">&lt;{email.from.email}&gt;</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                To: {email.to.name}
              </div>
              <div className="text-[11px] text-muted-foreground/70">{formatFullDate(email.date)}</div>
            </div>
          </div>

          {email.hasAttachment && (
            <div className="mb-6 p-3.5 rounded-lg border border-divider bg-secondary/50 flex items-center gap-2.5 shadow-stripe-sm">
              <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center">
                <Paperclip className="h-3.5 w-3.5 text-accent-foreground" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-foreground">Attachment</p>
                <p className="text-[11px] text-muted-foreground">1 file attached</p>
              </div>
            </div>
          )}

          <div
            className="text-[14px] leading-relaxed text-foreground/90 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-l-primary/30 [&_blockquote]:bg-secondary/50 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:rounded-r-lg [&_blockquote]:text-muted-foreground [&_ul]:space-y-1.5 [&_li]:text-foreground/85 [&_p]:mb-4"
            dangerouslySetInnerHTML={{ __html: email.body }}
          />
        </div>
      </div>

      {/* Quick reply */}
      <div className="border-t border-divider p-4">
        <div className="max-w-3xl mx-auto">
          <div className="border border-input rounded-lg px-4 py-3 text-[13px] text-muted-foreground cursor-text hover:border-ring/50 hover:shadow-stripe-sm transition-all duration-200">
            Reply to {email.from.name}...
          </div>
        </div>
      </div>
    </div>
  );
}
