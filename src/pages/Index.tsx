import { Mail, Settings, HelpCircle, Bell, LogOut, Menu, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEmails } from "@/hooks/useEmails";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmailSidebar } from "@/components/email/EmailSidebar";
import { EmailList } from "@/components/email/EmailList";
import { EmailReader } from "@/components/email/EmailReader";
import { ComposeDialog } from "@/components/email/ComposeDialog";
import { SearchBar } from "@/components/email/SearchBar";
import { useTheme } from "@/hooks/useTheme";
import { useState } from "react";

const Index = () => {
  const { user, signOut } = useAuth();
  const {
    emails, selectedEmail, selectedId, activeFolder, search, loading, folderCounts,
    setSearch, handleSelect, clearSelection, handleToggleStar, handleFolderChange, sendEmail,
  } = useEmails();
  const [composeOpen, setComposeOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { dark, toggle: toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() || "ME");

  // Mobile: show reader if email selected, otherwise show list
  const showReader = isMobile && selectedId;
  const showList = !isMobile || !selectedId;

  const handleMobileFolderChange = (folder: string) => {
    handleFolderChange(folder);
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center h-[52px] px-3 md:px-5 border-b border-divider bg-card shrink-0">
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-secondary transition-all duration-150 mr-1"
          >
            <Menu className="h-4 w-4 text-foreground" strokeWidth={2} />
          </button>
        )}
        <div className="flex items-center gap-2.5 mr-2 md:mr-4">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shadow-stripe-sm">
            <Mail className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold text-foreground tracking-tight hidden sm:inline">Mail</span>
        </div>

        <SearchBar value={search} onChange={setSearch} />

        <div className="flex items-center gap-0.5 ml-auto">
          <button className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group hidden sm:block">
            <Bell className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
          </button>
          <button className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group hidden sm:block">
            <HelpCircle className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
          </button>
          <button className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group hidden sm:block">
            <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group"
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark
              ? <Sun className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
              : <Moon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
            }
          </button>
          <button
            onClick={signOut}
            className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group"
            title="Sign out"
          >
            <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
          </button>
          <div className="ml-1 md:ml-3 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-stripe-sm cursor-pointer hover:shadow-stripe-md transition-shadow">
            <span className="text-[11px] font-bold text-primary-foreground tracking-wide">{initials}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="absolute inset-0 bg-foreground/20 z-30 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={
            isMobile
              ? `absolute top-0 left-0 h-full z-40 transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
              : ""
          }
        >
          <EmailSidebar
            activeFolder={activeFolder}
            onFolderChange={handleMobileFolderChange}
            onCompose={() => { setComposeOpen(true); setSidebarOpen(false); }}
            folderCounts={folderCounts}
          />
        </div>

        {/* Email list */}
        {showList && (
          <EmailList
            emails={emails}
            selectedId={selectedId}
            onSelect={handleSelect}
            onToggleStar={handleToggleStar}
            folderName={activeFolder}
            loading={loading}
            fullWidth={isMobile}
          />
        )}

        {/* Reader — full width on mobile, flex on desktop */}
        {showReader ? (
          <EmailReader
            email={selectedEmail}
            onToggleStar={handleToggleStar}
            onBack={clearSelection}
          />
        ) : !isMobile ? (
          <EmailReader
            email={selectedEmail}
            onToggleStar={handleToggleStar}
          />
        ) : null}
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
