import { useState } from "react";
import { Users, Plus, Building2, X, UserPlus, Link2, Unlink, Search } from "lucide-react";
import type { Contact, Company } from "@/hooks/useCRM";
import { cn } from "@/lib/utils";

// Contact picker popover to link email to contact
export function ContactLinker({
  contacts,
  linkedContacts,
  onLink,
  onUnlink,
  emailId,
}: {
  contacts: Contact[];
  linkedContacts: Contact[];
  onLink: (emailId: string, contactId: string) => void;
  onUnlink: (emailId: string, contactId: string) => void;
  emailId: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const linkedIds = new Set(linkedContacts.map((c) => c.id));

  const filtered = contacts.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md hover:bg-secondary transition-all duration-150 group"
        title="Link to contact"
      >
        <Users className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-72 bg-card border border-divider rounded-lg shadow-stripe-lg z-50 animate-fade-in">
            <div className="p-2 border-b border-divider">
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-secondary">
                <Search className="h-3 w-3 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search contacts..."
                  className="flex-1 text-[12px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50"
                  autoFocus
                />
              </div>
            </div>

            {linkedContacts.length > 0 && (
              <div className="p-2 border-b border-divider">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">Linked</span>
                {linkedContacts.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary mt-1">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-primary">{c.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                    </div>
                    <button
                      onClick={() => onUnlink(emailId, c.id)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Unlink className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-2 max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-3">No contacts found</p>
              ) : (
                filtered.filter((c) => !linkedIds.has(c.id)).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { onLink(emailId, c.id); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary text-left"
                  >
                    <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-[9px] font-bold text-accent-foreground">{c.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                    </div>
                    <Link2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// CRM sidebar panel
export function CRMPanel({
  open,
  onClose,
  contacts,
  companies,
  onCreateContact,
  onCreateCompany,
  onDeleteContact,
  onDeleteCompany,
  onUpdateContact,
}: {
  open: boolean;
  onClose: () => void;
  contacts: Contact[];
  companies: Company[];
  onCreateContact: (data: { name: string; email: string; phone?: string; role?: string; company_id?: string; deal_stage?: string }) => void;
  onCreateCompany: (data: { name: string; domain?: string }) => void;
  onDeleteContact: (id: string) => void;
  onDeleteCompany: (id: string) => void;
  onUpdateContact: (id: string, data: Partial<Contact>) => void;
}) {
  const [tab, setTab] = useState<"contacts" | "companies">("contacts");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [dealStage, setDealStage] = useState("lead");
  const [companyName, setCompanyName] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");

  if (!open) return null;

  const dealStages = ["lead", "qualified", "proposal", "negotiation", "closed-won", "closed-lost"];

  const handleCreateContact = () => {
    if (!name || !email) return;
    onCreateContact({ name, email, phone, role, company_id: companyId || undefined, deal_stage: dealStage });
    setName(""); setEmail(""); setPhone(""); setRole(""); setCompanyId(""); setDealStage("lead");
    setShowForm(false);
  };

  const handleCreateCompany = () => {
    if (!companyName) return;
    onCreateCompany({ name: companyName, domain: companyDomain || undefined });
    setCompanyName(""); setCompanyDomain("");
    setShowForm(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40 animate-fade-in" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[380px] max-w-full bg-card border-l border-divider z-50 flex flex-col animate-slide-in-right shadow-stripe-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-divider">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-[14px] font-semibold text-foreground">CRM</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex border-b border-divider">
          <button
            onClick={() => { setTab("contacts"); setShowForm(false); }}
            className={cn("flex-1 py-2 text-[12px] font-medium transition-colors", tab === "contacts" ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}
          >
            Contacts ({contacts.length})
          </button>
          <button
            onClick={() => { setTab("companies"); setShowForm(false); }}
            className={cn("flex-1 py-2 text-[12px] font-medium transition-colors", tab === "companies" ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}
          >
            Companies ({companies.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === "contacts" && !showForm && (
            <div className="p-3 space-y-1">
              <button
                onClick={() => setShowForm(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-primary/30 text-[12px] font-medium text-primary hover:bg-primary/5 transition-all mb-2"
              >
                <UserPlus className="h-3.5 w-3.5" /> Add Contact
              </button>
              {contacts.map((c) => (
                <div key={c.id} className="px-3 py-2.5 rounded-md hover:bg-secondary transition-colors group">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-primary">{c.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>
                    </div>
                    <select
                      value={c.deal_stage}
                      onChange={(e) => onUpdateContact(c.id, { deal_stage: e.target.value })}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-input bg-background text-foreground"
                    >
                      {dealStages.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => onDeleteContact(c.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  {c.company && (
                    <div className="flex items-center gap-1 mt-1 ml-10">
                      <Building2 className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{(c.company as Company).name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "contacts" && showForm && (
            <div className="p-4 space-y-2.5">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name *"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-[12px] text-foreground outline-none focus:border-ring" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" type="email"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-[12px] text-foreground outline-none focus:border-ring" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-[12px] text-foreground outline-none focus:border-ring" />
              <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role / Title"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-[12px] text-foreground outline-none focus:border-ring" />
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-[12px] text-foreground">
                <option value="">No company</option>
                {companies.map((co) => <option key={co.id} value={co.id}>{co.name}</option>)}
              </select>
              <select value={dealStage} onChange={(e) => setDealStage(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-[12px] text-foreground">
                {dealStages.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="flex gap-2 pt-1">
                <button onClick={handleCreateContact} className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold">Save</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md bg-secondary text-[12px] text-foreground">Cancel</button>
              </div>
            </div>
          )}

          {tab === "companies" && !showForm && (
            <div className="p-3 space-y-1">
              <button
                onClick={() => setShowForm(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-primary/30 text-[12px] font-medium text-primary hover:bg-primary/5 transition-all mb-2"
              >
                <Plus className="h-3.5 w-3.5" /> Add Company
              </button>
              {companies.map((co) => (
                <div key={co.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-secondary transition-colors group">
                  <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{co.name}</p>
                    {co.domain && <p className="text-[10px] text-muted-foreground">{co.domain}</p>}
                  </div>
                  <button
                    onClick={() => onDeleteCompany(co.id)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "companies" && showForm && (
            <div className="p-4 space-y-2.5">
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name *"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-[12px] text-foreground outline-none focus:border-ring" />
              <input value={companyDomain} onChange={(e) => setCompanyDomain(e.target.value)} placeholder="Domain (e.g. acme.com)"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-[12px] text-foreground outline-none focus:border-ring" />
              <div className="flex gap-2 pt-1">
                <button onClick={handleCreateCompany} className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold">Save</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md bg-secondary text-[12px] text-foreground">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Unsubscribe suggestion banner
export function UnsubscribeSuggestion({
  senderEmail,
  senderName,
  onDismiss,
  onKeep,
}: {
  senderEmail: string;
  senderName: string;
  onDismiss: () => void;
  onKeep: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/30 border-b border-accent/20 animate-fade-in">
      <span className="text-[10px] text-muted-foreground">
        No interaction with <span className="font-medium text-foreground">{senderName}</span> in 10+ days
      </span>
      <div className="ml-auto flex gap-1">
        <button
          onClick={onKeep}
          className="px-2 py-0.5 rounded text-[10px] font-medium text-foreground bg-secondary hover:bg-secondary/80 transition-colors"
        >
          Keep
        </button>
        <button
          onClick={onDismiss}
          className="px-2 py-0.5 rounded text-[10px] font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
        >
          Unsubscribe?
        </button>
      </div>
    </div>
  );
}
