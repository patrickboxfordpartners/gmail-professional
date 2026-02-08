import { Mail, Settings, HelpCircle, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEmails } from "@/hooks/useEmails";
import { EmailSidebar } from "@/components/email/EmailSidebar";
import { EmailList } from "@/components/email/EmailList";
import { EmailReader } from "@/components/email/EmailReader";
import { ComposeDialog } from "@/components/email/ComposeDialog";
import { SearchBar } from "@/components/email/SearchBar";
import { useState } from "react";

const Index = () => {
  const { user, signOut } = useAuth();
  const {
    emails, selectedEmail, selectedId, activeFolder, search, loading, folderCounts,
    setSearch, handleSelect, handleToggleStar, handleFolderChange, sendEmail,
  } = useEmails();
  const [composeOpen, setComposeOpen] = useState(false);

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() || "ME");

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
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
          <button
            onClick={signOut}
            className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group"
            title="Sign out"
          >
            <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
          </button>
          <div className="ml-3 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-stripe-sm cursor-pointer hover:shadow-stripe-md transition-shadow">
            <span className="text-[11px] font-bold text-primary-foreground tracking-wide">{initials}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <EmailSidebar
          activeFolder={activeFolder}
          onFolderChange={handleFolderChange}
          onCompose={() => setComposeOpen(true)}
          folderCounts={folderCounts}
        />
        <EmailList
          emails={emails}
          selectedId={selectedId}
          onSelect={handleSelect}
          onToggleStar={handleToggleStar}
          folderName={activeFolder}
          loading={loading}
        />
        <EmailReader
          email={selectedEmail}
          onToggleStar={handleToggleStar}
        />
      </div>

      <ComposeDialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSend={sendEmail}
      />
    </div>
  );
};

export default Index;
