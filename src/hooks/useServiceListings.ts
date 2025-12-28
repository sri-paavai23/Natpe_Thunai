import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, Models, ID } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// Collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const SERVICE_LISTINGS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SERVICE_LISTINGS_COLLECTION_ID;

export type ServiceCategory = "Academics" | "Tech" | "Creative" | "Manual Labor" | "Wellness" | "Other";
export type ServiceStatus = "Available" | "Booked" | "Completed" | "Cancelled";

export interface ServicePost extends Models.Document { // Extend Models.Document
  title: string;
  description: string;
  category: ServiceCategory;
  price: number; // Price per unit (e.g., per hour, per task)
  priceUnit: string; // e.g., "hour", "task", "project"
  imageUrl?: string;
  providerId: string;
  providerName: string;
  collegeName: string;
  status: ServiceStatus;
  contactInfo: string;
  location?: string; // Where the service is provided
  isCustomOrder?: boolean; // Added for custom food requests
  customOrderDescription?: string; // Added for custom food requests
}

interface UseServiceListingsState {
  services: ServicePost[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  postService: (serviceData: Omit<ServicePost, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "providerId" | "providerName" | "collegeName" | "status">) => Promise<void>;
  updateServiceStatus: (serviceId: string, newStatus: ServiceStatus) => Promise<void>;
}

export const useServiceListings = (categories?: string | string[]): UseServiceListingsState => {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const [services, setServices] = useState<ServicePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.orderDesc('$createdAt'),
        userProfile?.collegeName ? Query.equal('collegeName', userProfile.collegeName) : Query.limit(100) // Filter by college if available
      ];

      if (categories) {
        if (Array.isArray(categories)) {
          queries.push(Query.or(categories.map(cat => Query.equal('category', cat))));
        } else {
          queries.push(Query.equal('category', categories));
        }
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        SERVICE_LISTINGS_COLLECTION_ID,
        queries
      );
      setServices(response.documents as ServicePost[]); // Type assertion is now safer
    } catch (err: any) {
      console.error("Error fetching service listings:", err);
      setError("Failed to fetch service listings.");
      toast.error("Failed to load service listings.");
    } finally {
      setIsLoading(false);
    }
  }, [categories, userProfile?.collegeName]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchServices();
    }
  }, [fetchServices, isAuthLoading]);

  const postService = async (serviceData: Omit<ServicePost, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "providerId" | "providerName" | "collegeName" | "status">) => {
    if (!userProfile?.collegeName) {
      toast.error("You must be logged in and have a college name set to post a service.");
      return;
    }

    try {
      const newService = await databases.createDocument(
        DATABASE_ID,
        SERVICE_LISTINGS_COLLECTION_ID,
        ID.unique(),
        {
          ...serviceData,
          providerId: userProfile.$id!,
          providerName: userProfile.name,
          collegeName: userProfile.collegeName,
          status: "Available", // Default status
        }
      );
      setServices(prev => [newService as ServicePost, ...prev]); // Type assertion is now safer
      toast.success("Service posted successfully!");
    } catch (err: any) {
      console.error("Error posting service:", err);
      toast.error(err.message || "Failed to post service.");
      throw err;
    }
  };

  const updateServiceStatus = async (serviceId: string, newStatus: ServiceStatus) => {
    if (!userProfile) {
      toast.error("You must be logged in to update a service.");
      return;
    }

    try {
      const updatedService = await databases.updateDocument(
        DATABASE_ID,
        SERVICE_LISTINGS_COLLECTION_ID,
        serviceId,
        { status: newStatus }
      );
      setServices(prev => prev.map(service => service.$id === serviceId ? { ...service, status: newStatus } : service));
      toast.success(`Service status updated to ${newStatus}!`);
    } catch (err: any) {
      console.error("Error updating service status:", err);
      toast.error(err.message || "Failed to update service status.");
      throw err;
    }
  };

  return {
    services,
    isLoading,
    error,
    refetch: fetchServices,
    postService,
    updateServiceStatus,
  };
};