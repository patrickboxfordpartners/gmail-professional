import type { Email } from "@/data/mockEmails";
import { EmailListItem } from "./EmailListItem";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCw, MoreVertical, ChevronDown } from "lucide-react";

interface EmailListProps {
  emails: Email[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
  folderName: string;
}

export function EmailList({ emails, selectedId, onSelect, onToggleStar, folderName }: EmailListProps) {
  return (
    <div className="flex flex-col h-full border-r border-divider w-[380px] shrink-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-divider bg-toolbar">
        <Checkbox className="h-4 w-4" />
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
        <button className="p-1 rounded hover:bg-secondary transition-colors">
          <RotateCw className="h-4 w-4 text-muted-foreground" />
        </button>
        <button className="p-1 rounded hover:bg-secondary transition-colors">
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="ml-auto text-xs text-muted-foreground">
          {emails.length} {emails.length === 1 ? "message" : "messages"}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No messages in {folderName}
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
            />
          ))
        )}
      </div>
    </div>
  );
}
