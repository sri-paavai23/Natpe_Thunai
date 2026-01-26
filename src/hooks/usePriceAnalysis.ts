"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

// --- Types & Configurations ---

interface PriceRange {
  min: number;
  max: number;
  label: string;
  isPremium?: boolean; // If true, allows higher variance
}

interface PriceAnalysisResult {
  isPriceAnalyzed: boolean;
  isPriceReasonable: boolean;
  aiSuggestion: string;
  aiLoading: boolean;
  analyzePrice: (
    title: string,
    priceValue: string,
    categoryOrCondition?: string, 
    rentUnit?: "day" | "hour"
  ) => void;
  resetAnalysis: () => void;
}

// --- INDIAN MARKET DATASETS (INR) ---
// Calibrated for TIER-2/3 City College Students
const MARKET_DATA: Record<string, PriceRange> = {
  // 💻 Electronics
  laptop: { min: 5000, max: 60000, label: "used laptop" },
  gaming_laptop: { min: 30000, max: 120000, label: "gaming laptop", isPremium: true },
  macbook: { min: 25000, max: 150000, label: "used MacBook", isPremium: true },
  phone: { min: 2000, max: 25000, label: "used smartphone" },
  iphone: { min: 8000, max: 80000, label: "used iPhone", isPremium: true },
  android: { min: 3000, max: 30000, label: "Android phone" },
  tablet: { min: 3000, max: 40000, label: "used tablet" },
  ipad: { min: 8000, max: 60000, label: "used iPad", isPremium: true },
  calculator: { min: 200, max: 1200, label: "scientific calculator" }, // Casio fx-991ES range
  headphones: { min: 300, max: 15000, label: "headphones" },
  earbuds: { min: 500, max: 8000, label: "TWS earbuds" },
  smartwatch: { min: 500, max: 20000, label: "smartwatch" },
  charger: { min: 100, max: 2000, label: "charger/adapter" },

  // 📚 Education
  textbook: { min: 100, max: 1500, label: "academic textbook" },
  engineering_book: { min: 200, max: 2000, label: "engineering book" },
  medical_book: { min: 500, max: 4000, label: "medical textbook", isPremium: true },
  novel: { min: 50, max: 500, label: "novel/fiction" },
  notes: { min: 0, max: 500, label: "handwritten notes" }, 
  drafter: { min: 200, max: 800, label: "engineering drafter" },
  apron: { min: 100, max: 500, label: "lab apron" },

  // 🏏 Sports & Hobby
  cricket_bat: { min: 300, max: 5000, label: "cricket bat" },
  football: { min: 200, max: 2000, label: "football" },
  badminton: { min: 300, max: 4000, label: "badminton racket" },
  cycle: { min: 2000, max: 8000, label: "student bicycle" },
  gear_cycle: { min: 4000, max: 15000, label: "gear cycle", isPremium: true },
  guitar: { min: 1500, max: 10000, label: "acoustic guitar" },
  camera: { min: 5000, max: 80000, label: "DSLR/Mirrorless camera", isPremium: true },

  // 🏠 Hostel Essentials
  kettle: { min: 300, max: 1200, label: "electric kettle" },
  induction: { min: 800, max: 2500, label: "induction stove" },
  mattress: { min: 500, max: 3000, label: "mattress" },
  bucket: { min: 50, max: 300, label: "plastic bucket" },
};

// Rental Logic (Multiplier of Buy Price approx)
const RENT_MULTIPLIERS = {
  hour: { min: 20, max: 500, label: "hourly" },
  day: { min: 50, max: 2000, label: "daily" },
};

export const usePriceAnalysis = (): PriceAnalysisResult => {
  const [isPriceAnalyzed, setIsPriceAnalyzed] = useState(false);
  const [isPriceReasonable, setIsPriceReasonable] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const resetAnalysis = useCallback(() => {
    setIsPriceAnalyzed(false);
    setIsPriceReasonable(false);
    setAiSuggestion("");
    setAiLoading(false);
  }, []);

  const analyzePrice = useCallback(
    (
      title: string,
      priceValue: string,
      categoryOrCondition?: string,
      rentUnit?: "day" | "hour"
    ) => {
      // 1. Reset State
      setAiLoading(true);
      setIsPriceAnalyzed(false);
      setIsPriceReasonable(false);
      setAiSuggestion("");

      // 2. Simulate AI Processing Delay (randomized for realism)
      const delay = Math.floor(Math.random() * 500) + 600;

      setTimeout(() => {
        // --- INPUT NORMALIZATION ---
        const cleanPriceString = priceValue.toString().replace(/,/g, "").trim();
        const price = parseFloat(cleanPriceString);
        const lowerTitle = title.toLowerCase();
        
        // --- EDGE CASE: INVALID INPUT ---
        if (isNaN(price)) {
          setAiLoading(false);
          return;
        }

        // --- EDGE CASE: FREE ITEMS ---
        if (price <= 0) {
          if (lowerTitle.includes("free") || lowerTitle.includes("giveaway") || lowerTitle.includes("donate")) {
             setIsPriceReasonable(true);
             setAiSuggestion("That's generous of you! Listing as free.");
             toast.success("Listed as Free Item!");
          } else {
             setIsPriceReasonable(false);
             setAiSuggestion("Price is zero. Did you mean to list this as a giveaway?");
             toast.warning("Price Alert: Value is 0");
          }
          setAiLoading(false);
          setIsPriceAnalyzed(true);
          return;
        }

        // --- INTELLIGENT MATCHING ---
        let matchedKey: string | null = null;
        let matchQuality = 0; // 0 = no match, 1 = partial, 2 = exact

        const keys = Object.keys(MARKET_DATA);
        
        // Advanced Keyword Search
        for (const key of keys) {
           // Direct match (e.g. "laptop")
           if (lowerTitle.includes(key.replace('_', ' '))) {
              // Prefer specific matches (e.g., "gaming laptop" over "laptop")
              if (key.length > (matchedKey?.length || 0)) {
                 matchedKey = key;
                 matchQuality = 2;
              }
           }
        }

        // --- DECISION ENGINE ---
        let reasonable = true;
        let suggestion = "";

        if (rentUnit) {
            // === RENTAL MODE ===
            const limits = RENT_MULTIPLIERS[rentUnit];
            
            // Adjust limits based on item value (Heuristic)
            let adjustedMax = limits.max;
            if (matchedKey && MARKET_DATA[matchedKey].isPremium) {
                adjustedMax *= 3; // Allow higher rent for MacBooks/DSLRs
            } else if (matchedKey && matchedKey.includes("cycle")) {
                adjustedMax = rentUnit === 'hour' ? 50 : 200; // Cycles are cheap to rent
            }

            if (price > adjustedMax) {
                reasonable = false;
                suggestion = `₹${price}/${rentUnit} seems high. Students typically pay up to ₹${adjustedMax} for this.`;
            } else if (price < 10 && rentUnit === 'hour') {
                reasonable = true;
                suggestion = "Very affordable rental rate!";
            } else {
                reasonable = true;
                suggestion = "Rental rate looks fair for campus standards.";
            }

        } else {
            // === SELLING MODE ===
            
            if (matchedKey) {
                // 1. KNOWN ITEM FOUND
                const range = MARKET_DATA[matchedKey];
                let min = range.min;
                let max = range.max;

                // Context Modifiers
                if (lowerTitle.includes("pro") || lowerTitle.includes("ultra") || lowerTitle.includes("plus")) {
                    max *= 1.3; // Allow premium variants
                }
                if (lowerTitle.includes("broken") || lowerTitle.includes("parts") || lowerTitle.includes("not working")) {
                    max *= 0.3; // Scrap value
                    min = 0;
                }

                // Condition Modifiers
                const cond = categoryOrCondition?.toLowerCase() || "";
                if (cond.includes("new") || cond.includes("box")) {
                    min *= 1.2;
                    max *= 1.2;
                }

                // Validation
                if (price > max) {
                    reasonable = false;
                    suggestion = `A bit high for a used ${range.label}. Market avg: ₹${range.min} - ₹${range.max}.`;
                } else if (price < min * 0.4) { // Significantly below min
                    reasonable = true; // Still allow it, but warn
                    suggestion = `Unbelievable price! Just ensure you're not underselling your ${range.label}.`;
                } else {
                    reasonable = true;
                    suggestion = "Spot on! This price is competitive for the Indian market.";
                }

            } else {
                // 2. UNKNOWN ITEM (The "User Choice" Logic)
                // If we don't know what it is, we trust the user unless it's absurd.
                
                if (price > 100000) {
                    reasonable = true;
                    suggestion = "High-value item detected. Ensure description justifies the cost.";
                } else {
                    reasonable = true;
                    suggestion = "Price set based on your preference (Custom Item).";
                }
            }
        }

        // --- FINALIZATION ---
        setIsPriceAnalyzed(true);
        setIsPriceReasonable(reasonable);
        setAiSuggestion(suggestion);
        setAiLoading(false);

        // Toast Feedback
        if (reasonable) {
           if (suggestion.includes("Unbelievable")) toast.success("Wow! That's a steal deal!");
           else if (matchedKey) toast.success("Price Verified: Within Market Range ✅");
           else toast.info("Custom Price Accepted 👍");
        } else {
           toast.warning("Price Advice: Consider lowering for faster sale.");
        }

      }, delay);
    },
    []
  );

  return {
    isPriceAnalyzed,
    isPriceReasonable,
    aiSuggestion,
    aiLoading,
    analyzePrice,
    resetAnalysis,
  };
};