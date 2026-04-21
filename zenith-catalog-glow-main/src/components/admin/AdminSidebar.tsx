import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Clapperboard,
  FolderOpen,
  Gauge,
  Image,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import gadget69Logo from "@/assets/gadget69-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const gadget69Mark = "/favicon.svg";

const menuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Categories", url: "/admin/categories", icon: FolderOpen },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Offers", url: "/admin/offers", icon: Tag },
  { title: "Orders", url: "/admin/orders", icon: ShoppingBag },
  { title: "Banners", url: "/admin/banners", icon: Image },
  { title: "Media", url: "/admin/media", icon: Clapperboard },
  { title: "Speed Test", url: "/admin/speed-test", icon: Gauge },
  { title: "Reviews", url: "/admin/reviews", icon: MessageSquare },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

const AdminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin");
  };

  return (
    <Sidebar collapsible="icon" variant="floating" className="border-r-0">
      <SidebarHeader className="px-3 py-4">
        {collapsed ? (
          <div className="flex justify-center rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/60 px-2 py-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sidebar-border/60 bg-sidebar shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <img src={gadget69Mark} alt="Gadget69 logo mark" className="h-8 w-8" decoding="async" />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/45 p-3 shadow-sm">
            <div className="rounded-[1.15rem] border border-sidebar-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,240,232,0.94))] px-6 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
              <img
                src={gadget69Logo}
                alt="Gadget69 logo"
                className="h-32 w-auto max-w-full"
                decoding="async"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground">
                Admin Panel
              </span>
              <span className="inline-flex rounded-full border border-sidebar-border/70 bg-sidebar px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-primary">
                Control Room
              </span>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-1 pb-2">
        <SidebarGroup>
          {!collapsed && (
            <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/60">
              Workspace
            </p>
          )}
          <SidebarGroupContent className="pt-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="text-sidebar-foreground/90 [&>svg]:text-sidebar-foreground/72 hover:[&>svg]:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent/90 data-[active=true]:text-sidebar-accent-foreground data-[active=true]:[&>svg]:text-sidebar-primary"
                  >
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto">
        {!collapsed && (
          <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/45 p-3 text-xs text-sidebar-foreground/72">
            <div className="flex items-center gap-2 font-semibold text-sidebar-foreground">
              <ShieldCheck className="h-4 w-4 text-sidebar-primary" />
              Admin session protected
            </div>
            <p className="mt-1 leading-5">
              Changes sync against the live catalog APIs, so review updates carefully before
              publish.
            </p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-sidebar-foreground/90 [&>svg]:text-sidebar-foreground/72 hover:[&>svg]:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
