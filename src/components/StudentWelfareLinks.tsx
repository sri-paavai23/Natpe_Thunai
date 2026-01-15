"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink, 
  GraduationCap, 
  Sparkles, 
  HeartHandshake, 
  BrainCircuit,
  ArrowRight,
  Rocket, // New Icon
  Briefcase
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
  isNew?: boolean; 
  isRegional?: boolean; 
}

interface WelfareLinkItem {
  name: string;
  icon: React.ElementType;
  description: string;
  gradient: string; 
  dialogLinks: DialogLink[];
}

// 1. EDUCATION
const educationalDialogLinks: DialogLink[] = [
  { name: "Naan Mudhalvan", description: "TN Govt Skill Portal", url: "https://www.naanmudhalvan.tn.gov.in/", isRegional: true },
  { name: "NPTEL (Swayam)", description: "IIT/IISc Free Courses", url: "https://swayam.gov.in/" },
  { name: "Roadmap.sh", description: "Career Learning Paths", url: "https://roadmap.sh/", isNew: true },
  { name: "GitHub Student Pack", description: "Free Pro Dev Tools", url: "https://education.github.com/pack" },
  { name: "National Digital Library", description: "Academic Repo", url: "https://ndl.iitkgp.ac.in/" },
];

// 2. WELFARE
const welfareDialogLinks: DialogLink[] = [
  { name: "National Scholarship", description: "Central Govt Portal", url: "https://scholarships.gov.in/" },
  { name: "Pudhumai Penn", description: "TN Edu Assurance", url: "https://www.pudhumaippenn.tn.gov.in/", isRegional: true },
  { name: "Buddy4Study", description: "Scholarship Search", url: "https://www.buddy4study.com/" },
  { name: "Tele-MANAS", description: "Mental Health Support", url: "https://telemanas.mohfw.gov.in/" },
  { name: "UGC Samadhaan", description: "Grievance Portal", url: "https://samadhaan.ugc.ac.in/" },
];

// 3. TOOLS (AI & TECH)
const hiddenGemsDialogLinks: DialogLink[] = [
  { name: "TinyWow", description: "Free PDF/Image Tools", url: "https://tinywow.com/", isNew: true },
  { name: "FlowCV", description: "Free Resume Builder", url: "https://flowcv.com/" },
  { name: "Blackbox AI", description: "Code Autocomplete", url: "https://www.blackbox.ai/" },
  { name: "Wolfram Alpha", description: "Computational Engine", url: "https://www.wolframalpha.com/" },
  { name: "TempMail", description: "Disposable Email", url: "https://temp-mail.org/" },
];

// 4. NEW CATEGORY: PERKS & CAREER
const perksDialogLinks: DialogLink[] = [
  { name: "Notion for Education", description: "Free Personal Pro Plan", url: "https://www.notion.so/product/notion-for-education" },
  { name: "UNiDAYS", description: "Student Discounts", url: "https://www.myunidays.com/IN/en-IN" },
  { name: "Canva for Education", description: "Design Tools", url: "https://www.canva.com/education/students/" },
  { name: "Internshala", description: "Find Internships", url: "https://internshala.com/" },
  { name: "LinkedIn Learning", description: "Professional Skills", url: "https://www.linkedin.com/learning/" },
];

const welfareLinks: WelfareLinkItem[] = [
  { 
    name: "Skill & Study", 
    icon: BrainCircuit, 
    description: "Courses & Roadmaps",
    gradient: "from-blue-500/20 to-cyan-500/20 hover:border-cyan-500",
    dialogLinks: educationalDialogLinks 
  },
  { 
    name: "Welfare & Grants", 
    icon: HeartHandshake, 
    description: "Scholarships & Help",
    gradient: "from-pink-500/20 to-rose-500/20 hover:border-pink-500",
    dialogLinks: welfareDialogLinks 
  },
  { 
    name: "The Toolbox", 
    icon: Sparkles, 
    description: "AI Tools & Utilities",
    gradient: "from-amber-500/20 to-yellow-500/20 hover:border-amber-500",
    dialogLinks: hiddenGemsDialogLinks 
  },
  { 
    name: "Perks & Career", 
    icon: Rocket, // New Icon
    description: "Discounts & Jobs",
    gradient: "from-violet-500/20 to-purple-500/20 hover:border-violet-500",
    dialogLinks: perksDialogLinks 
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
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-secondary-neon" /> 
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
            Student Zone
          </span>
        </h2>
        <Badge variant="outline" className="border-secondary-neon/50 text-secondary-neon bg-secondary-neon/5 text-[10px] h-5 px-1.5">
          Resources
        </Badge>
      </div>

      {/* COMPACT 2x2 GRID */}
      <div className="grid grid-cols-2 gap-2">
        {welfareLinks.map((category) => (
          <Dialog key={category.name}>
            <DialogTrigger asChild>
              <button className={`
                group relative flex flex-col items-start justify-between 
                p-3 h-24 rounded-lg border border-border/50 
                bg-gradient-to-br ${category.gradient} 
                transition-all duration-300 hover:scale-[1.02] hover:shadow-md
                text-left w-full overflow-hidden
              `}>
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-25 transition-opacity">
                  <category.icon className="h-12 w-12" />
                </div>
                
                <div className="z-10 bg-background/60 backdrop-blur-sm p-1.5 rounded-md border border-border/30 mb-1">
                  <category.icon className="h-4 w-4 text-foreground" />
                </div>
                
                <div className="z-10 w-full">
                  <h3 className="font-bold text-sm leading-none mb-0.5 truncate pr-2">{category.name}</h3>
                  <p className="text-[10px] text-muted-foreground truncate">{category.description}</p>
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
                    <div className="flex flex-col gap-0.5 max-w-[85%]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm group-hover:text-secondary-neon transition-colors">
                          {link.name}
                        </span>
                        {link.isNew && (
                          <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1 py-0 rounded border border-blue-500/30">
                            NEW
                          </span>
                        )}
                        {link.isRegional && (
                          <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1 py-0 rounded border border-orange-500/30">
                            TN
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">{link.description}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-secondary-neon group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
      
      <p className="text-[9px] text-center text-muted-foreground opacity-50 pt-1">
        External links verified by Natpe🤝Thunai.
      </p>
    </section>
  );
};

export default StudentWelfareLinks;