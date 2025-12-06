"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite"; // NEW: Import Appwrite services
import { ID } from 'appwrite'; // NEW: Import ID
import { useAuth } from "@/context/AuthContext"; // NEW: Import useAuth

interface GiftCraftRequestFormProps {
  onSubmit: (request: {
    title: string;
    description: string;
    referenceImageUrl: string;
    budget: string;
    contact: string;
    ambassadorDelivery: boolean;
    ambassadorMessage: string;
  }) => void;
  onCancel: () => void;
}

const GiftCraftRequestForm: React.FC<GiftCraftRequestFormProps> = ({ onSubmit, onCancel }) => {
  const { user, userProfile } = useAuth(); // NEW: Use useAuth hook
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [budget, setBudget] = useState("");
  const [contact, setContact] = useState("");
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");
  const [isPosting, setIsPosting] = useState(false); // NEW: Add loading state

  const handleSubmit = async (e: React.FormEvent) => { // NEW: Make handleSubmit async
    e.preventDefault();
    // Added explicit check for user.$id
    if (!user || !user.$id || !userProfile || !userProfile.collegeName) {
      toast.error("You must be logged in with a complete profile to post a request.");
      return;
    }
    if (!title || !description || !budget || !contact) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsPosting(true); // NEW: Set loading state
    try {
      const newRequestData = {
        title: title,
        description: description,
        referenceImageUrl: referenceImageUrl || null,
        price: budget, // Using 'price' attribute for budget
        contact: contact,
        ambassadorDelivery: ambassadorDelivery,
        ambassadorMessage: ambassadorMessage || null,
        isCustomOrder: true, // Mark as custom order
        category: "gift-request", // Specific category for gift requests
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName, // NEW: Add collegeName
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        newRequestData
      );

      toast.success(`Your gift/craft request "${title}" has been posted!`);
      onSubmit({ title, description, referenceImageUrl, budget, contact, ambassadorDelivery, ambassadorMessage });
      setTitle("");
      setDescription("");
      setReferenceImageUrl("");
      setBudget("");
      setContact("");
      setAmbassadorDelivery(false);
      setAmbassadorMessage("");
    } catch (error: any) {
      console.error("Error posting gift/craft request:", error);
      toast.error(error.message || "Failed to post request.");
    } finally {
      setIsPosting(false); // NEW: Reset loading state
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-foreground">Request Title</Label>
        <Input
          id="title"
          type="text"
          placeholder="e.g., Custom Painted Mug"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          disabled={isPosting}
        />
      </div>
      <div>
        <Label htmlFor="description" className="text-foreground">Description of Request</Label>
        <Textarea
          id="description"
          placeholder="Describe what you want, colors, themes, etc."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          disabled={isPosting}
        />
      </div>
      <div>
        <Label htmlFor="referenceImageUrl" className="text-foreground">Reference Image URL (Optional)</Label>
        <Input
          id="referenceImageUrl"
          type="text"
          placeholder="e.g., https://example.com/reference.jpg"
          value={referenceImageUrl}
          onChange={(e) => setReferenceImageUrl(e.target.value)}
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          disabled={isPosting}
        />
        <p className="text-xs text-muted-foreground mt-1">Provide a link to an image for inspiration.</p>
      </div>
      <div>
        <Label htmlFor="budget" className="text-foreground">Your Budget (₹)</Label>
        <Input
          id="budget"
          type="text"
          placeholder="e.g., ₹300-₹500, Negotiable"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          disabled={isPosting}
        />
      </div>
      <div>
        <Label htmlFor="contact" className="text-foreground">Contact Email</Label>
        <Input
          id="contact"
          type="email"
          placeholder="your.email@example.com"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          disabled={isPosting}
        />
      </div>

      <AmbassadorDeliveryOption
        ambassadorDelivery={ambassadorDelivery}
        setAmbassadorDelivery={setAmbassadorDelivery}
        ambassadorMessage={ambassadorMessage}
        setAmbassadorMessage={setAmbassadorMessage}
      />

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted" disabled={isPosting}>
          Cancel
        </Button>
        <Button type="submit" className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={isPosting}>
          Post Request
        </Button>
      </div>
    </form>
  );
};

export default GiftCraftRequestForm;