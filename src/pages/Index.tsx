import { Mail, Settings, HelpCircle, Bell, LogOut, Menu, Sun, Moon, Users, Download, Pen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEmails } from "@/hooks/useEmails";
import { useLabels } from "@/hooks/useLabels";
import { useAIEmail } from "@/hooks/useAIEmail";
import { useCRM } from "@/hooks/useCRM";
import { useNoiseFilter } from "@/hooks/useNoiseFilter";
import { useSignatures } from "@/hooks/useSignatures";
import { useTemplates } from "@/hooks/useTemplates";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmailSidebar } from "@/components/email/EmailSidebar";
import { EmailList } from "@/components/email/EmailList";
import { EmailReader } from "@/components/email/EmailReader";
import { ComposeDialog } from "@/components/email/ComposeDialog";
import { SearchBar } from "@/components/email/SearchBar";
import { SettingsPanel } from "@/components/email/SettingsPanel";
import { CRMPanel } from "@/components/email/CRMComponents";
import { MigrationPanel } from "@/components/email/MigrationPanel";
import { SignatureEditor } from "@/components/email/SignatureEditor";
import { useTheme } from "@/hooks/useTheme";
import { useState, useEffect, useCallback, useMemo } from "react";

const Index = () => {
  const { user, signOut } = useAuth();
  const {
    emails, selectedEmail, selectedId, activeFolder, search, loading, folderCounts, hasMore,
    setSearch, handleSelect, clearSelection, handleToggleStar, handleFolderChange, sendEmail,
    loadMore, fetchEmailBody, handleArchive, handleDelete, handleMarkUnread, handleMarkRead,
    handleBulkMarkRead, handleBulkMarkUnread, handleBulkArchive, handleBulkDelete, handleMoveToFolder,
  } = useEmails();
  const labelCtx = useLabels();
  const aiCtx = useAIEmail();
  const crmCtx = useCRM();
  const noiseFilter = useNoiseFilter();
  const sigCtx = useSignatures();
  const tplCtx = useTemplates();
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyContext, setReplyContext] = useState<{ to: string; subject: string; body: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [crmOpen, setCrmOpen] = useState(false);
  const [migrationOpen, setMigrationOpen] = useState(false);
  const [sigEditorOpen, setSigEditorOpen] = useState(false);
  const { dark, toggle: toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  // Record interaction when user selects an email, and fetch body on demand
  const handleSelectWithTracking = useCallback(async (id: string) => {
    handleSelect(id);
    aiCtx.setActiveEmail(id);
    const email = emails.find((e) => e.id === id);
    if (email) {
      noiseFilter.recordInteraction(email.from.email);
      if (!email.body) {
        fetchEmailBody(id);
      }
    }
  }, [handleSelect, emails, noiseFilter, fetchEmailBody, aiCtx]);

  const inactiveSenders = useMemo(
    () => noiseFilter.getInactiveSenders(emails),
    [emails, noiseFilter]
  );

  // Merge DB-backed opportunity scores with in-memory buying signals
  const buyingSignals = useMemo(() => {
    if (activeFolder !== "inbox") return aiCtx.buyingSignals;
    const signals: Record<string, { urgency: string; reason: string }> = { ...aiCtx.buyingSignals };
    for (const e of emails) {
      if ((e.opportunityScore ?? 0) >= 60) {
        signals[e.id] = {
          urgency: (e.opportunityScore ?? 0) >= 80 ? "high" : "medium",
          reason: e.businessClassification || "Opportunity detected",
        };
      }
    }
    return signals;
  }, [activeFolder, emails, aiCtx.buyingSignals]);

  // Run 4-stage AI pipeline on unprocessed inbox emails
  useEffect(() => {
    if (activeFolder === "inbox" && emails.length > 0 && !aiCtx.processing) {
      aiCtx.processEmails(emails);
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

  const handleReply = useCallback((to: string, subject: string, body: string) => {
    setReplyContext({ to, subject, body });
    setComposeOpen(true);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <header className="flex items-center h-[56px] md:h-[52px] px-2 md:px-5 border-b border-divider bg-card shrink-0">
        <div className="flex items-center gap-2 mr-2 md:mr-4">
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center shadow-stripe-sm">
                <Mail className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              </div>
            </button>
          )}
          {!isMobile && (
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shadow-stripe-sm">
              <Mail className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2.5} />
            </div>
          )}
          <span className="text-[15px] font-semibold text-foreground tracking-tight">mailBOXFORD</span>
        </div>

        {!isMobile && <SearchBar value={search} onChange={setSearch} />}

        <div className="flex items-center gap-0.5 ml-auto">
          <button className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group hidden sm:block" title="Notifications">
            <Bell className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
          </button>
          <button className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group hidden sm:block" title="Help">
            <HelpCircle className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
          </button>
          <button
            onClick={() => window.open('https://app.boxfordpartners.com', '_blank')}
            className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group hidden sm:block"
            title="CRM"
          >
            <Users className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
          </button>
          <button
            onClick={() => setSigEditorOpen(true)}
            className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group hidden sm:block"
            title="Signatures"
          >
            <Pen className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
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
            className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:p-2 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150 group"
            title={dark ? "Light mode" : "Dark mode"}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark
              ? <Sun className="h-5 w-5 md:h-4 md:w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
              : <Moon className="h-5 w-5 md:h-4 md:w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
            }
          </button>
          <button
            onClick={signOut}
            className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:p-2 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150 group hidden md:flex"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
          </button>
          <div className="ml-1 md:ml-3 min-w-[44px] min-h-[44px] md:h-8 md:w-8 rounded-full bg-primary flex items-center justify-center shadow-stripe-sm cursor-pointer hover:shadow-stripe-md active:scale-95 transition-all">
            <span className="text-[11px] font-bold text-primary-foreground tracking-wide">{initials}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {isMobile && sidebarOpen && (
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm z-30 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
            role="button"
            aria-label="Close sidebar"
          />
        )}

        <div
          className={
            isMobile
              ? `absolute top-0 left-0 h-full z-40 transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} shadow-stripe-lg`
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
            buyingSignals={buyingSignals}
            inactiveSenders={activeFolder === "inbox" ? inactiveSenders : new Set()}
            onDismissSender={noiseFilter.dismissSuggestion}
            onKeepSender={noiseFilter.recordInteraction}
            hasMore={hasMore}
            onLoadMore={loadMore}
            search={search}
            onSearchChange={setSearch}
            onRefresh={() => window.location.reload()}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onMarkRead={handleMarkRead}
            onBulkMarkRead={handleBulkMarkRead}
            onBulkMarkUnread={handleBulkMarkUnread}
            onBulkArchive={handleBulkArchive}
            onBulkDelete={handleBulkDelete}
          />
        )}

        {showReader ? (
          <EmailReader
            email={selectedEmail}
            onToggleStar={handleToggleStar}
            onBack={clearSelection}
            onReply={handleReply}
            fetchEmailBody={fetchEmailBody}
            labelCtx={labelCtx}
            aiCtx={aiCtx}
            crmCtx={crmCtx}
            onMarkUnread={handleMarkUnread}
            onDelete={handleDelete}
            onMoveToFolder={handleMoveToFolder}
          />
        ) : !isMobile ? (
          <EmailReader
            email={selectedEmail}
            onToggleStar={handleToggleStar}
            onReply={handleReply}
            fetchEmailBody={fetchEmailBody}
            labelCtx={labelCtx}
            aiCtx={aiCtx}
            crmCtx={crmCtx}
            onMarkUnread={handleMarkUnread}
            onDelete={handleDelete}
            onMoveToFolder={handleMoveToFolder}
          />
        ) : null}
      </div>

      <ComposeDialog
        open={composeOpen}
        onClose={() => {
          setComposeOpen(false);
          setReplyContext(null);
        }}
        onSend={sendEmail}
        aiCtx={aiCtx}
        sigCtx={sigCtx}
        tplCtx={tplCtx}
        initialTo={replyContext?.to}
        initialSubject={replyContext?.subject}
        initialBody={replyContext?.body}
      />

      <SignatureEditor
        open={sigEditorOpen}
        onClose={() => setSigEditorOpen(false)}
        ctx={sigCtx}
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
