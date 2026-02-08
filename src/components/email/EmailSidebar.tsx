import { Inbox, Star, Send, FileText, Archive, AlertOctagon, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const folders = [
  { id: "inbox", name: "Inbox" },
  { id: "starred", name: "Starred" },
  { id: "sent", name: "Sent" },
  { id: "drafts", name: "Drafts" },
  { id: "archive", name: "Archive" },
  { id: "spam", name: "Spam" },
  { id: "trash", name: "Trash" },
];

const iconMap: Record<string, React.ElementType> = {
  inbox: Inbox,
  starred: Star,
  sent: Send,
  drafts: FileText,
  archive: Archive,
  spam: AlertOctagon,
  trash: Trash2,
};

interface EmailSidebarProps {
  activeFolder: string;
  onFolderChange: (folder: string) => void;
  onCompose: () => void;
  folderCounts: Record<string, number>;
}

export function EmailSidebar({ activeFolder, onFolderChange, onCompose, folderCounts }: EmailSidebarProps) {
  return (
    <aside className="w-60 shrink-0 border-r border-divider bg-card flex flex-col h-full">
      <div className="p-4 pb-3">
        <button
          onClick={onCompose}
          className="compose-btn w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-primary-foreground font-medium text-[13px] tracking-wide transition-all duration-200"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Compose
        </button>
      </div>

      <nav className="flex-1 px-3 py-1 space-y-0.5">
        {folders.map((folder) => {
          const Icon = iconMap[folder.id] || Inbox;
          const isActive = activeFolder === folder.id;
          const count = folderCounts[folder.id] || 0;
          return (
            <button
              key={folder.id}
              onClick={() => onFolderChange(folder.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-[7px] rounded-md text-[13px] transition-all duration-150",
                isActive
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-sidebar-foreground hover:bg-secondary"
              )}
            >
              <Icon className={cn("h-[16px] w-[16px] shrink-0", isActive && "text-accent-foreground")} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="flex-1 text-left">{folder.name}</span>
              {count > 0 && (
                <span className={cn(
                  "text-xs tabular-nums font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                  isActive
                    ? "bg-accent-foreground/10 text-accent-foreground"
                    : "text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
