"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Store, Briefcase, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility is available

const BottomNavbar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', icon: Home, path: '/home' },
    { name: 'Market', icon: Store, path: '/market' },
    { name: 'Services', icon: Briefcase, path: '/services' },
    { name: 'Profile', icon: User, path: '/profile' },
    { name: 'Chat', icon: MessageSquare, path: '/chat' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg md:hidden">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                           (item.path === '/market' && location.pathname.startsWith('/market')) ||
                           (item.path === '/services' && location.pathname.startsWith('/services')) ||
                           (item.path === '/profile' && location.pathname.startsWith('/profile'));
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center text-xs font-medium transition-colors duration-200",
                isActive ? "text-secondary-neon" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-1", isActive ? "fill-secondary-neon" : "")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavbar;