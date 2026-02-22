import type { Email } from "@/hooks/useEmails";
import type { useLabels } from "@/hooks/useLabels";
import { EmailListItem } from "./EmailListItem";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCw, MoreVertical, ChevronDown, Archive, Trash2, MailOpen, Mail, X } from "lucide-react";
import { BuyingSignalHeader } from "./AIFeatures";
import { UnsubscribeSuggestion } from "./CRMComponents";
import { SearchBar } from "./SearchBar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface EmailListProps {
  emails: Email[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
  folderName: string;
  loading?: boolean;
  fullWidth?: boolean;
  labelCtx?: ReturnType<typeof useLabels>;
  buyingSignals?: Record<string, { urgency: string; reason: string }>;
  inactiveSenders?: Set<string>;
  onDismissSender?: (email: string) => void;
  onKeepSender?: (email: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  onRefresh?: () => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMarkRead?: (id: string) => void;
  onBulkMarkRead?: (ids: string[]) => void;
  onBulkMarkUnread?: (ids: string[]) => void;
  onBulkArchive?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
}

export function EmailList({ emails, selectedId, onSelect, onToggleStar, folderName, loading, fullWidth, labelCtx, buyingSignals = {}, inactiveSenders = new Set(), onDismissSender, onKeepSender, hasMore, onLoadMore, search = "", onSearchChange, onRefresh, onArchive, onDelete, onMarkRead, onBulkMarkRead, onBulkMarkUnread, onBulkArchive, onBulkDelete }: EmailListProps) {
  const isMobile = useIsMobile();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // Clear selection when folder changes
  useEffect(() => { setChecked(new Set()); }, [folderName]);

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allChecked = emails.length > 0 && checked.size === emails.length;
  const someChecked = checked.size > 0 && !allChecked;

  const toggleAll = () => {
    setChecked(allChecked ? new Set() : new Set(emails.map((e) => e.id)));
  };

  const clearSelection = () => setChecked(new Set());

  const selectedIds = Array.from(checked);
  const hasSelection = checked.size > 0;

  const signalIds = new Set(Object.keys(buyingSignals));
  const signalEmails = emails.filter((e) => signalIds.has(e.id));
  const otherEmails = emails.filter((e) => !signalIds.has(e.id));
  const hasSignals = signalEmails.length > 0;

  return (
    <div className={cn(
      "flex flex-col h-full border-r border-divider shrink-0 bg-card",
      fullWidth ? "w-full" : "w-[400px]"
    )}>
      <div className="flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-2.5 border-b border-divider">
        {isMobile ? (
          <SearchBar value={search} onChange={onSearchChange || (() => {})} />
        ) : hasSelection ? (
          /* ── Bulk action toolbar ── */
          <>
            <button
              onClick={clearSelection}
              className="md:p-1.5 flex items-center justify-center rounded-md hover:bg-secondary transition-all duration-150"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
            </button>
            <span className="text-[12px] font-semibold text-foreground tabular-nums mr-1">
              {checked.size} selected
            </span>
            <div className="w-px h-4 bg-divider mx-1" />
            <button
              onClick={() => { onBulkMarkRead?.(selectedIds); clearSelection(); }}
              className="md:p-1.5 flex items-center justify-center rounded-md hover:bg-secondary transition-all duration-150"
              title="Mark as read"
            >
              <MailOpen className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
            </button>
            <button
              onClick={() => { onBulkMarkUnread?.(selectedIds); clearSelection(); }}
              className="md:p-1.5 flex items-center justify-center rounded-md hover:bg-secondary transition-all duration-150"
              title="Mark as unread"
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
            </button>
            <button
              onClick={() => { onBulkArchive?.(selectedIds); clearSelection(); }}
              className="md:p-1.5 flex items-center justify-center rounded-md hover:bg-secondary transition-all duration-150"
              title="Archive"
            >
              <Archive className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
            </button>
            <button
              onClick={() => { onBulkDelete?.(selectedIds); clearSelection(); }}
              className="md:p-1.5 flex items-center justify-center rounded-md hover:bg-secondary transition-all duration-150"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
            </button>
          </>
        ) : (
          /* ── Normal toolbar ── */
          <>
            <Checkbox
              checked={allChecked}
              ref={(el) => { if (el) (el as any).indeterminate = someChecked; }}
              onCheckedChange={toggleAll}
              className="h-[14px] w-[14px] rounded-sm"
            />
            <ChevronDown className="h-3 w-3 text-muted-foreground -ml-0.5" />
            <div className="w-px h-4 bg-divider mx-1" />
            <button
              onClick={() => { if (onRefresh) { onRefresh(); toast.success("Refreshed"); } }}
              className="md:p-1.5 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150"
              title="Refresh"
            >
              <RotateCw className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
            </button>
            <button
              onClick={() => selectedId && onArchive?.(selectedId)}
              disabled={!selectedId}
              className="md:p-1.5 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150 disabled:opacity-30 disabled:cursor-default"
              title="Archive"
            >
              <Archive className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
            </button>
            <button
              onClick={() => selectedId && onDelete?.(selectedId)}
              disabled={!selectedId}
              className="md:p-1.5 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150 disabled:opacity-30 disabled:cursor-default"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
            </button>
            <button
              onClick={() => selectedId && onMarkRead?.(selectedId)}
              disabled={!selectedId}
              className="md:p-1.5 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150 disabled:opacity-30 disabled:cursor-default"
              title="Mark as read"
            >
              <MailOpen className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
            </button>
            <button className="md:p-1.5 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150">
              <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
            </button>
            <span className="ml-auto text-[11px] text-muted-foreground font-medium tabular-nums">
              {emails.length} {emails.length === 1 ? "message" : "messages"}
            </span>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-divider">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 md:px-8">
            <div className="h-14 w-14 md:h-12 md:w-12 rounded-full bg-secondary flex items-center justify-center mb-4 md:mb-3">
              <Archive className="h-6 w-6 md:h-5 md:w-5 text-muted-foreground" />
            </div>
            <p className="text-[15px] md:text-sm font-medium text-foreground mb-1">No messages</p>
            <p className="text-[13px] md:text-xs text-muted-foreground">Your {folderName} is empty</p>
          </div>
        ) : (
          <>
            {hasSignals && (
              <>
                <BuyingSignalHeader />
                {signalEmails.map((email) => (
                  <EmailListItem
                    key={email.id}
                    email={email}
                    isSelected={selectedId === email.id}
                    onSelect={() => onSelect(email.id)}
                    onToggleStar={(e) => { e.stopPropagation(); onToggleStar(email.id); }}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onMarkRead={onMarkRead}
                    isChecked={checked.has(email.id)}
                    onCheck={() => toggleCheck(email.id)}
                    labelCtx={labelCtx}
                    buyingSignal={buyingSignals[email.id]}
                  />
                ))}
              </>
            )}
            {otherEmails.map((email) => (
              <div key={email.id}>
                {inactiveSenders.has(email.from.email) && onDismissSender && onKeepSender && (
                  <UnsubscribeSuggestion
                    senderEmail={email.from.email}
                    senderName={email.from.name}
                    onDismiss={() => onDismissSender(email.from.email)}
                    onKeep={() => onKeepSender(email.from.email)}
                  />
                )}
                <EmailListItem
                  email={email}
                  isSelected={selectedId === email.id}
                  onSelect={() => onSelect(email.id)}
                  onToggleStar={(e) => { e.stopPropagation(); onToggleStar(email.id); }}
                  onArchive={onArchive}
                  onDelete={onDelete}
                  onMarkRead={onMarkRead}
                  isChecked={checked.has(email.id)}
                  onCheck={() => toggleCheck(email.id)}
                  labelCtx={labelCtx}
                />
              </div>
            ))}
            {hasMore && onLoadMore && (
              <div className="px-4 py-4 text-center">
                <button
                  onClick={onLoadMore}
                  className="min-h-[44px] px-6 py-3 md:px-4 md:py-2 text-[13px] md:text-[12px] font-medium text-primary hover:bg-secondary active:bg-secondary/80 rounded-md transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
