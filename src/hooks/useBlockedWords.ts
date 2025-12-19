"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_BLOCKED_WORDS_COLLECTION_ID } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { toast } from 'sonner';

export interface BlockedWord {
  $id: string;
  word: string;
  $createdAt: string;
}

export const useBlockedWords = () => {
  const [blockedWords, setBlockedWords] = useState<BlockedWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlockedWords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_BLOCKED_WORDS_COLLECTION_ID,
        [Query.orderAsc('word')]
      );
      setBlockedWords(response.documents as unknown as BlockedWord[]);
    } catch (err: any) {
      console.error("Error fetching blocked words:", err);
      setError(err.message || "Failed to fetch blocked words.");
      toast.error("Failed to load blocked words.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlockedWords();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_BLOCKED_WORDS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          setBlockedWords((prev) => [...prev, response.payload as unknown as BlockedWord].sort((a, b) => a.word.localeCompare(b.word)));
          toast.info(`New word "${(response.payload as any).word}" added to blocked list.`);
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          setBlockedWords((prev) => prev.filter((word) => word.$id !== (response.payload as any).$id));
          toast.info(`Word "${(response.payload as any).word}" removed from blocked list.`);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchBlockedWords]);

  const addBlockedWord = async (word: string) => {
    const trimmedWord = word.trim().toLowerCase();
    if (!trimmedWord) {
      toast.error("Blocked word cannot be empty.");
      return;
    }
    if (blockedWords.some(bw => bw.word === trimmedWord)) {
      toast.warning(`Word "${trimmedWord}" is already blocked.`);
      return;
    }

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_BLOCKED_WORDS_COLLECTION_ID,
        ID.unique(),
        { word: trimmedWord }
      );
      toast.success(`Word "${trimmedWord}" added to blocked list.`);
    } catch (err: any) {
      console.error("Error adding blocked word:", err);
      toast.error(err.message || "Failed to add blocked word.");
    }
  };

  const removeBlockedWord = async (wordId: string) => {
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_BLOCKED_WORDS_COLLECTION_ID,
        wordId
      );
      toast.info("Blocked word removed.");
    } catch (err: any) {
      console.error("Error removing blocked word:", err);
      toast.error(err.message || "Failed to remove blocked word.");
    }
  };

  return {
    blockedWords,
    isLoading,
    error,
    addBlockedWord,
    removeBlockedWord,
    refetchBlockedWords: fetchBlockedWords,
  };
};