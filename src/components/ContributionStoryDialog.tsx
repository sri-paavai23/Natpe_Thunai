"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HeartHandshake, QrCode, Code } from "lucide-react";
import { DEVELOPER_UPI_ID } from "@/lib/config"; // Import DEVELOPER_UPI_ID

interface ContributionStoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContributionStoryDialog: React.FC<ContributionStoryDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-secondary-neon" /> Our Journey & Your Support
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Understand the heart behind Natpe🤝Thunai and how you can help us grow.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 text-sm text-muted-foreground">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Code className="h-4 w-4 text-secondary-neon" /> The Story of Natpe🤝Thunai
            </h3>
            <p>
              Natpe🤝Thunai was born from a simple yet powerful idea: to bridge the gaps in campus life. We saw students struggling with everyday needs – finding study partners, selling old books, getting quick errands done, or even just connecting with peers for a game. We envisioned a platform that wasn't just an app, but a living, breathing community hub.
            </p>
            <p>
              It started with late-night coding sessions, fueled by passion and a belief that technology could make college life smoother, more connected, and truly collaborative. Every line of code, every feature, is built with the student experience at its core.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-secondary-neon" /> Our Purpose
            </h3>
            <p>
              Our purpose is to empower students. To give you a platform where you can effortlessly buy, sell, rent, find services, exchange cash, and even find lost items within your college. We aim to foster a self-sustaining ecosystem where every student can find "Thunai" (support) when they need it, and offer "Natpe" (friendship/collaboration) in return.
            </p>
            <p>
              This app is a labor of love, built to serve you and your campus community. Keeping it running, improving it, and adding new features requires continuous effort and resources.
            </p>
          </div>

          <Separator />

          {/* Developer UPI Info for Contribution */}
          <div className="space-y-3 text-center">
            <h3 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5 text-secondary-neon" /> Support Our Mission
            </h3>
            <p className="text-sm text-muted-foreground">
              If Natpe🤝Thunai has made your college life a little easier, or if you believe in our vision, consider contributing to help us keep the platform alive and thriving. Your support ensures we can continue to build, maintain, and innovate for the student community.
            </p>
            <div className="flex flex-col items-center space-y-2 p-3 border border-border rounded-md bg-background">
              <img src="/qr.jpg" alt="Developer UPI QR Code" className="w-32 h-32 object-contain rounded-md" />
              <p className="text-sm font-medium text-foreground">UPI ID: <span className="text-secondary-neon">{DEVELOPER_UPI_ID}</span></p>
              <p className="text-xs text-muted-foreground text-center">Scan or use this UPI ID to contribute any amount you wish.</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContributionStoryDialog;