"use client";

import React, { useEffect, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, account, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/context/Auth/AuthContext";
import { Loader2, DollarSign, Users, Shield, Trash2, Ban, UserCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import ChangeUserRoleForm from "@/components/forms/ChangeUserRoleForm";
import { Query } from "appwrite";

interface Transaction {
  $id: string;
  productId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  sellerUpiId: string;
  amount: number;
  status: "initiated" | "payment_confirmed_to_developer" | "commission_deducted" | "paid_to_seller" | "failed";
  type: "buy" | "rent";
  productTitle: string;
  commissionAmount?: number;
  netSellerAmount?: number;
  $createdAt: string;
}

const COMMISSION_RATE = 0.30; // 30% commission

const DeveloperDashboardPage = () => {
  const { userProfile, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockedWords, setBlockedWords] = useState<string[]>(["badword", "spam", "scam", "fraud"]); // Local state for blocked words
  const [newBlockedWord, setNewBlockedWord] = useState("");

  const isDeveloper = userProfile?.role === "developer";

  useEffect(() => {
    if (!isDeveloper) {
      toast.error("Access Denied: You must be a developer to view this page.");
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID
        );
        setTransactions(response.documents as unknown as Transaction[]);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to load transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    // Realtime subscription for transactions
    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          setTransactions((prev) => [response.payload as unknown as Transaction, ...prev]);
          toast.info(`New transaction initiated: "${(response.payload as any).productTitle}"`);
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          setTransactions((prev) =>
            prev.map((t) =>
              t.$id === (response.payload as any).$id ? (response.payload as unknown as Transaction) : t
            )
          );
          toast.info(`Transaction "${(response.payload as any).productTitle}" updated to status: ${(response.payload as any).status}`);
        }
      }
    );

    return () => {
      unsubscribe(); // Unsubscribe on component unmount
    };
  }, [isDeveloper]);

  // --- Content Moderation Handlers ---
  const handleAddBlockedWord = () => {
    const word = newBlockedWord.trim().toLowerCase();
    if (word && !blockedWords.includes(word)) {
      setBlockedWords((prev) => [...prev, word]);
      setNewBlockedWord("");
      toast.success(`Word "${word}" added to blocked list.`);
    } else if (word) {
      toast.warning(`Word "${word}" is already blocked.`);
    }
  };

  const handleRemoveBlockedWord = (wordToRemove: string) => {
    setBlockedWords((prev) => prev.filter((word) => word !== wordToRemove));
    toast.info(`Word "${wordToRemove}" removed from blocked list.`);
  };

  // --- User Management Handlers ---
  const handleSuspendUser = async (userId: string) => {
    if (userId === user?.$id) {
      toast.error("Cannot suspend your own account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to SUSPEND user ID: ${userId}? This action is reversible.`)) return;

    // NOTE: Client SDK cannot update another user's status. Simulating action.
    toast.warning(`Simulated suspension of user ${userId}. Actual suspension must be performed via Appwrite Console or Function.`);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.$id) {
      toast.error("Cannot delete your own account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE user ID: ${userId}? This action is irreversible.`)) return;

    try {
      // 1. Find and delete the user profile document first
      const profileResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );

      if (profileResponse.documents.length > 0) {
        const profileId = profileResponse.documents[0].$id;
        await databases.deleteDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_USER_PROFILES_COLLECTION_ID,
          profileId
        );
        toast.info(`User profile ${profileId} deleted.`);
      }

      // 2. Delete the user account
      // NOTE: Client SDK cannot delete another user's account. Simulating action.
      toast.warning(`Simulated deletion of user ${userId}. Actual deletion must be performed via Appwrite Console or Function.`);
      
      toast.success(`User ${userId} has been deleted (simulated).`);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user.");
    }
  };

  // --- Transaction Handlers (kept existing logic) ---
  const handleProcessPayment = async (transaction: Transaction) => {
    if (transaction.status !== "payment_confirmed_to_developer") {
      toast.error("Transaction is not in 'Payment Confirmed' status.");
      return;
    }

    setLoading(true);
    try {
      const commissionAmount = transaction.amount * COMMISSION_RATE;
      const netSellerAmount = transaction.amount - commissionAmount;

      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        transaction.$id,
        {
          status: "commission_deducted",
          commissionAmount: commissionAmount,
          netSellerAmount: netSellerAmount,
        }
      );
      toast.success(`Commission deducted for transaction ${transaction.$id}. Ready to pay seller.`);
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error(error.message || "Failed to process payment.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaySeller = async (transaction: Transaction) => {
    if (transaction.status !== "commission_deducted") {
      toast.error("Commission must be deducted before paying the seller.");
      return;
    }
    if (!transaction.netSellerAmount || !transaction.sellerUpiId) {
      toast.error("Missing net amount or seller UPI ID.");
      return;
    }

    setLoading(true);
    try {
      const upiDeepLink = `upi://pay?pa=${transaction.sellerUpiId}&pn=${encodeURIComponent(transaction.sellerName)}&am=${transaction.netSellerAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Payment for ${transaction.productTitle} (Net of commission)`)}`;
      
      window.open(upiDeepLink, "_blank");
      toast.info(`Redirecting to UPI app to pay ₹${transaction.netSellerAmount.toFixed(2)} to ${transaction.sellerName}.`);

      setTimeout(async () => {
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          transaction.$id,
          { status: "paid_to_seller" }
        );
        toast.success(`Successfully marked transaction ${transaction.$id} as 'Paid to Seller'.`);
      }, 3000); 

    } catch (error: any) {
      console.error("Error paying seller:", error);
      toast.error(error.message || "Failed to pay seller.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: Transaction["status"]) => {
    switch (status) {
      case "initiated":
        return "bg-yellow-500 text-white";
      case "payment_confirmed_to_developer":
        return "bg-blue-500 text-white";
      case "commission_deducted":
        return "bg-orange-500 text-white";
      case "paid_to_seller":
        return "bg-green-500 text-white";
      case "failed":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (!isDeveloper) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <XCircle className="h-10 w-10 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground text-center">You do not have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-secondary-neon" />
        <p className="ml-3 text-lg text-muted-foreground">Loading developer dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Developer Dashboard</h1>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* --- User Management Section --- */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary-neon" /> User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage user roles and account status for community safety.
            </p>
            
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-secondary-neon" /> Change User Role (Developer/User)
            </h3>
            <ChangeUserRoleForm />

            <Separator className="my-4" />

            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Ban className="h-4 w-4 text-destructive" /> Suspend/Delete User Account
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Enter the target user's Appwrite User ID to manage their account status.
            </p>
            <form className="flex flex-col sm:flex-row gap-2">
              <Input
                id="targetUserIdAction"
                type="text"
                placeholder="Enter target User ID"
                className="flex-grow bg-input text-foreground border-border focus:ring-ring focus:border-ring"
              />
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  const userId = (document.getElementById('targetUserIdAction') as HTMLInputElement)?.value;
                  if (userId) handleDeleteUser(userId);
                }}
                className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete User
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const userId = (document.getElementById('targetUserIdAction') as HTMLInputElement)?.value;
                  if (userId) handleSuspendUser(userId);
                }}
                className="w-full sm:w-auto border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
              >
                <Ban className="mr-2 h-4 w-4" /> Suspend User
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* --- Content Moderation Section (Word Blocking) --- */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-secondary-neon" /> Content Moderation (Word Blocking)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage the list of words blocked from user-submitted content (feedback, reports, etc.) to maintain a safe community environment.
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Add new blocked word"
                value={newBlockedWord}
                onChange={(e) => setNewBlockedWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBlockedWord()}
                className="flex-grow bg-input text-foreground border-border focus:ring-ring focus:border-ring"
              />
              <Button onClick={handleAddBlockedWord} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 p-3 border border-border rounded-md bg-background">
              {blockedWords.length > 0 ? (
                blockedWords.map((word) => (
                  <Badge key={word} variant="destructive" className="cursor-pointer" onClick={() => handleRemoveBlockedWord(word)}>
                    {word} <XCircle className="ml-1 h-3 w-3" />
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No words currently blocked.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* --- All Transactions Section --- */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-secondary-neon" /> All Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 overflow-x-auto">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No transactions found.</p>
            ) : (
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Product</TableHead>
                    <TableHead className="text-foreground">Buyer</TableHead>
                    <TableHead className="text-foreground">Seller</TableHead>
                    <TableHead className="text-foreground">Amount</TableHead>
                    <TableHead className="text-foreground">Commission</TableHead>
                    <TableHead className="text-foreground">Net to Seller</TableHead>
                    <TableHead className="text-foreground">Seller UPI</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-right text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.$id}>
                      <TableCell className="font-medium text-foreground">{tx.productTitle}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.buyerName}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.sellerName}</TableCell>
                      <TableCell className="text-foreground">₹{tx.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-foreground">₹{(tx.commissionAmount || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-foreground">₹{(tx.netSellerAmount || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.sellerUpiId}</TableCell>
                      <TableCell>
                        <Badge className={cn("px-2 py-1 text-xs font-semibold", getStatusBadgeClass(tx.status))}>
                          {tx.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-y-1">
                        {tx.status === "payment_confirmed_to_developer" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleProcessPayment(tx)}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            Process Commission
                          </Button>
                        )}
                        {tx.status === "commission_deducted" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handlePaySeller(tx)}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
                          >
                            Pay Seller
                          </Button>
                        )}
                        {tx.status === "paid_to_seller" && (
                          <span className="text-green-500 text-sm">Completed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default DeveloperDashboardPage;