import { useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Email } from "@/hooks/useEmails";

export function useAIEmail() {
  const [summarizing, setSummarizing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [composing, setComposing] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Per-email caches
  const summaryCache = useRef<Map<string, string>>(new Map());
  const repliesCache = useRef<Map<string, string[]>>(new Map());
  const [buyingSignals, setBuyingSignals] = useState<Record<string, { urgency: string; reason: string }>>({});

  // Which email's cached results to expose
  const [activeEmailId, setActiveEmailId] = useState<string | null>(null);
  // Trigger re-renders when caches update
  const [cacheVersion, setCacheVersion] = useState(0);

  const callAI = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("ai-email", { body });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data.result as string;
  };

  const summarize = useCallback(async (email: Email) => {
    // Return cached result if available
    if (summaryCache.current.has(email.id)) return;

    setSummarizing(true);
    try {
      const result = await callAI({
        action: "summarize",
        email: { subject: email.subject, from: email.from.name, body: email.body.replace(/<[^>]*>/g, "") },
      });
      summaryCache.current.set(email.id, result);
      setCacheVersion((v) => v + 1);
    } catch (e: any) {
      toast.error(e.message || "Failed to summarize");
    } finally {
      setSummarizing(false);
    }
  }, []);

  const getSmartReplies = useCallback(async (email: Email) => {
    // Return cached result if available
    if (repliesCache.current.has(email.id)) return;

    setReplying(true);
    try {
      const result = await callAI({
        action: "smart_reply",
        email: { subject: email.subject, from: email.from.name, body: email.body.replace(/<[^>]*>/g, "") },
      });
      const parsed = JSON.parse(result.replace(/```json\n?|\n?```/g, "").trim());
      repliesCache.current.set(email.id, Array.isArray(parsed) ? parsed : []);
      setCacheVersion((v) => v + 1);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate replies");
    } finally {
      setReplying(false);
    }
  }, []);

  const composeAssist = useCallback(async (prompt: string): Promise<string> => {
    setComposing(true);
    try {
      const result = await callAI({ action: "compose_assist", prompt });
      return result;
    } catch (e: any) {
      toast.error(e.message || "Failed to generate draft");
      return "";
    } finally {
      setComposing(false);
    }
  }, []);

  const detectBuyingSignals = useCallback(async (emails: Email[]) => {
    if (emails.length === 0) return;

    // Filter out emails already analyzed
    const uncached = emails.slice(0, 20).filter((e) => !(e.id in buyingSignals));
    if (uncached.length === 0) return;

    setCategorizing(true);
    try {
      const simplified = uncached.map((e) => ({
        id: e.id,
        subject: e.subject,
        from: e.from.name,
        preview: e.preview,
        body: e.body.replace(/<[^>]*>/g, "").slice(0, 300),
      }));
      const result = await callAI({ action: "categorize", email: simplified });
      const parsed = JSON.parse(result.replace(/```json\n?|\n?```/g, "").trim());
      if (parsed.results) {
        setBuyingSignals((prev) => {
          const next = { ...prev };
          for (const r of parsed.results) {
            if (r.is_buying_signal) {
              next[r.id] = { urgency: r.urgency, reason: r.reason };
            }
          }
          return next;
        });
      }
    } catch (e: any) {
      console.error("Categorize error:", e);
    } finally {
      setCategorizing(false);
    }
  }, [buyingSignals]);

  const setActiveEmail = useCallback((id: string | null) => {
    setActiveEmailId(id);
  }, []);

  // Batch-process emails through the 4-stage xAI pipeline.
  // Results are written to DB by the edge function; realtime picks up the changes.
  const processEmails = useCallback(async (emails: Email[]) => {
    const unprocessed = emails.filter((e) => e.opportunityScore == null && !e.isSpam);
    if (unprocessed.length === 0) return;

    setProcessing(true);
    try {
      const payload = unprocessed.slice(0, 10).map((e) => ({
        id: e.id,
        subject: e.subject,
        from: e.from.name,
        preview: e.preview,
        body: e.body ? e.body.replace(/<[^>]*>/g, "").slice(0, 500) : undefined,
      }));
      await supabase.functions.invoke("ai-email", { body: { action: "process", emails: payload } });
    } catch (e: any) {
      console.error("processEmails error:", e);
    } finally {
      setProcessing(false);
    }
  }, []);

  // Expose cached results for the active email
  const summary = useMemo(
    () => (activeEmailId ? summaryCache.current.get(activeEmailId) ?? null : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeEmailId, cacheVersion]
  );

  const smartReplies = useMemo(
    () => (activeEmailId ? repliesCache.current.get(activeEmailId) ?? [] : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeEmailId, cacheVersion]
  );

  const clearSummary = useCallback(() => {
    if (activeEmailId) {
      summaryCache.current.delete(activeEmailId);
      setCacheVersion((v) => v + 1);
    }
  }, [activeEmailId]);

  const clearReplies = useCallback(() => {
    if (activeEmailId) {
      repliesCache.current.delete(activeEmailId);
      setCacheVersion((v) => v + 1);
    }
  }, [activeEmailId]);

  return {
    summarize, summary, summarizing, clearSummary,
    getSmartReplies, smartReplies, replying, clearReplies,
    composeAssist, composing,
    detectBuyingSignals, buyingSignals, categorizing,
    processEmails, processing,
    setActiveEmail,
  };
}
