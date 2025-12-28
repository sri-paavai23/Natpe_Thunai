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
const REPORTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID;

export type ReportStatus = "Pending" | "Reviewed" | "Dismissed";
export type ListingType = 'product' | 'service' | 'errand' | 'canteen' | 'tournament' | 'collaboratorPost' | 'lostFoundItem';

export interface Report extends Models.Document {
  reporterId: string;
  reporterName: string;
  collegeName: string;
  listingId: string;
  listingType: ListingType;
  reason: string;
  description?: string;
  status: ReportStatus;
  reviewedBy?: string; // Developer ID
  reviewedAt?: string; // ISO date string
}

interface ReportsState {
  reports: Report[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  submitReport: (reportData: Omit<Report, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "reporterId" | "reporterName" | "collegeName" | "status" | "reviewedBy" | "reviewedAt">) => Promise<void>;
  updateReportStatus: (reportId: string, newStatus: ReportStatus, reviewedBy?: string) => Promise<void>;
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
      const queries = [
        Query.orderDesc('$createdAt'),
        collegeNameFilter ? Query.equal('collegeName', collegeNameFilter) : Query.limit(100) // Filter by college if provided
      ];

      const response = await databases.listDocuments(
        DATABASE_ID,
        REPORTS_COLLECTION_ID,
        queries
      );
      setReports(response.documents as Report[]);
    } catch (err: any) {
      console.error("Error fetching reports:", err);
      setError("Failed to fetch reports.");
      toast.error("Failed to load reports.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeNameFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const submitReport = async (reportData: Omit<Report, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "reporterId" | "reporterName" | "collegeName" | "status" | "reviewedBy" | "reviewedAt">) => {
    if (!userProfile?.collegeName) {
      toast.error("You must be logged in and have a college name set to submit a report.");
      return;
    }

    try {
      const newReport = await databases.createDocument(
        DATABASE_ID,
        REPORTS_COLLECTION_ID,
        ID.unique(),
        {
          ...reportData,
          reporterId: userProfile.$id!,
          reporterName: userProfile.name,
          collegeName: userProfile.collegeName,
          status: "Pending", // Default status
        }
      );
      setReports(prev => [newReport as Report, ...prev]);
      toast.success("Report submitted successfully!");
    } catch (err: any) {
      console.error("Error submitting report:", err);
      toast.error(err.message || "Failed to submit report.");
      throw err;
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: ReportStatus, reviewedBy?: string) => {
    if (!userProfile) {
      toast.error("You must be logged in to update a report.");
      return;
    }

    try {
      const dataToUpdate: Partial<Report> = { status: newStatus };
      if (reviewedBy) {
        dataToUpdate.reviewedBy = reviewedBy;
        dataToUpdate.reviewedAt = new Date().toISOString();
      }

      const updatedReport = await databases.updateDocument(
        DATABASE_ID,
        REPORTS_COLLECTION_ID,
        reportId,
        dataToUpdate
      );
      setReports(prev => prev.map(report => report.$id === reportId ? { ...report, ...dataToUpdate } : report));
      toast.success(`Report status updated to ${newStatus}!`);
    } catch (err: any) {
      console.error("Error updating report status:", err);
      toast.error(err.message || "Failed to update report status.");
      throw err;
    }
  };

  return {
    reports,
    isLoading,
    error,
    refetch: fetchReports,
    submitReport,
    updateReportStatus,
  };
};