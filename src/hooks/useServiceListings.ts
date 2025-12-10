"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext'; // NEW: Import useAuth

export interface ServicePost extends Models.Document {
  title: string;
  description: string;
  category: string;
  price: string;
  contact: string;
  datePosted: string;
  customOrderDescription?: string;
  isCustomOrder?: boolean;
  posterId: string;
  posterName: string;
  collegeName: string; // NEW: Add collegeName
}

interface ServiceListingsState {
  services: ServicePost[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useServiceListings = (category?: string): ServiceListingsState => {
  const { userProfile } = useAuth(); // NEW: Get userProfile to access collegeName
  const [services, setServices] = useState<ServicePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (!userProfile?.collegeName) { // NEW: Only fetch if collegeName is available
      setIsLoading(false);
      setServices([]); // Clear services if no college is set
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const queries = [
      Query.orderDesc('$createdAt'),
      Query.equal('collegeName', userProfile.collegeName) // NEW: Filter by collegeName
    ];
    if (category) {
      queries.push(Query.equal('category', category));
    }

    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        queries
      );
      setServices(response.documents as unknown as ServicePost[]);
    } catch (err: any) {
      console.error(`Error fetching service listings for category ${category}:`, err);
      setError(err.message || "Failed to load service listings.");
      toast.error("Failed to load service listings.");
    } finally {
      setIsLoading(false);
    }
  }, [category, userProfile?.collegeName]); // NEW: Depend on userProfile.collegeName

  useEffect(() => {
    fetchServices();

    if (!userProfile?.collegeName) return; // NEW: Only subscribe if collegeName is available

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_SERVICES_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as ServicePost;

        // Filter real-time updates based on the current category filter AND collegeName
        const matchesCategory = !category || payload.category === category;
        const matchesCollege = payload.collegeName === userProfile.collegeName; // NEW: Check collegeName

        if (!matchesCollege) return; // NEW: Skip if not from current college

        setServices(prev => {
          const existingIndex = prev.findIndex(s => s.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1 && matchesCategory) {
              toast.info(`New service posted: ${payload.title}`);
              return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              toast.info(`Service updated: ${payload.title}`);
              return prev.map(s => s.$id === payload.$id ? payload : s);
            } else if (matchesCategory) {
                // Handle case where a service is updated and now matches the filter
                return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              toast.info(`Service removed: ${payload.title}`);
              return prev.filter(s => s.$id !== payload.$id);
            }
          }
          return prev;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchServices, category, userProfile?.collegeName]); // NEW: Depend on userProfile.collegeName

  return { services, isLoading, error, refetch: fetchServices };
};