"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Settings, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { generateAvatarUrl } from '@/utils/avatarGenerator';

const TopNavbar = () => {
  const { user, userProfile } = useAuth();
  const displayName = user?.name || "Guest";
  const avatarUrl = generateAvatarUrl(
    displayName,
    userProfile?.gender || "prefer-not-to-say",
    userProfile?.userType || "student",
    userProfile?.avatarStyle || "lorelei"
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-card border-b border-border shadow-sm">
      <div className="container mx-auto h-16 flex items-center justify-between px-4">
        <Link to="/home" className="flex items-center space-x-2">
          <img src="/app-logo.png" alt="App Logo" className="h-8 w-8" />
          <span className="text-xl font-bold text-foreground hidden sm:block">Natpe🤝Thunai</span>
        </Link>

        <div className="flex items-center space-x-4">
          <Link to="/chat" className="text-muted-foreground hover:text-foreground transition-colors">
            <MessageSquare className="h-5 w-5" />
          </Link>
          <Link to="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="h-5 w-5" />
          </Link>
          <Link to="/profile">
            <Avatar className="h-8 w-8 border-2 border-secondary-neon">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;