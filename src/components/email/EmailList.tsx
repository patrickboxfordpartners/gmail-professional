import type { Email } from "@/hooks/useEmails";
import type { useLabels } from "@/hooks/useLabels";
import { EmailListItem } from "./EmailListItem";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCw, MoreVertical, ChevronDown, Archive, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailListProps {
  emails: Email[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
  folderName: string;
  loading?: boolean;
  fullWidth?: boolean;
  labelCtx?: ReturnType<typeof useLabels>;
}

export function EmailList({ emails, selectedId, onSelect, onToggleStar, folderName, loading, fullWidth, labelCtx }: EmailListProps) {
  return (
    <div className={cn(
      "flex flex-col h-full border-r border-divider shrink-0 bg-card",
      fullWidth ? "w-full" : "w-[400px]"
    )}>
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-divider">
        <Checkbox className="h-[14px] w-[14px] rounded-sm" />
        <ChevronDown className="h-3 w-3 text-muted-foreground -ml-0.5" />
        <div className="w-px h-4 bg-divider mx-1" />
        <button className="p-1.5 rounded-md hover:bg-secondary transition-all duration-150" title="Refresh">
          <RotateCw className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
        <button className="p-1.5 rounded-md hover:bg-secondary transition-all duration-150" title="Archive">
          <Archive className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
        <button className="p-1.5 rounded-md hover:bg-secondary transition-all duration-150" title="Delete">
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
        <button className="p-1.5 rounded-md hover:bg-secondary transition-all duration-150">
          <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
        <span className="ml-auto text-[11px] text-muted-foreground font-medium tabular-nums">
          {emails.length} {emails.length === 1 ? "message" : "messages"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-divider">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
              <Archive className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No messages</p>
            <p className="text-xs text-muted-foreground">Your {folderName} is empty</p>
          </div>
        ) : (
          emails.map((email) => (
            <EmailListItem
              key={email.id}
              email={email}
              isSelected={selectedId === email.id}
              onSelect={() => onSelect(email.id)}
              onToggleStar={(e) => {
                e.stopPropagation();
                onToggleStar(email.id);
              }}
              labelCtx={labelCtx}
            />
          ))
        )}
      </div>
    </div>
  );
}
