import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  ShoppingCart,
  Briefcase,
  Users,
  Utensils,
  MessageSquare,
  Trophy,
  Handshake,
  DollarSign,
  PackageSearch,
  ShieldAlert,
  GraduationCap,
  UserCog,
  Building2,
  BellRing,
  PlusCircle,
  QrCode,
  Info,
  Mail,
  BookOpen,
  ClipboardList,
  MapPin,
  Calendar,
  Clock,
  ListTodo,
  Megaphone,
  Lightbulb,
  Heart,
  Gift,
  Wallet,
  Banknote,
  Coins,
  Receipt,
  History,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { toast } from "sonner";

interface SidebarLink {
  title: string;
  href: string;
  icon: React.ElementType;
  roles?: ('user' | 'developer' | 'staff' | 'merchant' | 'ambassador')[];
  userTypes?: ('student' | 'staff' | 'merchant' | 'ambassador')[];
}

const mainLinks: SidebarLink[] = [
  { title: "Home", href: "/", icon: Home },
  { title: "Marketplace", href: "/market", icon: ShoppingCart },
  { title: "Freelance", href: "/freelance", icon: Briefcase },
  { title: "Short-Term Needs", href: "/errands", icon: ListTodo },
  { title: "Collaborators", href: "/collaborators", icon: Users },
  { title: "Food & Wellness", href: "/food-wellness", icon: Utensils },
  { title: "Cash Exchange", href: "/cash-exchange", icon: Banknote },
  { title: "Tournaments", href: "/tournaments", icon: Trophy },
  { title: "Lost & Found", href: "/lost-found", icon: PackageSearch },
  { title: "Ambassador Program", href: "/ambassador", icon: Megaphone },
  { title: "Tracking", href: "/tracking", icon: History },
  { title: "Profile", href: "/profile", icon: UserIcon },
];

const developerLinks: SidebarLink[] = [
  { title: "Developer Dashboard", href: "/developer-dashboard", icon: UserCog, roles: ['developer'] },
  { title: "Canteen Management", href: "/canteen-management", icon: Building2, roles: ['developer', 'staff'] },
  { title: "Reports", href: "/reports", icon: ShieldAlert, roles: ['developer'] },
  { title: "Developer Chat", href: "/developer-chat", icon: MessageSquare, roles: ['developer'] },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, userProfile, loading } = useAuth(); // Corrected 'currentUser' to 'user' and 'loading'

  const filteredLinks = [...mainLinks, ...developerLinks].filter(link => {
    if (!link.roles && !link.userTypes) return true; // Link visible to all if no specific roles/userTypes
    if (!userProfile) return false; // Hide if no user profile

    const hasRole = link.roles ? link.roles.includes(userProfile.role) : true;
    const hasUserType = link.userTypes ? link.userTypes.includes(userProfile.userType) : true;

    return hasRole && hasUserType;
  });

  return (
    <div className="hidden md:flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground">
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg text-sidebar-primary">
          <img src="/app-logo.png" alt="Natpe Thunai Logo" className="h-8 w-8" />
          Natpe🤝Thunai
        </Link>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {filteredLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-sidebar-primary",
                currentPath === link.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.title}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4 border-t border-sidebar-border">
        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-sidebar-primary" />
          </div>
        ) : user ? (
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:text-sidebar-primary" asChild>
            <Link to="/auth">
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Link>
          </Button>
        ) : (
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:text-sidebar-primary" asChild>
            <Link to="/auth">
              <LogIn className="h-4 w-4 mr-2" /> Login
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;