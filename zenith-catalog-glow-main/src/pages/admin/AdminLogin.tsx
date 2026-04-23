import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import gadget69Wordmark from "@/assets/gadget69-navbar-wordmark.png";
import { adminLogin } from "@/api/adminApi";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ForgotPasswordModal = lazy(() => import("@/components/admin/ForgotPasswordModal"));

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
  const [errorMsg, setErrorMsg] = useState("");
  const lockoutTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isLockedOut = lockoutRemaining > 0;

  const startLockout = () => {
    if (lockoutTimer.current) {
      clearInterval(lockoutTimer.current);
    }

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

  useEffect(() => {
    return () => {
      if (lockoutTimer.current) {
        clearInterval(lockoutTimer.current);
      }
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (isLockedOut) {
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const response = await adminLogin({ email: email.trim(), password });
      login(response.token);
      toast.success("Welcome back, Admin!");
      navigate("/admin/dashboard");
    } catch (error: unknown) {
      setLoading(false);

      const isNetworkError =
        !((error as { response?: unknown }).response) &&
        ((error as { code?: string }).code === "ERR_NETWORK" ||
          (error as { code?: string }).code === "ECONNREFUSED" ||
          (error as { message?: string }).message?.includes("Network Error") ||
          (error as { message?: string }).message?.includes("ENOBUFS"));

      if (isNetworkError) {
        const message = "Cannot connect to server. Please make sure the backend is running.";
        setErrorMsg(message);
        toast.error(message);
        return;
      }

      const nextCount = attemptCount + 1;
      setAttemptCount(nextCount);

      if (nextCount >= MAX_LOGIN_ATTEMPTS) {
        const message = `Too many failed attempts. Locked out for ${LOCKOUT_SECONDS} seconds.`;
        setErrorMsg(message);
        toast.error(message);
        startLockout();
      } else {
        const message = getErrorMessage(error, "Invalid credentials");
        setErrorMsg(message);
        toast.error(message);

        if (nextCount >= 3) {
          toast.warning(`${MAX_LOGIN_ATTEMPTS - nextCount} attempt(s) remaining before lockout.`);
        }
      }
    }
  };

  return (
    <>
      {forgotOpen ? (
        <Suspense fallback={null}>
          <ForgotPasswordModal onClose={() => setForgotOpen(false)} />
        </Suspense>
      ) : null}

      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center">
              <img
                src={gadget69Wordmark}
                alt="Gadget69"
                className="h-32 w-32 max-w-full object-contain"
                width={1024}
                height={1024}
                decoding="async"
                {...{ fetchpriority: "high" }}
              />
            </div>
            <p className="text-sm text-muted-foreground font-body">Admin Panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-card p-8 shadow-premium">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span className="font-body">Secured connection</span>
            </div>

            <h2 className="text-center font-heading text-xl font-bold">Sign In</h2>

            {isLockedOut ? (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <Lock className="h-5 w-5 shrink-0 text-destructive" />
                <p className="text-sm text-destructive font-body">
                  Account locked. Try again in <strong>{lockoutRemaining}s</strong>.
                </p>
              </div>
            ) : null}

            {!isLockedOut && errorMsg ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive font-body">
                {errorMsg}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-body">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@gadget69.com"
                required
                disabled={isLockedOut}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-body">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs text-accent font-body hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  required
                  className="pr-10"
                  disabled={isLockedOut}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-accent font-heading font-semibold text-accent-foreground hover:bg-accent/90"
              disabled={loading || isLockedOut}
            >
              {loading ? "Signing in..." : isLockedOut ? `Locked (${lockoutRemaining}s)` : "Sign In"}
            </Button>

            <p className="text-center text-xs text-muted-foreground font-body">
              Seeded default credentials apply only on the first backend start. If the password
              changed later, use the latest one or reset it with the admin secret key.
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
