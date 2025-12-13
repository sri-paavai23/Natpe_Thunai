"use client";

import { databases, APPWRITE_DATABASE_ID, APPWRITE_LOST_FOUND_COLLECTION_ID } from "@/lib/appwrite";
import { Query, Models } from "appwrite";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export interface LostFoundPost extends Models.Document {
  title: string;
  description: string;
  type: "lost" | "found"; // 'lost' or 'found'
  location: string;
  contact: string;
  posterId: string;
  posterName: string;
  collegeName: string;
  status: "active" | "resolved";
}

export const useLostFoundListings = (collegeName?: string) => {
  const [listings, setListings] = useState<LostFoundPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  const targetCollegeName = collegeName || userProfile?.collegeName;

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let queries = [Query.orderDesc("$createdAt")];
        if (targetCollegeName) {
          queries.push(Query.equal("collegeName", targetCollegeName));
        }
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_LOST_FOUND_COLLECTION_ID,
          queries
        );
        setListings(response.documents as unknown as LostFoundPost[]);
      } catch (err: any) {
        console.error("Error fetching lost and found listings:", err);
        setError(err.message || "Failed to fetch lost and found listings.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();

    // Real-time subscription
    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_LOST_FOUND_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          const newListing = response.payload as unknown as LostFoundPost;
          if (newListing.collegeName === targetCollegeName) {
            setListings((prev) => [newListing, ...prev]);
          }
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          const updatedListing = response.payload as unknown as LostFoundPost;
          setListings((prev) =>
            prev.map((l) => (l.$id === updatedListing.$id ? updatedListing : l))
          );
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          const deletedListing = response.payload as unknown as LostFoundPost;
          setListings((prev) => prev.filter((l) => l.$id !== deletedListing.$id));
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [targetCollegeName]);

  return { listings, isLoading, error };
};