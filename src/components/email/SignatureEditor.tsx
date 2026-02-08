import {
  X, Plus, Trash2, Star, Upload, Palette, Type, Layout,
  Linkedin, Twitter, Instagram, Globe, Phone, Building2, User, Image,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { EmailSignature } from "@/hooks/useSignatures";
import type { useSignatures } from "@/hooks/useSignatures";

interface SignatureEditorProps {
  open: boolean;
  onClose: () => void;
  ctx: ReturnType<typeof useSignatures>;
}

export function SignatureEditor({ open, onClose, ctx }: SignatureEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "style" | "social">("info");

  if (!open) return null;

  const selected = ctx.signatures.find((s) => s.id === selectedId) || ctx.signatures[0] || null;

  const update = (field: string, value: string | boolean) => {
    if (selected) ctx.updateSignature(selected.id, { [field]: value } as any);
  };

  const handleImageUpload = async (type: "logo" | "photo") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = await ctx.uploadAsset(file, type);
      if (url && selected) {
        ctx.updateSignature(selected.id, { [`${type}_url`]: url } as any);
      }
    };
    input.click();
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-card border-l border-divider z-50 flex flex-col shadow-stripe-lg animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider shrink-0">
          <h2 className="text-[15px] font-semibold text-foreground tracking-tight">Email Signatures</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary transition-all">
            <X className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Signature list */}
          <div className="w-48 border-r border-divider flex flex-col shrink-0">
            <div className="p-3 border-b border-divider">
              <button
                onClick={() => ctx.createSignature()}
                className="w-full flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3 w-3" /> New Signature
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {ctx.signatures.map((sig) => (
                <button
                  key={sig.id}
                  onClick={() => setSelectedId(sig.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 border-b border-divider text-[12px] transition-all",
                    (selected?.id === sig.id) ? "bg-accent text-accent-foreground" : "hover:bg-secondary text-foreground"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {sig.is_default && <Star className="h-3 w-3 text-primary fill-primary" />}
                    <span className="font-medium truncate">{sig.name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {sig.full_name || "Untitled"}
                  </p>
                </button>
              ))}
              {ctx.signatures.length === 0 && (
                <p className="px-3 py-4 text-[11px] text-muted-foreground text-center">
                  No signatures yet
                </p>
              )}
            </div>
          </div>

          {/* Editor */}
          {selected ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-divider px-4 shrink-0">
                {([
                  { id: "info" as const, label: "Details", icon: User },
                  { id: "style" as const, label: "Style", icon: Palette },
                  { id: "social" as const, label: "Links", icon: Globe },
                ] as const).map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={cn(
                        "flex items-center gap-1 px-3 py-2.5 text-[12px] font-medium border-b-2 transition-all -mb-px",
                        activeTab === t.id
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3 w-3" strokeWidth={1.8} />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {activeTab === "info" && (
                  <>
                    <Field label="Signature name" value={selected.name} onChange={(v) => update("name", v)} />
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-medium text-muted-foreground">Default signature</label>
                      <Switch checked={selected.is_default} onCheckedChange={(v) => update("is_default", v)} />
                    </div>
                    <Separator />
                    <Field label="Full name" value={selected.full_name} onChange={(v) => update("full_name", v)} icon={User} />
                    <Field label="Job title" value={selected.job_title} onChange={(v) => update("job_title", v)} icon={Type} />
                    <Field label="Company" value={selected.company} onChange={(v) => update("company", v)} icon={Building2} />
                    <Field label="Phone" value={selected.phone} onChange={(v) => update("phone", v)} icon={Phone} />
                    <Separator />
                    <div className="space-y-2">
                      <label className="text-[12px] font-medium text-muted-foreground">Profile photo</label>
                      <div className="flex items-center gap-3">
                        {selected.photo_url ? (
                          <img src={selected.photo_url} alt="" className="w-12 h-12 rounded-full object-cover border border-divider" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <button onClick={() => handleImageUpload("photo")} className="px-3 py-1.5 rounded-md border border-input text-[11px] font-medium text-foreground hover:bg-secondary transition-colors flex items-center gap-1">
                          <Upload className="h-3 w-3" /> Upload
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-medium text-muted-foreground">Company logo</label>
                      <div className="flex items-center gap-3">
                        {selected.logo_url ? (
                          <img src={selected.logo_url} alt="" className="h-8 max-w-[120px] object-contain border border-divider rounded" />
                        ) : (
                          <div className="h-8 w-20 rounded bg-secondary flex items-center justify-center">
                            <Image className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <button onClick={() => handleImageUpload("logo")} className="px-3 py-1.5 rounded-md border border-input text-[11px] font-medium text-foreground hover:bg-secondary transition-colors flex items-center gap-1">
                          <Upload className="h-3 w-3" /> Upload
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "style" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[12px] font-medium text-muted-foreground">Layout</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["horizontal", "vertical"] as const).map((l) => (
                          <button
                            key={l}
                            onClick={() => update("layout", l)}
                            className={cn(
                              "p-2.5 rounded-lg border text-[12px] font-medium capitalize transition-all flex items-center justify-center gap-1.5",
                              selected.layout === l
                                ? "border-primary bg-accent text-accent-foreground"
                                : "border-divider text-muted-foreground hover:border-ring/40"
                            )}
                          >
                            <Layout className="h-3.5 w-3.5" strokeWidth={1.5} />
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[12px] font-medium text-muted-foreground">Font</label>
                      <select
                        value={selected.font_family}
                        onChange={(e) => update("font_family", e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-[12px] text-foreground outline-none focus:border-ring"
                      >
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="'Georgia', serif">Georgia</option>
                        <option value="'Helvetica Neue', sans-serif">Helvetica Neue</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="'Verdana', sans-serif">Verdana</option>
                        <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                      </select>
                    </div>

                    <Separator />

                    <ColorField label="Primary color" value={selected.primary_color} onChange={(v) => update("primary_color", v)} />
                    <ColorField label="Secondary color" value={selected.secondary_color} onChange={(v) => update("secondary_color", v)} />
                    <ColorField label="Accent color" value={selected.accent_color} onChange={(v) => update("accent_color", v)} />

                    <Separator />

                    <div className="space-y-2">
                      <label className="text-[12px] font-medium text-muted-foreground">Custom HTML (overrides template)</label>
                      <textarea
                        value={selected.custom_html}
                        onChange={(e) => update("custom_html", e.target.value)}
                        placeholder="Paste custom HTML signature here..."
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-[11px] text-foreground outline-none focus:border-ring font-mono resize-y min-h-[80px]"
                      />
                    </div>
                  </>
                )}

                {activeTab === "social" && (
                  <>
                    <Field label="Website" value={selected.website} onChange={(v) => update("website", v)} icon={Globe} placeholder="https://boxfordpartners.com" />
                    <Field label="LinkedIn" value={selected.linkedin} onChange={(v) => update("linkedin", v)} icon={Linkedin} placeholder="https://linkedin.com/in/..." />
                    <Field label="Twitter / X" value={selected.twitter} onChange={(v) => update("twitter", v)} icon={Twitter} placeholder="https://x.com/..." />
                    <Field label="Instagram" value={selected.instagram} onChange={(v) => update("instagram", v)} icon={Instagram} placeholder="https://instagram.com/..." />
                  </>
                )}
              </div>

              {/* Preview */}
              <div className="border-t border-divider px-4 py-3 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Preview</span>
                  <button
                    onClick={() => ctx.deleteSignature(selected.id)}
                    className="text-[11px] text-destructive hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
                <div
                  className="p-3 rounded-md border border-divider bg-background overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: ctx.renderSignatureHtml(selected) }}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[13px] text-muted-foreground">Create a signature to get started</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Field({
  label, value, onChange, icon: Icon, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  icon?: React.ElementType; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[12px] font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-[12px] text-foreground outline-none focus:border-ring"
        />
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-[12px] font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-7 rounded border border-input cursor-pointer"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-2 py-1 rounded border border-input bg-background text-[11px] text-foreground font-mono outline-none focus:border-ring"
        />
      </div>
    </div>
  );
}
