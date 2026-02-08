import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Label {
  id: string;
  name: string;
  color: string;
}

const DEFAULT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#64748b",
];

export function useLabels() {
  const { user } = useAuth();
  const [labels, setLabels] = useState<Label[]>([]);
  const [emailLabelMap, setEmailLabelMap] = useState<Record<string, string[]>>({});

  const fetchLabels = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("labels")
      .select("id, name, color")
      .eq("user_id", user.id)
      .order("name");
    if (error) {
      console.error("Failed to fetch labels:", error);
      return;
    }
    setLabels(data || []);
  }, [user]);

  const fetchEmailLabels = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("email_labels")
      .select("email_id, label_id");
    if (error) {
      console.error("Failed to fetch email_labels:", error);
      return;
    }
    const map: Record<string, string[]> = {};
    for (const row of data || []) {
      if (!map[row.email_id]) map[row.email_id] = [];
      map[row.email_id].push(row.label_id);
    }
    setEmailLabelMap(map);
  }, [user]);

  useEffect(() => {
    fetchLabels();
    fetchEmailLabels();
  }, [fetchLabels, fetchEmailLabels]);

  // Realtime for email_labels
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("email-labels-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "email_labels" }, () => {
        fetchEmailLabels();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchEmailLabels]);

  const createLabel = useCallback(async (name: string, color: string) => {
    if (!user) return;
    const { error } = await supabase.from("labels").insert({
      user_id: user.id,
      name: name.trim(),
      color,
    });
    if (error) {
      if (error.message.includes("duplicate")) {
        toast.error("A label with that name already exists");
      } else {
        toast.error("Failed to create label");
      }
      return;
    }
    toast.success(`Label "${name}" created`);
    fetchLabels();
  }, [user, fetchLabels]);

  const deleteLabel = useCallback(async (labelId: string) => {
    const { error } = await supabase.from("labels").delete().eq("id", labelId);
    if (error) {
      toast.error("Failed to delete label");
      return;
    }
    fetchLabels();
    fetchEmailLabels();
  }, [fetchLabels, fetchEmailLabels]);

  const toggleEmailLabel = useCallback(async (emailId: string, labelId: string) => {
    const current = emailLabelMap[emailId] || [];
    if (current.includes(labelId)) {
      // Remove
      await supabase
        .from("email_labels")
        .delete()
        .eq("email_id", emailId)
        .eq("label_id", labelId);
    } else {
      // Add
      await supabase.from("email_labels").insert({ email_id: emailId, label_id: labelId });
    }
    fetchEmailLabels();
  }, [emailLabelMap, fetchEmailLabels]);

  const getLabelsForEmail = useCallback((emailId: string): Label[] => {
    const ids = emailLabelMap[emailId] || [];
    return labels.filter((l) => ids.includes(l.id));
  }, [emailLabelMap, labels]);

  return {
    labels,
    emailLabelMap,
    createLabel,
    deleteLabel,
    toggleEmailLabel,
    getLabelsForEmail,
    DEFAULT_COLORS,
  };
}
