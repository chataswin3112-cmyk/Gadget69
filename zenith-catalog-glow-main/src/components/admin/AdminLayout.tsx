import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import gadget69Logo from "@/assets/gadget69-logo.png";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4">
            <SidebarTrigger className="mr-4" />
            <div className="ml-auto flex items-center gap-3">
              <img src={gadget69Logo} alt="Gadget69" className="h-9 w-auto" />
              <div className="text-right leading-none">
                <p className="font-heading text-lg font-bold text-foreground sm:text-xl">Gadget69</p>
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Admin Panel
                </span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 bg-background overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
