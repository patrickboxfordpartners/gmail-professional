import { Star, Paperclip } from "lucide-react";
import type { Email } from "@/data/mockEmails";
import { cn } from "@/lib/utils";

interface EmailListItemProps {
  email: Email;
  isSelected: boolean;
  onSelect: () => void;
  onToggleStar: (e: React.MouseEvent) => void;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / 3600000;
  if (hours < 1) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function EmailListItem({ email, isSelected, onSelect, onToggleStar }: EmailListItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left email-row-hover border-b border-divider",
        isSelected && "email-selected",
        !email.read && "bg-accent/30"
      )}
    >
      {/* Avatar */}
      <div className="mt-0.5 h-9 w-9 rounded-full bg-avatar flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-avatar-foreground">{getInitials(email.from.name)}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm truncate", !email.read ? "font-semibold text-foreground" : "text-foreground")}>
            {email.from.name}
          </span>
          <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {formatDate(email.date)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-sm truncate", !email.read ? "font-medium text-foreground" : "text-muted-foreground")}>
            {email.subject}
          </span>
          {email.hasAttachment && <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{email.preview}</p>
      </div>

      {/* Star */}
      <button
        onClick={onToggleStar}
        className="mt-1 shrink-0 p-0.5 rounded hover:bg-secondary transition-colors"
      >
        <Star
          className={cn(
            "h-4 w-4 transition-colors",
            email.starred ? "star-active" : "text-muted-foreground/40 hover:text-muted-foreground"
          )}
        />
      </button>
    </button>
  );
}
