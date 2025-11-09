"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption"; // Import new component

interface RentListingFormProps {
  onSubmit: (product: {
    title: string;
    rentPrice: string; // e.g., "₹500/day" or "₹50/hour"
    description: string;
    policies: string; // New field for rent policies
    imageUrl: string;
    ambassadorDelivery: boolean; // New field
    ambassadorMessage: string; // New field
  }) => void;
  onCancel: () => void;
}

const RentListingForm: React.FC<RentListingFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");
  const [rentPrice, setRentPrice] = useState("");
  const [rentUnit, setRentUnit] = useState<"day" | "hour">("day");
  const [description, setDescription] = useState("");
  const [policies, setPolicies] = useState(""); // State for policies
  const [imageUrl, setImageUrl] = useState("/app-logo.png"); // Default to app logo
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false); // New state
  const [ambassadorMessage, setAmbassadorMessage] = useState(""); // New state

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rentPrice || !description || !policies) {
      toast.error("Please fill in all required fields.");
      return;
    }
    onSubmit({ title, rentPrice: `${rentPrice}/${rentUnit}`, description, policies, imageUrl, ambassadorDelivery, ambassadorMessage });
    setTitle("");
    setRentPrice("");
    setRentUnit("day");
    setDescription("");
    setPolicies("");
    setImageUrl("/app-logo.png");
    setAmbassadorDelivery(false);
    setAmbassadorMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-foreground">Title</Label>
        <Input
          id="title"
          type="text"
          placeholder="e.g., Bicycle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="rentPrice" className="text-foreground">Rent Price</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="rentPrice"
            type="text"
            placeholder="e.g., ₹500"
            value={rentPrice}
            onChange={(e) => setRentPrice(e.target.value)}
            required
            className="flex-grow bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          />
          <Select value={rentUnit} onValueChange={(value: "day" | "hour") => setRentUnit(value)} required>
            <SelectTrigger className="w-full sm:w-[100px] bg-input text-foreground border-border focus:ring-ring focus:border-ring">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border-border">
              <SelectItem value="day">/day</SelectItem>
              <SelectItem value="hour">/hour</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="description" className="text-foreground">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your item..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="policies" className="text-foreground">Valid Policies</Label>
        <Textarea
          id="policies"
          placeholder="e.g., No smoking, return by 5 PM, security deposit required."
          value={policies}
          onChange={(e) => setPolicies(e.target.value)}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="imageUrl" className="text-foreground">Image URL (Optional)</Label>
        <Input
          id="imageUrl"
          type="text"
          placeholder="e.g., https://example.com/image.jpg"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
        <p className="text-xs text-muted-foreground mt-1">Defaults to app logo if empty.</p>
      </div>

      <AmbassadorDeliveryOption
        ambassadorDelivery={ambassadorDelivery}
        setAmbassadorDelivery={setAmbassadorDelivery}
        ambassadorMessage={ambassadorMessage}
        setAmbassadorMessage={setAmbassadorMessage}
      />

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          Create Listing
        </Button>
      </div>
    </form>
  );
};

export default RentListingForm;