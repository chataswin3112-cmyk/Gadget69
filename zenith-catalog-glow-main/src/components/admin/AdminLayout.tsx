import { ShieldCheck } from "lucide-react";
import gadget69Logo from "@/assets/gadget69-logo.png";
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import AdminSidebar from "./AdminSidebar";

const AdminHeader = () => {
  const { isMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="h-9 w-9 rounded-full border border-border/70 bg-background shadow-sm" />
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-bold text-foreground sm:text-lg">
            Admin Workspace
          </p>
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Catalog control center
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          Secure admin access
        </div>
        {isMobile && (
          <div className="flex items-center rounded-full border border-border/70 bg-background/90 px-3 py-1.5 shadow-sm">
            <img
              src={gadget69Logo}
              alt="Gadget69 logo"
              className="h-8 w-auto max-w-[9rem]"
              width={1024}
              height={1024}
              decoding="async"
            />
          </div>
        )}
      </div>
    </header>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--secondary)/0.24))]">
        <AdminSidebar />
        <SidebarInset className="min-h-screen min-w-0 bg-transparent">
          <AdminHeader />
          <main className="relative flex-1 min-w-0 overflow-auto">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_62%)]" />
            <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] min-w-0 w-full max-w-[1600px] flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
