import { useState } from 'react';
import { functions } from "@/lib/appwrite"; 
import { toast } from "sonner";
import { ExecutionMethod } from 'appwrite'; // <--- 1. Import this

export const useCueLink = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLink = async (listingId: string) => {
    setIsGenerating(true);
    try {
      const execution = await functions.createExecution(
        'generate_cuelink',      
        JSON.stringify({ listingId }), 
        false,                   
        '/',                     
        ExecutionMethod.POST     // <--- 2. Use the Enum here instead of 'POST'
      );

      const response = JSON.parse(execution.responseBody);

      if (response.success) {
        console.log("Link Generated:", response.cueLink);
        toast.success("CueLink generated and copied!");
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