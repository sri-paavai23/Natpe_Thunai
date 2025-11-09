"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption"; // Import new component
import { Brain, CheckCircle, XCircle } from "lucide-react"; // Import AI-related icons

interface GiftCraftListingFormProps {
  onSubmit: (product: {
    title: string;
    price: string;
    description: string;
    imageUrl: string;
    ambassadorDelivery: boolean; // New field
    ambassadorMessage: string; // New field
  }) => void;
  onCancel: () => void;
}

const GiftCraftListingForm: React.FC<GiftCraftListingFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");
  const [priceValue, setPriceValue] = useState(""); // Raw number input for price
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("/app-logo.png"); // Default to app logo
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false); // New state
  const [ambassadorMessage, setAmbassadorMessage] = useState(""); // New state

  // AI Price Analysis States
  const [isPriceAnalyzed, setIsPriceAnalyzed] = useState(false);
  const [isPriceReasonable, setIsPriceReasonable] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleAnalyzePrice = () => {
    setAiLoading(true);
    setIsPriceAnalyzed(false);
    setIsPriceReasonable(false);
    setAiSuggestion("");

    setTimeout(() => { // Simulate AI processing time
      const price = parseFloat(priceValue);
      let reasonable = true;
      let suggestion = "";

      if (isNaN(price) || price <= 0) {
        reasonable = false;
        suggestion = "Price must be a valid number greater than zero.";
      } else if (price < 50 || price > 1500) { // Example range for gifts/crafts
        reasonable = false;
        suggestion = "For handmade gifts and crafts, a typical price range is between ₹50 and ₹1500, depending on complexity and materials.";
      } else {
        suggestion = "Price seems generally acceptable for a gift/craft item.";
      }

      setIsPriceAnalyzed(true);
      setIsPriceReasonable(reasonable);
      setAiSuggestion(suggestion);
      setAiLoading(false);

      if (reasonable) {
        toast.success("Price analysis complete: Price seems reasonable!");
      } else {
        toast.warning(`Price analysis complete: Price might be unreasonable. ${suggestion}`);
      }
    }, 1500); // 1.5 second delay for AI simulation
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !priceValue || !description) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!isPriceAnalyzed) {
      toast.error("Please analyze the price before creating the listing.");
      return;
    }
    if (!isPriceReasonable) {
      toast.error("The price is outside the reasonable range. Please adjust or confirm you understand.");
      return;
    }

    onSubmit({ title, price: `₹${priceValue}`, description, imageUrl, ambassadorDelivery, ambassadorMessage });
    setTitle("");
    setPriceValue("");
    setDescription("");
    setImageUrl("/app-logo.png");
    setAmbassadorDelivery(false);
    setAmbassadorMessage("");
    setIsPriceAnalyzed(false);
    setIsPriceReasonable(false);
    setAiSuggestion("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-foreground">Title</Label>
        <Input
          id="title"
          type="text"
          placeholder="e.g., Handmade Bracelet"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setIsPriceAnalyzed(false); }}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="price" className="text-foreground">Price</Label>
        <Input
          id="price"
          type="number"
          placeholder="e.g., 250"
          value={priceValue}
          onChange={(e) => { setPriceValue(e.target.value); setIsPriceAnalyzed(false); }}
          required
          min="1"
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="description" className="text-foreground">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your gift or craft item..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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

      {/* AI Price Analysis Section */}
      <div className="space-y-2 border-t border-border pt-4 mt-4">
        <Button
          type="button"
          onClick={handleAnalyzePrice}
          disabled={aiLoading || !title || !priceValue}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {aiLoading ? (
            <>
              <Brain className="mr-2 h-4 w-4 animate-pulse" /> Analyzing Price...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" /> Analyze Price
            </>
          )}
        </Button>
        {isPriceAnalyzed && (
          <div className={`p-3 rounded-md text-sm ${isPriceReasonable ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"}`}>
            <div className="flex items-center gap-2 font-semibold">
              {isPriceReasonable ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span>Price Status: {isPriceReasonable ? "Reasonable" : "Potentially Unreasonable"}</span>
            </div>
            {aiSuggestion && <p className="mt-1">{aiSuggestion}</p>}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
          disabled={!isPriceReasonable || aiLoading} // Disable if price not reasonable or AI is loading
        >
          Create Listing
        </Button>
      </div>
    </form>
  );
};

export default GiftCraftListingForm;