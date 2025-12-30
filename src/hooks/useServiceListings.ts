import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID, client } from '@/lib/appwrite'; // Added client for subscribe
import { Models, Query } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface ServicePost extends Models.Document {
  posterId: string;
  posterName: string;
  title: string;
  description: string;
  category: string;
  price: number;
  contact: string; // UPI ID or contact info
  collegeName: string;
  imageUrl?: string;
  status: 'active' | 'completed' | 'cancelled';
  isAgeGated: boolean; // NEW: For age-gated services
}

interface UseServiceListingsState {
  services: ServicePost[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  addService: (service: Omit<ServicePost, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'>) => Promise<void>;
  updateService: (serviceId: string, data: Partial<ServicePost>) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
}

export const useServiceListings = (categories?: string | string[]): UseServiceListingsState => { // NEW: Accept string or string[]
  const { userProfile, loading: isAuthLoading } = useAuth(); // Corrected 'isLoading' to 'loading'
  const [services, setServices] = useState<ServicePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (isAuthLoading) return;

    setIsLoading(true);
    setError(null);

    if (!userProfile?.collegeName) { // Only fetch if collegeName is available
      setIsLoading(false);
      setServices([]);
      return;
    }

    try {
      let queries = [
        Query.equal('collegeName', userProfile.collegeName),
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ];

      if (categories) {
        if (Array.isArray(categories)) {
          queries.push(Query.or(categories.map(cat => Query.equal('category', cat))));
        } else {
          queries.push(Query.equal('category', categories));
        }
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        queries
      );
      setServices(response.documents as unknown as ServicePost[]); // Cast to unknown first
    } catch (err: any) {
      console.error("Error fetching service listings:", err);
      setError(err.message || "Failed to fetch service listings.");
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName, categories, isAuthLoading]); // NEW: Add categories to dependency array

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const addService = useCallback(async (service: Omit<ServicePost, '$id' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'>) => {
    if (!userProfile?.collegeName) {
      toast.error("Your profile is missing college information. Cannot add service.");
      return;
    }
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        { ...service, collegeName: userProfile.collegeName }
      );
      toast.success("Service added successfully!");
      fetchServices();
    } catch (err: any) {
      console.error("Error adding service:", err);
      toast.error(err.message || "Failed to add service.");
    }
  }, [userProfile?.collegeName, fetchServices]);

  const updateService = useCallback(async (serviceId: string, data: Partial<ServicePost>) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        serviceId,
        data
      );
      toast.success("Service updated successfully!");
      fetchServices();
    } catch (err: any) {
      console.error("Error updating service:", err);
      toast.error(err.message || "Failed to update service.");
    }
  }, [fetchServices]);

  const deleteService = useCallback(async (serviceId: string) => {
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        serviceId
      );
      toast.success("Service deleted successfully!");
      fetchServices();
    } catch (err: any) {
      console.error("Error deleting service:", err);
      toast.error(err.message || "Failed to delete service.");
    }
  }, [fetchServices]);

  // Real-time subscription
  useEffect(() => {
    if (!userProfile?.collegeName) return;

    const unsubscribe = client.subscribe( // Corrected to client.subscribe
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_SERVICES_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as ServicePost; // Cast to unknown first
        if (payload.collegeName !== userProfile.collegeName) {
          return; // Only process updates for the user's college
        }

        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          setServices(prev => [payload, ...prev]);
        } else if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          setServices(prev => prev.map(s => s.$id === payload.$id ? payload : s));
        } else if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
          setServices(prev => prev.filter(s => s.$id !== payload.$id));
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchServices, userProfile?.collegeName, categories]); // NEW: Add categories to dependency array

  return {
    services,
    isLoading,
    error,
    refetch: fetchServices,
    addService,
    updateService,
    deleteService,
  };
};