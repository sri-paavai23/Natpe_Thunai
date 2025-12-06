"use client";

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, ShoppingCart, Bell, User, Menu, X, Search, PlusCircle, MessageSquareText, DollarSign, Gamepad2, Utensils, Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { generateAvatarUrl } from "@/lib/utils"; // Assuming this utility exists

const Header = () => {
  const { user, userProfile, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    setIsSheetOpen(false);
    navigate("/auth");
  };

  const displayName = userProfile?.firstName && userProfile?.lastName 
    ? `${userProfile.firstName} ${userProfile.lastName}` 
    : user?.name || "Guest";

  const avatarUrl = userProfile?.profilePictureUrl || generateAvatarUrl(
    displayName,
    userProfile?.gender || "prefer-not-to-say", // Fixed: Use existing gender or default
    userProfile?.userType || "student" // Fixed: Use existing userType or default
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-primary-blue-dark text-primary-foreground shadow-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Home Link */}
        <Link to="/home" className="flex items-center gap-2 text-lg font-bold hover:text-secondary-neon transition-colors">
          <img src="/logo.png" alt="Natpe Thunai Logo" className="h-8 w-8" />
          <span className="hidden sm:inline">Natpe🤝Thunai</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/market" className="hover:text-secondary-neon transition-colors flex items-center gap-1">
            <ShoppingCart className="h-5 w-5" /> Market
          </Link>
          <Link to="/services" className="hover:text-secondary-neon transition-colors flex items-center gap-1">
            <Wrench className="h-5 w-5" /> Services
          </Link>
          <Link to="/food" className="hover:text-secondary-neon transition-colors flex items-center gap-1">
            <Utensils className="h-5 w-5" /> Food
          </Link>
          <Link to="/activity" className="hover:text-secondary-neon transition-colors flex items-center gap-1">
            <Bell className="h-5 w-5" /> Buzz
          </Link>
          <Link to="/profile" className="hover:text-secondary-neon transition-colors flex items-center gap-1">
            <User className="h-5 w-5" /> Profile
          </Link>
        </nav>

        {/* Mobile Menu / User Avatar */}
        <div className="flex items-center gap-4">
          {/* Search Button (Mobile Only) */}
          <Button variant="ghost" size="icon" className="md:hidden text-primary-foreground hover:bg-primary-blue-light hover:text-secondary-neon">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Mobile Sheet Trigger */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-blue-light hover:text-secondary-neon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-card text-card-foreground p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <Link to="/profile" className="flex items-center gap-3" onClick={() => setIsSheetOpen(false)}>
                    <Avatar className="h-10 w-10 border-2 border-secondary-neon">
                      <AvatarImage src={avatarUrl} alt={displayName} />
                      <AvatarFallback className="bg-secondary-neon text-primary-foreground">{displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-lg font-semibold text-foreground">{displayName}</span>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)} className="text-muted-foreground hover:bg-muted">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close menu</span>
                  </Button>
                </div>
                <nav className="flex-1 flex flex-col p-4 space-y-2">
                  <Link to="/home" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors" onClick={() => setIsSheetOpen(false)}>
                    <Home className="h-5 w-5 text-secondary-neon" /> Home
                  </Link>
                  <Link to="/market" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors" onClick={() => setIsSheetOpen(false)}>
                    <ShoppingCart className="h-5 w-5 text-secondary-neon" /> Market
                  </Link>
                  <Link to="/services" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors" onClick={() => setIsSheetOpen(false)}>
                    <Wrench className="h-5 w-5 text-secondary-neon" /> Services
                  </Link>
                  <Link to="/food" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors" onClick={() => setIsSheetOpen(false)}>
                    <Utensils className="h-5 w-5 text-secondary-neon" /> Food
                  </Link>
                  <Link to="/activity" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors" onClick={() => setIsSheetOpen(false)}>
                    <Bell className="h-5 w-5 text-secondary-neon" /> Buzz
                  </Link>
                  <Link to="/profile" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors" onClick={() => setIsSheetOpen(false)}>
                    <User className="h-5 w-5 text-secondary-neon" /> Profile
                  </Link>
                  <Separator className="my-2" />
                  <Link to="/market/create" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors" onClick={() => setIsSheetOpen(false)}>
                    <PlusCircle className="h-5 w-5 text-secondary-neon" /> Create Listing
                  </Link>
                  <Link to="/profile/developer-chat" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors" onClick={() => setIsSheetOpen(false)}>
                    <MessageSquareText className="h-5 w-5 text-secondary-neon" /> Dev Chat
                  </Link>
                  <Link to="/wallet" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors" onClick={() => setIsSheetOpen(false)}>
                    <DollarSign className="h-5 w-5 text-secondary-neon" /> Wallet
                  </Link>
                  <Link to="/tournaments" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors" onClick={() => setIsSheetOpen(false)}>
                    <Gamepad2 className="h-5 w-5 text-secondary-neon" /> Tournaments
                  </Link>
                  <Link to="/activity/tracking" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors" onClick={() => setIsSheetOpen(false)}>
                    <Package className="h-5 w-5 text-secondary-neon" /> Tracking
                  </Link>
                  <Link to="/activity/cash-exchange" className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors" onClick={() => setIsSheetOpen(false)}>
                    <Users className="h-5 w-5 text-secondary-neon" /> Cash Exchange
                  </Link>
                </nav>
                <div className="p-4 border-t border-border">
                  {user ? (
                    <Button onClick={handleLogout} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Logout
                    </Button>
                  ) : (
                    <Button onClick={() => navigate("/auth")} className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                      Login / Register
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;