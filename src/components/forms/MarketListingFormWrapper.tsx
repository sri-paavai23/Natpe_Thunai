"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { Loader2 } from "lucide-react";
import { Product } from "@/lib/mockData"; // Assuming Product interface is defined here or similar

interface MarketListingFormWrapperProps {
  type: Product['type']; // 'sell', 'rent', 'gift', 'service'
  onSuccess: () => void;
  onCancel: () => void;
}

const MarketListingFormWrapper: React.FC<MarketListingFormWrapperProps> = ({ type, onSuccess, onCancel }) => {
  const { user, userProfile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) {
      toast.error("You must be logged in to create a listing.");
      return;
    }

    if (!title.trim() || !description.trim() || (type !== 'gift' && !price.trim())) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const collectionId = type === 'service' ? APPWRITE_SERVICES_COLLECTION_ID : APPWRITE_PRODUCTS_COLLECTION_ID;
      const parsedPrice = type === 'gift' ? 0 : parseFloat(price);

      const newListingData = {
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        imageUrl: imageUrl.trim() || undefined,
        type: type,
        status: "available", // Default status
        posterId: user.$id,
        posterName: user.name,
        sellerName: user.name,
        sellerUpiId: userProfile.upiId || '', // Fixed: Use existing upiId or default to empty string
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        collectionId,
        ID.unique(),
        newListingData
      );

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} listing created successfully!`);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating listing:", error);
      toast.error(error.message || "Failed to create listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-foreground">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder={`e.g., ${type === 'sell' ? 'Textbook' : type === 'rent' ? 'Bicycle' : type === 'gift' ? 'Old Clothes' : 'Tutoring Service'}`}
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description" className="text-foreground">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="Provide a detailed description of your item or service."
          required
          disabled={isSubmitting}
        />
      </div>
      {type !== 'gift' && (
        <div className="space-y-2">
          <Label htmlFor="price" className="text-foreground">Price (₹)</Label>
          <Input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
            placeholder="e.g., 500"
            min="0"
            required
            disabled={isSubmitting}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="imageUrl" className="text-foreground">Image URL (Optional)</Label>
        <Input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="https://example.com/image.jpg"
          disabled={isSubmitting}
        />
      </div>
      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Create ${type.charAt(0).toUpperCase() + type.slice(1)} Listing`}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default MarketListingFormWrapper;