"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { ID, Query } from 'appwrite';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID } from '@/lib/appwrite';
import { Product } from '@/lib/mockData'; // Assuming Product interface is available

interface BargainRequest {
  $id: string;
  productId: string;
  productTitle: string;
  sellerId: string;
  buyerId: string;
  requestedAmount: number;
  status: 'pending' | 'accepted' | 'denied';
  $createdAt: string;
}

interface BargainContextType {
  sendBargainRequest: (product: Product, requestedAmount: number) => Promise<void>;
  getBargainStatusForProduct: (productId: string) => { status: 'none' | 'pending' | 'accepted' | 'denied', requestId?: string };
  // Add other bargain-related functions as needed
}

const BargainContext = createContext<BargainContextType | undefined>(undefined);

export const BargainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bargainRequests, setBargainRequests] = useState<BargainRequest[]>([]); // This would ideally be fetched from Appwrite

  // Placeholder for fetching user's bargain requests
  // In a real app, you'd fetch these on load and keep them updated
  // For now, we'll simulate it.

  const sendBargainRequest = async (product: Product, requestedAmount: number) => {
    try {
      // Simulate sending a request
      const newRequest: BargainRequest = {
        $id: ID.unique(),
        productId: product.$id,
        productTitle: product.title,
        sellerId: product.sellerId,
        buyerId: 'current_user_id', // Replace with actual user ID from AuthContext
        requestedAmount,
        status: 'pending',
        $createdAt: new Date().toISOString(),
      };

      // In a real app, you'd save this to Appwrite
      // await databases.createDocument(
      //   APPWRITE_DATABASE_ID,
      //   APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID,
      //   ID.unique(),
      //   newRequest
      // );

      setBargainRequests((prev) => [...prev, newRequest]);
      toast.success(`Bargain request for "${product.title}" sent successfully!`);
    } catch (error: any) {
      console.error("Error sending bargain request:", error);
      toast.error(error.message || "Failed to send bargain request.");
      throw error;
    }
  };

  const getBargainStatusForProduct = (productId: string): { status: 'none' | 'pending' | 'accepted' | 'denied', requestId?: string } => {
    // This is a simplified check. In a real app, you'd filter by current user's ID as well.
    const request = bargainRequests.find(req => req.productId === productId);
    if (request) {
      return { status: request.status, requestId: request.$id };
    }
    return { status: 'none' };
  };

  return (
    <BargainContext.Provider value={{ sendBargainRequest, getBargainStatusForProduct }}>
      {children}
    </BargainContext.Provider>
  );
};

export const useBargainRequests = () => {
  const context = useContext(BargainContext);
  if (context === undefined) {
    throw new Error('useBargainRequests must be used within a BargainProvider');
  }
  return context;
};