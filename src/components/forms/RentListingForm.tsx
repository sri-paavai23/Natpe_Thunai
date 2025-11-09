"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption"; // Import new component
import { Brain, CheckCircle, XCircle } from "lucide-react"; // Import AI-related icons

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
  const [rentPriceValue, setRentPriceValue] = useState(""); // Raw number input for price
  const [rentUnit, setRentUnit] = useState<"day" | "hour">("day");
  const [description, setDescription] = useState("");
  const [policies, setPolicies] = useState(""); // State for policies
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
      const price = parseFloat(rentPriceValue);
      const lowerTitle = title.toLowerCase();
      let reasonable = true;
      let suggestion = "";

      if (lowerTitle.includes("laptop") || lowerTitle.includes("computer") || lowerTitle.includes("macbook")) {
        if (rentUnit === "hour") {
          if (price < 30 || price > 150) { // Example range: ₹30-₹150 per hour
            reasonable = false;
            suggestion = "For a laptop, a reasonable hourly rent is typically between ₹30-₹150.";
          }
        } else if (rentUnit === "day") {
          if (price < 200 || price > 800) { // Example range: ₹200-₹800 per day
            reasonable = false;
            suggestion = "For a laptop, a reasonable daily rent is typically between ₹200-₹800.";
          }
        }
      } else if (lowerTitle.includes("bicycle") || lowerTitle.includes("bike")) {
        if (rentUnit === "hour") {
          if (price < 10 || price > 50) { // Example range: ₹10-₹50 per hour
            reasonable = false;
            suggestion = "For a bicycle, a reasonable hourly rent is typically between ₹10-₹50.";
          }
        } else if (rentUnit === "day") {
          if (price < 50 || price > 250) { // Example range: ₹50-₹250 per day
            reasonable = false;
            suggestion = "For a bicycle, a reasonable daily rent is typically between ₹50-₹250.";
          }
        }
      } else {
        // Default for other items if no specific rules apply
        if (price <= 0) {
          reasonable = false;
          suggestion = "Price must be greater than zero.";
        } else {
          suggestion = "Price seems generally acceptable, but consider market rates for similar items.";
        }
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
    if (!title || !rentPriceValue || !description || !policies) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!isPriceAnalyzed) {
      toast.error("Please analyze the price before creating the listing.");
      return;
    }
    if (!isPriceReasonable) {
      toast.error("The price is outside the reasonable range. Please adjust or confirm you understand.");
      // Optionally, allow override with a confirmation dialog in a real app
      // For now, we'll strictly prevent it.
      return;
    }

    onSubmit({ title, rentPrice: `₹${rentPriceValue}/${rentUnit}`, description, policies, imageUrl, ambassadorDelivery, ambassadorMessage });
    setTitle("");
    setRentPriceValue("");
    setRentUnit("day");
    setDescription("");
    setPolicies("");
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
          placeholder="e.g., Bicycle"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setIsPriceAnalyzed(false); }}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="rentPrice" className="text-foreground">Rent Price</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="rentPrice"
            type="number" // Changed to number for better input control
            placeholder="e.g., 500"
            value={rentPriceValue}
            onChange={(e) => { setRentPriceValue(e.target.value); setIsPriceAnalyzed(false); }}
            required
            min="1"
            className="flex-grow bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          />
          <Select value={rentUnit} onValueChange={(value: "day" | "hour") => { setRentUnit(value); setIsPriceAnalyzed(false); }} required>
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

      {/* AI Price Analysis Section */}
      <div className="space-y-2 border-t border-border pt-4 mt-4">
        <Button
          type="button"
          onClick={handleAnalyzePrice}
          disabled={aiLoading || !title || !rentPriceValue}
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

export default RentListingForm;