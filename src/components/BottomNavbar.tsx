"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Briefcase, Activity, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNavbar = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', icon: Home, path: '/home' },
    { name: 'Market', icon: ShoppingBag, path: '/market' },
    { name: 'Services', icon: Briefcase, path: '/services' },
    { name: 'Activity', icon: Activity, path: '/activity' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 md:hidden">
      <div className="flex justify-around h-16 items-center">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center text-xs font-medium transition-colors duration-200",
              location.pathname === item.path ? "text-secondary-neon" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 mb-1" />
            {item.name}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavbar;