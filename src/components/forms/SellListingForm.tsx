"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";
import { Brain, CheckCircle, XCircle } from "lucide-react";
import { usePriceAnalysis } from "@/hooks/usePriceAnalysis"; // Import the new hook

interface SellListingFormProps {
  onSubmit: (product: {
    title: string;
    price: string;
    description: string;
    category: string;
    damages: string;
    imageUrl: string;
    ambassadorDelivery: boolean;
    ambassadorMessage: string;
  }) => void;
  onCancel: () => void;
}

const SellListingForm: React.FC<SellListingFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [damages, setDamages] = useState("");
  const [imageUrl, setImageUrl] = useState("/app-logo.png");
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

  const handleAnalyzePriceClick = () => {
    analyzePrice(title, priceValue, category);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !priceValue || !description || !category) {
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

    onSubmit({ title, price: `₹${priceValue}`, description, category, damages, imageUrl, ambassadorDelivery, ambassadorMessage });
    setTitle("");
    setPriceValue("");
    setDescription("");
    setCategory("");
    setDamages("");
    setImageUrl("/app-logo.png");
    setAmbassadorDelivery(false);
    setAmbassadorMessage("");
    resetAnalysis();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-foreground">Title</Label>
        <Input
          id="title"
          type="text"
          placeholder="e.g., Gaming Laptop"
          value={title}
          onChange={(e) => { setTitle(e.target.value); resetAnalysis(); }}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="price" className="text-foreground">Price</Label>
        <Input
          id="price"
          type="number"
          placeholder="e.g., 65000"
          value={priceValue}
          onChange={(e) => { setPriceValue(e.target.value); resetAnalysis(); }}
          required
          min="1"
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
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
        <Label htmlFor="damages" className="text-foreground">Damages (if any)</Label>
        <Textarea
          id="damages"
          placeholder="e.g., Minor scratch on the back, missing original box."
          value={damages}
          onChange={(e) => setDamages(e.target.value)}
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="category" className="text-foreground">Category</Label>
        <Select value={category} onValueChange={(value) => { setCategory(value); resetAnalysis(); }} required>
          <SelectTrigger className="w-full bg-input text-foreground border-border focus:ring-ring focus:border-ring">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="books">Books</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
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
          onClick={handleAnalyzePriceClick}
          disabled={aiLoading || !title || !priceValue || !category}
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

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button
          type="submit"
          className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
          disabled={!isPriceReasonable || aiLoading}
        >
          Create Listing
        </Button>
      </div>
    </form>
  );
};

export default SellListingForm;