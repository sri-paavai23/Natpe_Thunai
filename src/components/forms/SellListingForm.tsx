"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Brain, CheckCircle, MapPin, IndianRupee, 
  Image as ImageIcon, AlertCircle, Loader2, UploadCloud, X, Check
} from "lucide-react";
import { usePriceAnalysis } from "@/hooks/usePriceAnalysis";
import { cn } from "@/lib/utils";
import imageCompression from 'browser-image-compression';
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";

// --- CONFIGURATION ---
// I have updated these with the values from your screenshot
const CLOUDINARY_CLOUD_NAME = "dpusuqjvo"; 
const CLOUDINARY_UPLOAD_PRESET = "natpe_thunai_preset"; 
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface SellListingFormProps {
  onSubmit: (product: {
    title: string;
    price: string;
    description: string;
    category: string;
    damages: string;
    imageUrl: string;
    location: string;
    ambassadorDelivery: boolean;
    ambassadorMessage: string;
  }) => void;
  onCancel: () => void;
}

const SellListingForm: React.FC<SellListingFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [location, setLocation] = useState(""); 
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [damages, setDamages] = useState("");
  const [imageUrl, setImageUrl] = useState(""); 
  const [isUploading, setIsUploading] = useState(false);
  
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");

  const {
    isPriceAnalyzed,
    isPriceReasonable,
    aiSuggestion,
    aiLoading,
    analyzePrice,
    resetAnalysis,
  } = usePriceAnalysis();

  // --- CLOUDINARY UPLOAD LOGIC ---
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const imageFile = event.target.files?.[0];
    if (!imageFile) return;

    setIsUploading(true);

    try {
      // 1. Client-Side Compression (Vital for speed)
      const options = {
        maxSizeMB: 0.5,          // Max 500KB
        maxWidthOrHeight: 1080,  // Max 1080p width
        useWebWorker: true,
      };
      
      let fileToUpload = imageFile;
      try {
          fileToUpload = await imageCompression(imageFile, options);
      } catch (e) {
          console.warn("Compression failed, using original file", e);
      }

      // 2. Prepare Form Data for Cloudinary
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET); 

      // 3. Direct Upload to Cloudinary API
      const response = await fetch(CLOUDINARY_URL, {
          method: "POST",
          body: formData,
      });

      if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.secure_url) {
        setImageUrl(data.secure_url);
        toast.success("Image uploaded successfully!");
      } else {
        throw new Error("Cloudinary did not return a secure_url");
      }

    } catch (error: any) {
      console.error("Upload failed", error);
      toast.error(`Image upload failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
      setImageUrl("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !priceValue || !description || !category || !location) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!imageUrl) {
        toast.error("Please upload an image of the item.");
        return;
    }
    if (!isPriceAnalyzed) {
      toast.error("Please analyze the price first.");
      return;
    }
    
    // Send data to parent (which saves to Appwrite Database)
    onSubmit({ 
      title, 
      price: `₹${priceValue}`, 
      description, 
      category, 
      damages, 
      location, 
      imageUrl, // This is now a secure Cloudinary URL
      ambassadorDelivery, 
      ambassadorMessage 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Title */}
      <div className="space-y-1.5">
        <Label className="text-foreground font-semibold">What are you selling?</Label>
        <Input
          placeholder="e.g. Mechanical Keyboard, Semester 3 Books"
          value={title}
          onChange={(e) => { setTitle(e.target.value); resetAnalysis(); }}
          className="h-12 bg-secondary/5 border-border focus:ring-secondary-neon"
        />
      </div>

      {/* Price & Category */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-foreground font-semibold">Price</Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="500"
              value={priceValue}
              onChange={(e) => { setPriceValue(e.target.value); resetAnalysis(); }}
              className="pl-9 h-11 bg-secondary/5 border-border"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-foreground font-semibold">Category</Label>
          <Select value={category} onValueChange={(v) => { setCategory(v); resetAnalysis(); }}>
            <SelectTrigger className="h-11 bg-secondary/5 border-border">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="books">Books & Notes</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* AI Price Analysis */}
      <div className={cn("rounded-lg border p-3 transition-all", isPriceAnalyzed ? (isPriceReasonable ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20") : "bg-muted/30 border-dashed")}>
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Brain className="h-3 w-3" /> Price Check
            </h4>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => analyzePrice(title, priceValue, category)}
                disabled={aiLoading || !title || !priceValue}
                className="h-6 text-xs text-secondary-neon hover:text-secondary-neon/80 p-0 hover:bg-transparent"
            >
                {aiLoading ? "Scanning..." : "Check Price"}
            </Button>
        </div>
        {isPriceAnalyzed && (
            <div className="flex items-start gap-2 text-sm">
                {isPriceReasonable ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" /> : <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />}
                <p className="text-foreground/90 text-xs leading-relaxed">{aiSuggestion}</p>
            </div>
        )}
        {!isPriceAnalyzed && <p className="text-xs text-muted-foreground italic">Enter title and price to verify market value.</p>}
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label className="text-foreground font-semibold">Preferred Meeting Spot</Label>
        <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
            placeholder="e.g. Library Entrance, Main Canteen"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-9 h-11 bg-secondary/5 border-border"
            />
        </div>
      </div>

      {/* Description & Damages */}
      <div className="space-y-4">
        <div className="space-y-1.5">
            <Label className="text-foreground font-semibold">Description</Label>
            <Textarea
            placeholder="Item condition, age, reason for selling..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-secondary/5 border-border min-h-[80px]"
            />
        </div>
        <div className="space-y-1.5">
            <Label className="text-foreground font-semibold">Any Damages/Issues?</Label>
            <Input
            placeholder="e.g. Minor scratch on screen, loose binding"
            value={damages}
            onChange={(e) => setDamages(e.target.value)}
            className="h-11 bg-secondary/5 border-border"
            />
        </div>
      </div>

      {/* --- CLOUDINARY IMAGE UPLOAD --- */}
      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Product Image</Label>
        
        {!imageUrl ? (
            <div className="relative border-2 border-dashed border-border hover:border-secondary-neon/50 bg-secondary/5 rounded-xl h-32 transition-all group cursor-pointer overflow-hidden">
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                    {isUploading ? (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin text-secondary-neon mb-2" />
                            <span className="text-xs font-medium animate-pulse">Uploading to Cloud...</span>
                        </>
                    ) : (
                        <>
                            <div className="p-3 bg-background rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                <UploadCloud className="h-6 w-6 text-secondary-neon" />
                            </div>
                            <span className="text-xs font-medium">Tap to upload photo</span>
                            <span className="text-[10px] text-muted-foreground/70 mt-1">Free image hosting via Cloudinary</span>
                        </>
                    )}
                </div>
            </div>
        ) : (
            <div className="relative h-48 w-full rounded-xl overflow-hidden border border-border shadow-sm group bg-black/5">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                
                <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Check className="h-3 w-3" /> Uploaded
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        onClick={handleRemoveImage}
                        className="rounded-full shadow-lg"
                    >
                        <X className="h-4 w-4 mr-1" /> Remove Image
                    </Button>
                </div>
            </div>
        )}
      </div>

      <AmbassadorDeliveryOption
        ambassadorDelivery={ambassadorDelivery}
        setAmbassadorDelivery={setAmbassadorDelivery}
        ambassadorMessage={ambassadorMessage}
        setAmbassadorMessage={setAmbassadorMessage}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-11 border-border">
          Cancel
        </Button>
        <Button 
            type="submit" 
            className="flex-[2] h-11 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-bold shadow-md"
            disabled={(!isPriceReasonable && isPriceAnalyzed) || isUploading} 
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Post Listing
        </Button>
      </div>
    </form>
  );
};

export default SellListingForm;