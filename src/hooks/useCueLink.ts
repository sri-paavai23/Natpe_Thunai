import { useState } from 'react';
import { functions } from "@/lib/appwrite"; // Import 'functions' from your existing config
import { toast } from "sonner";

export const useCueLink = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLink = async (listingId: string) => {
    setIsGenerating(true);
    try {
      const execution = await functions.createExecution(
        'generate_cuelink',      // Function ID
        JSON.stringify({ listingId }), // Body
        false,                   // Async (false = wait for response)
        '/',                     // Path
        'POST'                   // Method
      );

      const response = JSON.parse(execution.responseBody);

      if (response.success) {
        console.log("Link Generated:", response.cueLink);
        toast.success("CueLink generated and copied!");
        // Optional: Copy to clipboard automatically
        navigator.clipboard.writeText(response.cueLink);
        return response.cueLink;
      } else {
        console.error("Function Error:", response.error);
        toast.error(`Error: ${response.message || "Failed to generate link"}`);
      }
    } catch (error: any) {
      console.error("Execution Failed:", error.message);
      toast.error("Failed to connect to server.");
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateLink, isGenerating };
};