"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Handshake, Activity, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "The Hub", icon: Home, path: "/home" },
  { name: "The Exchange", icon: ShoppingBag, path: "/market" },
  { name: "The Grind", icon: Handshake, path: "/services" },
  { name: "Activity", icon: Activity, path: "/activity" },
  { name: "My Zone", icon: User, path: "/profile" },
];

const BottomNavbar = () => {
  const location = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-primary text-primary-foreground shadow-lg border-t border-border-dark md:hidden">
      <div className="flex justify-around h-16 items-center">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-full w-full text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors duration-200",
              location.pathname === item.path && "text-secondary-neon font-bold bg-primary-foreground/10"
            )}
          >
            <item.icon className={cn("h-5 w-5", location.pathname === item.path && "text-secondary-neon")} />
            <span className="text-xs">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavbar;