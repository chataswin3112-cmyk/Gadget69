import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import gadget69Logo from "@/assets/gadget69-logo.png";
import { adminLogin } from "@/api/adminApi";
import { getErrorMessage } from "@/lib/api-error";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await adminLogin({ email, password });
      login(response.token);
      toast.success("Welcome back, Admin!");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(getErrorMessage(error, "Invalid credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <img src={gadget69Logo} alt="Gadget69" className="h-14 w-auto" />
          </div>
          <p className="text-muted-foreground font-body text-sm">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-premium p-8 space-y-5">
          <h2 className="font-heading text-xl font-bold text-center">Sign In</h2>
          <div className="space-y-2">
            <Label htmlFor="email" className="font-body">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gadget69.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-body">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-heading font-semibold"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          <p className="text-xs text-center text-muted-foreground font-body">
            Default admin: admin@gadget69.com / admin123
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
