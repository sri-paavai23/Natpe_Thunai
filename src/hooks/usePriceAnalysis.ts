"use client";

import React, { useState, useCallback } from "react";
import { toast } from "sonner";

interface PriceAnalysisResult {
  isPriceAnalyzed: boolean;
  isPriceReasonable: boolean;
  aiSuggestion: string;
  aiLoading: boolean;
  analyzePrice: (title: string, priceValue: string, categoryOrCondition?: string, rentUnit?: "day" | "hour") => void;
  resetAnalysis: () => void;
}

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

  const analyzePrice = useCallback((title: string, priceValue: string, categoryOrCondition?: string, rentUnit?: "day" | "hour") => {
    setAiLoading(true);
    setIsPriceAnalyzed(false);
    setIsPriceReasonable(false);
    setAiSuggestion("");

    setTimeout(() => {
      const price = parseFloat(priceValue);
      const lowerTitle = title.toLowerCase();
      let reasonable = true;
      let suggestion = "";

      if (isNaN(price) || price <= 0) {
        reasonable = false;
        suggestion = "Price must be a valid number greater than zero.";
      } else {
        // Logic for SellListingForm (category)
        if (categoryOrCondition === "electronics") {
          if (lowerTitle.includes("laptop")) {
            if (price < 10000 || price > 80000) {
              reasonable = false;
              suggestion = "For a used laptop, a typical selling price is between ₹10,000 and ₹80,000, depending on specifications and condition.";
            }
          } else if (lowerTitle.includes("phone") || lowerTitle.includes("smartphone")) {
            if (price < 2000 || price > 30000) {
              reasonable = false;
              suggestion = "For a used smartphone, a typical selling price is between ₹2,000 and ₹30,000.";
            }
          } else {
            suggestion = "Consider market rates for similar used electronics.";
          }
        } else if (categoryOrCondition === "books") {
          if (lowerTitle.includes("textbook")) {
            if (price < 100 || price > 1500) {
              reasonable = false;
              suggestion = "For a used textbook, a typical selling price is between ₹100 and ₹1,500, depending on edition and condition.";
            }
          } else if (lowerTitle.includes("novel")) {
            if (price < 50 || price > 500) {
              reasonable = false;
              suggestion = "For a used novel, a typical selling price is between ₹50 and ₹500.";
            }
          } else {
            suggestion = "Consider market rates for similar used books.";
          }
        }
        // Logic for RentListingForm (rentUnit)
        else if (rentUnit) {
          if (lowerTitle.includes("laptop") || lowerTitle.includes("computer") || lowerTitle.includes("macbook")) {
            if (rentUnit === "hour") {
              if (price < 30 || price > 150) {
                reasonable = false;
                suggestion = "For a laptop, a reasonable hourly rent is typically between ₹30-₹150.";
              }
            } else if (rentUnit === "day") {
              if (price < 200 || price > 800) {
                reasonable = false;
                suggestion = "For a laptop, a reasonable daily rent is typically between ₹200-₹800.";
              }
            }
          } else if (lowerTitle.includes("bicycle") || lowerTitle.includes("bike")) {
            if (rentUnit === "hour") {
              if (price < 10 || price > 50) {
                reasonable = false;
                suggestion = "For a bicycle, a reasonable hourly rent is typically between ₹10-₹50.";
              }
            } else if (rentUnit === "day") {
              if (price < 50 || price > 250) {
                reasonable = false;
                suggestion = "For a bicycle, a reasonable daily rent is typically between ₹50-₹250.";
              }
            }
          } else {
            suggestion = "Price seems generally acceptable, but consider market rates for similar items.";
          }
        }
        // Logic for GiftCraftListingForm (no specific category/condition, just price range)
        else if (!categoryOrCondition && !rentUnit) {
          if (price < 50 || price > 1500) {
            reasonable = false;
            suggestion = "For handmade gifts and crafts, a typical price range is between ₹50 and ₹1500, depending on complexity and materials.";
          } else {
            suggestion = "Price seems generally acceptable for a gift/craft item.";
          }
        }
        // Logic for SportsGearListingForm (condition)
        else if (categoryOrCondition) { // Here categoryOrCondition is actually 'condition'
          const condition = categoryOrCondition.toLowerCase();
          if (lowerTitle.includes("cricket bat")) {
            if (condition === "new" && (price < 1000 || price > 10000)) {
              reasonable = false;
              suggestion = "New cricket bats typically range from ₹1,000 to ₹10,000.";
            } else if (condition.includes("used") && (price < 300 || price > 5000)) {
              reasonable = false;
              suggestion = "Used cricket bats typically range from ₹300 to ₹5,000, depending on condition.";
            }
          } else if (lowerTitle.includes("football") || lowerTitle.includes("soccer ball")) {
            if (condition === "new" && (price < 300 || price > 2000)) {
              reasonable = false;
              suggestion = "New footballs typically range from ₹300 to ₹2,000.";
            } else if (condition.includes("used") && (price < 100 || price > 1000)) {
              reasonable = false;
              suggestion = "Used footballs typically range from ₹100 to ₹1,000.";
            }
          } else if (lowerTitle.includes("badminton racket")) {
            if (condition === "new" && (price < 200 || price > 3000)) {
              reasonable = false;
              suggestion = "New badminton rackets typically range from ₹200 to ₹3,000.";
            } else if (condition.includes("used") && (price < 50 || price > 1500)) {
              reasonable = false;
              suggestion = "Used badminton rackets typically range from ₹50 to ₹1,500.";
            }
          } else {
            suggestion = "Price seems generally acceptable, but consider market rates for similar sports gear.";
          }
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
  }, []);

  return {
    isPriceAnalyzed,
    isPriceReasonable,
    aiSuggestion,
    aiLoading,
    analyzePrice,
    resetAnalysis,
  };
};