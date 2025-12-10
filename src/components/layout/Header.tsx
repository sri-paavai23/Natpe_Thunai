"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, ShoppingCart, Briefcase, Activity, User, LogOut, Settings, Info, HeartHandshake, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import { toast } from "sonner";
import ContributionStoryDialog from "@/components/ContributionStoryDialog";

const Header = () => {
  const { user, userProfile, logout, isLoading } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
      setIsSheetOpen(false);
    } catch (error) {
      toast.error("Failed to log out.");
      console.error("Logout error:", error);
    }
  };

  const avatarSeed = userProfile?.firstName || "User";
  const avatarUrl = generateAvatarUrl(
    avatarSeed,
    userProfile?.avatarStyle || "lorelei",
    64 // Explicitly pass size
  );

  const navItems = [
    { name: "Home", icon: Home, path: "/home", requiresAuth: true },
    { name: "Market", icon: ShoppingCart, path: "/market", requiresAuth: true },
    { name: "Services", icon: Briefcase, path: "/services", requiresAuth: true },
    { name: "Activity", icon: Activity, path: "/activity", requiresAuth: true },
    { name: "Profile", icon: User, path: "/profile", requiresAuth: true },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-card border-b border-border shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/home" className="flex items-center gap-2 text-lg font-bold text-foreground hover:text-secondary-neon transition-colors">
          <img src="/app-logo.png" alt="NatpeThunai Logo" className="h-8 w-8" />
          Natpe🤝Thunai
        </Link>

        <nav className="hidden md:flex items-center space-x-4">
          {navItems.map((item) =>
            item.requiresAuth && !user ? null : (
              <Button key={item.name} variant="ghost" asChild className="text-foreground hover:bg-muted hover:text-secondary-neon">
                <Link to={item.path}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            )
          )}
          {userProfile?.role === "developer" && (
            <Button variant="ghost" asChild className="text-foreground hover:bg-muted hover:text-secondary-neon">
              <Link to="/developer-dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dev Dashboard
              </Link>
            </Button>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" asChild>
                <Link to="/profile">
                  <Avatar className="h-9 w-9 border-2 border-secondary-neon">
                    <AvatarImage src={avatarUrl} alt={userProfile?.firstName || "User"} />
                    <AvatarFallback>
                      <User className="h-5 w-5 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </Button>
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden text-foreground hover:bg-muted">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[250px] sm:w-[300px] bg-card text-card-foreground border-border">
                  <div className="flex flex-col items-center py-4 border-b border-border">
                    <Avatar className="h-20 w-20 border-2 border-secondary-neon mb-2">
                      <AvatarImage src={avatarUrl} alt={userProfile?.firstName || "User"} />
                      <AvatarFallback>
                        <User className="h-10 w-10 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-lg font-semibold text-foreground">{userProfile?.firstName} {userProfile?.lastName}</span>
                    <span className="text-sm text-muted-foreground">{userProfile?.collegeName}</span>
                  </div>
                  <nav className="flex flex-col gap-1 p-4">
                    {navItems.map((item) => (
                      <Button key={item.name} variant="ghost" asChild className="justify-start text-foreground hover:bg-muted hover:text-secondary-neon" onClick={() => setIsSheetOpen(false)}>
                        <Link to={item.path}>
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.name}
                        </Link>
                      </Button>
                    ))}
                    {userProfile?.role === "developer" && (
                      <Button variant="ghost" asChild className="justify-start text-foreground hover:bg-muted hover:text-secondary-neon" onClick={() => setIsSheetOpen(false)}>
                        <Link to="/developer-dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dev Dashboard
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" asChild className="justify-start text-foreground hover:bg-muted hover:text-secondary-neon" onClick={() => setIsSheetOpen(false)}>
                      <Link to="/profile/details">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </Button>
                    <Button variant="ghost" className="justify-start text-foreground hover:bg-muted hover:text-secondary-neon" onClick={() => setIsContributionDialogOpen(true)}>
                      <HeartHandshake className="mr-2 h-4 w-4" />
                      Contribute
                    </Button>
                    <Button variant="ghost" onClick={handleLogout} className="justify-start text-destructive hover:bg-destructive/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <Button asChild className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
              <Link to="/auth">Login</Link>
            </Button>
          )}
        </div>
      </div>
      <ContributionStoryDialog isOpen={isContributionDialogOpen} onClose={() => setIsContributionDialogOpen(false)} />
    </header>
  );
};

export default Header;