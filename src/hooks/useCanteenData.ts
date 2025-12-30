import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CANTEEN_COLLECTION_ID, client } from '@/lib/appwrite'; // Added client for subscribe
import { Query, ID } from 'appwrite';
import { toast } from 'sonner';
import { Models } from 'appwrite';

export interface CanteenData extends Models.Document {
  name: string;
  collegeId: string;
  collegeName: string;
  menu: CanteenMenuItem[];
  isOpen: boolean;
  lastUpdated: string;
}

export interface CanteenMenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

interface CanteenDataState {
  canteens: CanteenData[];
  isLoading: boolean;
  error: string | null;
  addCanteen: (name: string, collegeId: string) => Promise<void>;
  updateCanteenStatus: (canteenId: string, isOpen: boolean) => Promise<void>;
  updateCanteenMenu: (canteenId: string, menu: CanteenMenuItem[]) => Promise<void>;
  deleteCanteen: (canteenId: string) => Promise<void>;
  refetch: () => void;
}

export const useCanteenData = (): CanteenDataState => {
  const { userProfile, loading: isAuthLoading } = useAuth(); // Corrected 'isLoading' to 'loading'
  const [allCanteens, setAllCanteens] = useState<CanteenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCanteens = useCallback(async () => {
    if (isAuthLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      let queries = [
        Query.orderAsc('name'),
        Query.limit(100)
      ];

      // If user is not a developer, filter by their college
      if (userProfile?.role !== 'developer' && userProfile?.collegeName) { // Corrected userType to role, added collegeName
        queries.push(Query.equal('collegeName', userProfile.collegeName));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        queries
      );
      setAllCanteens(response.documents as unknown as CanteenData[]); // Cast to unknown first
    } catch (err: any) {
      console.error("Error fetching canteen data:", err);
      setError(err.message || "Failed to fetch canteen data.");
      setAllCanteens([]);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName, userProfile?.role, isAuthLoading]); // Added userProfile.role to dependencies

  useEffect(() => {
    fetchCanteens();
  }, [fetchCanteens]);

  const addCanteen = useCallback(async (name: string, collegeId: string) => {
    if (!userProfile?.collegeName) {
      toast.error("Your profile is missing college information. Cannot add canteen.");
      return;
    }
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        ID.unique(),
        {
          name,
          collegeId,
          collegeName: userProfile.collegeName, // Use collegeName from profile
          menu: [],
          isOpen: true,
          lastUpdated: new Date().toISOString(),
        }
      );
      toast.success("Canteen added successfully!");
      fetchCanteens();
    } catch (err: any) {
      console.error("Error adding canteen:", err);
      toast.error(err.message || "Failed to add canteen.");
    }
  }, [userProfile?.collegeName, fetchCanteens]);

  const updateCanteenStatus = useCallback(async (canteenId: string, isOpen: boolean) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        canteenId,
        { isOpen, lastUpdated: new Date().toISOString() }
      );
      toast.success("Canteen status updated!");
      fetchCanteens();
    } catch (err: any) {
      console.error("Error updating canteen status:", err);
      toast.error(err.message || "Failed to update canteen status.");
    }
  }, [fetchCanteens]);

  const updateCanteenMenu = useCallback(async (canteenId: string, menu: CanteenMenuItem[]) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        canteenId,
        { menu, lastUpdated: new Date().toISOString() }
      );
      toast.success("Canteen menu updated!");
      fetchCanteens();
    } catch (err: any) {
      console.error("Error updating canteen menu:", err);
      toast.error(err.message || "Failed to update canteen menu.");
    }
  }, [fetchCanteens]);

  const deleteCanteen = useCallback(async (canteenId: string) => {
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        canteenId
      );
      toast.success("Canteen deleted!");
      fetchCanteens();
    } catch (err: any) {
      console.error("Error deleting canteen:", err);
      toast.error(err.message || "Failed to delete canteen.");
    }
  }, [fetchCanteens]);

  // Real-time subscription
  useEffect(() => {
    if (!userProfile?.collegeName) return;

    const unsubscribe = client.subscribe( // Corrected to client.subscribe
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_CANTEEN_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as CanteenData; // Cast to unknown first
        if (payload.collegeName !== userProfile.collegeName && userProfile.role !== 'developer') {
          return; // Only process updates for the user's college or if developer
        }

        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          setAllCanteens(prev => [payload, ...prev]);
        } else if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          setAllCanteens(prev => prev.map(c => c.$id === payload.$id ? payload : c));
        } else if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
          setAllCanteens(prev => prev.filter(c => c.$id !== payload.$id));
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userProfile?.collegeName, userProfile?.role]);

  return {
    canteens: allCanteens,
    isLoading,
    error,
    addCanteen,
    updateCanteenStatus,
    updateCanteenMenu,
    deleteCanteen,
    refetch: fetchCanteens,
  };
};