"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Utensils, Clock, IndianRupee, Leaf, Beef, Info } from "lucide-react";
import { toast } from "sonner";

interface PostFoodOrderFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isCustomRequest?: boolean; // Toggle between "Selling" and "Requesting"
  // Added optional props to match potential legacy usage
  categoryOptions?: any[];
  titlePlaceholder?: string;
  pricePlaceholder?: string;
}

const PostFoodOrderForm: React.FC<PostFoodOrderFormProps> = ({ 
  onSubmit, 
  onCancel, 
  isCustomRequest = false 
}) => {
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("homemade-meals");
  const [dietaryType, setDietaryType] = useState("veg"); // veg, non-veg
  const [timeEstimate, setTimeEstimate] = useState(""); // Prep time or Needed by

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !price || !timeEstimate) {
      toast.error("Please fill in all the details.");
      return;
    }

    setLoading(true);

    // Construct the data object
    const data = {
      title,
      description,
      price: `₹${price}`, // Format as currency string
      category,
      dietaryType, // New field for food context
      timeEstimate, // New field (Prep time / Delivery time)
      isCustomOrder: isCustomRequest,
      status: "Active"
    };

    await onSubmit(data);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      
      {/* Category Selection */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase text-muted-foreground">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="homemade-meals">Homemade Meal</SelectItem>
            <SelectItem value="wellness-remedies">Home Remedy (Tea/Soup)</SelectItem>
            <SelectItem value="snacks">Snacks & Munchies</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">
            {isCustomRequest ? "What are you craving?" : "What's on the menu?"}
        </Label>
        <div className="relative">
            <Utensils className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                id="title"
                placeholder={isCustomRequest ? "e.g. Spicy Paneer Roll" : "e.g. Mom's Hyderabadi Biryani"} 
                className="pl-9"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
        </div>
      </div>

      {/* Dietary Type (Radio) */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase text-muted-foreground">Dietary Preference</Label>
        <RadioGroup defaultValue="veg" value={dietaryType} onValueChange={setDietaryType} className="flex gap-4">
            <div className={`flex items-center space-x-2 border p-2 rounded-md cursor-pointer transition-colors ${dietaryType === 'veg' ? 'bg-green-50 border-green-500' : 'border-border'}`}>
                <RadioGroupItem value="veg" id="veg" className="text-green-600 border-green-600" />
                <Label htmlFor="veg" className="flex items-center gap-1 cursor-pointer text-green-700 dark:text-green-400">
                    <Leaf className="h-3 w-3" /> Veg
                </Label>
            </div>
            <div className={`flex items-center space-x-2 border p-2 rounded-md cursor-pointer transition-colors ${dietaryType === 'non-veg' ? 'bg-red-50 border-red-500' : 'border-border'}`}>
                <RadioGroupItem value="non-veg" id="non-veg" className="text-red-600 border-red-600" />
                <Label htmlFor="non-veg" className="flex items-center gap-1 cursor-pointer text-red-700 dark:text-red-400">
                    <Beef className="h-3 w-3" /> Non-Veg
                </Label>
            </div>
        </RadioGroup>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="desc">
            {isCustomRequest ? "Specific Preferences" : "Ingredients & Description"}
        </Label>
        <Textarea 
            id="desc"
            placeholder={isCustomRequest ? "e.g. Less oil, extra spicy, needed for lunch." : "e.g. Made with Basmati rice, served with raita."}
            className="h-20 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Price & Time Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
            <Label htmlFor="price">{isCustomRequest ? "Your Budget (₹)" : "Price per Plate (₹)"}</Label>
            <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="price"
                    type="number"
                    placeholder="120" 
                    className="pl-9"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                />
            </div>
        </div>
        <div className="space-y-1.5">
            <Label htmlFor="time">{isCustomRequest ? "Needed By" : "Preparation Time"}</Label>
            <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="time"
                    placeholder={isCustomRequest ? "1:00 PM" : "30 Mins / Pre-order"} 
                    className="pl-9"
                    value={timeEstimate}
                    onChange={(e) => setTimeEstimate(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* Contextual Info */}
      {!isCustomRequest && (
          <div className="flex gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-600 dark:text-yellow-400 items-start">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p>Ensure hygiene standards. You will be paid directly via UPI by the student.</p>
          </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
        </Button>
        <Button type="submit" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isCustomRequest ? "Post Request" : "Start Selling")}
        </Button>
      </div>

    </form>
  );
};

export default PostFoodOrderForm;