"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface ServicePost extends Models.Document {
  title: string;
  description: string;
  category: string;
  price: string;
  contact: string;
  posterId: string;
  posterName: string;
  collegeName: string;
  isCustomOrder: boolean;
  customOrderDescription?: string; // NEW: Added customOrderDescription
}

interface UseServiceListingsState {
  services: ServicePost[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useServiceListings = (categories?: string | string[]): UseServiceListingsState => { // NEW: Accept string or string[]
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const [services, setServices] = useState<ServicePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (isAuthLoading) {
      setIsLoading(true);
      setServices([]);
      setError(null);
      return;
    }

    if (!userProfile?.collegeName) {
      setIsLoading(false);
      setServices([]);
      setError("User college information is missing. Cannot fetch services.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const queries = [
        Query.equal('collegeName', userProfile.collegeName),
        Query.orderDesc('$createdAt')
      ];

      if (categories) {
        if (Array.isArray(categories)) {
          // If categories is an array, use Query.or for multiple category filters
          if (categories.length > 0) {
            queries.push(Query.or(categories.map(cat => Query.equal('category', cat))));
          }
        } else {
          // If it's a single string, use Query.equal
          queries.push(Query.equal('category', categories));
        }
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        queries
      );
      setServices(response.documents as unknown as ServicePost[]);
    } catch (err: any) {
      console.error("Error fetching service listings:", err);
      setError(err.message || "Failed to load service listings.");
      toast.error("Failed to load service listings.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName, categories, isAuthLoading]); // NEW: Add categories to dependency array

  useEffect(() => {
    fetchServices();

    if (!userProfile?.collegeName) return;

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_SERVICES_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as ServicePost;

        if (payload.collegeName !== userProfile.collegeName) {
          return;
        }

        // Check if the payload's category matches the filtered categories
        const matchesCategory = !categories || 
                                (Array.isArray(categories) && categories.includes(payload.category)) ||
                                (!Array.isArray(categories) && categories === payload.category);

        if (!matchesCategory) {
          return;
        }

        setServices(prev => {
          let updatedServices = prev;
          const existingIndex = prev.findIndex(s => s.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New service posted: "${payload.title}"`);
              updatedServices = [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              updatedServices = prev.map(s => s.$id === payload.$id ? payload : s);
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              updatedServices = prev.filter(s => s.$id !== payload.$id);
            }
          }
          return updatedServices;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchServices, userProfile?.collegeName, categories]); // NEW: Add categories to dependency array

  return { services, isLoading, error, refetch: fetchServices };
};