import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock } from "lucide-react";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000;       // Show warning 2 minutes before logout

interface AdminSessionGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps admin panel pages and automatically logs out the admin after
 * INACTIVITY_TIMEOUT_MS of no mouse/keyboard activity.
 * Shows a warning dialog 2 minutes before auto-logout.
 */
const AdminSessionGuard: React.FC<AdminSessionGuardProps> = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doLogout = useCallback(() => {
    setShowWarning(false);
    logout();
    navigate("/admin");
  }, [logout, navigate]);

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowWarning(false);

    if (!isAuthenticated) return;

    // Schedule warning 2 min before timeout
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      let secs = WARNING_BEFORE_MS / 1000;
      setCountdown(secs);
      countdownRef.current = setInterval(() => {
        secs -= 1;
        setCountdown(secs);
        if (secs <= 0) {
          clearInterval(countdownRef.current!);
        }
      }, 1000);
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);

    // Schedule actual logout after full timeout
    timeoutRef.current = setTimeout(doLogout, INACTIVITY_TIMEOUT_MS);
  }, [isAuthenticated, doLogout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    const onActivity = () => resetTimers();

    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    resetTimers(); // Start timers on mount

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAuthenticated, resetTimers]);

  return (
    <>
      {children}

      {/* Auto-logout Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-4 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-amber-100 p-3">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <h3 className="font-heading text-lg font-bold">Session Expiring Soon</h3>
            <p className="text-sm text-muted-foreground font-body">
              You've been inactive. You'll be automatically logged out in:
            </p>
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              <span className="text-3xl font-bold font-mono text-accent">
                {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={resetTimers}
              >
                Stay Logged In
              </Button>
              <Button variant="outline" className="flex-1" onClick={doLogout}>
                Log Out Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSessionGuard;
