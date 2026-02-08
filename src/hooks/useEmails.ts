import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PAGE_SIZE = 50;

const LIST_COLUMNS = "id, sender_id, recipient_id, subject, preview, folder, read, starred, has_attachment, labels, created_at, sender:profiles!emails_sender_id_fkey(email, display_name), recipient:profiles!emails_recipient_id_fkey(email, display_name)";

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
}

interface DbEmail {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  preview: string;
  body?: string;
  folder: string;
  read: boolean;
  starred: boolean;
  has_attachment: boolean;
  labels: string[];
  created_at: string;
  sender: { email: string; display_name: string | null } | null;
  recipient: { email: string; display_name: string | null } | null;
}

function mapDbEmail(row: DbEmail): Email {
  return {
    id: row.id,
    from: {
      name: row.sender?.display_name || row.sender?.email || "Unknown",
      email: row.sender?.email || "",
    },
    to: {
      name: row.recipient?.display_name || row.recipient?.email || "Unknown",
      email: row.recipient?.email || "",
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
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
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
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
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

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("emails-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "emails" }, () => {
        fetchEmails();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchEmails]);

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

  const sendEmail = useCallback(async (to: string, subject: string, body: string, scheduledAt?: string) => {
    if (!user) return;
    // Find recipient profile
    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", to)
      .maybeSingle();

    if (!recipientProfile) {
      toast.error("Recipient not found. They must have an account.");
      return;
    }

    const preview = body.replace(/<[^>]*>/g, "").slice(0, 100);

    const insertData: Record<string, unknown> = {
      sender_id: user.id,
      recipient_id: recipientProfile.id,
      subject,
      body,
      preview,
      folder: "inbox",
      read: false,
      starred: false,
    };

    if (scheduledAt) {
      insertData.scheduled_at = scheduledAt;
    }

    const { error } = await supabase.from("emails").insert(insertData as any);

    if (error) {
      toast.error("Failed to send email");
      console.error(error);
      return;
    }

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
    sendEmail,
    loadMore,
    fetchEmailBody,
  };
}
