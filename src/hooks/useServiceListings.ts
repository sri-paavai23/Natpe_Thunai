"use client";

import { useState, useEffect, useCallback } from "react";
import { Query, Models } from "appwrite";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";

// Define the structure of a service post document
export interface ServicePost extends Models.Document {
  providerId: string;
  providerName: string;
  collegeName: string;
  title: string;
  description: string;
  category: string;
  otherCategoryDescription?: string;
  compensation: string;
  deadline?: string;
  contact: string;
  // New fields added based on errors
  price: string; // For services with a direct price
  isCustomOrder?: boolean; // To differentiate between offerings and custom requests
  customOrderDescription?: string; // Specific details for custom orders
  ambassadorDelivery?: boolean; // For food/wellness, if ambassador delivery is an option
  ambassadorMessage?: string; // Message for ambassador delivery
}

export const useServiceListings = (categories: string[] = []) => {
  const { userProfile } = useAuth();
  const [services, setServices] = useState<ServicePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (!userProfile?.collegeName) {
      setIsLoading(false);
      setError("User college information not available.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.equal("collegeName", userProfile.collegeName),
        Query.orderDesc("$createdAt"),
      ];

      if (categories.length > 0) {
        queries.push(Query.or(categories.map(cat => Query.equal("category", cat))));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        queries
      );
      setServices(response.documents as ServicePost[]);
    } catch (err: any) {
      console.error("Error fetching services:", err);
      setError(err.message || "Failed to fetch service listings.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName, categories]);

  useEffect(() => {
    fetchServices();

    // Realtime updates
    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_SERVICES_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          setServices((prev) => [response.payload as ServicePost, ...prev]);
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          setServices((prev) =>
            prev.map((service) =>
              service.$id === (response.payload as ServicePost).$id
                ? (response.payload as ServicePost)
                : service
            )
          );
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          setServices((prev) =>
            prev.filter((service) => service.$id !== (response.payload as ServicePost).$id)
          );
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchServices]);

  return { services, isLoading, error, refetchServices: fetchServices };
};