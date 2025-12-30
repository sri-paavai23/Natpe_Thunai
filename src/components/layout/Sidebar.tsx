"use client";

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  ShoppingCart,
  Utensils,
  DollarSign,
  Briefcase,
  Bike,
  Users,
  Trophy,
  MessageSquare,
  UserPlus,
  Flag,
  Building2,
  Search,
  LayoutDashboard, // New icon for Merchant Dashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";

interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  currentPath: string;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon: Icon, label, currentPath }) => {
  const isActive = currentPath === to;
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-muted text-primary"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { currentUser, userProfile } = useAuth(); // Use currentUser and userProfile from AuthContext

  const isMerchant = userProfile?.userType === 'merchant';

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-sidebar sm:flex">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
          <img src="/app-logo.png" alt="Natpe Thunai Logo" className="h-6 w-6" />
          <span className="">Natpe Thunai</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          <NavLink to="/" icon={Home} label="Dashboard" currentPath={currentPath} />
          <NavLink to="/exchange" icon={ShoppingCart} label="Exchange" currentPath={currentPath} />
          <NavLink to="/food-and-wellness" icon={Utensils} label="Food & Wellness" currentPath={currentPath} />
          <NavLink to="/canteen" icon={Utensils} label="Canteen" currentPath={currentPath} />
          <NavLink to="/cash-exchange" icon={DollarSign} label="Cash Exchange" currentPath={currentPath} />
          <NavLink to="/services" icon={Briefcase} label="Services" currentPath={currentPath} />
          <NavLink to="/errands" icon={Bike} label="Errands" currentPath={currentPath} />
          <NavLink to="/collaborators" icon={Users} label="Collaborators" currentPath={currentPath} />
          <NavLink to="/tournaments" icon={Trophy} label="Tournaments" currentPath={currentPath} />
          <NavLink to="/developer-messages" icon={MessageSquare} label="Developer Messages" currentPath={currentPath} />
          <NavLink to="/ambassador-applications" icon={UserPlus} label="Ambassador Applications" currentPath={currentPath} />
          <NavLink to="/reports" icon={Flag} label="Reports" currentPath={currentPath} />
          <NavLink to="/missing-colleges" icon={Building2} label="Missing Colleges" currentPath={currentPath} />
          <NavLink to="/lost-and-found" icon={Search} label="Lost & Found" currentPath={currentPath} />
          
          {isMerchant && (
            <>
              <Separator className="my-4" />
              <NavLink to="/merchant/dashboard" icon={LayoutDashboard} label="Merchant Dashboard" currentPath={currentPath} />
            </>
          )}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4 border-t">
        <Button variant="secondary" className="w-full">
          Settings
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;