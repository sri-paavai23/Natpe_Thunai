"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";
import { 
  Brain, IndianRupee, MapPin, Loader2, UploadCloud, 
  X, Check, AlertCircle, CheckCircle 
} from "lucide-react";
import { usePriceAnalysis } from "@/hooks/usePriceAnalysis";
import { cn } from "@/lib/utils";
import imageCompression from 'browser-image-compression';

// --- CONFIGURATION ---
const CLOUDINARY_CLOUD_NAME = "dpusuqjvo"; 
const CLOUDINARY_UPLOAD_PRESET = "natpe_thunai_preset"; 
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface RentListingFormProps {
  onSubmit: (product: {
    title: string;
    price: string;
    description: string;
    policies: string;
    imageUrl: string;
    location: string;
    ambassadorDelivery: boolean;
    ambassadorMessage: string;
  }) => void;
  onCancel: () => void;
}

const RentListingForm: React.FC<RentListingFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");
  const [rentPriceValue, setRentPriceValue] = useState("");
  const [rentUnit, setRentUnit] = useState<"day" | "hour">("day");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [policies, setPolicies] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false); 

  const { isPriceAnalyzed, isPriceReasonable, aiSuggestion, aiLoading, analyzePrice, resetAnalysis } = usePriceAnalysis();

  // --- CLOUDINARY UPLOAD LOGIC ---
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const imageFile = event.target.files?.[0];
    if (!imageFile) return;

    setIsUploading(true);

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1080,
        useWebWorker: true,
      };
      
      let fileToUpload = imageFile;
      try {
          fileToUpload = await imageCompression(imageFile, options);
      } catch (e) {
          console.warn("Compression failed, using original file", e);
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET); 

      const response = await fetch(CLOUDINARY_URL, {
          method: "POST",
          body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        toast.success("Image uploaded successfully!");
      }

    } catch (error) {
      toast.error("Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => setImageUrl("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocalSubmitting) return; 

    if (!title || !rentPriceValue || !description || !policies || !location) {
      toast.error("All fields are required.");
      return;
    }
    if (!imageUrl) {
        toast.error("Please upload an image.");
        return;
    }
    if (!isPriceAnalyzed) { 
        toast.error("Please verify price first."); 
        return; 
    }

    setIsLocalSubmitting(true);
    
    onSubmit({ 
        title, 
        price: `₹${rentPriceValue}/${rentUnit}`, 
        description, 
        policies, 
        location,
        imageUrl, 
        ambassadorDelivery, 
        ambassadorMessage 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20 sm:pb-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Title */}
      <div className="space-y-2">
        <Label className="text-sm font-bold text-foreground">Item Name</Label>
        <Input
          placeholder="e.g. DSLR Camera, Scientific Calculator"
          value={title}
          onChange={(e) => { setTitle(e.target.value); resetAnalysis(); }}
          className="h-12 text-base bg-secondary/5 border-border focus:ring-secondary-neon rounded-xl"
          disabled={isLocalSubmitting}
        />
      </div>

      {/* Price & Unit Row - Mobile Friendly Grid */}
      <div className="space-y-2">
        <Label className="text-sm font-bold text-foreground">Rental Rate</Label>
        <div className="flex gap-3">
            <div className="relative flex-grow">
                <IndianRupee className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="number"
                    placeholder="50"
                    value={rentPriceValue}
                    onChange={(e) => { setRentPriceValue(e.target.value); resetAnalysis(); }}
                    className="pl-10 h-12 text-base bg-secondary/5 border-border rounded-xl"
                    disabled={isLocalSubmitting}
                />
            </div>
            <Select value={rentUnit} onValueChange={(v: any) => { setRentUnit(v); resetAnalysis(); }} disabled={isLocalSubmitting}>
                <SelectTrigger className="w-[120px] h-12 text-base bg-secondary/5 border-border rounded-xl">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="day">/ Day</SelectItem>
                    <SelectItem value="hour">/ Hour</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      {/* AI Price Check - Mobile Card */}
      <div className={cn("rounded-xl border p-4 transition-all bg-card/50", isPriceAnalyzed ? (isPriceReasonable ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5") : "border-dashed border-border")}>
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Brain className="h-4 w-4" /> Market Check
            </h4>
            <Button
                type="button" variant="ghost" size="sm"
                onClick={() => analyzePrice(title, rentPriceValue, undefined, rentUnit)}
                disabled={aiLoading || !title || !rentPriceValue || isLocalSubmitting}
                className="h-8 px-3 text-xs font-bold text-secondary-neon bg-secondary-neon/10 hover:bg-secondary-neon/20 rounded-full"
            >
                {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verify Rate"}
            </Button>
        </div>
        {isPriceAnalyzed ? (
            <div className="flex items-start gap-2 text-sm mt-1">
                {isPriceReasonable ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                <p className="text-foreground/90 text-xs leading-relaxed">{aiSuggestion}</p>
            </div>
        ) : (
            <p className="text-[10px] text-muted-foreground">Enter details to check if your rental price is fair.</p>
        )}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label className="text-sm font-bold text-foreground">Pickup / Return Location</Label>
        <div className="relative">
            <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="e.g. Block A Warden Office"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 h-12 text-base bg-secondary/5 border-border rounded-xl"
                disabled={isLocalSubmitting}
            />
        </div>
      </div>

      {/* Description & Policies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label className="text-sm font-bold text-foreground">Description</Label>
            <Textarea
                placeholder="Condition, included accessories..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary/5 border-border min-h-[100px] rounded-xl text-base"
                disabled={isLocalSubmitting}
            />
        </div>
        <div className="space-y-2">
            <Label className="text-sm font-bold text-foreground">Policies / Terms</Label>
            <Textarea
                placeholder="e.g. ID card deposit required, return by 8 PM..."
                value={policies}
                onChange={(e) => setPolicies(e.target.value)}
                className="bg-secondary/5 border-border min-h-[100px] rounded-xl text-base"
                disabled={isLocalSubmitting}
            />
        </div>
      </div>

      {/* Image Upload - Large Touch Target */}
      <div className="space-y-2">
        <Label className="text-sm font-bold text-foreground">Item Photo</Label>
        
        {!imageUrl ? (
            <div className="relative border-2 border-dashed border-border hover:border-secondary-neon/50 bg-secondary/5 rounded-2xl h-40 transition-all group cursor-pointer overflow-hidden active:scale-[0.98]">
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    disabled={isUploading || isLocalSubmitting}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors p-4 text-center">
                    {isUploading ? (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin text-secondary-neon mb-2" />
                            <span className="text-xs font-bold animate-pulse">Compressing & Uploading...</span>
                        </>
                    ) : (
                        <>
                            <div className="p-3 bg-background rounded-full shadow-sm mb-3">
                                <UploadCloud className="h-6 w-6 text-secondary-neon" />
                            </div>
                            <span className="text-sm font-bold">Tap to Upload</span>
                            <span className="text-[10px] text-muted-foreground/70 mt-1">We compress it automatically</span>
                        </>
                    )}
                </div>
            </div>
        ) : (
            <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-border shadow-sm group bg-black/5">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                
                <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Check className="h-3 w-3" /> Ready
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        onClick={handleRemoveImage}
                        className="rounded-full shadow-lg font-bold"
                    >
                        <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                </div>
            </div>
        )}
      </div>

      <div className="py-2">
        <AmbassadorDeliveryOption 
            ambassadorDelivery={ambassadorDelivery} 
            setAmbassadorDelivery={setAmbassadorDelivery} 
            ambassadorMessage={ambassadorMessage} 
            setAmbassadorMessage={setAmbassadorMessage} 
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 rounded-xl font-bold border-border" disabled={isLocalSubmitting}>Cancel</Button>
        <Button 
            type="submit" 
            className="flex-[2] h-12 rounded-xl bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-black text-lg shadow-lg shadow-secondary-neon/20"
            disabled={(!isPriceReasonable && isPriceAnalyzed) || isLocalSubmitting || isUploading}
        >
          {isLocalSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
          List for Rent
        </Button>
      </div>
    </form>
  );
};

export default RentListingForm;