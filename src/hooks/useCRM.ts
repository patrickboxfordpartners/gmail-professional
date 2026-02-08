import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Company {
  id: string;
  name: string;
  domain: string | null;
  notes: string;
  created_at: string;
}

export interface Contact {
  id: string;
  company_id: string | null;
  name: string;
  email: string;
  phone: string;
  role: string;
  deal_stage: string;
  notes: string;
  created_at: string;
  company?: Company | null;
}

export function useCRM() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const [{ data: c }, { data: co }] = await Promise.all([
        supabase.from("contacts").select("*, company:companies(*)").order("created_at", { ascending: false }),
        supabase.from("companies").select("*").order("name"),
      ]);
      setContacts((c as any[]) || []);
      setCompanies((co as any[]) || []);
    } catch (e) {
      console.error("CRM fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createContact = useCallback(async (data: { name: string; email: string; phone?: string; role?: string; company_id?: string; deal_stage?: string }) => {
    if (!user) return;
    const { error } = await supabase.from("contacts").insert({ ...data, user_id: user.id });
    if (error) { toast.error("Failed to create contact"); console.error(error); return; }
    toast.success("Contact created");
    fetchAll();
  }, [user, fetchAll]);

  const updateContact = useCallback(async (id: string, data: Partial<Contact>) => {
    const { error } = await supabase.from("contacts").update(data).eq("id", id);
    if (error) { toast.error("Failed to update contact"); return; }
    fetchAll();
  }, [fetchAll]);

  const deleteContact = useCallback(async (id: string) => {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) { toast.error("Failed to delete contact"); return; }
    toast.success("Contact deleted");
    fetchAll();
  }, [fetchAll]);

  const createCompany = useCallback(async (data: { name: string; domain?: string }) => {
    if (!user) return;
    const { error } = await supabase.from("companies").insert({ ...data, user_id: user.id });
    if (error) { toast.error("Failed to create company"); console.error(error); return; }
    toast.success("Company created");
    fetchAll();
  }, [user, fetchAll]);

  const deleteCompany = useCallback(async (id: string) => {
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) { toast.error("Failed to delete company"); return; }
    toast.success("Company deleted");
    fetchAll();
  }, [fetchAll]);

  const linkEmailToContact = useCallback(async (emailId: string, contactId: string) => {
    const { error } = await supabase.from("email_contacts").insert({ email_id: emailId, contact_id: contactId });
    if (error) {
      if (error.code === "23505") { toast.info("Already linked"); return; }
      toast.error("Failed to link"); console.error(error); return;
    }
    toast.success("Email linked to contact");
  }, []);

  const unlinkEmailFromContact = useCallback(async (emailId: string, contactId: string) => {
    const { error } = await supabase.from("email_contacts").delete().eq("email_id", emailId).eq("contact_id", contactId);
    if (error) { toast.error("Failed to unlink"); return; }
    toast.success("Email unlinked");
  }, []);

  const getContactsForEmail = useCallback(async (emailId: string): Promise<Contact[]> => {
    const { data } = await supabase
      .from("email_contacts")
      .select("contact_id, contact:contacts(*, company:companies(*))")
      .eq("email_id", emailId);
    return (data || []).map((d: any) => d.contact).filter(Boolean);
  }, []);

  const findContactByEmail = useCallback((email: string) => {
    return contacts.find((c) => c.email.toLowerCase() === email.toLowerCase()) || null;
  }, [contacts]);

  return {
    contacts, companies, loading,
    createContact, updateContact, deleteContact,
    createCompany, deleteCompany,
    linkEmailToContact, unlinkEmailFromContact, getContactsForEmail,
    findContactByEmail, refresh: fetchAll,
  };
}
