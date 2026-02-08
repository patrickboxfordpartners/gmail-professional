import { useState, useMemo, useCallback } from "react";
import { Mail, Settings, HelpCircle, Bell } from "lucide-react";
import { mockEmails, type Email } from "@/data/mockEmails";
import { EmailSidebar } from "@/components/email/EmailSidebar";
import { EmailList } from "@/components/email/EmailList";
import { EmailReader } from "@/components/email/EmailReader";
import { ComposeDialog } from "@/components/email/ComposeDialog";
import { SearchBar } from "@/components/email/SearchBar";

const Index = () => {
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredEmails = useMemo(() => {
    let list = emails;
    if (activeFolder === "starred") {
      list = list.filter((e) => e.starred);
    } else {
      list = list.filter((e) => e.folder === activeFolder);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.from.name.toLowerCase().includes(q) ||
          e.preview.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [emails, activeFolder, search]);

  const selectedEmail = useMemo(
    () => emails.find((e) => e.id === selectedId) || null,
    [emails, selectedId]
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, read: true } : e))
    );
  }, []);

  const handleToggleStar = useCallback((id: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e))
    );
  }, []);

  const handleFolderChange = useCallback((folder: string) => {
    setActiveFolder(folder);
    setSelectedId(null);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <header className="flex items-center h-[52px] px-5 border-b border-divider bg-card shrink-0">
        <div className="flex items-center gap-2.5 mr-4">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shadow-stripe-sm">
            <Mail className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold text-foreground tracking-tight">Mail</span>
        </div>

        <SearchBar value={search} onChange={setSearch} />

        <div className="flex items-center gap-0.5 ml-auto">
          <button className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group">
            <Bell className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
          </button>
          <button className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group">
            <HelpCircle className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
          </button>
          <button className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group">
            <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
          </button>
          <div className="ml-3 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-stripe-sm cursor-pointer hover:shadow-stripe-md transition-shadow">
            <span className="text-[11px] font-bold text-primary-foreground tracking-wide">ME</span>
          </div>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        <EmailSidebar
          activeFolder={activeFolder}
          onFolderChange={handleFolderChange}
          onCompose={() => setComposeOpen(true)}
        />
        <EmailList
          emails={filteredEmails}
          selectedId={selectedId}
          onSelect={handleSelect}
          onToggleStar={handleToggleStar}
          folderName={activeFolder}
        />
        <EmailReader
          email={selectedEmail}
          onToggleStar={handleToggleStar}
        />
      </div>

      <ComposeDialog open={composeOpen} onClose={() => setComposeOpen(false)} />
    </div>
  );
};

export default Index;
