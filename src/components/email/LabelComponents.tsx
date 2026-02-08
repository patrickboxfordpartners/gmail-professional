import { useState } from "react";
import { Tag, Plus, X, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Label } from "@/hooks/useLabels";

interface LabelBadgeProps {
  label: Label;
  size?: "sm" | "md";
  onRemove?: () => void;
}

export function LabelBadge({ label, size = "sm", onRemove }: LabelBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium transition-all",
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"
      )}
      style={{
        backgroundColor: `${label.color}18`,
        color: label.color,
        border: `1px solid ${label.color}30`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: label.color }} />
      {label.name}
      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="hover:opacity-70 ml-0.5">
          <X className="h-2.5 w-2.5" strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}

interface LabelPickerProps {
  emailId: string;
  labels: Label[];
  activeIds: string[];
  onToggle: (emailId: string, labelId: string) => void;
  onCreate: (name: string, color: string) => void;
  onDelete: (labelId: string) => void;
  defaultColors: string[];
}

export function LabelPicker({ emailId, labels, activeIds, onToggle, onCreate, onDelete, defaultColors }: LabelPickerProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(defaultColors[0]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName, newColor);
    setNewName("");
    setCreating(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md hover:bg-secondary transition-all duration-150 group"
        title="Labels"
      >
        <Tag className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.8} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setCreating(false); }} />
          <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-divider rounded-lg shadow-stripe-lg z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-divider">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Labels</p>
            </div>

            <div className="max-h-48 overflow-y-auto py-1">
              {labels.length === 0 && !creating && (
                <p className="px-3 py-3 text-[12px] text-muted-foreground text-center">No labels yet</p>
              )}
              {labels.map((label) => {
                const isActive = activeIds.includes(label.id);
                return (
                  <div
                    key={label.id}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/60 transition-colors group/item"
                  >
                    <button
                      onClick={() => onToggle(emailId, label.id)}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      <span
                        className="h-3 w-3 rounded-sm border flex items-center justify-center"
                        style={{
                          borderColor: label.color,
                          backgroundColor: isActive ? label.color : "transparent",
                        }}
                      >
                        {isActive && <Check className="h-2 w-2 text-white" strokeWidth={3} />}
                      </span>
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="text-[13px] text-foreground truncate">{label.name}</span>
                    </button>
                    <button
                      onClick={() => onDelete(label.id)}
                      className="p-1 rounded opacity-0 group-hover/item:opacity-100 hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" strokeWidth={2} />
                    </button>
                  </div>
                );
              })}
            </div>

            {creating ? (
              <div className="border-t border-divider p-2 space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Label name"
                  autoFocus
                  className="w-full px-2.5 py-1.5 rounded-md border border-input bg-background text-[12px] text-foreground outline-none focus:border-ring transition-all"
                />
                <div className="flex flex-wrap gap-1">
                  {defaultColors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={cn(
                        "h-5 w-5 rounded-full transition-all",
                        newColor === c ? "ring-2 ring-offset-1 ring-ring" : "hover:scale-110"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="compose-btn flex-1 py-1 rounded-md text-[11px] font-semibold text-primary-foreground disabled:opacity-40"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setCreating(false); setNewName(""); }}
                    className="px-3 py-1 rounded-md border border-divider text-[11px] text-muted-foreground hover:bg-secondary transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2 border-t border-divider text-[12px] text-primary font-medium hover:bg-secondary/60 transition-colors"
              >
                <Plus className="h-3 w-3" strokeWidth={2.5} />
                Create new label
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
