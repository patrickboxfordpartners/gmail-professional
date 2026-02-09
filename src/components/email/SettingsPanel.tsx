import { X, Sun, Moon, Monitor, Bell, BellOff, User, Mail, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "account" | "appearance" | "notifications";
type Density = "Compact" | "Default" | "Comfortable";

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { user, signOut } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("appearance");
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");
  const [saving, setSaving] = useState(false);
  const [density, setDensity] = useState<Density>(() => (localStorage.getItem("pref_density") as Density) || "Default");

  // Notification prefs stored in localStorage
  const [emailNotifs, setEmailNotifs] = useState(() => localStorage.getItem("pref_email_notifs") !== "false");
  const [desktopNotifs, setDesktopNotifs] = useState(() => localStorage.getItem("pref_desktop_notifs") === "true");
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("pref_sound") !== "false");

  if (!open) return null;

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });
      if (error) throw error;

      await supabase.from("profiles").update({ display_name: displayName }).eq("id", user?.id);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleNotifPref = (key: string, value: boolean, setter: (v: boolean) => void) => {
    localStorage.setItem(key, String(value));
    setter(value);
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "appearance", label: "Appearance", icon: Sun },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "account", label: "Account", icon: User },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-foreground/20 z-50 animate-fade-in" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-divider z-50 flex flex-col shadow-stripe-lg animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider shrink-0">
          <h2 className="text-[15px] font-semibold text-foreground tracking-tight">Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary transition-all">
            <X className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-divider px-5 shrink-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 transition-all -mb-px",
                  tab === t.id
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
          {tab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-1">Theme</h3>
                <p className="text-[12px] text-muted-foreground mb-4">Choose your preferred appearance</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "light", label: "Light", icon: Sun, active: !dark },
                    { id: "dark", label: "Dark", icon: Moon, active: dark },
                    { id: "system", label: "System", icon: Monitor, active: false },
                  ] as const).map((opt) => {
                    const OptIcon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          if (opt.id === "system") {
                            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                            if (prefersDark !== dark) toggleTheme();
                            localStorage.removeItem("theme");
                          } else if ((opt.id === "dark") !== dark) {
                            toggleTheme();
                          }
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-lg border text-[12px] font-medium transition-all",
                          opt.active
                            ? "border-primary bg-accent text-accent-foreground"
                            : "border-divider text-muted-foreground hover:border-ring/40 hover:bg-secondary"
                        )}
                      >
                        <OptIcon className="h-5 w-5" strokeWidth={1.5} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-1">Density</h3>
                <p className="text-[12px] text-muted-foreground mb-3">Adjust email list spacing</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["Compact", "Default", "Comfortable"] as Density[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setDensity(d);
                        localStorage.setItem("pref_density", d);
                        toast.success(`Density set to ${d}`);
                      }}
                      className={cn(
                        "p-2.5 rounded-lg border text-[12px] font-medium transition-all",
                        d === density
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-divider text-muted-foreground hover:border-ring/40 hover:bg-secondary"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-1">Notification Preferences</h3>
                <p className="text-[12px] text-muted-foreground mb-4">Control how you receive notifications</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center">
                      <Mail className="h-4 w-4 text-accent-foreground" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">Email notifications</p>
                      <p className="text-[11px] text-muted-foreground">Receive email alerts for new messages</p>
                    </div>
                  </div>
                  <Switch
                    checked={emailNotifs}
                    onCheckedChange={(v) => toggleNotifPref("pref_email_notifs", v, setEmailNotifs)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center">
                      <Bell className="h-4 w-4 text-accent-foreground" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">Desktop notifications</p>
                      <p className="text-[11px] text-muted-foreground">Show browser push notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={desktopNotifs}
                    onCheckedChange={(v) => toggleNotifPref("pref_desktop_notifs", v, setDesktopNotifs)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center">
                      {soundEnabled
                        ? <Bell className="h-4 w-4 text-accent-foreground" strokeWidth={1.8} />
                        : <BellOff className="h-4 w-4 text-accent-foreground" strokeWidth={1.8} />
                      }
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">Sound</p>
                      <p className="text-[11px] text-muted-foreground">Play a sound for new messages</p>
                    </div>
                  </div>
                  <Switch
                    checked={soundEnabled}
                    onCheckedChange={(v) => toggleNotifPref("pref_sound", v, setSoundEnabled)}
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "account" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-1">Profile</h3>
                <p className="text-[12px] text-muted-foreground mb-4">Manage your account information</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Email</label>
                  <div className="px-3.5 py-2.5 rounded-lg border border-input bg-secondary/50 text-[13px] text-muted-foreground">
                    {user?.email}
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Display name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-card text-[13px] text-foreground outline-none focus:border-ring focus:shadow-stripe-sm transition-all"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="compose-btn px-4 py-2 rounded-lg text-[13px] font-semibold text-primary-foreground transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>

              <Separator />

              <div>
                <h3 className="text-[13px] font-semibold text-foreground mb-1">Security</h3>
                <p className="text-[12px] text-muted-foreground mb-3">Manage your account security</p>

                <div className="flex items-center gap-3 p-3 rounded-lg border border-divider">
                  <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center">
                    <Shield className="h-4 w-4 text-accent-foreground" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-foreground">Password</p>
                    <p className="text-[11px] text-muted-foreground">Change your password</p>
                  </div>
                  <button className="text-[12px] font-medium text-primary hover:underline">
                    Update
                  </button>
                </div>
              </div>

              <Separator />

              <button
                onClick={signOut}
                className="w-full py-2.5 rounded-lg border border-destructive/30 text-[13px] font-medium text-destructive hover:bg-destructive/10 transition-all"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
