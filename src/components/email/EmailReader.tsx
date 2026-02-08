import { Reply, ReplyAll, Forward, MoreHorizontal, Star, Paperclip, ArrowLeft } from "lucide-react";
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
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Paperclip className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm">Select an email to read</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in">
      {/* Header toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-divider bg-toolbar">
        {onBack && (
          <button onClick={onBack} className="p-1.5 rounded hover:bg-secondary transition-colors mr-1">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        <button className="p-1.5 rounded hover:bg-secondary transition-colors">
          <Reply className="h-4 w-4 text-muted-foreground" />
        </button>
        <button className="p-1.5 rounded hover:bg-secondary transition-colors">
          <ReplyAll className="h-4 w-4 text-muted-foreground" />
        </button>
        <button className="p-1.5 rounded hover:bg-secondary transition-colors">
          <Forward className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => onToggleStar(email.id)}
          className="p-1.5 rounded hover:bg-secondary transition-colors"
        >
          <Star className={cn("h-4 w-4", email.starred ? "star-active" : "text-muted-foreground")} />
        </button>
        <button className="p-1.5 rounded hover:bg-secondary transition-colors">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <h1 className="text-xl font-semibold text-foreground mb-4">{email.subject}</h1>

        <div className="flex items-start gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-avatar flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-avatar-foreground">{getInitials(email.from.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm text-foreground">{email.from.name}</span>
              <span className="text-xs text-muted-foreground">&lt;{email.from.email}&gt;</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              To: {email.to.name} &lt;{email.to.email}&gt;
            </div>
            <div className="text-xs text-muted-foreground">{formatFullDate(email.date)}</div>
          </div>
        </div>

        {email.hasAttachment && (
          <div className="mb-4 p-3 rounded-md bg-secondary flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">1 attachment</span>
          </div>
        )}

        <div
          className="prose prose-sm max-w-none text-foreground [&_a]:text-primary [&_blockquote]:border-l-primary [&_blockquote]:bg-secondary [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:rounded-r"
          dangerouslySetInnerHTML={{ __html: email.body }}
        />
      </div>

      {/* Quick reply */}
      <div className="border-t border-divider p-4">
        <div className="border border-input rounded-lg px-4 py-3 text-sm text-muted-foreground cursor-text hover:border-ring transition-colors">
          Click here to reply...
        </div>
      </div>
    </div>
  );
}
