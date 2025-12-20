"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, GraduationCap, BookOpen, Gem } from "lucide-react"; // Added Gem icon, removed Laptop
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define link types for dialogs
interface DialogLink {
  name: string;
  description: string;
  url: string;
}

interface WelfareLinkItem {
  name: string;
  icon: React.ElementType;
  type: "dialog"; // All remaining links will open dialogs
  dialogLinks: DialogLink[];
}

const educationalDialogLinks: DialogLink[] = [
  { name: "National Digital Library", description: "Vast academic resources", url: "https://ndl.iitkgp.ac.in/" },
  { name: "Studynama", description: "Notes & study materials", url: "https://www.studynama.com/" },
  { name: "Virtual Labs", description: "Online lab experiments", url: "https://www.vlab.co.in/" },
  { name: "Class Central", description: "Free online courses", url: "https://www.classcentral.com/" },
  { name: "Codewars", description: "Coding challenges platform", url: "https://www.codewars.com/dashboard" },
];

const welfareDialogLinks: DialogLink[] = [
  { name: "UGC Samadhaan", description: "Grievance redressal portal", url: "https://samadhaan.ugc.ac.in/Registration" },
  { name: "iCALL Helpline", description: "Mental health support", url: "https://icallhelpline.org/" },
  { name: "Vidyasaarathi", description: "Scholarship application portal", url: "https://www.vidyasaarathi.co.in/Vidyasaarathi/" },
];

const hiddenGemsDialogLinks: DialogLink[] = [
  { name: "Remove.bg", description: "Instant background remover", url: "https://www.remove.bg/" },
  { name: "Wolfram Alpha", description: "Computational knowledge engine", url: "https://www.wolframalpha.com/" },
  { name: "Canva", description: "Easy graphic design", url: "https://www.canva.com/" },
  { name: "Notion", description: "All-in-one workspace", url: "https://www.notion.so/" },
  { name: "Grammarly", description: "Writing assistant tool", url: "https://www.grammarly.com/" },
];

const welfareLinks: WelfareLinkItem[] = [
  { name: "Educational Resources", icon: BookOpen, type: "dialog", dialogLinks: educationalDialogLinks },
  { name: "General Student Welfare", icon: GraduationCap, type: "dialog", dialogLinks: welfareDialogLinks },
  { name: "Hidden Gems & Tools", icon: Gem, type: "dialog", dialogLinks: hiddenGemsDialogLinks }, // Using Gem icon for hidden gems
];

const StudentWelfareLinks = () => {
  const handleRedirect = (platform: string, url: string) => {
    window.open(url, "_blank");
    toast.info(`Redirecting to ${platform}...`);
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-secondary-neon" /> Student Welfare & E-commerce
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <p className="text-sm text-muted-foreground">
          Access affiliated e-commerce sites and student welfare resources relevant to Tamil Nadu.
        </p>
        <div className="space-y-2">
          {welfareLinks.map((link) => (
            <Dialog key={link.name}>
              <DialogTrigger asChild>
                <Button
                  className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <link.icon className="mr-2 h-4 w-4" /> {link.name} <ExternalLink className="ml-auto h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{link.name}</DialogTitle>
                  <DialogDescription>
                    Select a link to redirect to.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {link.dialogLinks.map((dialogLink) => (
                    <Button
                      key={dialogLink.name}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleRedirect(dialogLink.name, dialogLink.url)}
                    >
                      {dialogLink.name} - <span className="ml-1 text-muted-foreground text-xs italic">{dialogLink.description}</span> <ExternalLink className="ml-auto h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Disclaimer: External links. Natpe🤝Thunai is not responsible for content on partner sites.
        </p>
      </CardContent>
    </Card>
  );
};

export default StudentWelfareLinks;