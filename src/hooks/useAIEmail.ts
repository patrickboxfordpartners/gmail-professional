import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Email } from "@/hooks/useEmails";

export function useAIEmail() {
  const [summarizing, setSummarizing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [composing, setComposing] = useState(false);
  const [categorizing, setCategorizing] = useState(false);

  const [summary, setSummary] = useState<string | null>(null);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [buyingSignals, setBuyingSignals] = useState<Record<string, { urgency: string; reason: string }>>({});

  const callAI = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("ai-email", { body });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data.result as string;
  };

  const summarize = useCallback(async (email: Email) => {
    setSummarizing(true);
    setSummary(null);
    try {
      const result = await callAI({
        action: "summarize",
        email: { subject: email.subject, from: email.from.name, body: email.body.replace(/<[^>]*>/g, "") },
      });
      setSummary(result);
    } catch (e: any) {
      toast.error(e.message || "Failed to summarize");
    } finally {
      setSummarizing(false);
    }
  }, []);

  const getSmartReplies = useCallback(async (email: Email) => {
    setReplying(true);
    setSmartReplies([]);
    try {
      const result = await callAI({
        action: "smart_reply",
        email: { subject: email.subject, from: email.from.name, body: email.body.replace(/<[^>]*>/g, "") },
      });
      const parsed = JSON.parse(result.replace(/```json\n?|\n?```/g, "").trim());
      setSmartReplies(Array.isArray(parsed) ? parsed : []);
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
    setCategorizing(true);
    try {
      const simplified = emails.slice(0, 20).map((e) => ({
        id: e.id,
        subject: e.subject,
        from: e.from.name,
        preview: e.preview,
        body: e.body.replace(/<[^>]*>/g, "").slice(0, 300),
      }));
      const result = await callAI({ action: "categorize", email: simplified });
      const parsed = JSON.parse(result.replace(/```json\n?|\n?```/g, "").trim());
      const map: Record<string, { urgency: string; reason: string }> = {};
      if (parsed.results) {
        for (const r of parsed.results) {
          if (r.is_buying_signal) {
            map[r.id] = { urgency: r.urgency, reason: r.reason };
          }
        }
      }
      setBuyingSignals(map);
    } catch (e: any) {
      console.error("Categorize error:", e);
    } finally {
      setCategorizing(false);
    }
  }, []);

  const clearSummary = useCallback(() => setSummary(null), []);
  const clearReplies = useCallback(() => setSmartReplies([]), []);

  return {
    summarize, summary, summarizing, clearSummary,
    getSmartReplies, smartReplies, replying, clearReplies,
    composeAssist, composing,
    detectBuyingSignals, buyingSignals, categorizing,
  };
}
