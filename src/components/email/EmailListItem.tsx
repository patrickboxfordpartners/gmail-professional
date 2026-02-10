import React, { useState, useRef, useEffect } from "react";
import { Star, Paperclip, Archive, Trash2 } from "lucide-react";
import type { Email } from "@/hooks/useEmails";
import type { useLabels } from "@/hooks/useLabels";
import { LabelBadge } from "./LabelComponents";
import { BuyingSignalBadge } from "./AIFeatures";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface EmailListItemProps {
  email: Email;
  isSelected: boolean;
  onSelect: () => void;
  onToggleStar: (e: React.MouseEvent) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  labelCtx?: ReturnType<typeof useLabels>;
  buyingSignal?: { urgency: string; reason: string };
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / 3600000;
  if (hours < 1) return `${Math.max(1, Math.floor(diff / 60000))}m`;
  if (hours < 24) return `${Math.floor(hours)}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export const EmailListItem = React.memo(function EmailListItem({ email, isSelected, onSelect, onToggleStar, onArchive, onDelete, labelCtx, buyingSignal }: EmailListItemProps) {
  const emailLabels = labelCtx?.getLabelsForEmail(email.id) || [];
  const isMobile = useIsMobile();
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const swipeDirectionDetermined = useRef(false);

  const SWIPE_THRESHOLD = 100; // pixels to trigger action
  const MAX_SWIPE = 150; // maximum swipe distance

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onArchive && !onDelete) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentX.current = e.touches[0].clientX;
    swipeDirectionDetermined.current = false;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;

    // Determine swipe direction on first significant move
    if (!swipeDirectionDetermined.current && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      swipeDirectionDetermined.current = true;
      // If horizontal swipe, prevent default to stop scrolling
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault();
      } else {
        // Vertical swipe - cancel our swipe handling
        setIsSwiping(false);
        setSwipeX(0);
        return;
      }
    }

    if (swipeDirectionDetermined.current && Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      currentX.current = touch.clientX;
      const diff = currentX.current - startX.current;
      // Limit swipe distance
      const limitedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff));
      setSwipeX(limitedDiff);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);

    const absSwipe = Math.abs(swipeX);

    // Swipe left = delete
    if (swipeX < -SWIPE_THRESHOLD && onDelete) {
      onDelete(email.id);
    }
    // Swipe right = archive
    else if (swipeX > SWIPE_THRESHOLD && onArchive) {
      onArchive(email.id);
    }
    // If swipe was minimal, trigger the click/select
    else if (absSwipe < 10 && isMobile) {
      onSelect();
    }

    // Reset
    setSwipeX(0);
  };

  const getBackgroundColor = () => {
    if (!isSwiping) return '';
    if (swipeX > SWIPE_THRESHOLD) return 'bg-green-500/20'; // Archive
    if (swipeX < -SWIPE_THRESHOLD) return 'bg-red-500/20'; // Delete
    return '';
  };

  const showArchiveIcon = isSwiping && swipeX > 40;
  const showDeleteIcon = isSwiping && swipeX < -40;

  return (
    <div
      className="relative overflow-hidden"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe action background */}
      {showArchiveIcon && (
        <div className="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center bg-green-500/30 z-10">
          <Archive className="h-6 w-6 text-green-600" strokeWidth={2} />
        </div>
      )}
      {showDeleteIcon && (
        <div className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-red-500/30 z-10">
          <Trash2 className="h-6 w-6 text-red-600" strokeWidth={2} />
        </div>
      )}

      <button
        onClick={isMobile ? undefined : onSelect}
        style={{
          transform: isMobile ? `translateX(${swipeX}px)` : undefined,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
        }}
        className={cn(
          "w-full min-h-[80px] md:min-h-0 flex items-start gap-3 md:gap-3 px-3 md:px-4 py-4 md:py-3.5 text-left email-row-hover group active:bg-email-hover relative",
          isSelected ? "email-selected border-l-4 md:border-l-2 border-l-primary" : "border-l-4 md:border-l-2 border-l-transparent",
          !email.read && !isSelected && "bg-accent/20",
          getBackgroundColor()
        )}
      >
      <div className="mt-0.5 h-11 w-11 md:h-9 md:w-9 rounded-full bg-avatar flex items-center justify-center shrink-0 shadow-stripe-sm">
        <span className="text-[12px] md:text-[11px] font-bold text-avatar-foreground tracking-wide">{getInitials(email.from.name)}</span>
      </div>

      <div className="flex-1 min-w-0 space-y-1 md:space-y-0.5">
        <div className="flex items-center gap-2">
          <span className={cn("text-[14px] md:text-[13px] truncate", !email.read ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
            {email.from.name}
          </span>
          <span className="ml-auto text-[12px] md:text-[11px] text-muted-foreground whitespace-nowrap shrink-0 tabular-nums">
            {formatDate(email.date)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {!email.read && (
            <span className="h-[7px] w-[7px] md:h-[6px] md:w-[6px] rounded-full bg-primary shrink-0" />
          )}
          <span className={cn("text-[14px] md:text-[13px] truncate", !email.read ? "font-medium text-foreground" : "text-muted-foreground")}>
            {email.subject}
          </span>
          {email.hasAttachment && <Paperclip className="h-3.5 w-3.5 md:h-3 md:w-3 text-muted-foreground shrink-0" strokeWidth={2} />}
          {/* Temporarily hidden - AI features unavailable */}
          {/* {buyingSignal && <BuyingSignalBadge urgency={buyingSignal.urgency} reason={buyingSignal.reason} />} */}
        </div>
        <p className="text-[13px] md:text-[12px] text-muted-foreground/80 truncate leading-relaxed">{email.preview}</p>
        {emailLabels.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 md:pt-0.5">
            {emailLabels.map((l) => (
              <LabelBadge key={l.id} label={l} size="sm" />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onToggleStar}
        className="mt-1 shrink-0 min-w-[40px] min-h-[40px] md:min-w-0 md:min-h-0 md:p-1 flex items-center justify-center rounded-md md:opacity-0 md:group-hover:opacity-100 transition-all duration-150 hover:bg-secondary active:bg-secondary/80"
        style={{ opacity: email.starred ? 1 : undefined }}
        aria-label={email.starred ? "Unstar email" : "Star email"}
      >
        <Star
          className={cn(
            "h-4 w-4 md:h-3.5 md:w-3.5 transition-all duration-200",
            email.starred ? "star-active" : "text-muted-foreground/30"
          )}
          strokeWidth={email.starred ? 2.5 : 1.5}
        />
      </button>
      </button>
    </div>
  );
});
