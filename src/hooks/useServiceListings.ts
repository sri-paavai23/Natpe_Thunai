"use client";

import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { Query, Models } from "appwrite";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export interface ServicePost extends Models.Document {
  title: string;
  description: string;
  category: string;
  compensation: string;
  price: string; // Added price
  deadline?: string;
  contact: string;
  posterId: string;
  posterName: string;
  collegeName: string;
  serviceType: "freelance" | "short-term"; // e.g., 'freelance', 'short-term'
}

export const useServiceListings = (serviceType: "freelance" | "short-term", category?: string) => {
  const [services, setServices] = useState<ServicePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let queries = [
          Query.equal("serviceType", serviceType),
          Query.orderDesc("$createdAt")
        ];

        if (category) {
          queries.push(Query.equal("category", category));
        }

        if (userProfile?.collegeName) {
          queries.push(Query.equal("collegeName", userProfile.collegeName));
        }

        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_SERVICES_COLLECTION_ID,
          queries
        );
        setServices(response.documents as unknown as ServicePost[]);
      } catch (err: any) {
        console.error("Error fetching services:", err);
        setError(err.message || "Failed to fetch services.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();

    // Real-time subscription
    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_SERVICES_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          const newService = response.payload as unknown as ServicePost;
          if (newService.serviceType === serviceType && (!category || newService.category === category) && newService.collegeName === userProfile?.collegeName) {
            setServices((prev) => [newService, ...prev]);
          }
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          const updatedService = response.payload as unknown as ServicePost;
          setServices((prev) =>
            prev.map((s) => (s.$id === updatedService.$id ? updatedService : s))
          );
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          const deletedService = response.payload as unknown as ServicePost;
          setServices((prev) => prev.filter((s) => s.$id !== deletedService.$id));
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [serviceType, category, userProfile?.collegeName]);

  return { services, isLoading, error };
};