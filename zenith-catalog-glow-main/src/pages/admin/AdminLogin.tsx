import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import gadget69Logo from "@/assets/gadget69-logo.png";
import { adminLogin, resetPasswordWithSecretKey } from "@/api/adminApi";
import { getErrorMessage } from "@/lib/api-error";
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock, ShieldCheck, X } from "lucide-react";

/* ─── Forgot Password Modal ──────────────────────────── */
const ForgotPasswordModal = ({ onClose }: { onClose: () => void }) => {
  const [secretKey, setSecretKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey.trim()) {
      toast.error("Enter the secret key");
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
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-accent" />
            <h2 className="font-heading text-lg font-bold">Forgot Password</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted transition-colors">
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
                  <p className="text-sm text-green-600/80 font-body">You can now log in with your new password.</p>
                </div>
              </div>
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={onClose}>
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm font-body text-muted-foreground">
                Enter the <strong>Admin Secret Key</strong> configured in your backend
                (<code className="text-xs bg-muted px-1 py-0.5 rounded">app.admin-secret</code>) to reset your password.
              </div>

              {/* Secret Key */}
              <div className="space-y-2">
                <Label className="font-body font-semibold">Secret Key</Label>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Enter admin secret key"
                    required
                    className="pr-10 font-mono"
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label className="font-body font-semibold">New Password</Label>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    className="pr-10"
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
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

/* ─── Admin Login Page ───────────────────────────────── */
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const lockoutTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isLockedOut = lockoutRemaining > 0;

  const startLockout = () => {
    let remaining = LOCKOUT_SECONDS;
    setLockoutRemaining(remaining);
    lockoutTimer.current = setInterval(() => {
      remaining -= 1;
      setLockoutRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(lockoutTimer.current!);
        setAttemptCount(0);
      }
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;
    try {
      setLoading(true);
      const response = await adminLogin({ email, password });
      login(response.token);
      toast.success("Welcome back, Admin!");
      navigate("/admin/dashboard");
    } catch (error) {
      const newCount = attemptCount + 1;
      setAttemptCount(newCount);
      if (newCount >= MAX_LOGIN_ATTEMPTS) {
        toast.error(`Too many failed attempts. Locked out for ${LOCKOUT_SECONDS} seconds.`);
        startLockout();
      } else {
        toast.error(getErrorMessage(error, "Invalid credentials"));
        if (newCount >= 3) {
          toast.warning(`${MAX_LOGIN_ATTEMPTS - newCount} attempt(s) remaining before lockout.`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {forgotOpen && <ForgotPasswordModal onClose={() => setForgotOpen(false)} />}

      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-2">
              <img src={gadget69Logo} alt="Gadget69" className="h-14 w-auto" />
            </div>
            <p className="text-muted-foreground font-body text-sm">Admin Panel</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-premium p-8 space-y-5">
            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span className="font-body">Secured connection</span>
            </div>

            <h2 className="font-heading text-xl font-bold text-center">Sign In</h2>

            {/* Lockout warning */}
            {isLockedOut && (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <Lock className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive font-body">
                  Account locked. Try again in <strong>{lockoutRemaining}s</strong>.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-body">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gadget69.com"
                required
                disabled={isLockedOut}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-body">Password</Label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs text-accent hover:underline font-body"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  className="pr-10"
                  disabled={isLockedOut}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-heading font-semibold"
              disabled={loading || isLockedOut}
            >
              {loading ? "Signing in..." : isLockedOut ? `Locked (${lockoutRemaining}s)` : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
