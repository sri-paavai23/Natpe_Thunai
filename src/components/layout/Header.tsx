"use client";

import React from "react";
import { useLocation, Link } from "react-router-dom"; // Import Link
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { generateAvatarUrl } from "@/utils/avatarGenerator"; // Import new avatar generator

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case "/home":
      return "The Hub";
    case "/market":
      return "The Exchange";
    case "/services":
      return "The Grind";
    case "/activity":
      return "The Buzz";
    case "/profile":
      return "My Zone";
    case "/tournaments":
      return "Esports Arena";
    case "/activity/tracking":
      return "Tracking";
    case "/activity/cash-exchange":
      return "Cash Exchange";
    case "/profile/details":
      return "User Profile";
    case "/profile/wallet":
      return "Wallet & Payments";
    case "/profile/policies":
      return "Policies";
    case "/services/freelance":
      return "Freelance Section";
    case "/services/errands":
      return "Errands";
    case "/services/short-term":
      return "Short-Term Needs";
    case "/services/food-wellness":
      return "Food & Wellness";
    case "/services/ticket-booking":
      return "Ticket Booking";
    case "/services/collaborators":
      return "Project Collaborator Tab";
    case "/services/post-job":
      return "Post a Job/Service";
    default:
      return "Natpe Thunai"; // Default title if no specific route matches
  }
};

const Header = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const { user, userProfile } = useAuth();

  // Use the public username (user.name) for display
  const displayName = user?.name || "Guest";
  
  const avatarUrl = generateAvatarUrl(
    displayName,
    userProfile?.gender || "prefer-not-to-say",
    userProfile?.userType || "student"
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-primary text-primary-foreground border-b border-border-dark p-4 flex items-center justify-between md:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <Link to="/home" className="flex items-center gap-2 text-primary-foreground hover:text-secondary-neon transition-colors">
          <img src="/app-logo.png" alt="Logo" className="h-7 w-7 rounded-full object-cover" />
          <span className="font-bold text-xl">Natpe Thunai</span>
        </Link>
        {/* Only show the dynamic page title if it's not the home page */}
        {location.pathname !== "/home" && (
          <h2 className="text-2xl font-bold ml-4 hidden sm:block text-foreground">{title}</h2>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <Link to="/profile" className="cursor-pointer"> {/* Added Link for redirection */}
          <Avatar className="h-9 w-9 border-2 border-secondary-neon">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary-blue-light text-primary-foreground">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
};

export default Header;