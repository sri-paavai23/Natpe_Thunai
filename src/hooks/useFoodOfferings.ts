"use client";

import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_OFFERINGS_COLLECTION_ID, APPWRITE_FOOD_REQUESTS_COLLECTION_ID } from "@/lib/appwrite";
import { Query, Models } from "appwrite";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export interface FoodOffering extends Models.Document {
  title: string;
  description: string;
  category: string; // e.g., "homemade-meal", "home-remedy", "other"
  price: number;
  contact: string;
  posterId: string;
  posterName: string;
  collegeName: string;
  status: "available" | "sold-out" | "unavailable";
}

export interface FoodRequest extends Models.Document {
  title: string;
  description: string;
  category: string; // e.g., "custom-meal", "special-remedy", "other"
  contact: string;
  requesterId: string;
  requesterName: string;
  collegeName: string;
  status: "open" | "fulfilled" | "cancelled";
}

export const useFoodOfferings = (collegeName?: string) => {
  const [offerings, setOfferings] = useState<FoodOffering[]>([]);
  const [requests, setRequests] = useState<FoodRequest[]>([]);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [errorOfferings, setErrorOfferings] = useState<string | null>(null);
  const [errorRequests, setErrorRequests] = useState<string | null>(null);
  const { userProfile } = useAuth();

  const targetCollegeName = collegeName || userProfile?.collegeName;

  // Fetch Offerings
  useEffect(() => {
    const fetchOfferings = async () => {
      setIsLoadingOfferings(true);
      setErrorOfferings(null);
      try {
        let queries = [Query.orderDesc("$createdAt")];
        if (targetCollegeName) {
          queries.push(Query.equal("collegeName", targetCollegeName));
        }
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_FOOD_OFFERINGS_COLLECTION_ID,
          queries
        );
        setOfferings(response.documents as FoodOffering[]);
      } catch (err: any) {
        console.error("Error fetching food offerings:", err);
        setErrorOfferings(err.message || "Failed to fetch food offerings.");
      } finally {
        setIsLoadingOfferings(false);
      }
    };

    fetchOfferings();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_FOOD_OFFERINGS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          const newOffering = response.payload as FoodOffering;
          if (newOffering.collegeName === targetCollegeName) {
            setOfferings((prev) => [newOffering, ...prev]);
          }
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          const updatedOffering = response.payload as FoodOffering;
          setOfferings((prev) =>
            prev.map((o) => (o.$id === updatedOffering.$id ? updatedOffering : o))
          );
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          const deletedOffering = response.payload as FoodOffering;
          setOfferings((prev) => prev.filter((o) => o.$id !== deletedOffering.$id));
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [targetCollegeName]);

  // Fetch Requests
  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoadingRequests(true);
      setErrorRequests(null);
      try {
        let queries = [Query.orderDesc("$createdAt")];
        if (targetCollegeName) {
          queries.push(Query.equal("collegeName", targetCollegeName));
        }
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_FOOD_REQUESTS_COLLECTION_ID,
          queries
        );
        setRequests(response.documents as FoodRequest[]);
      } catch (err: any) {
        console.error("Error fetching food requests:", err);
        setErrorRequests(err.message || "Failed to fetch food requests.");
      } finally {
        setIsLoadingRequests(false);
      }
    };

    fetchRequests();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_FOOD_REQUESTS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          const newRequest = response.payload as FoodRequest;
          if (newRequest.collegeName === targetCollegeName) {
            setRequests((prev) => [newRequest, ...prev]);
          }
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          const updatedRequest = response.payload as FoodRequest;
          setRequests((prev) =>
            prev.map((r) => (r.$id === updatedRequest.$id ? updatedRequest : r))
          );
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          const deletedRequest = response.payload as FoodRequest;
          setRequests((prev) => prev.filter((r) => r.$id !== deletedRequest.$id));
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [targetCollegeName]);

  return {
    offerings,
    requests,
    isLoadingOfferings,
    isLoadingRequests,
    errorOfferings,
    errorRequests,
  };
};