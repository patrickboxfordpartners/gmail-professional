import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface EmailSignature {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  full_name: string;
  job_title: string;
  company: string;
  phone: string;
  website: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  logo_url: string;
  photo_url: string;
  font_family: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  layout: string;
  custom_html: string;
  created_at: string;
  updated_at: string;
}

const defaultSignature: Omit<EmailSignature, "id" | "user_id" | "created_at" | "updated_at"> = {
  name: "Default",
  is_default: true,
  full_name: "",
  job_title: "",
  company: "Boxford Partners",
  phone: "",
  website: "",
  linkedin: "",
  twitter: "",
  instagram: "",
  logo_url: "",
  photo_url: "",
  font_family: "Arial, sans-serif",
  primary_color: "#1a1a1a",
  secondary_color: "#666666",
  accent_color: "#4f46e5",
  layout: "horizontal",
  custom_html: "",
};

export function useSignatures() {
  const { user } = useAuth();
  const [signatures, setSignatures] = useState<EmailSignature[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignatures = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("email_signatures")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Fetch signatures error:", error);
    } else {
      setSignatures((data as unknown as EmailSignature[]) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSignatures(); }, [fetchSignatures]);

  const createSignature = useCallback(async (partial?: Partial<typeof defaultSignature>) => {
    if (!user) return;
    const isFirst = signatures.length === 0;
    const { error } = await supabase.from("email_signatures").insert({
      user_id: user.id,
      ...defaultSignature,
      ...partial,
      is_default: isFirst ? true : (partial?.is_default ?? false),
      name: partial?.name || `Signature ${signatures.length + 1}`,
    } as any);
    if (error) {
      toast.error("Failed to create signature");
      console.error(error);
    } else {
      toast.success("Signature created");
      await fetchSignatures();
    }
  }, [user, signatures.length, fetchSignatures]);

  const updateSignature = useCallback(async (id: string, updates: Partial<EmailSignature>) => {
    // Optimistic update - update local state immediately
    setSignatures((prev) => prev.map((sig) => sig.id === id ? { ...sig, ...updates } : sig));

    // If setting as default, unset others first
    if (updates.is_default && user) {
      await supabase.from("email_signatures").update({ is_default: false } as any).eq("user_id", user.id);
    }
    const { error } = await supabase.from("email_signatures").update(updates as any).eq("id", id);
    if (error) {
      toast.error("Failed to update signature");
      // Revert on error
      await fetchSignatures();
      console.error(error);
    } else {
      await fetchSignatures();
    }
  }, [user, fetchSignatures]);

  const deleteSignature = useCallback(async (id: string) => {
    const { error } = await supabase.from("email_signatures").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete signature");
    } else {
      toast.success("Signature deleted");
      await fetchSignatures();
    }
  }, [fetchSignatures]);

  const uploadAsset = useCallback(async (file: File, type: "logo" | "photo"): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${type}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("signature-assets").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Failed to upload image");
      console.error(error);
      return null;
    }
    const { data } = supabase.storage.from("signature-assets").getPublicUrl(path);
    return data.publicUrl;
  }, [user]);

  const getDefaultSignature = useCallback((): EmailSignature | null => {
    return signatures.find((s) => s.is_default) || signatures[0] || null;
  }, [signatures]);

  const renderSignatureHtml = useCallback((sig: EmailSignature): string => {
    if (sig.custom_html) return sig.custom_html;

    const socialLinks: string[] = [];
    if (sig.linkedin) socialLinks.push(`<a href="${sig.linkedin}" style="color:${sig.accent_color};text-decoration:none;margin-right:8px;">LinkedIn</a>`);
    if (sig.twitter) socialLinks.push(`<a href="${sig.twitter}" style="color:${sig.accent_color};text-decoration:none;margin-right:8px;">Twitter</a>`);
    if (sig.instagram) socialLinks.push(`<a href="${sig.instagram}" style="color:${sig.accent_color};text-decoration:none;margin-right:8px;">Instagram</a>`);
    if (sig.website) socialLinks.push(`<a href="${sig.website}" style="color:${sig.accent_color};text-decoration:none;">Website</a>`);

    const photoHtml = sig.photo_url ? `<img src="${sig.photo_url}" alt="" style="width:64px;height:64px;border-radius:50%;object-fit:cover;margin-right:16px;" />` : "";
    const logoHtml = sig.logo_url ? `<img src="${sig.logo_url}" alt="" style="max-height:32px;margin-top:8px;" />` : "";

    const isHorizontal = sig.layout === "horizontal";

    return `
      <table cellpadding="0" cellspacing="0" border="0" style="font-family:${sig.font_family};font-size:13px;color:${sig.primary_color};margin-top:16px;">
        <tr>
          ${photoHtml ? `<td style="vertical-align:top;padding-right:${isHorizontal ? '16' : '0'}px;">${photoHtml}</td>` : ""}
          <td style="vertical-align:top;">
            <div style="font-size:15px;font-weight:600;color:${sig.primary_color};">${sig.full_name}</div>
            ${sig.job_title ? `<div style="font-size:12px;color:${sig.secondary_color};margin-top:2px;">${sig.job_title}</div>` : ""}
            ${sig.company ? `<div style="font-size:12px;color:${sig.secondary_color};margin-top:1px;">${sig.company}</div>` : ""}
            ${sig.phone ? `<div style="font-size:12px;color:${sig.secondary_color};margin-top:4px;">📞 ${sig.phone}</div>` : ""}
            ${socialLinks.length > 0 ? `<div style="margin-top:6px;font-size:12px;">${socialLinks.join("")}</div>` : ""}
            ${logoHtml ? `<div>${logoHtml}</div>` : ""}
          </td>
        </tr>
      </table>
    `.trim();
  }, []);

  return {
    signatures, loading,
    createSignature, updateSignature, deleteSignature,
    uploadAsset, getDefaultSignature, renderSignatureHtml,
  };
}
