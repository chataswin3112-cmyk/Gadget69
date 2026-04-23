import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CheckCircle2, Eye, EyeOff, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordWithSecretKey } from "@/api/adminApi";
import { getErrorMessage } from "@/lib/api-error";
import {
  ADMIN_PASSWORD_HINT,
  ADMIN_PASSWORD_PLACEHOLDER,
  isStrongAdminPassword,
} from "@/lib/admin-password";

const ForgotPasswordModal = ({ onClose }: { onClose: () => void }) => {
  const [secretKey, setSecretKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!secretKey.trim()) {
      toast.error("Enter the secret key");
      return;
    }

    if (!isStrongAdminPassword(newPassword)) {
      toast.error(ADMIN_PASSWORD_HINT);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await resetPasswordWithSecretKey({ secretKey: secretKey.trim(), newPassword });
      setDone(true);
      toast.success("Password reset successfully!");
    } catch (error) {
      toast.error(getErrorMessage(error, "Invalid secret key"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-accent" />
            <h2 className="font-heading text-lg font-bold">Forgot Password</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 transition-colors hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {done ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
                <div>
                  <p className="font-semibold text-green-700">Password Reset Successfully!</p>
                  <p className="font-body text-sm text-green-600/80">
                    You can now log in with your new password.
                  </p>
                </div>
              </div>
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={onClose}
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm font-body text-muted-foreground">
                Enter the <strong>Admin Secret Key</strong> configured in your backend
                (<code className="rounded bg-muted px-1 py-0.5 text-xs">app.admin-secret</code>) to
                reset your password.
              </div>

              <div className="space-y-2">
                <Label className="font-body font-semibold">Secret Key</Label>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={secretKey}
                    onChange={(event) => setSecretKey(event.target.value)}
                    placeholder="Enter admin secret key"
                    required
                    className="font-mono pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowKey((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-body font-semibold">New Password</Label>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder={ADMIN_PASSWORD_PLACEHOLDER}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPwd((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs font-body text-muted-foreground">{ADMIN_PASSWORD_HINT}</p>
              </div>

              <div className="space-y-2">
                <Label className="font-body font-semibold">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
                {confirmPassword && newPassword !== confirmPassword ? (
                  <p className="text-xs text-destructive font-body">Passwords do not match</p>
                ) : null}
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading || (!!confirmPassword && newPassword !== confirmPassword)}
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
