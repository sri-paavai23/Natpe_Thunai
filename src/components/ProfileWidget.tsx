"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { User, Zap, Crown, TrendingUp, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import { calculateCommissionRate, formatCommissionRate } from "@/utils/commission";
import { getLevelBadge } from "@/utils/badges";
import { Badge } from "@/components/ui/badge";

const ProfileWidget = () => {
  const { user, userProfile } = useAuth();

  const displayName = user?.name || "CampusExplorer";
  
  const userLevel = userProfile?.level ?? 1;
  const currentXp = userProfile?.currentXp ?? 0;
  const maxXp = userProfile?.maxXp ?? 100;
  const xpPercentage = Math.min(100, (currentXp / maxXp) * 100);
  
  const commissionRate = calculateCommissionRate(userLevel);
  const userBadge = getLevelBadge(userLevel);

  const avatarUrl = generateAvatarUrl(
    displayName,
    userProfile?.gender || "prefer-not-to-say",
    userProfile?.userType || "student",
    userProfile?.avatarStyle || "lorelei"
  );

  // Compact, punchy one-liners based on level range
  const getShortMotivationalQuote = () => {
    if (userProfile?.userType !== "student") return "Welcome, Developer. Build the future.";
    
    if (userLevel >= 25) return "Legend Status Achieved. Maximum perks unlocked.";
    if (userLevel >= 20) return "Endgame approaching. Finish strong!";
    if (userLevel >= 15) return "Elite tier. Your reputation precedes you.";
    if (userLevel >= 10) return "Rising Star. Commission rates are dropping!";
    if (userLevel >= 5) return "Gaining momentum. Keep the hustle alive.";
    return "New Challenger. Start your journey today.";
  };

  return (
    <Card className="relative overflow-hidden border-secondary-neon/30 bg-gradient-to-br from-card to-background shadow-xl">
      {/* Decorative Glow Background */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-secondary-neon/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />

      <CardContent className="p-5 relative z-10">
        <div className="flex items-start gap-4">
          
          {/* --- Avatar Section with Level Badge --- */}
          <div className="relative shrink-0">
            <div className="rounded-full p-[2px] bg-gradient-to-tr from-secondary-neon to-blue-500 shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                <Avatar className="h-20 w-20 border-2 border-background">
                <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                <AvatarFallback className="bg-muted text-muted-foreground">
                    <User className="h-8 w-8" />
                </AvatarFallback>
                </Avatar>
            </div>
            {/* Level Badge Overlay */}
            <div className="absolute -bottom-2 -right-1 bg-background border border-secondary-neon text-secondary-neon text-xs font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <Zap className="h-3 w-3 fill-current" />
                <span>LVL {userLevel}</span>
            </div>
          </div>

          {/* --- Info Section --- */}
          <div className="flex-grow min-w-0 pt-1">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-foreground truncate leading-tight tracking-tight">
                        {displayName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="border-border text-muted-foreground text-[10px] px-1.5 h-5 font-normal uppercase tracking-wider">
                            {userProfile?.userType || "Student"}
                        </Badge>
                        {userBadge && (
                            <Badge variant="secondary" className="bg-secondary-neon/10 text-secondary-neon border-0 text-[10px] px-1.5 h-5 font-medium flex items-center gap-1">
                                <Crown className="h-3 w-3" /> {userBadge}
                            </Badge>
                        )}
                    </div>
                </div>
                
                {/* Commission Stat Box */}
                <div className="text-right">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Commission</p>
                    <div className="flex items-center justify-end gap-1 text-green-500">
                        <TrendingUp className="h-3 w-3" />
                        <span className="font-bold text-sm">{formatCommissionRate(commissionRate)}</span>
                    </div>
                </div>
            </div>

            {/* --- Gamified XP Bar --- */}
            <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Progress to Lvl {userLevel + 1}</span>
                    <span className="text-secondary-neon">{Math.floor(currentXp)} / {maxXp} XP</span>
                </div>
                
                {/* Custom Neon Progress Bar */}
                <div className="h-2.5 w-full bg-secondary/20 rounded-full overflow-hidden relative shadow-inner">
                    <div 
                        className="h-full bg-gradient-to-r from-secondary-neon to-cyan-400 rounded-full shadow-[0_0_10px_rgba(0,243,255,0.5)] transition-all duration-700 ease-out"
                        style={{ width: `${xpPercentage}%` }}
                    />
                    {/* Scanline effect */}
                    <div className="absolute inset-0 bg-white/10 w-full h-full animate-[shimmer_2s_infinite] skew-x-12 opacity-30" />
                </div>
            </div>
          </div>
        </div>

        {/* --- Mission Intel (Replaces Long Text) --- */}
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-2.5">
            <div className="bg-secondary-neon/10 p-1.5 rounded-md shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-secondary-neon" />
            </div>
            <p className="text-xs text-muted-foreground font-medium italic leading-relaxed">
                "{getShortMotivationalQuote()}"
            </p>
        </div>

      </CardContent>
    </Card>
  );
};

export default ProfileWidget;