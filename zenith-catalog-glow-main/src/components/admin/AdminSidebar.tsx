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
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/70 px-3 py-4">
        {collapsed ? (
          <div className="flex justify-center">
            <img src={gadget69Logo} alt="Gadget69" className="h-8 w-auto" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <img src={gadget69Logo} alt="Gadget69" className="h-10 w-auto" />
            <div className="flex flex-col leading-none">
              <span className="font-heading text-xl font-bold text-foreground">Gadget69</span>
              <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Admin Panel
              </span>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="pt-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
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
