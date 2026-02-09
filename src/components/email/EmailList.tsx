import type { Email } from "@/hooks/useEmails";
import type { useLabels } from "@/hooks/useLabels";
import { EmailListItem } from "./EmailListItem";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCw, MoreVertical, ChevronDown, Archive, Trash2 } from "lucide-react";
import { BuyingSignalHeader } from "./AIFeatures";
import { UnsubscribeSuggestion } from "./CRMComponents";
import { cn } from "@/lib/utils";

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
}

export function EmailList({ emails, selectedId, onSelect, onToggleStar, folderName, loading, fullWidth, labelCtx, buyingSignals = {}, inactiveSenders = new Set(), onDismissSender, onKeepSender, hasMore, onLoadMore }: EmailListProps) {
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
        <Checkbox className="h-[14px] w-[14px] rounded-sm hidden md:block" />
        <ChevronDown className="h-3 w-3 text-muted-foreground -ml-0.5 hidden md:block" />
        <div className="w-px h-4 bg-divider mx-1 hidden md:block" />
        <button className="min-w-[40px] min-h-[40px] md:min-w-0 md:min-h-0 md:p-1.5 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150" title="Refresh">
          <RotateCw className="h-4 w-4 md:h-3.5 md:w-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
        <button className="min-w-[40px] min-h-[40px] md:min-w-0 md:min-h-0 md:p-1.5 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150" title="Archive">
          <Archive className="h-4 w-4 md:h-3.5 md:w-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
        <button className="min-w-[40px] min-h-[40px] md:min-w-0 md:min-h-0 md:p-1.5 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150" title="Delete">
          <Trash2 className="h-4 w-4 md:h-3.5 md:w-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
        <button className="min-w-[40px] min-h-[40px] md:min-w-0 md:min-h-0 md:p-1.5 flex items-center justify-center rounded-md hover:bg-secondary active:bg-secondary/80 transition-all duration-150">
          <MoreVertical className="h-4 w-4 md:h-3.5 md:w-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
        <span className="ml-auto text-[11px] md:text-[11px] text-muted-foreground font-medium tabular-nums">
          {emails.length} {emails.length === 1 ? "message" : "messages"}
        </span>
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
