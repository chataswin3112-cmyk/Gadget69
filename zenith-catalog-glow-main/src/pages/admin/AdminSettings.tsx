import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/contexts/AdminDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Shield, MessageCircle, KeyRound, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import MediaUploadField from "@/components/admin/MediaUploadField";
import { getErrorMessage } from "@/lib/api-error";
import { requestPasswordOtp, changePasswordWithOtp } from "@/api/adminApi";

// ---------- OTP Password Change Component ----------
const OtpPasswordChange = () => {
  const [step, setStep] = useState<"idle" | "otp-sent" | "done">("idle");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRequestOtp = async () => {
    try {
      setLoading(true);
      await requestPasswordOtp();
      setStep("otp-sent");
      setCountdown(300);
      toast.success("OTP sent to WhatsApp +918825602356");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send OTP"));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!otp.trim()) { toast.error("Enter the OTP"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="bg-card rounded-xl shadow-premium p-6 space-y-5 border border-border">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-accent/10">
          <Shield className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold">Change Admin Password</h2>
          <p className="text-sm text-muted-foreground font-body">
            OTP will be sent to WhatsApp{" "}
            <span className="font-semibold text-foreground">+91 88256 02356</span>
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs font-body flex-wrap">
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${step === "idle" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
          <MessageCircle className="h-3 w-3" /> 1. Request OTP
        </div>
        <div className="h-px w-4 bg-border" />
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${step === "otp-sent" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
          <KeyRound className="h-3 w-3" /> 2. Verify OTP
        </div>
        <div className="h-px w-4 bg-border" />
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${step === "done" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
          <CheckCircle2 className="h-3 w-3" /> 3. Done
        </div>
      </div>

      {/* Step 1 */}
      {step === "idle" && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground font-body">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            An OTP will be sent to your registered WhatsApp number. Enter it to verify and change password.
          </div>
          <Button
            onClick={handleRequestOtp}
            disabled={loading}
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            {loading ? "Sending OTP..." : "Send OTP to WhatsApp"}
          </Button>
        </div>
      )}

      {/* Step 2 */}
      {step === "otp-sent" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <span className="text-sm font-body text-green-700 dark:text-green-400">
              ✅ OTP sent to WhatsApp +918825602356
            </span>
            {countdown > 0 && (
              <span className="text-xs font-mono font-bold text-orange-600">
                Expires in {formatTime(countdown)}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-body font-semibold">Enter OTP</Label>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="font-mono text-lg tracking-widest text-center"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-body font-semibold">New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-body font-semibold">Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={handleChangePassword}
              disabled={loading}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {loading ? "Verifying..." : "Change Password"}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setStep("idle"); setOtp(""); setNewPassword(""); setConfirmPassword(""); }}
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

      {/* Step 3 */}
      {step === "done" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-700 dark:text-green-400">Password Changed Successfully!</p>
              <p className="text-sm text-green-600/80 dark:text-green-500/80 font-body">
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

// ---------- Main Settings ----------
const AdminSettings = () => {
  const { settings, updateSettings } = useAdminData();
  const [form, setForm] = useState({ ...settings });
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const addAnnouncement = () => {
    if (!newAnnouncement.trim()) return;
    setForm((prev) => ({
      ...prev,
      announcementItems: [...prev.announcementItems, newAnnouncement.trim()],
    }));
    setNewAnnouncement("");
  };

  const removeAnnouncement = (index: number) => {
    setForm((prev) => ({
      ...prev,
      announcementItems: prev.announcementItems.filter((_, itemIndex) => itemIndex !== index),
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
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="font-heading text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">Store configuration</p>
        </div>

        {/* 🔐 Security Section */}
        <OtpPasswordChange />

        {/* Store Config */}
        <div className="bg-card rounded-xl shadow-premium p-6 space-y-6">
          <div className="space-y-2">
            <Label className="font-body">Site Title</Label>
            <Input value={form.siteTitle} onChange={(event) => setForm((prev) => ({ ...prev, siteTitle: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label className="font-body">Meta Description</Label>
            <Textarea value={form.metaDescription || ""} onChange={(event) => setForm((prev) => ({ ...prev, metaDescription: event.target.value }))} rows={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MediaUploadField
              label="Logo"
              value={form.logoUrl}
              accept="image/*"
              placeholder="Paste logo URL or upload one"
              onChange={(value) => setForm((prev) => ({ ...prev, logoUrl: value }))}
            />
            <MediaUploadField
              label="Favicon"
              value={form.faviconUrl}
              accept="image/*"
              placeholder="Paste favicon URL or upload one"
              onChange={(value) => setForm((prev) => ({ ...prev, faviconUrl: value }))}
            />
          </div>

          <MediaUploadField
            label="Catalogue File or Link"
            value={form.catalogueUrl}
            accept=".pdf,image/*"
            placeholder="Paste catalogue link or upload a file"
            onChange={(value) => setForm((prev) => ({ ...prev, catalogueUrl: value }))}
          />

          <div className="space-y-2">
            <Label className="font-body">Footer Text</Label>
            <Textarea value={form.footerText || ""} onChange={(event) => setForm((prev) => ({ ...prev, footerText: event.target.value }))} rows={3} />
          </div>

          <div className="space-y-3">
            <Label className="font-body">Announcement Items</Label>
            <div className="space-y-2">
              {form.announcementItems.map((item, index) => (
                <div key={`${item}-${index}`} className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-body bg-muted px-3 py-2 rounded-md">{item}</span>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-body">Instagram URL</Label>
              <Input value={form.instagramUrl || ""} onChange={(event) => setForm((prev) => ({ ...prev, instagramUrl: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Facebook URL</Label>
              <Input value={form.facebookUrl || ""} onChange={(event) => setForm((prev) => ({ ...prev, facebookUrl: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="font-body">WhatsApp Number</Label>
              <Input value={form.whatsappNumber || ""} onChange={(event) => setForm((prev) => ({ ...prev, whatsappNumber: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Contact URL</Label>
              <Input value={form.contactUrl || ""} onChange={(event) => setForm((prev) => ({ ...prev, contactUrl: event.target.value }))} />
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
