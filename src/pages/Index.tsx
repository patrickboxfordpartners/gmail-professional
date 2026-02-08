import { Mail, Settings, HelpCircle, Bell, LogOut, Menu, Sun, Moon, Users, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEmails } from "@/hooks/useEmails";
import { useLabels } from "@/hooks/useLabels";
import { useAIEmail } from "@/hooks/useAIEmail";
import { useCRM } from "@/hooks/useCRM";
import { useNoiseFilter } from "@/hooks/useNoiseFilter";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmailSidebar } from "@/components/email/EmailSidebar";
import { EmailList } from "@/components/email/EmailList";
import { EmailReader } from "@/components/email/EmailReader";
import { ComposeDialog } from "@/components/email/ComposeDialog";
import { SearchBar } from "@/components/email/SearchBar";
import { SettingsPanel } from "@/components/email/SettingsPanel";
import { CRMPanel } from "@/components/email/CRMComponents";
import { MigrationPanel } from "@/components/email/MigrationPanel";
import { useTheme } from "@/hooks/useTheme";
import { useState, useEffect, useCallback } from "react";

const Index = () => {
  const { user, signOut } = useAuth();
  const {
    emails, selectedEmail, selectedId, activeFolder, search, loading, folderCounts,
    setSearch, handleSelect, clearSelection, handleToggleStar, handleFolderChange, sendEmail,
  } = useEmails();
  const labelCtx = useLabels();
  const aiCtx = useAIEmail();
  const crmCtx = useCRM();
  const noiseFilter = useNoiseFilter();
  const [composeOpen, setComposeOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [crmOpen, setCrmOpen] = useState(false);
  const [migrationOpen, setMigrationOpen] = useState(false);
  const { dark, toggle: toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  // Record interaction when user selects an email
  const handleSelectWithTracking = useCallback(async (id: string) => {
    handleSelect(id);
    const email = emails.find((e) => e.id === id);
    if (email) {
      noiseFilter.recordInteraction(email.from.email);
    }
  }, [handleSelect, emails, noiseFilter]);

  const inactiveSenders = noiseFilter.getInactiveSenders(emails);

  // Auto-detect buying signals when inbox emails load
  useEffect(() => {
    if (activeFolder === "inbox" && emails.length > 0 && !aiCtx.categorizing) {
      aiCtx.detectBuyingSignals(emails);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolder, emails.length]);

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() || "ME");

  const showReader = isMobile && selectedId;
  const showList = !isMobile || !selectedId;

  const handleMobileFolderChange = (folder: string) => {
    handleFolderChange(folder);
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
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
          <span className="text-[15px] font-semibold text-foreground tracking-tight hidden sm:inline">mailBOXFORD</span>
        </div>

        <SearchBar value={search} onChange={setSearch} />

        <div className="flex items-center gap-0.5 ml-auto">
          <button className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group hidden sm:block">
            <Bell className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
          </button>
          <button className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group hidden sm:block">
            <HelpCircle className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
          </button>
          <button
            onClick={() => setCrmOpen(true)}
            className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group hidden sm:block"
            title="CRM"
          >
            <Users className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
          </button>
          <button
            onClick={() => setMigrationOpen(true)}
            className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group hidden sm:block"
            title="Import Emails"
          >
            <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group hidden sm:block"
            title="Settings"
          >
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
        {isMobile && sidebarOpen && (
          <div
            className="absolute inset-0 bg-foreground/20 z-30 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

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

        {showList && (
          <EmailList
            emails={emails}
            selectedId={selectedId}
            onSelect={handleSelectWithTracking}
            onToggleStar={handleToggleStar}
            folderName={activeFolder}
            loading={loading}
            fullWidth={isMobile}
            labelCtx={labelCtx}
            buyingSignals={activeFolder === "inbox" ? aiCtx.buyingSignals : {}}
            inactiveSenders={activeFolder === "inbox" ? inactiveSenders : new Set()}
            onDismissSender={noiseFilter.dismissSuggestion}
            onKeepSender={noiseFilter.recordInteraction}
          />
        )}

        {showReader ? (
          <EmailReader
            email={selectedEmail}
            onToggleStar={handleToggleStar}
            onBack={clearSelection}
            labelCtx={labelCtx}
            aiCtx={aiCtx}
            crmCtx={crmCtx}
          />
        ) : !isMobile ? (
          <EmailReader
            email={selectedEmail}
            onToggleStar={handleToggleStar}
            labelCtx={labelCtx}
            aiCtx={aiCtx}
            crmCtx={crmCtx}
          />
        ) : null}
      </div>

      <ComposeDialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSend={sendEmail}
        aiCtx={aiCtx}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <CRMPanel
        open={crmOpen}
        onClose={() => setCrmOpen(false)}
        contacts={crmCtx.contacts}
        companies={crmCtx.companies}
        onCreateContact={crmCtx.createContact}
        onCreateCompany={crmCtx.createCompany}
        onDeleteContact={crmCtx.deleteContact}
        onDeleteCompany={crmCtx.deleteCompany}
        onUpdateContact={crmCtx.updateContact}
      />

      <MigrationPanel
        open={migrationOpen}
        onClose={() => setMigrationOpen(false)}
      />
    </div>
  );
};

export default Index;
