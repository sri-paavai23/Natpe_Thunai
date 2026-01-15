"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink, 
  GraduationCap, 
  BookOpen, 
  Gem, 
  Sparkles, 
  HeartHandshake, 
  BrainCircuit,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// --- Data & Links Configuration ---

interface DialogLink {
  name: string;
  description: string;
  url: string;
  isNew?: boolean; // To show a "New" badge
  isRegional?: boolean; // To highlight TN specific links
}

interface WelfareLinkItem {
  name: string;
  icon: React.ElementType;
  description: string;
  gradient: string; // Custom gradient for each card
  dialogLinks: DialogLink[];
}

const educationalDialogLinks: DialogLink[] = [
  { name: "Naan Mudhalvan", description: "TN Govt Skill Upskilling Portal", url: "https://www.naanmudhalvan.tn.gov.in/", isRegional: true },
  { name: "NPTEL (Swayam)", description: "IIT/IISc Free Online Courses", url: "https://swayam.gov.in/" },
  { name: "Roadmap.sh", description: "Career Learning Paths", url: "https://roadmap.sh/", isNew: true },
  { name: "GitHub Student Pack", description: "Free Pro Dev Tools", url: "https://education.github.com/pack" },
  { name: "National Digital Library", description: "Vast Academic Repo", url: "https://ndl.iitkgp.ac.in/" },
  { name: "GeeksforGeeks", description: "CS Concepts & Interview Prep", url: "https://www.geeksforgeeks.org/" },
  { name: "Virtual Labs", description: "MHRD Online Experiments", url: "https://www.vlab.co.in/" },
];

const welfareDialogLinks: DialogLink[] = [
  { name: "National Scholarship Portal", description: "Central Govt Scholarships", url: "https://scholarships.gov.in/" },
  { name: "Pudhumai Penn Scheme", description: "TN Higher Edu Assurance", url: "https://www.pudhumaippenn.tn.gov.in/", isRegional: true },
  { name: "Buddy4Study", description: "Private & Govt Scholarship Aggregator", url: "https://www.buddy4study.com/" },
  { name: "UGC Samadhaan", description: "Student Grievance Portal", url: "https://samadhaan.ugc.ac.in/" },
  { name: "Tele-MANAS", description: "24/7 Mental Health Support", url: "https://telemanas.mohfw.gov.in/" },
  { name: "Internshala", description: "Student Internships", url: "https://internshala.com/" },
];

const hiddenGemsDialogLinks: DialogLink[] = [
  { name: "TinyWow", description: "Free PDF/Video/Image Tools", url: "https://tinywow.com/", isNew: true },
  { name: "FlowCV", description: "Best Free Resume Builder", url: "https://flowcv.com/" },
  { name: "Excalidraw", description: "Hand-drawn style Diagrams", url: "https://excalidraw.com/" },
  { name: "TempMail", description: "Disposable Email for Signups", url: "https://temp-mail.org/" },
  { name: "Wolfram Alpha", description: "Computational Intelligence", url: "https://www.wolframalpha.com/" },
  { name: "Blackbox AI", description: "Code Chat & Autocomplete", url: "https://www.blackbox.ai/" },
  { name: "Unsplash", description: "Free High-Res Images", url: "https://unsplash.com/" },
];

const welfareLinks: WelfareLinkItem[] = [
  { 
    name: "Skill & Study", 
    icon: BrainCircuit, 
    description: "Courses, Roadmaps & Labs",
    gradient: "from-blue-500/20 to-cyan-500/20 hover:border-cyan-500",
    dialogLinks: educationalDialogLinks 
  },
  { 
    name: "Welfare & Grants", 
    icon: HeartHandshake, 
    description: "Scholarships & Support",
    gradient: "from-pink-500/20 to-rose-500/20 hover:border-pink-500",
    dialogLinks: welfareDialogLinks 
  },
  { 
    name: "The Toolbox", 
    icon: Sparkles, 
    description: "AI Tools & Hidden Gems",
    gradient: "from-amber-500/20 to-yellow-500/20 hover:border-amber-500",
    dialogLinks: hiddenGemsDialogLinks 
  },
];

const StudentWelfareLinks = () => {
  const handleRedirect = (platform: string, url: string) => {
    window.open(url, "_blank");
    toast.success(`Opening ${platform}`, {
      description: "Redirecting you to the external site."
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-secondary-neon" /> 
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
            Student Zone
          </span>
        </h2>
        <Badge variant="outline" className="border-secondary-neon/50 text-secondary-neon animate-pulse bg-secondary-neon/10">
          Updated
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {welfareLinks.map((category) => (
          <Dialog key={category.name}>
            <DialogTrigger asChild>
              <button className={`
                group relative flex flex-col items-start justify-between 
                p-4 h-32 rounded-xl border border-border/50 
                bg-gradient-to-br ${category.gradient} 
                transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
                text-left w-full overflow-hidden
              `}>
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <category.icon className="h-16 w-16" />
                </div>
                
                <div className="z-10 bg-background/50 backdrop-blur-sm p-2 rounded-lg border border-border/50 mb-2">
                  <category.icon className="h-5 w-5 text-foreground" />
                </div>
                
                <div className="z-10">
                  <h3 className="font-bold text-lg leading-none mb-1">{category.name}</h3>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </div>
              </button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px] border-border bg-card/95 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <category.icon className="h-5 w-5 text-secondary-neon" /> 
                  {category.name}
                </DialogTitle>
                <DialogDescription>
                  Curated resources. Click to visit.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-2 py-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {category.dialogLinks.map((link) => (
                  <div
                    key={link.name}
                    onClick={() => handleRedirect(link.name, link.url)}
                    className="
                      group flex items-center justify-between p-3 rounded-lg 
                      border border-border/40 bg-background/50 hover:bg-secondary-neon/10 
                      hover:border-secondary-neon/50 cursor-pointer transition-all duration-200
                    "
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm group-hover:text-secondary-neon transition-colors">
                          {link.name}
                        </span>
                        {link.isNew && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                            NEW
                          </span>
                        )}
                        {link.isRegional && (
                          <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30">
                            TN GOVT
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{link.description}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-secondary-neon group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
      
      <p className="text-[10px] text-center text-muted-foreground opacity-60">
        Resources curated for educational purposes. Natpe🤝Thunai verifies links but is not affiliated with them.
      </p>
    </section>
  );
};

export default StudentWelfareLinks;