"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";
import { Brain, CheckCircle, XCircle, MapPin, IndianRupee, Image as ImageIcon, HelpCircle, AlertCircle, Dumbbell } from "lucide-react";
import { usePriceAnalysis } from "@/hooks/usePriceAnalysis";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SportsGearListingFormProps {
  onSubmit: (product: {
    title: string;
    price: string;
    description: string;
    condition: string;
    location: string;
    imageUrl: string;
    ambassadorDelivery: boolean;
    ambassadorMessage: string;
  }) => void;
  onCancel: () => void;
}

const SportsGearListingForm: React.FC<SportsGearListingFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");

  const { isPriceAnalyzed, isPriceReasonable, aiSuggestion, aiLoading, analyzePrice, resetAnalysis } = usePriceAnalysis();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !priceValue || !description || !condition || !location) {
      toast.error("All fields required.");
      return;
    }
    if (!isPriceAnalyzed) { toast.error("Check price first."); return; }

    onSubmit({ 
        title, 
        price: `₹${priceValue}`, 
        description, 
        condition, 
        location,
        imageUrl: imageUrl.trim() || "/app-logo.png", 
        ambassadorDelivery, 
        ambassadorMessage 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <div className="space-y-1.5">
        <Label className="text-foreground font-semibold flex items-center gap-2"><Dumbbell className="h-4 w-4 text-secondary-neon"/> Gear Name</Label>
        <Input placeholder="e.g. Cricket Bat (Willow), Badminton Racket" value={title} onChange={(e) => { setTitle(e.target.value); resetAnalysis(); }} className="h-12 bg-secondary/5 border-border" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-foreground font-semibold">Price</Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input type="number" placeholder="1500" value={priceValue} onChange={(e) => { setPriceValue(e.target.value); resetAnalysis(); }} className="pl-9 h-11 bg-secondary/5 border-border" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground font-semibold">Condition</Label>
          <Select value={condition} onValueChange={(v) => { setCondition(v); resetAnalysis(); }}>
            <SelectTrigger className="h-11 bg-secondary/5 border-border"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Brand New</SelectItem>
              <SelectItem value="used-like-new">Like New</SelectItem>
              <SelectItem value="used-good">Good</SelectItem>
              <SelectItem value="used-fair">Fair / Functional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* AI Check */}
      <div className={cn("rounded-lg border p-3", isPriceAnalyzed ? (isPriceReasonable ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20") : "bg-muted/30 border-dashed")}>
        <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><Brain className="h-3 w-3" /> System Check</h4>
            <Button type="button" variant="ghost" size="sm" onClick={() => analyzePrice(title, priceValue, condition)} disabled={aiLoading || !title || !priceValue} className="h-6 text-xs text-secondary-neon p-0 hover:bg-transparent">{aiLoading ? "Scanning..." : "Check"}</Button>
        </div>
        {isPriceAnalyzed && <p className="text-xs mt-1 text-foreground/90">{aiSuggestion}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-foreground font-semibold">Meeting Spot</Label>
        <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="e.g. Sports Ground, Basketball Court" value={location} onChange={(e) => setLocation(e.target.value)} className="pl-9 h-11 bg-secondary/5 border-border" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-foreground font-semibold">Specs / Description</Label>
        <Textarea placeholder="Weight, brand, size, grip condition..." value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary/5 border-border min-h-[80px]" />
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between"><Label className="text-foreground font-semibold">Image URL</Label><Link to="/help/image-to-url" className="text-[10px] text-secondary-neon hover:underline">Help</Link></div>
        <Input placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="h-11 bg-secondary/5 border-border" />
      </div>

      <AmbassadorDeliveryOption ambassadorDelivery={ambassadorDelivery} setAmbassadorDelivery={setAmbassadorDelivery} ambassadorMessage={ambassadorMessage} setAmbassadorMessage={setAmbassadorMessage} />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-11">Cancel</Button>
        <Button type="submit" className="flex-[2] h-11 bg-secondary-neon text-primary-foreground font-bold" disabled={!isPriceReasonable && isPriceAnalyzed}>Post Gear</Button>
      </div>
    </form>
  );
};

export default SportsGearListingForm;