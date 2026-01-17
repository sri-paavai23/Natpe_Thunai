"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ShieldCheck, TrendingUp, Users, FileText, 
  Lock, Scale, ChevronRight, AlertTriangle 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { calculateCommissionRate } from "@/utils/commission"; 

// --- POLICY DATA ---
const policyContent = {
  // --- CATEGORY 1: THE ESSENTIALS ---
  safetyGuide: {
    title: "The Safety Guide",
    icon: ShieldCheck,
    badge: "Must Read",
    description: "Rules for meeting up without getting scammed.",
    fullText: `
      <div class="space-y-6">
        <div class="p-4 bg-secondary-neon/10 border border-secondary-neon/30 rounded-xl text-center">
          <p class="text-sm font-bold text-secondary-neon italic">“Friends don’t let friends get scammed.”</p>
        </div>
        
        <div class="space-y-4">
          <div class="bg-card border border-border p-4 rounded-xl">
            <h3 class="font-bold text-foreground flex items-center gap-2">1. The "Public Place" Rule 🏛️</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              Never meet in a hostel room or deserted corridor. Stick to the <strong>Canteen, Library, or Main Gate</strong>. After 6 PM? Bring a friend.
            </p>
          </div>

          <div class="bg-card border border-border p-4 rounded-xl">
            <h3 class="font-bold text-foreground flex items-center gap-2">2. The 4-Digit Handshake 🤝</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              Before handing over your item, ask the buyer for their <strong>Handshake Code</strong> (in their app receipt). No code? No deal. This is your proof.
            </p>
          </div>

          <div class="bg-card border border-border p-4 rounded-xl">
            <h3 class="font-bold text-foreground flex items-center gap-2">3. Inspect Before You Accept 🧐</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              <strong>Buyers:</strong> Check the item thoroughly <em>before</em> sharing the code. Is the cycle chain rusty? Notes missing pages? Once the deal is marked complete, the money moves from Escrow to the Seller instantly.
            </p>
          </div>

          <div class="bg-card border border-border p-4 rounded-xl">
            <h3 class="font-bold text-foreground flex items-center gap-2">4. Keep it on the App 📲</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
              If someone says "GPay me directly to avoid fees," they are asking you to waive your insurance. If you pay outside and get blocked, we can't help.
            </p>
          </div>
        </div>
      </div>
    `,
  },
  termsOfService: {
    title: "Fair Play Agreement",
    icon: Scale,
    badge: "The Rules",
    description: "How Escrow, Karma, and Bans work.",
    fullText: `
      <div class="space-y-6">
        <p class="text-xs text-muted-foreground text-center">Last Updated: Jan 2026</p>

        <section>
          <h3 class="font-bold text-foreground text-base mb-2">1. The Escrow System 💸</h3>
          <div class="text-sm text-muted-foreground space-y-2 pl-2 border-l-2 border-secondary-neon">
            <p><strong>Holding:</strong> When you buy, we hold the money safely.</p>
            <p><strong>Releasing:</strong> Money goes to the seller only after you confirm receipt or 48hrs after the meeting time.</p>
            <p><strong>Fees:</strong> We take a small commission to keep the servers running. This is non-refundable once a deal is done.</p>
          </div>
        </section>

        <section>
          <h3 class="font-bold text-foreground text-base mb-2">2. Karma & Bans ⭐</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Your Karma is your reputation. We permanently ban users who:
          </p>
          <ul class="list-disc list-inside text-sm text-muted-foreground mt-2 ml-1 space-y-1">
            <li>Spam the "Bounty" feed.</li>
            <li>Sell broken items as "New".</li>
            <li>Harass other students.</li>
          </ul>
          <p class="text-xs text-red-500 font-bold mt-2 bg-red-500/10 p-2 rounded">
            ⚠️ No second chances for scammers.
          </p>
        </section>

        <section>
          <h3 class="font-bold text-foreground text-base mb-2">3. Liability 🤷‍♂️</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Natpe-Thunai is the platform, not the seller. We verify IDs, but we don't manufacture the goods. If a used cycle gets a flat tire the next day, that's between you and the seller.
          </p>
        </section>
      </div>
    `,
  },

  // --- CATEGORY 2: MONEY MATTERS ---
  commissionPolicy: {
    title: "Commission Rates",
    icon: TrendingUp,
    badge: "Save $$",
    description: "Level up to lower your fees.",
    fullText: `
      <h3 class="text-lg font-bold mb-2 text-foreground">Dynamic Fees</h3>
      <p class="text-sm text-muted-foreground mb-6">
        We reward active students. Fees start at <strong>11.32%</strong> and drop to <strong>5.37%</strong> as you level up.
      </p>
      
      <div class="border rounded-xl overflow-hidden shadow-sm">
        <table class="min-w-full divide-y divide-border">
          <thead class="bg-muted">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-bold text-foreground uppercase">Level</th>
              <th class="px-4 py-3 text-right text-xs font-bold text-foreground uppercase">Fee</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border bg-card">
            ${Array.from({ length: 5 }, (_, i) => { 
              const level = (i * 5) + 1; // 1, 6, 11...
              const rate = calculateCommissionRate(level);
              return `
                <tr>
                  <td class="px-4 py-3 text-sm">Level ${level}</td>
                  <td class="px-4 py-3 text-sm text-right font-mono text-secondary-neon">${(rate * 100).toFixed(2)}%</td>
                </tr>
              `;
            }).join('')}
            <tr>
              <td class="px-4 py-3 text-sm font-bold">Level 25+ (Elite)</td>
              <td class="px-4 py-3 text-sm text-right font-bold text-green-500">5.37%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-muted-foreground mt-4 text-center">Fees are deducted from the Seller's payout.</p>
    `,
  },
  refundPolicy: {
    title: "Refund Policy",
    icon: FileText,
    badge: null,
    description: "Returns & cancellations.",
    fullText: `
      <div class="space-y-4">
        <div class="bg-card p-4 rounded-xl border border-border">
          <h3 class="font-bold text-foreground mb-1">Physical Items 📦</h3>
          <p class="text-sm text-muted-foreground">
            You have <strong>7 days</strong> from delivery to report an issue. Refunds are only for items significantly not as described.
          </p>
        </div>
        
        <div class="bg-card p-4 rounded-xl border border-border">
          <h3 class="font-bold text-foreground mb-1">Services & Food 🍔</h3>
          <p class="text-sm text-muted-foreground">
            <strong>Non-refundable</strong> once work/cooking starts. If a provider cancels, you get a 100% refund automatically.
          </p>
        </div>

        <div class="bg-card p-4 rounded-xl border border-border">
          <h3 class="font-bold text-foreground mb-1">Damaged on Arrival 💥</h3>
          <p class="text-sm text-muted-foreground">
            Take a photo immediately. If you don't have proof, we can't force a refund.
          </p>
        </div>
      </div>
    `,
  },

  // --- CATEGORY 3: COMMUNITY ---
  ambassadorMisuse: {
    title: "Ambassador Fair Use",
    icon: Users,
    badge: null,
    description: "Don't spam the runners.",
    fullText: `
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Ambassador delivery is for when you <em>cannot</em> meet. It's not a butler service.
        </p>
        
        <div class="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <h3 class="font-bold text-orange-600 dark:text-orange-400 mb-2">The Limit</h3>
          <p class="text-sm text-muted-foreground">
            Excessive use (>5 times without valid reason) may lower your XP gain rate.
          </p>
        </div>

        <div class="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <h3 class="font-bold text-purple-600 dark:text-purple-400 mb-2">Safety First</h3>
          <p class="text-sm text-muted-foreground">
            Female students have a higher threshold (10 times) to ensure safety and comfort when meeting strangers.
          </p>
        </div>
      </div>
    `,
  },
  privacyPolicy: {
    title: "Data Privacy",
    icon: Lock,
    badge: null,
    description: "Your data stays on campus.",
    fullText: `
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">
          We only collect what's needed to verify you are a real student.
        </p>
        <ul class="space-y-3">
          <li class="flex items-start gap-3 bg-card p-3 rounded-lg border border-border">
            <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
            <div class="text-sm text-muted-foreground">
              <strong class="text-foreground block">ID Verification</strong>
              Your College ID photo is encrypted. Only developers see it once to verify the tick.
            </div>
          </li>
          <li class="flex items-start gap-3 bg-card p-3 rounded-lg border border-border">
            <Lock className="h-5 w-5 text-blue-500 shrink-0" />
            <div class="text-sm text-muted-foreground">
              <strong class="text-foreground block">Phone Numbers</strong>
              Only shared with the other person AFTER a deal is confirmed. Never public.
            </div>
          </li>
        </ul>
      </div>
    `,
  },
};

const PolicyButton = ({ itemKey, onClick }: { itemKey: keyof typeof policyContent, onClick: () => void }) => {
  const item = policyContent[itemKey];
  const Icon = item.icon;
  
  return (
    <Button
      variant="outline"
      className="w-full justify-between h-auto py-4 px-4 bg-card hover:bg-accent border-border/50 shadow-sm transition-all active:scale-[0.98] group rounded-xl"
      onClick={onClick}
    >
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="p-2.5 bg-background border border-border rounded-full group-hover:border-secondary-neon/50 group-hover:text-secondary-neon transition-colors shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-left min-w-0">
          <div className="font-bold text-base text-foreground flex items-center gap-2">
            <span className="truncate">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-[9px] h-5 px-1.5 bg-secondary-neon/10 text-secondary-neon border-0 shrink-0">
                {item.badge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate opacity-80 font-medium mt-0.5">
            {item.description}
          </p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 group-hover:text-foreground transition-colors" />
    </Button>
  );
};

const PoliciesPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({ title: "", description: "", fullText: "" });

  const handleViewPolicy = (policyKey: keyof typeof policyContent) => {
    const content = policyContent[policyKey];
    setDialogContent(content);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-24">
      <div className="max-w-md mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="text-center space-y-1 pt-2">
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground">
            APP<span className="text-secondary-neon">POLICIES</span>
          </h1>
          <p className="text-xs text-muted-foreground font-medium">The rules that keep us safe.</p>
        </div>

        {/* SECTIONS */}
        <div className="space-y-6">
          
          {/* SECTION 1 */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest pl-1">The Essentials</h2>
            <div className="space-y-3">
              <PolicyButton itemKey="safetyGuide" onClick={() => handleViewPolicy("safetyGuide")} />
              <PolicyButton itemKey="termsOfService" onClick={() => handleViewPolicy("termsOfService")} />
            </div>
          </div>

          {/* SECTION 2 */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest pl-1">Money Matters</h2>
            <div className="space-y-3">
              <PolicyButton itemKey="commissionPolicy" onClick={() => handleViewPolicy("commissionPolicy")} />
              <PolicyButton itemKey="refundPolicy" onClick={() => handleViewPolicy("refundPolicy")} />
            </div>
          </div>

          {/* SECTION 3 */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest pl-1">Community</h2>
            <div className="space-y-3">
              <PolicyButton itemKey="ambassadorMisuse" onClick={() => handleViewPolicy("ambassadorMisuse")} />
              <PolicyButton itemKey="privacyPolicy" onClick={() => handleViewPolicy("privacyPolicy")} />
            </div>
          </div>

        </div>
      </div>
      
      <MadeWithDyad />

      {/* READING DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] w-[95%] rounded-2xl bg-card text-card-foreground border-border max-h-[85vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-6 pb-2 shrink-0 bg-background/50 backdrop-blur-sm border-b border-border/50">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
               {dialogContent.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {dialogContent.description}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-6 pt-4">
             <div 
               className="text-foreground prose prose-sm dark:prose-invert max-w-none leading-relaxed pb-4"
               dangerouslySetInnerHTML={{ __html: dialogContent.fullText }} 
             />
          </ScrollArea>

          <div className="p-4 border-t border-border bg-muted/20 shrink-0">
            <Button className="w-full font-bold bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" onClick={() => setIsDialogOpen(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PoliciesPage;