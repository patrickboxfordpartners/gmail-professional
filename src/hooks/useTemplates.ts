import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export function useTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Fetch templates error:", error);
    else setTemplates((data as unknown as EmailTemplate[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const createTemplate = useCallback(async (name: string, subject: string, body: string) => {
    if (!user) return;
    const { error } = await supabase.from("email_templates").insert({
      user_id: user.id, name, subject, body,
    } as any);
    if (error) { toast.error("Failed to save template"); console.error(error); }
    else { toast.success("Template saved"); await fetchTemplates(); }
  }, [user, fetchTemplates]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<EmailTemplate>) => {
    const { error } = await supabase.from("email_templates").update(updates as any).eq("id", id);
    if (error) { toast.error("Failed to update template"); }
    else { await fetchTemplates(); }
  }, [fetchTemplates]);

  const deleteTemplate = useCallback(async (id: string) => {
    const { error } = await supabase.from("email_templates").delete().eq("id", id);
    if (error) { toast.error("Failed to delete template"); }
    else { toast.success("Template deleted"); await fetchTemplates(); }
  }, [fetchTemplates]);

  return { templates, loading, createTemplate, updateTemplate, deleteTemplate };
}
