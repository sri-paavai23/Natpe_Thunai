"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_REPORTS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface Report extends Models.Document {
  reporterId: string;
  reporterName: string;
  productId: string;
  productTitle: string;
  sellerId: string;
  reason: string;
  message?: string;
  status: "Pending" | "Reviewed" | "Resolved" | "Dismissed";
  collegeName: string;
}

interface ReportsState {
  reports: Report[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  updateReportStatus: (reportId: string, newStatus: Report['status']) => Promise<void>;
}

export const useReports = (collegeNameFilter?: string): ReportsState => {
  const { userProfile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const queries = [Query.orderDesc('$createdAt')];
      if (collegeNameFilter) {
        queries.push(Query.equal('collegeName', collegeNameFilter));
      } else if (userProfile?.role !== 'developer' && userProfile?.collegeName) {
        // For regular users, if no explicit filter is passed, use their collegeName
        queries.push(Query.equal('collegeName', userProfile.collegeName));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_REPORTS_COLLECTION_ID,
        queries
      );
      setReports(response.documents as unknown as Report[]);
    } catch (err: any) {
      console.error("Error fetching reports:", err);
      setError(err.message || "Failed to load reports.");
      toast.error("Failed to load reports.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeNameFilter, userProfile?.collegeName, userProfile?.role]);

  const updateReportStatus = useCallback(async (reportId: string, newStatus: Report['status']) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_REPORTS_COLLECTION_ID,
        reportId,
        { status: newStatus }
      );
      toast.success(`Report ${reportId} status updated to ${newStatus}.`);
      fetchReports(); // Refetch to update local state
    } catch (err: any) {
      console.error("Error updating report status:", err);
      toast.error(err.message || "Failed to update report status.");
      throw err;
    }
  }, [fetchReports]);

  useEffect(() => {
    fetchReports();

    let subscriptionFilterCollege = '';
    if (collegeNameFilter) {
        subscriptionFilterCollege = collegeNameFilter;
    } else if (userProfile?.role !== 'developer' && userProfile?.collegeName) {
        subscriptionFilterCollege = userProfile.collegeName;
    }

    if (!subscriptionFilterCollege && userProfile?.role !== 'developer') return;

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_REPORTS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as Report;

        if (subscriptionFilterCollege && payload.collegeName !== subscriptionFilterCollege) {
            return;
        }

        setReports(prev => {
          const existingIndex = prev.findIndex(r => r.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New report submitted for "${payload.productTitle}".`);
              return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              toast.info(`Report for "${payload.productTitle}" updated to ${payload.status}.`);
              return prev.map(r => r.$id === payload.$id ? payload : r);
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              toast.info(`Report for "${payload.productTitle}" removed.`);
              return prev.filter(r => r.$id !== payload.$id);
            }
          }
          return prev;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchReports, collegeNameFilter, userProfile?.collegeName, userProfile?.role]);

  return { reports, isLoading, error, refetch: fetchReports, updateReportStatus };
};