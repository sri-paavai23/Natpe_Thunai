"use client";

import { useState, useEffect } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuth } from '@/context/AuthContext';

interface ServicePost {
  $id: string;
  title: string;
  description: string;
  price: number;
  collegeName: string;
  sellerId: string;
  sellerName: string;
  category: string;
  postedAt: string;
  isMerchantListing?: boolean; // Added for merchant listings
  servedCollegeIds?: string[]; // Added for merchant listings
}

const DB = APPWRITE_DATABASE_ID;
const COL = APPWRITE_SERVICES_COLLECTION_ID;

export const useServiceListings = (category?: string) => {
  const [services, setServices] = useState<ServicePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    const fetchServices = async () => {
      if (!userProfile?.collegeName && !userProfile?.servedCollegeIds) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const queries: string[] = [];

        // Base query for category if provided
        if (category) {
          queries.push(Query.equal('category', category));
        }

        // Fetch Peer listings (Same College)
        if (userProfile?.collegeName) {
          const peerQuery = [
            ...queries,
            Query.equal('collegeName', userProfile.collegeName),
            Query.equal('isMerchantListing', false), // Explicitly exclude merchant listings
            Query.orderDesc('$createdAt')
          ];
          const peerRes = await databases.listDocuments(DB, COL, peerQuery);
          setServices(prev => [...prev, ...peerRes.documents as ServicePost[]]);
        }

        // Fetch Merchant listings (Where servedCollegeIds contains user's college ID)
        if (userProfile?.collegeId || userProfile?.collegeName) { // Use collegeId if available, else collegeName
          const userCollegeIdentifier = userProfile.collegeId || userProfile.collegeName;
          const merchantQuery = [
            ...queries,
            Query.equal('isMerchantListing', true),
            Query.search('servedCollegeIds', userCollegeIdentifier), // Search for user's college in servedCollegeIds
            Query.orderDesc('$createdAt')
          ];
          const merchantRes = await databases.listDocuments(DB, COL, merchantQuery);
          setServices(prev => [...prev, ...merchantRes.documents as ServicePost[]]);
        }
        
        // After fetching, combine and sort all unique services
        setServices(prevServices => {
          const combined = [...prevServices];
          // Remove duplicates if any (based on $id)
          const unique = Array.from(new Set(combined.map(a => a.$id)))
            .map(id => combined.find(a => a.$id === id));
          
          // Sort by creation date descending
          return unique.sort((a, b) => 
            new Date(b!.$createdAt).getTime() - new Date(a!.$createdAt).getTime()
          ) as ServicePost[];
        });

      } catch (err: any) {
        console.error("Error fetching services:", err);
        setError(err.message || "Failed to fetch services.");
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [userProfile?.collegeName, userProfile?.collegeId, userProfile?.servedCollegeIds, category]);

  return { services, loading, error };
};