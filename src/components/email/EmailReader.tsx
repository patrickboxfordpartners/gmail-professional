import { Reply, ReplyAll, Forward, MoreHorizontal, Star, Paperclip, ArrowLeft, Mail, MailOpen, Folder, Trash2 } from "lucide-react";
import DOMPurify from "dompurify";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import type { Email } from "@/hooks/useEmails";
import type { useLabels } from "@/hooks/useLabels";
import type { useAIEmail } from "@/hooks/useAIEmail";
import type { useCRM, Contact } from "@/hooks/useCRM";
import { LabelBadge, LabelPicker } from "./LabelComponents";
import { AISummaryPanel, SmartReplyChips } from "./AIFeatures";
import { ContactLinker } from "./CRMComponents";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }) + " at " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

interface EmailReaderProps {
  email: Email | null;
  onToggleStar: (id: string) => void;
  onBack?: () => void;
  onReply?: (to: string, subject: string, body: string) => void;
  fetchEmailBody?: (id: string) => Promise<string>;
  labelCtx?: ReturnType<typeof useLabels>;
  aiCtx?: ReturnType<typeof useAIEmail>;
  crmCtx?: ReturnType<typeof useCRM>;
}

export function EmailReader({ email, onToggleStar, onBack, onReply, fetchEmailBody, labelCtx, aiCtx, crmCtx }: EmailReaderProps) {
  const [linkedContacts, setLinkedContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (email && crmCtx) {
      crmCtx.getContactsForEmail(email.id).then(setLinkedContacts);
    } else {
      setLinkedContacts([]);
    }
  }, [email?.id, crmCtx]);

  // Fetch email body if it's missing
  useEffect(() => {
    if (email && !email.body && fetchEmailBody) {
      fetchEmailBody(email.id);
    }
  }, [email?.id, email?.body, fetchEmailBody]);
  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4 shadow-stripe-sm">
            <Mail className="h-7 w-7 text-muted-foreground/40" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Select a message to read</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Choose from your inbox on the left</p>
        </div>
      </div>
    );
  }

  const emailLabels = labelCtx?.getLabelsForEmail(email.id) || [];
  const activeIds = labelCtx?.emailLabelMap[email.id] || [];

  const handleReply = () => {
    if (!onReply || !email) return;
    const replySubject = email.subject.startsWith("Re: ") ? email.subject : `Re: ${email.subject}`;
    const replyBody = `\n\n---\nOn ${formatFullDate(email.date)}, ${email.from.name} wrote:\n\n${email.body.replace(/<[^>]*>/g, "")}`;
    onReply(email.from.email, replySubject, replyBody);
  };

  const handleReplyAll = () => {
    if (!onReply || !email) return;
    const replySubject = email.subject.startsWith("Re: ") ? email.subject : `Re: ${email.subject}`;
    const replyBody = `\n\n---\nOn ${formatFullDate(email.date)}, ${email.from.name} wrote:\n\n${email.body.replace(/<[^>]*>/g, "")}`;
    onReply(email.from.email, replySubject, replyBody);
  };

  const handleForward = () => {
    if (!onReply || !email) return;
    const fwdSubject = email.subject.startsWith("Fwd: ") ? email.subject : `Fwd: ${email.subject}`;
    const fwdBody = `\n\n---\nForwarded message from ${email.from.name} <${email.from.email}>\nDate: ${formatFullDate(email.date)}\nSubject: ${email.subject}\n\n${email.body.replace(/<[^>]*>/g, "")}`;
    onReply("", fwdSubject, fwdBody);
  };

  const handleMarkAsUnread = () => {
    toast.success("Marked as unread");
  };

  const handleMoveToFolder = () => {
    toast.success("Moved to folder");
  };

  const handleDelete = () => {
    toast.success("Email deleted");
  };

  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in bg-background">
      <div className="flex items-center gap-1 md:gap-0.5 px-2 md:px-4 py-2.5 border-b border-divider">
        {onBack && (
          <button onClick={onBack} className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:p-1.5 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150 mr-1" aria-label="Back to list">
            <ArrowLeft className="h-5 w-5 md:h-4 md:w-4 text-muted-foreground" strokeWidth={2} />
          </button>
        )}
        <button onClick={handleReply} className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:p-2 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150 group" title="Reply">
          <Reply className="h-5 w-5 md:h-4 md:w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
        </button>
        <button onClick={handleReplyAll} className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:p-2 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150 group" title="Reply All">
          <ReplyAll className="h-5 w-5 md:h-4 md:w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
        </button>
        <button onClick={handleForward} className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:p-2 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150 group" title="Forward">
          <Forward className="h-5 w-5 md:h-4 md:w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
        </button>
        <div className="flex-1" />
        {labelCtx && (
          <LabelPicker
            emailId={email.id}
            labels={labelCtx.labels}
            activeIds={activeIds}
            onToggle={labelCtx.toggleEmailLabel}
            onCreate={labelCtx.createLabel}
            onDelete={labelCtx.deleteLabel}
            defaultColors={labelCtx.DEFAULT_COLORS}
          />
        )}
        {crmCtx && email && (
          <ContactLinker
            contacts={crmCtx.contacts}
            linkedContacts={linkedContacts}
            emailId={email.id}
            onLink={async (eid, cid) => {
              await crmCtx.linkEmailToContact(eid, cid);
              const updated = await crmCtx.getContactsForEmail(eid);
              setLinkedContacts(updated);
            }}
            onUnlink={async (eid, cid) => {
              await crmCtx.unlinkEmailFromContact(eid, cid);
              const updated = await crmCtx.getContactsForEmail(eid);
              setLinkedContacts(updated);
            }}
          />
        )}
        <button
          onClick={() => onToggleStar(email.id)}
          className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:p-2 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150"
          aria-label={email.starred ? "Unstar" : "Star"}
        >
          <Star className={cn("h-5 w-5 md:h-4 md:w-4 transition-all duration-200", email.starred ? "star-active" : "text-muted-foreground")} strokeWidth={email.starred ? 2.5 : 1.8} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:p-2 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150">
              <MoreHorizontal className="h-5 w-5 md:h-4 md:w-4 text-muted-foreground" strokeWidth={1.8} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleMarkAsUnread} className="cursor-pointer">
              <MailOpen className="h-4 w-4 mr-2" />
              Mark as unread
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleMoveToFolder} className="cursor-pointer">
              <Folder className="h-4 w-4 mr-2" />
              Move to folder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6">
          <h1 className="text-[17px] md:text-lg font-semibold text-foreground tracking-tight mb-3 md:mb-2 leading-snug">{email.subject}</h1>

          {emailLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {emailLabels.map((l) => (
                <LabelBadge
                  key={l.id}
                  label={l}
                  size="md"
                  onRemove={() => labelCtx?.toggleEmailLabel(email.id, l.id)}
                />
              ))}
            </div>
          )}

          <div className="flex items-start gap-3 md:gap-3.5 mb-6 md:mb-8">
            <div className="h-12 w-12 md:h-10 md:w-10 rounded-full bg-avatar flex items-center justify-center shrink-0 shadow-stripe-sm">
              <span className="text-[12px] md:text-[11px] font-bold text-avatar-foreground tracking-wide">{getInitials(email.from.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-semibold text-[14px] md:text-[13px] text-foreground">{email.from.name}</span>
                <span className="text-[12px] md:text-[11px] text-muted-foreground break-all">&lt;{email.from.email}&gt;</span>
              </div>
              <div className="text-[12px] md:text-[11px] text-muted-foreground mt-1 md:mt-0.5">
                To: {email.to.name}
              </div>
              <div className="text-[12px] md:text-[11px] text-muted-foreground/70">{formatFullDate(email.date)}</div>
            </div>
          </div>

          {email.hasAttachment && (
            <div className="mb-6 p-4 md:p-3.5 rounded-lg border border-divider bg-secondary/50 flex items-center gap-3 md:gap-2.5 shadow-stripe-sm">
              <div className="h-10 w-10 md:h-8 md:w-8 rounded-md bg-accent flex items-center justify-center shrink-0">
                <Paperclip className="h-4 w-4 md:h-3.5 md:w-3.5 text-accent-foreground" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[14px] md:text-[13px] font-medium text-foreground">Attachment</p>
                <p className="text-[12px] md:text-[11px] text-muted-foreground">1 file attached</p>
              </div>
            </div>
          )}

          {/* Temporarily hidden - AI features unavailable due to API quota limits */}
          {/* {aiCtx && (
            <AISummaryPanel
              summary={aiCtx.summary}
              loading={aiCtx.summarizing}
              onRequest={() => aiCtx.summarize(email)}
              onClear={aiCtx.clearSummary}
            />
          )} */}

          <div
            className="text-[15px] md:text-[14px] leading-relaxed md:leading-relaxed text-foreground/90 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-l-primary/30 [&_blockquote]:bg-secondary/50 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:rounded-r-lg [&_blockquote]:text-muted-foreground [&_ul]:space-y-1.5 [&_li]:text-foreground/85 [&_p]:mb-4"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.body) }}
          />
        </div>
      </div>

      <div className="border-t border-divider p-3 md:p-4">
        <div className="max-w-3xl mx-auto">
          {/* Temporarily hidden - AI features unavailable due to API quota limits */}
          {/* {aiCtx && (
            <SmartReplyChips
              replies={aiCtx.smartReplies}
              loading={aiCtx.replying}
              onRequest={() => aiCtx.getSmartReplies(email)}
              onSelect={(reply) => {
                navigator.clipboard.writeText(reply);
                toast.success("Reply copied to clipboard");
              }}
            />
          )} */}
          <div
            onClick={handleReply}
            className="min-h-[48px] md:min-h-0 border border-input rounded-lg px-4 py-3 text-[14px] md:text-[13px] text-muted-foreground cursor-text hover:border-ring/50 hover:shadow-stripe-sm active:bg-secondary/50 transition-all duration-200 flex items-center"
          >
            Reply to {email.from.name}...
          </div>
        </div>
      </div>
    </div>
  );
}
