import {
  X,
  Upload,
  FileText,
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface MigrationPanelProps {
  open: boolean;
  onClose: () => void;
}

type MigrationMethod = "file" | "guide";
type FileType = "eml" | "mbox" | "csv";
type Status = "idle" | "uploading" | "success" | "error";

export function MigrationPanel({ open, onClose }: MigrationPanelProps) {
  const [method, setMethod] = useState<MigrationMethod>("file");
  const [status, setStatus] = useState<Status>("idle");
  const [importedCount, setImportedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const detectFileType = (filename: string): FileType | null => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "eml") return "eml";
    if (ext === "mbox") return "mbox";
    if (ext === "csv") return "csv";
    return null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = detectFileType(file.name);
    if (!fileType) {
      toast.error("Unsupported file type. Please use .eml, .mbox, or .csv files.");
      return;
    }

    setStatus("uploading");
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", fileType);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-migration`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Import failed");
      }

      setImportedCount(result.imported || 0);
      setStatus("success");
      toast.success(`Successfully imported ${result.imported} email(s)`);
    } catch (err: any) {
      setErrorMsg(err.message || "Import failed");
      setStatus("error");
      toast.error(err.message || "Import failed");
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const reset = () => {
    setStatus("idle");
    setImportedCount(0);
    setErrorMsg("");
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-50 animate-fade-in" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-divider z-50 flex flex-col shadow-stripe-lg animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider shrink-0">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" strokeWidth={2} />
            <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
              Import Emails
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary transition-all">
            <X className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
          </button>
        </div>

        {/* Method Tabs */}
        <div className="flex border-b border-divider px-5 shrink-0">
          {([
            { id: "file" as const, label: "File Import", icon: Upload },
            { id: "guide" as const, label: "Export Guide", icon: Mail },
          ]).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => { setMethod(t.id); reset(); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 transition-all -mb-px",
                  method === t.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {method === "file" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-1">
                  Upload Email Files
                </h3>
                <p className="text-[12px] text-muted-foreground mb-4">
                  Import your emails from .eml, .mbox, or .csv files exported from your email client.
                </p>
              </div>

              {/* Supported formats */}
              <div className="grid grid-cols-3 gap-2">
                {([
                  { ext: ".eml", desc: "Single email" },
                  { ext: ".mbox", desc: "Mailbox archive" },
                  { ext: ".csv", desc: "Spreadsheet" },
                ] as const).map((f) => (
                  <div
                    key={f.ext}
                    className="p-3 rounded-lg border border-divider text-center"
                  >
                    <FileText className="h-5 w-5 text-primary mx-auto mb-1.5" strokeWidth={1.5} />
                    <p className="text-[12px] font-semibold text-foreground">{f.ext}</p>
                    <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Upload area */}
              {status === "idle" && (
                <label className="flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                  <Upload className="h-8 w-8 text-primary/60" strokeWidth={1.5} />
                  <div className="text-center">
                    <p className="text-[13px] font-medium text-foreground">
                      Click to upload or drag & drop
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      .eml, .mbox, or .csv files
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".eml,.mbox,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}

              {status === "uploading" && (
                <div className="flex flex-col items-center gap-3 p-8 rounded-lg border border-divider bg-secondary/50">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" strokeWidth={1.5} />
                  <p className="text-[13px] font-medium text-foreground">Importing emails…</p>
                  <p className="text-[11px] text-muted-foreground">This may take a moment</p>
                </div>
              )}

              {status === "success" && (
                <div className="flex flex-col items-center gap-3 p-8 rounded-lg border border-primary/30 bg-primary/5">
                  <CheckCircle className="h-8 w-8 text-primary" strokeWidth={1.5} />
                  <p className="text-[13px] font-semibold text-foreground">
                    {importedCount} email{importedCount !== 1 ? "s" : ""} imported!
                  </p>
                  <button
                    onClick={reset}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors"
                  >
                    Import more
                  </button>
                </div>
              )}

              {status === "error" && (
                <div className="flex flex-col items-center gap-3 p-8 rounded-lg border border-destructive/30 bg-destructive/5">
                  <AlertCircle className="h-8 w-8 text-destructive" strokeWidth={1.5} />
                  <p className="text-[13px] font-medium text-foreground">Import failed</p>
                  <p className="text-[11px] text-destructive text-center">{errorMsg}</p>
                  <button
                    onClick={reset}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              )}

              <Separator />

              {/* CSV format guide */}
              <div>
                <h4 className="text-[12px] font-semibold text-foreground mb-2">CSV Format</h4>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Your CSV should have these column headers:
                </p>
                <div className="p-3 rounded-md bg-secondary/60 border border-divider font-mono text-[11px] text-muted-foreground">
                  from,subject,body,date
                  <br />
                  john@boxfordpartners.com,Hello,Hi there!,2025-01-15
                </div>
              </div>
            </div>
          )}

          {method === "guide" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-1">
                  Export from Your Email Provider
                </h3>
                <p className="text-[12px] text-muted-foreground mb-4">
                  Follow these guides to export your emails, then import them using the File Import tab.
                </p>
              </div>

              {/* Gmail */}
              <ExportGuide
                provider="Gmail"
                icon="📧"
                steps={[
                  "Go to takeout.google.com",
                  "Deselect all, then select only 'Mail'",
                  "Click 'Next step' and choose your export format",
                  "Select .mbox format and start export",
                  "Download the archive when ready",
                  "Upload the .mbox file here",
                ]}
              />

              <Separator />

              {/* Outlook */}
              <ExportGuide
                provider="Outlook"
                icon="📨"
                steps={[
                  "Open Outlook desktop app",
                  "Go to File > Open & Export > Import/Export",
                  "Select 'Export to a file'",
                  "Choose the mailbox or folder to export",
                  "Save as .csv or .pst file",
                  "For .pst, convert to .mbox using a tool like Thunderbird",
                  "Upload the exported file here",
                ]}
              />

              <Separator />

              {/* Thunderbird */}
              <ExportGuide
                provider="Thunderbird"
                icon="🦊"
                steps={[
                  "Install the 'ImportExportTools NG' add-on",
                  "Right-click on a folder in Thunderbird",
                  "Select 'ImportExportTools NG' > 'Export folder'",
                  "Choose 'mbox format'",
                  "Upload the .mbox file here",
                ]}
              />

              <Separator />

              {/* Apple Mail */}
              <ExportGuide
                provider="Apple Mail"
                icon="🍎"
                steps={[
                  "Select the mailbox you want to export",
                  "Go to Mailbox > Export Mailbox",
                  "Choose a save location",
                  "The exported .mbox file can be uploaded here",
                ]}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ExportGuide({
  provider,
  icon,
  steps,
}: {
  provider: string;
  icon: string;
  steps: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h4 className="text-[13px] font-semibold text-foreground">{provider}</h4>
      </div>
      <ol className="space-y-2 pl-1">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="text-[12px] text-muted-foreground leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
