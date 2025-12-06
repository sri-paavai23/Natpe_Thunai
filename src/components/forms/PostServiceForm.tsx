"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // NEW: Import useAuth
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite"; // NEW: Import Appwrite services
import { ID } from 'appwrite'; // NEW: Import ID
import { Loader2 } from "lucide-react"; // NEW: Import Loader2
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption"; // NEW: Import AmbassadorDeliveryOption

interface CategoryOption {
  value: string;
  label: string;
}

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { value: "resume-building", label: "Resume Building" },
  { value: "video-editing", label: "Video Editing" },
  { value: "content-writing", label: "Content Writing" },
  { value: "graphic-design", label: "Graphic Design" },
  { value: "homemade-meals", label: "Homemade Meals" },
  { value: "wellness-remedies", label: "Wellness Remedies" },
  { value: "other", label: "Other" },
];

interface PostServiceFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    category: string;
    price: string;
    contact: string;
    customOrderDescription?: string;
    ambassadorDelivery: boolean;
    ambassadorMessage: string;
  }) => Promise<void>; // Changed to return Promise<void>
  onCancel: () => void;
  initialCategory?: string; // Optional prop to pre-select category
  isCustomOrder?: boolean; // New prop to indicate if it's a custom order form
  categoryOptions?: CategoryOption[]; // New prop for dynamic category filtering
}

const PostServiceForm: React.FC<PostServiceFormProps> = ({ onSubmit, onCancel, initialCategory = "", isCustomOrder = false, categoryOptions }) => {
  const { user, userProfile } = useAuth(); // NEW: Use useAuth hook
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [price, setPrice] = useState("");
  const [contact, setContact] = useState("");
  const [customOrderDescription, setCustomOrderDescription] = useState(""); // New state
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false); // NEW
  const [ambassadorMessage, setAmbassadorMessage] = useState(""); // NEW
  const [isPosting, setIsPosting] = useState(false); // NEW: Add loading state

  const categoriesToRender = categoryOptions || DEFAULT_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => { // NEW: Make handleSubmit async
    e.preventDefault();
    // Added explicit check for user.$id
    if (!user || !user.$id || !userProfile || !userProfile.collegeName) {
      toast.error("You must be logged in with a complete profile to post a service.");
      return;
    }
    if (!title || !description || !category || !price || !contact) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsPosting(true); // NEW: Set loading state
    try {
      const newServiceData = {
        title: title,
        description: description,
        category: category,
        price: price,
        contact: contact,
        customOrderDescription: customOrderDescription || null,
        isCustomOrder: isCustomOrder,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName, // NEW: Add collegeName
        ambassadorDelivery: ambassadorDelivery, // NEW
        ambassadorMessage: ambassadorMessage || null, // NEW
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        newServiceData
      );
      
      toast.success(`Your ${isCustomOrder ? "custom request" : "service"} "${title}" has been posted!`);
      await onSubmit({ title, description, category, price, contact, customOrderDescription, ambassadorDelivery, ambassadorMessage }); // Call original onSubmit prop
      setTitle("");
      setDescription("");
      setCategory(initialCategory);
      setPrice("");
      setContact("");
      setCustomOrderDescription("");
      setAmbassadorDelivery(false); // NEW
      setAmbassadorMessage(""); // NEW
    } catch (error: any) {
      console.error("Error posting service:", error);
      toast.error(error.message || "Failed to post service listing.");
    } finally {
      setIsPosting(false); // NEW: Reset loading state
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="title" className="text-left sm:text-right text-foreground">{isCustomOrder ? "Custom Order Title" : "Service Title"}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder={isCustomOrder ? "e.g., Vegan Meal Prep for a Week" : "e.g., Professional Resume Writing"}
          required
          disabled={isPosting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="description" className="text-left sm:text-right text-foreground">{isCustomOrder ? "Brief Description" : "Description"}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder={isCustomOrder ? "Briefly describe your custom request." : "Detail your service, experience, and what clients can expect."}
          required
          disabled={isPosting}
        />
      </div>
      {isCustomOrder && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
          <Label htmlFor="customOrderDescription" className="text-left sm:text-right text-foreground">Detailed Customization (Optional)</Label>
          <Textarea
            id="customOrderDescription"
            value={customOrderDescription}
            onChange={(e) => setCustomOrderDescription(e.target.value)}
            className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
            placeholder="e.g., Specific ingredients, dietary restrictions, preparation methods, or remedy components."
            disabled={isPosting}
          />
          <p className="text-xs text-muted-foreground mt-1 col-span-4 sm:col-start-2">
            Provide detailed instructions for your custom food or wellness remedy.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="category" className="text-left sm:text-right text-foreground">Category</Label>
        <Select value={category} onValueChange={setCategory} required disabled={isPosting}>
          <SelectTrigger className="col-span-3 w-full bg-input text-foreground border-border focus:ring-ring focus:border-ring">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            {categoriesToRender.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="price" className="text-left sm:text-right text-foreground">{isCustomOrder ? "Proposed Budget" : "Price/Fee"}</Label>
        <Input
          id="price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder={isCustomOrder ? "e.g., ₹1000-₹1500, Negotiable" : "e.g., ₹500/hour, Negotiable"}
          required
          disabled={isPosting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="contact" className="text-left sm:text-right text-foreground">
          Contact Email
        </Label>
        <Input
          id="contact"
          type="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="your.email@example.com"
          required
          disabled={isPosting}
        />
      </div>

      <AmbassadorDeliveryOption // NEW
        ambassadorDelivery={ambassadorDelivery}
        setAmbassadorDelivery={setAmbassadorDelivery}
        ambassadorMessage={ambassadorMessage}
        setAmbassadorMessage={setAmbassadorMessage}
      />

      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPosting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={isPosting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isCustomOrder ? "Post Custom Request" : "Post Service")}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default PostServiceForm;