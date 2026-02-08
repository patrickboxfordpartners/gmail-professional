import { Inbox, Star, Send, FileText, Archive, AlertOctagon, Trash2, Plus } from "lucide-react";
import { folders } from "@/data/mockEmails";
import { cn } from "@/lib/utils";

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
}

export function EmailSidebar({ activeFolder, onFolderChange, onCompose }: EmailSidebarProps) {
  return (
    <aside className="w-56 shrink-0 border-r border-divider bg-sidebar flex flex-col h-full">
      <div className="p-3">
        <button
          onClick={onCompose}
          className="compose-btn w-full flex items-center gap-2 px-5 py-2.5 rounded-lg text-primary-foreground font-medium text-sm shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          Compose
        </button>
      </div>

      <nav className="flex-1 px-2 py-1 space-y-0.5">
        {folders.map((folder) => {
          const Icon = iconMap[folder.id] || Inbox;
          const isActive = activeFolder === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => onFolderChange(folder.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-sidebar-foreground hover:bg-secondary"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{folder.name}</span>
              {folder.count > 0 && (
                <span className={cn(
                  "text-xs tabular-nums",
                  isActive ? "font-bold text-accent-foreground" : "text-muted-foreground"
                )}>
                  {folder.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
