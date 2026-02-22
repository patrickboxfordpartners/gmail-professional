import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PAGE_SIZE = 50;

export interface Attachment {
  name: string;
  size: number;
  type: string;
}

export interface AttachmentPayload extends Attachment {
  data: string; // base64
}

const LIST_COLUMNS = "id, sender_id, recipient_id, sender_email, recipient_email, sender_name, recipient_name, subject, preview, folder, read, starred, has_attachment, labels, created_at, opportunity_score, is_spam, business_classification, ai_summary, cc, bcc, attachments, sender:profiles!emails_sender_id_fkey(email, display_name), recipient:profiles!emails_recipient_id_fkey(email, display_name)";

export interface Email {
  id: string;
  from: { name: string; email: string };
  to: { name: string; email: string };
  subject: string;
  preview: string;
  body: string;
  date: Date;
  read: boolean;
  starred: boolean;
  folder: string;
  labels: string[];
  hasAttachment: boolean;
  opportunityScore: number | null;
  isSpam: boolean;
  businessClassification: string | null;
  aiSummary: string | null;
  cc: string[];
  bcc: string[];
  attachments: Attachment[];
}

interface DbEmail {
  id: string;
  sender_id: string | null;
  recipient_id: string | null;
  sender_email: string | null;
  recipient_email: string | null;
  sender_name: string | null;
  recipient_name: string | null;
  subject: string;
  preview: string;
  body?: string;
  folder: string;
  read: boolean;
  starred: boolean;
  has_attachment: boolean;
  labels: string[];
  created_at: string;
  opportunity_score: number | null;
  is_spam: boolean | null;
  business_classification: string | null;
  ai_summary: string | null;
  cc: string | null;
  bcc: string | null;
  attachments: Attachment[] | null;
  sender: { email: string; display_name: string | null } | null;
  recipient: { email: string; display_name: string | null } | null;
}

function mapDbEmail(row: DbEmail): Email {
  const senderEmail = row.sender?.email || row.sender_email || "";
  const recipientEmail = row.recipient?.email || row.recipient_email || "";
  return {
    id: row.id,
    from: {
      name: row.sender?.display_name || row.sender_name || senderEmail || "Unknown",
      email: senderEmail,
    },
    to: {
      name: row.recipient?.display_name || row.recipient_name || recipientEmail || "Unknown",
      email: recipientEmail,
    },
    subject: row.subject,
    preview: row.preview,
    body: row.body || "",
    date: new Date(row.created_at),
    read: row.read,
    starred: row.starred,
    folder: row.folder,
    labels: row.labels || [],
    hasAttachment: row.has_attachment,
    opportunityScore: row.opportunity_score ?? null,
    isSpam: row.is_spam ?? false,
    businessClassification: row.business_classification ?? null,
    aiSummary: row.ai_summary ?? null,
    cc: row.cc ? row.cc.split(",").map((s) => s.trim()).filter(Boolean) : [],
    bcc: row.bcc ? row.bcc.split(",").map((s) => s.trim()).filter(Boolean) : [],
    attachments: row.attachments ?? [],
  };
}

export function useEmails() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  const fetchEmails = useCallback(async () => {
    if (!user) return;
    try {
      pageRef.current = 0;
      const from = 0;
      const to = PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("emails")
        .select(LIST_COLUMNS)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id},sender_email.eq.${user.email},recipient_email.eq.${user.email}`)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      const mapped = (data as unknown as DbEmail[]).map(mapDbEmail);
      setEmails(mapped);
      setHasMore(mapped.length === PAGE_SIZE);
    } catch (err: any) {
      console.error("Failed to fetch emails:", err);
      toast.error("Failed to load emails");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadMore = useCallback(async () => {
    if (!user || !hasMore) return;
    const nextPage = pageRef.current + 1;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
      const { data, error } = await supabase
        .from("emails")
        .select(LIST_COLUMNS)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id},sender_email.eq.${user.email},recipient_email.eq.${user.email}`)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      const mapped = (data as unknown as DbEmail[]).map(mapDbEmail);
      setEmails((prev) => [...prev, ...mapped]);
      setHasMore(mapped.length === PAGE_SIZE);
      pageRef.current = nextPage;
    } catch (err: any) {
      console.error("Failed to load more emails:", err);
      toast.error("Failed to load more emails");
    }
  }, [user, hasMore]);

  /** Fetch full email body on demand (for the reader). */
  const fetchEmailBody = useCallback(async (id: string): Promise<string> => {
    const { data, error } = await supabase
      .from("emails")
      .select("body")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Failed to fetch email body:", error);
      return "";
    }
    // Also update the cached email so subsequent reads are instant
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, body: data.body } : e)));
    return data.body;
  }, []);

  /** Fetch a single email with joined sender/recipient for INSERT events. */
  const fetchSingleEmail = useCallback(async (id: string): Promise<Email | null> => {
    const { data, error } = await supabase
      .from("emails")
      .select(LIST_COLUMNS)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Failed to fetch single email:", error);
      return null;
    }
    return mapDbEmail(data as unknown as DbEmail);
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Realtime subscription — delta updates instead of full refetch
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("emails-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "emails" }, async (payload) => {
        const newRow = payload.new as { id: string; sender_id: string | null; recipient_id: string | null; sender_email: string | null; recipient_email: string | null };
        // Only care about emails involving this user (by UUID or email address)
        const involvesUser =
          newRow.sender_id === user.id ||
          newRow.recipient_id === user.id ||
          newRow.sender_email === user.email ||
          newRow.recipient_email === user.email;
        if (!involvesUser) return;
        const email = await fetchSingleEmail(newRow.id);
        if (email) {
          setEmails((prev) => [email, ...prev]);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "emails" }, (payload) => {
        const updated = payload.new as Record<string, any>;
        setEmails((prev) =>
          prev.map((e) =>
            e.id === updated.id
              ? {
                  ...e,
                  read: updated.read,
                  starred: updated.starred,
                  folder: updated.folder,
                  labels: updated.labels || e.labels,
                  opportunityScore: updated.opportunity_score ?? e.opportunityScore,
                  isSpam: updated.is_spam ?? e.isSpam,
                  businessClassification: updated.business_classification ?? e.businessClassification,
                  aiSummary: updated.ai_summary ?? e.aiSummary,
                }
              : e
          )
        );
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "emails" }, (payload) => {
        const deleted = payload.old as { id: string };
        setEmails((prev) => prev.filter((e) => e.id !== deleted.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredEmails = useMemo(() => {
    let list = emails;
    if (activeFolder === "starred") {
      list = list.filter((e) => e.starred);
    } else if (activeFolder === "sent") {
      list = list.filter((e) => e.from.email === user?.email && e.folder !== "drafts");
    } else {
      list = list.filter((e) => e.folder === activeFolder);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.from.name.toLowerCase().includes(q) ||
          e.preview.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [emails, activeFolder, search, user?.email]);

  const selectedEmail = useMemo(
    () => emails.find((e) => e.id === selectedId) || null,
    [emails, selectedId]
  );

  const handleSelect = useCallback(async (id: string) => {
    setSelectedId(id);
    if (!id) return; // clearing selection
    // Mark as read
    await supabase.from("emails").update({ read: true }).eq("id", id);
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleToggleStar = useCallback(async (id: string) => {
    const email = emails.find((e) => e.id === id);
    if (!email) return;
    const newStarred = !email.starred;
    await supabase.from("emails").update({ starred: newStarred }).eq("id", id);
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, starred: newStarred } : e)));
  }, [emails]);

  const handleFolderChange = useCallback((folder: string) => {
    setActiveFolder(folder);
    setSelectedId(null);
  }, []);

  const handleArchive = useCallback(async (id: string) => {
    await supabase.from("emails").update({ folder: "archive" }).eq("id", id);
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, folder: "archive" } : e)));
    toast.success("Archived");
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from("emails").update({ folder: "trash" }).eq("id", id);
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, folder: "trash" } : e)));
    toast.success("Moved to trash");
  }, []);

  const handleMarkUnread = useCallback(async (id: string) => {
    await supabase.from("emails").update({ read: false }).eq("id", id);
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, read: false } : e)));
  }, []);

  const handleMarkRead = useCallback(async (id: string) => {
    await supabase.from("emails").update({ read: true }).eq("id", id);
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)));
  }, []);

  const handleBulkMarkRead = useCallback(async (ids: string[]) => {
    await supabase.from("emails").update({ read: true }).in("id", ids);
    setEmails((prev) => prev.map((e) => ids.includes(e.id) ? { ...e, read: true } : e));
  }, []);

  const handleBulkMarkUnread = useCallback(async (ids: string[]) => {
    await supabase.from("emails").update({ read: false }).in("id", ids);
    setEmails((prev) => prev.map((e) => ids.includes(e.id) ? { ...e, read: false } : e));
  }, []);

  const handleBulkArchive = useCallback(async (ids: string[]) => {
    await supabase.from("emails").update({ folder: "archive" }).in("id", ids);
    setEmails((prev) => prev.map((e) => ids.includes(e.id) ? { ...e, folder: "archive" } : e));
    toast.success(`Archived ${ids.length} ${ids.length === 1 ? "email" : "emails"}`);
  }, []);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    await supabase.from("emails").update({ folder: "trash" }).in("id", ids);
    setEmails((prev) => prev.map((e) => ids.includes(e.id) ? { ...e, folder: "trash" } : e));
    toast.success(`Moved ${ids.length} ${ids.length === 1 ? "email" : "emails"} to trash`);
  }, []);

  const handleMoveToFolder = useCallback(async (id: string, folder: string) => {
    await supabase.from("emails").update({ folder }).eq("id", id);
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, folder } : e)));
    toast.success(`Moved to ${folder}`);
  }, []);

  const sendEmail = useCallback(async (
    to: string, subject: string, body: string,
    scheduledAt?: string, cc?: string[], bcc?: string[],
    attachments?: AttachmentPayload[]
  ) => {
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase.functions.invoke("mailgun-send", {
      body: { to, subject, body, scheduledAt, cc, bcc, attachments },
    });

    if (error) {
      console.error("Send error:", error);
      throw new Error(error.message || "Failed to send email");
    }

    if (data?.error) {
      console.error("Send error:", data.error);
      throw new Error(data.error);
    }

    toast.success("Email sent successfully");
    fetchEmails();
  }, [user, fetchEmails]);

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {
      inbox: 0, starred: 0, sent: 0, drafts: 0, archive: 0, spam: 0, trash: 0,
    };
    for (const e of emails) {
      if (!e.read && e.folder === "inbox") counts.inbox++;
      if (e.starred) counts.starred++;
      if (e.folder === "drafts") counts.drafts++;
    }
    return counts;
  }, [emails]);

  return {
    emails: filteredEmails,
    selectedEmail,
    selectedId,
    activeFolder,
    search,
    loading,
    folderCounts,
    hasMore,
    setSearch,
    handleSelect,
    clearSelection,
    handleToggleStar,
    handleFolderChange,
    handleArchive,
    handleDelete,
    handleMarkUnread,
    handleMarkRead,
    handleBulkMarkRead,
    handleBulkMarkUnread,
    handleBulkArchive,
    handleBulkDelete,
    handleMoveToFolder,
    sendEmail,
    loadMore,
    fetchEmailBody,
  };
}
