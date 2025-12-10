"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuth } from '@/context/AuthContext';

export interface ServicePost {
  $id: string;
  $createdAt: string; // Added
  title: string;
  description: string;
  category: string;
  price: string;
  contact: string;
  posterId: string;
  posterName: string;
  collegeName: string;
  isCustomOrder: boolean;
  posterAvatarStyle?: string;
  ambassadorDelivery?: boolean;
  ambassadorMessage?: string;
  isCustomOtherCategory?: boolean;
  customOrderDescription?: string; // Added
  // Add other fields as necessary for your service posts
}

export const useServiceListings = (initialCategory?: string) => {
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
        Query.equal('collegeName', userProfile.collegeName),
        Query.orderDesc('$createdAt'),
      ];

      if (initialCategory) {
        queries.push(Query.equal('category', initialCategory));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        queries
      );
      setServices(response.documents as unknown as ServicePost[]);
    } catch (err: any) {
      console.error("Error fetching service listings:", err);
      setError(err.message || "Failed to fetch service listings.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName, initialCategory]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return { services, isLoading, error, refetch: fetchServices };
};