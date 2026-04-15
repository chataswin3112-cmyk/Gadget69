import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Lock, MessageCircle, Plus, Shield, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import MediaUploadField from "@/components/admin/MediaUploadField";
import { useAdminData } from "@/contexts/AdminDataContext";
import { requestPasswordOtp, changePasswordWithOtp } from "@/api/adminApi";
import { getErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const formatWhatsappNumber = (value?: string) => {
  if (!value?.trim()) {
    return "your registered WhatsApp number";
  }

  const digitsOnly = value.replace(/[^\d]/g, "");
  if (digitsOnly.length === 10) {
    return `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`;
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+91 ${digitsOnly.slice(2, 7)} ${digitsOnly.slice(7)}`;
  }
  if (value.trim().startsWith("+")) {
    return value.trim();
  }
  return digitsOnly ? `+${digitsOnly}` : value.trim();
};

const OtpPasswordChange = ({ registeredWhatsappNumber }: { registeredWhatsappNumber?: string }) => {
  const [step, setStep] = useState<"idle" | "otp-sent" | "done">("idle");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpRecipient, setOtpRecipient] = useState(formatWhatsappNumber(registeredWhatsappNumber));

  useEffect(() => {
    setOtpRecipient(formatWhatsappNumber(registeredWhatsappNumber));
  }, [registeredWhatsappNumber]);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }
    const timer = setInterval(() => setCountdown((current) => current - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRequestOtp = async () => {
    try {
      setLoading(true);
      const response = await requestPasswordOtp();
      setStep("otp-sent");
      setCountdown(300);
      setOtpRecipient(response.recipient || formatWhatsappNumber(registeredWhatsappNumber));
      toast.success(response.message);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send OTP"));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!otp.trim()) {
      toast.error("Enter the OTP");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await changePasswordWithOtp({ otp: otp.trim(), newPassword });
      setStep("done");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully!");
    } catch (error) {
      toast.error(getErrorMessage(error, "Invalid OTP or OTP expired"));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  };

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-premium">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-accent/10 p-2">
          <Shield className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold">Change Admin Password</h2>
          <p className="font-body text-sm text-muted-foreground">
            OTP will be sent to WhatsApp{" "}
            <span className="font-semibold text-foreground">
              {formatWhatsappNumber(registeredWhatsappNumber)}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs font-body">
        <div
          className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${
            step === "idle" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          <MessageCircle className="h-3 w-3" /> 1. Request OTP
        </div>
        <div className="h-px w-4 bg-border" />
        <div
          className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${
            step === "otp-sent" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          <KeyRound className="h-3 w-3" /> 2. Verify OTP
        </div>
        <div className="h-px w-4 bg-border" />
        <div
          className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${
            step === "done" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          <CheckCircle2 className="h-3 w-3" /> 3. Done
        </div>
      </div>

      {step === "idle" && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 font-body text-sm text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            {registeredWhatsappNumber?.trim()
              ? "An OTP will be sent to the saved WhatsApp number. Update and save the number below if it needs to change before requesting a code."
              : "Save a WhatsApp number in Settings first. That saved number becomes the password-reset OTP destination."}
          </div>
          <Button
            onClick={handleRequestOtp}
            disabled={loading || !registeredWhatsappNumber?.trim()}
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <MessageCircle className="h-4 w-4" />
            {loading ? "Sending OTP..." : "Send OTP to WhatsApp"}
          </Button>
        </div>
      )}

      {step === "otp-sent" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/30">
            <span className="font-body text-sm text-green-700 dark:text-green-400">
              OTP sent to WhatsApp {otpRecipient}
            </span>
            {countdown > 0 && (
              <span className="font-mono text-xs font-bold text-orange-600">
                Expires in {formatTime(countdown)}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-body font-semibold">Enter OTP</Label>
            <Input
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="font-mono text-center text-lg tracking-widest"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-body font-semibold">New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Min 6 characters"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-body font-semibold">Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter new password"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleChangePassword}
              disabled={loading}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {loading ? "Verifying..." : "Change Password"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep("idle");
                setOtp("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              Cancel
            </Button>
            {countdown === 0 && (
              <Button variant="ghost" onClick={handleRequestOtp} disabled={loading}>
                Resend OTP
              </Button>
            )}
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
            <div>
              <p className="font-semibold text-green-700 dark:text-green-400">
                Password Changed Successfully!
              </p>
              <p className="font-body text-sm text-green-600/80 dark:text-green-500/80">
                Use your new password next time you login.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setStep("idle")}>
            Change Again
          </Button>
        </div>
      )}
    </div>
  );
};

const AdminSettings = () => {
  const { settings, updateSettings } = useAdminData();
  const [form, setForm] = useState({ ...settings });
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const addAnnouncement = () => {
    if (!newAnnouncement.trim()) {
      return;
    }
    setForm((current) => ({
      ...current,
      announcementItems: [...current.announcementItems, newAnnouncement.trim()],
    }));
    setNewAnnouncement("");
  };

  const removeAnnouncement = (index: number) => {
    setForm((current) => ({
      ...current,
      announcementItems: current.announcementItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const save = async () => {
    try {
      setSaving(true);
      await updateSettings(form);
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

        <OtpPasswordChange registeredWhatsappNumber={settings.whatsappNumber} />

        <div className="space-y-6 rounded-xl bg-card p-6 shadow-premium">
          <div className="space-y-2">
            <Label className="font-body">Site Title</Label>
            <Input
              value={form.siteTitle}
              onChange={(event) => setForm((current) => ({ ...current, siteTitle: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-body">Meta Description</Label>
            <Textarea
              value={form.metaDescription || ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, metaDescription: event.target.value }))
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
              onChange={(value) => setForm((current) => ({ ...current, logoUrl: value }))}
            />
            <MediaUploadField
              label="Favicon"
              value={form.faviconUrl}
              accept="image/*"
              placeholder="Paste favicon URL or upload one"
              onChange={(value) => setForm((current) => ({ ...current, faviconUrl: value }))}
            />
          </div>

          <MediaUploadField
            label="Catalogue File or Link"
            value={form.catalogueUrl}
            accept=".pdf,image/*"
            placeholder="Paste catalogue link or upload a file"
            onChange={(value) => setForm((current) => ({ ...current, catalogueUrl: value }))}
          />

          <div className="space-y-2">
            <Label className="font-body">Footer Text</Label>
            <Textarea
              value={form.footerText || ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, footerText: event.target.value }))
              }
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label className="font-body">Announcement Items</Label>
            <div className="space-y-2">
              {form.announcementItems.map((item, index) => (
                <div key={`${item}-${index}`} className="flex items-center gap-2">
                  <span className="flex-1 rounded-md bg-muted px-3 py-2 font-body text-sm">{item}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeAnnouncement(index)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newAnnouncement}
                onChange={(event) => setNewAnnouncement(event.target.value)}
                placeholder="New announcement..."
                onKeyDown={(event) => event.key === "Enter" && addAnnouncement()}
              />
              <Button variant="outline" size="sm" onClick={addAnnouncement}>
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
                  setForm((current) => ({ ...current, instagramUrl: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Facebook URL</Label>
              <Input
                value={form.facebookUrl || ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, facebookUrl: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">WhatsApp Number</Label>
              <Input
                value={form.whatsappNumber || ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, whatsappNumber: event.target.value }))
                }
              />
              <p className="font-body text-xs text-muted-foreground">
                This saved number is also used for admin password-reset OTP delivery.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="font-body">Contact URL</Label>
              <Input
                value={form.contactUrl || ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contactUrl: event.target.value }))
                }
              />
            </div>
          </div>

          <Button
            onClick={save}
            disabled={saving}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
