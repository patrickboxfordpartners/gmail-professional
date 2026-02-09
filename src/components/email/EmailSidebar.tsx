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
    <aside className="w-64 md:w-60 shrink-0 border-r border-divider bg-card flex flex-col h-full">
      <div className="p-4 pb-3">
        <button
          onClick={onCompose}
          className="compose-btn w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-3 md:py-2.5 rounded-lg text-primary-foreground font-medium text-[14px] md:text-[13px] tracking-wide transition-all duration-200 active:scale-[0.98]"
        >
          <Plus className="h-5 w-5 md:h-4 md:w-4" strokeWidth={2.5} />
          Compose
        </button>
      </div>

      <nav className="flex-1 px-3 py-1 space-y-1 md:space-y-0.5">
        {folders.map((folder) => {
          const Icon = iconMap[folder.id] || Inbox;
          const isActive = activeFolder === folder.id;
          const count = folderCounts[folder.id] || 0;
          return (
            <button
              key={folder.id}
              onClick={() => onFolderChange(folder.id)}
              className={cn(
                "w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 md:py-[7px] rounded-md text-[14px] md:text-[13px] transition-all duration-150 active:scale-[0.98]",
                isActive
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-sidebar-foreground hover:bg-secondary active:bg-secondary/80"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] md:h-[16px] md:w-[16px] shrink-0", isActive && "text-accent-foreground")} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="flex-1 text-left">{folder.name}</span>
              {count > 0 && (
                <span className={cn(
                  "text-xs tabular-nums font-medium px-2 py-1 md:px-1.5 md:py-0.5 rounded-full min-w-[24px] md:min-w-[20px] text-center",
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
