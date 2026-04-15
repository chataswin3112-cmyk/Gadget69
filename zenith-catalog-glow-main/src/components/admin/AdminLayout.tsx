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
          <div className="flex items-center gap-2">
            <img src={gadget69Logo} alt="Gadget69" className="h-8 w-auto" />
            <span className="font-heading text-sm font-bold text-foreground">Gadget69</span>
          </div>
        )}
      </div>
    </header>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <SidebarInset className="min-h-screen">
          <AdminHeader />
          <main className="flex-1 overflow-auto bg-background p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
