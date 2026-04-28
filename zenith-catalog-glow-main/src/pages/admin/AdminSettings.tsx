import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock, Plus, Shield, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import MediaUploadField from "@/components/admin/MediaUploadField";
import { useAdminData } from "@/contexts/AdminDataContext";
import { changePassword } from "@/api/adminApi";
import { getErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ADMIN_PASSWORD_HINT,
  ADMIN_PASSWORD_PLACEHOLDER,
  checkAdminPasswordStrength,
} from "@/lib/admin-password";

/* ─── Password Strength Helper ────────────────────────── */
const STRENGTH_LABELS = ["", "Very Weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
const STRENGTH_TEXT = ["", "text-red-500", "text-orange-500", "text-yellow-500", "text-blue-500", "text-green-500"];

const normalizeOptionalAssetUrl = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed && !trimmed.startsWith("#") ? trimmed : undefined;
};

const PasswordStrengthMeter = ({ password }: { password: string }) => {
  if (!password) return null;
  const { checks, score } = checkAdminPasswordStrength(password);
  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i <= score ? STRENGTH_COLORS[score] : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-body font-semibold ${STRENGTH_TEXT[score]}`}>
        {STRENGTH_LABELS[score]}
      </p>
      {/* Requirements checklist */}
      <div className="grid grid-cols-1 gap-1 text-xs font-body text-muted-foreground sm:grid-cols-2">
        {([
          [checks.length, "8+ characters"],
          [checks.uppercase, "Uppercase letter"],
          [checks.lowercase, "Lowercase letter"],
          [checks.number, "Number (0-9)"],
          [checks.special, "Special char (@!#...)"],
        ] as [boolean, string][]).map(([ok, label]) => (
          <span key={label} className={ok ? "text-green-600" : ""}>
            {ok ? "✓" : "○"} {label}
          </span>
        ))}
      </div>
    </div>
  );
};

const ChangePasswordForm = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { score } = checkAdminPasswordStrength(newPassword);
  const isPasswordStrong = score === 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim()) {
      toast.error("Enter your current password");
      return;
    }
    if (!isPasswordStrong) {
      toast.error("Password does not meet security requirements");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      setLoading(true);
      await changePassword({ currentPassword: oldPassword, newPassword });
      setDone(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully! Please log in again.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Current password is incorrect"));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-premium">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-2">
            <Shield className="h-5 w-5 text-accent" />
          </div>
          <h2 className="font-heading text-lg font-bold">Change Admin Password</h2>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
          <div>
            <p className="font-semibold text-green-700 dark:text-green-400">Password Changed Successfully!</p>
            <p className="font-body text-sm text-green-600/80 dark:text-green-500/80">
              Your previous sessions have been invalidated. Use your new password next time you log in.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setDone(false)} className="w-full sm:w-auto">Change Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-premium">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-accent/10 p-2">
          <Shield className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold">Change Admin Password</h2>
          <p className="font-body text-sm text-muted-foreground">
            Enter your current password to set a new one.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current password */}
        <div className="space-y-2">
          <Label className="font-body font-semibold">Current Password</Label>
          <div className="relative">
            <Input
              type={showOld ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Your current password"
              required
              className="pr-10"
            />
            <button type="button" tabIndex={-1}
              aria-label={showOld ? "Hide current password" : "Show current password"}
              onClick={() => setShowOld((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="space-y-2">
          <Label className="font-body font-semibold">New Password</Label>
          <div className="relative">
            <Input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={ADMIN_PASSWORD_PLACEHOLDER}
              required
              className="pr-10"
            />
            <button type="button" tabIndex={-1}
              aria-label={showNew ? "Hide new password" : "Show new password"}
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs font-body text-muted-foreground">{ADMIN_PASSWORD_HINT}</p>
          {/* Live strength meter */}
          <PasswordStrengthMeter password={newPassword} />
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <Label className="font-body font-semibold">Confirm New Password</Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            required
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-destructive font-body">Passwords do not match</p>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 font-body text-sm text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0" />
          <span>Changing your password will log out all existing sessions.</span>
        </div>

        <Button
          type="submit"
          disabled={loading || !isPasswordStrong || (!!confirmPassword && newPassword !== confirmPassword)}
          className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto"
        >
          <KeyRound className="h-4 w-4" />
          {loading ? "Changing..." : "Change Password"}
        </Button>
      </form>
    </div>
  );
};

const AdminSettings = () => {
  const { settings, updateSettings, ensureSettingsLoaded } = useAdminData();
  const [form, setForm] = useState({ ...settings });
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    void ensureSettingsLoaded();
  }, [ensureSettingsLoaded]);

  useEffect(() => {
    if (!isDirty) {
      setForm({ ...settings });
    }
  }, [isDirty, settings]);

  const updateForm = (updater: (current: typeof form) => typeof form) => {
    setIsDirty(true);
    setForm(updater);
  };

  const addAnnouncement = () => {
    if (!newAnnouncement.trim()) {
      return;
    }
    updateForm((current) => ({
      ...current,
      announcementItems: [...current.announcementItems, newAnnouncement.trim()],
    }));
    setNewAnnouncement("");
  };

  const removeAnnouncement = (index: number) => {
    updateForm((current) => ({
      ...current,
      announcementItems: current.announcementItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const save = async () => {
    try {
      setSaving(true);
      const updated = await updateSettings({
        ...form,
        logoUrl: normalizeOptionalAssetUrl(form.logoUrl),
        faviconUrl: normalizeOptionalAssetUrl(form.faviconUrl),
        catalogueUrl: normalizeOptionalAssetUrl(form.catalogueUrl),
        announcementItems: form.announcementItems
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setForm({ ...updated });
      setIsDirty(false);
      toast.success("Settings saved");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save settings"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Settings</h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">Store configuration</p>
        </div>

        <ChangePasswordForm />

        <div className="space-y-6 rounded-xl bg-card p-4 shadow-premium sm:p-6">
          <div className="space-y-2">
            <Label className="font-body">Site Title</Label>
            <Input
              value={form.siteTitle}
              onChange={(event) => updateForm((current) => ({ ...current, siteTitle: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-body">Meta Description</Label>
            <Textarea
              value={form.metaDescription || ""}
              onChange={(event) =>
                updateForm((current) => ({ ...current, metaDescription: event.target.value }))
              }
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <MediaUploadField
              label="Logo"
              value={form.logoUrl}
              accept="image/*"
              placeholder="Paste logo URL or upload one"
              uploadTarget="SETTINGS"
              onChange={(value) => updateForm((current) => ({ ...current, logoUrl: value }))}
            />
            <MediaUploadField
              label="Favicon"
              value={form.faviconUrl}
              accept="image/*"
              placeholder="Paste favicon URL or upload one"
              uploadTarget="SETTINGS"
              onChange={(value) => updateForm((current) => ({ ...current, faviconUrl: value }))}
            />
          </div>

          <MediaUploadField
            label="Catalogue File or Link"
            value={form.catalogueUrl}
            accept=".pdf,image/*"
            placeholder="Paste catalogue link or upload a file"
            uploadTarget="SETTINGS"
            onChange={(value) => updateForm((current) => ({ ...current, catalogueUrl: value }))}
          />

          <div className="space-y-2">
            <Label className="font-body">Footer Text</Label>
            <Textarea
              value={form.footerText || ""}
              onChange={(event) =>
                updateForm((current) => ({ ...current, footerText: event.target.value }))
              }
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label className="font-body">Announcement Items</Label>
            <div className="space-y-2">
              {form.announcementItems.map((item, index) => (
                <div key={`${item}-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="flex-1 rounded-md bg-muted px-3 py-2 font-body text-sm">{item}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove announcement ${index + 1}`}
                    onClick={() => removeAnnouncement(index)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={newAnnouncement}
                onChange={(event) => setNewAnnouncement(event.target.value)}
                placeholder="New announcement..."
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addAnnouncement();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Add announcement"
                onClick={addAnnouncement}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-body">Instagram URL</Label>
              <Input
                value={form.instagramUrl || ""}
                onChange={(event) =>
                  updateForm((current) => ({ ...current, instagramUrl: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">WhatsApp Number</Label>
              <Input
                value={form.whatsappNumber || ""}
                onChange={(event) =>
                  updateForm((current) => ({ ...current, whatsappNumber: event.target.value }))
                }
              />
              <p className="font-body text-xs text-muted-foreground">
                This saved number is also used for admin password-reset OTP delivery.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="font-body">Shop Phone</Label>
              <Input
                value={form.shopPhone || ""}
                onChange={(event) =>
                  updateForm((current) => ({ ...current, shopPhone: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Support Email</Label>
              <Input
                value={form.supportEmail || ""}
                onChange={(event) =>
                  updateForm((current) => ({ ...current, supportEmail: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Contact URL</Label>
              <Input
                value={form.contactUrl || ""}
                onChange={(event) =>
                  updateForm((current) => ({ ...current, contactUrl: event.target.value }))
                }
              />
            </div>
          </div>

          <Button
            onClick={save}
            disabled={saving}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
