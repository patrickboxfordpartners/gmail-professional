import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Email } from "@/hooks/useEmails";

interface SenderInteraction {
  sender_email: string;
  last_interaction_at: string;
  dismissed: boolean;
}

export function useNoiseFilter() {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<Record<string, SenderInteraction>>({});
  const [loading, setLoading] = useState(false);

  const fetchInteractions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("sender_interactions")
        .select("*")
        .eq("user_id", user.id);
      const map: Record<string, SenderInteraction> = {};
      for (const row of data || []) {
        map[row.sender_email] = row;
      }
      setInteractions(map);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchInteractions(); }, [fetchInteractions]);

  // Record that user interacted with this sender (reply, star, open, etc.)
  const recordInteraction = useCallback(async (senderEmail: string) => {
    if (!user || !senderEmail) return;
    const { error } = await supabase
      .from("sender_interactions")
      .upsert(
        { user_id: user.id, sender_email: senderEmail, last_interaction_at: new Date().toISOString(), dismissed: false },
        { onConflict: "user_id,sender_email" }
      );
    if (!error) {
      setInteractions((prev) => ({
        ...prev,
        [senderEmail]: { sender_email: senderEmail, last_interaction_at: new Date().toISOString(), dismissed: false },
      }));
    }
  }, [user]);

  // Dismiss the unsubscribe suggestion for a sender
  const dismissSuggestion = useCallback(async (senderEmail: string) => {
    if (!user) return;
    await supabase
      .from("sender_interactions")
      .upsert(
        { user_id: user.id, sender_email: senderEmail, last_interaction_at: new Date().toISOString(), dismissed: true },
        { onConflict: "user_id,sender_email" }
      );
    setInteractions((prev) => ({
      ...prev,
      [senderEmail]: { ...prev[senderEmail], dismissed: true, sender_email: senderEmail, last_interaction_at: new Date().toISOString() },
    }));
  }, [user]);

  // Get inactive senders (no interaction in 10 days)
  const getInactiveSenders = useCallback((emails: Email[]): Set<string> => {
    const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
    const senderEmails = new Set<string>();

    // Collect unique senders
    const senderMap = new Map<string, Date>();
    for (const e of emails) {
      const existing = senderMap.get(e.from.email);
      if (!existing || e.date > existing) {
        senderMap.set(e.from.email, e.date);
      }
    }

    for (const [senderEmail] of senderMap) {
      const interaction = interactions[senderEmail];
      if (interaction?.dismissed) continue; // user dismissed suggestion

      if (interaction) {
        const lastAt = new Date(interaction.last_interaction_at).getTime();
        if (lastAt < tenDaysAgo) {
          senderEmails.add(senderEmail);
        }
      }
      // If no interaction record exists and the sender has been emailing, suggest after 10 days
      // We use the oldest email date to determine if they've been around long enough
    }

    return senderEmails;
  }, [interactions]);

  return {
    recordInteraction,
    dismissSuggestion,
    getInactiveSenders,
    loading,
    interactions,
  };
}
