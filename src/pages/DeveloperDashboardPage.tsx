"use client";

import React, { useEffect, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_USER_PROFILES_COLLECTION_ID, APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { Loader2, DollarSign, Users, Shield, Trash2, Ban, UserCheck, XCircle, MessageSquareText, Clock, Send, Truck, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import ChangeUserRoleForm from "@/components/forms/ChangeUserRoleForm";
import { Query, ID } from "appwrite";
import { useDeveloperMessages, DeveloperMessage } from "@/hooks/useDeveloperMessages";
import { calculateCommissionRate } from "@/utils/commission";
import { useReports, Report } from "@/hooks/useReports";
import { useBlockedWords } from "@/hooks/useBlockedWords"; // NEW IMPORT

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
  collegeName: string;
  ambassadorDelivery?: boolean;
  ambassadorMessage?: string;
  utrId?: string;
}

const DeveloperDashboardPage = () => {
  const { user, userProfile } = useAuth();
  const { messages, isLoading: isMessagesLoading, error: messagesError, refetch: refetchMessages } = useDeveloperMessages(); 
  const { reports, isLoading: isReportsLoading, error: reportsError, refetch: refetchReports, updateReportStatus } = useReports();
  const { blockedWords, isLoading: isBlockedWordsLoading, error: blockedWordsError, addBlockedWord, removeBlockedWord } = useBlockedWords(); // NEW: Use blocked words hook
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [newBlockedWord, setNewBlockedWord] = useState("");
  const [targetUserIdAction, setTargetUserIdAction] = useState("");
  const [developerReply, setDeveloperReply] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const isDeveloper = userProfile?.role === "developer";

  useEffect(() => {
    if (!isDeveloper) {
      setLoadingTransactions(false);
      return;
    }

    const fetchTransactions = async () => {
      setLoadingTransactions(true);
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
        setLoadingTransactions(false);
      }
    };

    fetchTransactions();

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
          const updatedTx = response.payload as unknown as Transaction;
          toast.info(`Transaction "${updatedTx.productTitle}" updated to status: ${updatedTx.status.replace(/_/g, ' ')}`);
          if (updatedTx.status === 'payment_confirmed_to_developer' && updatedTx.utrId) {
            toast.success(`New Payment Claim: Order ${updatedTx.$id} by ${updatedTx.buyerName}. TR ID: ${updatedTx.utrId}. Amount: ${updatedTx.amount}. Commission: ${updatedTx.commissionAmount}. Net to Seller: ${updatedTx.netSellerAmount}.`);
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isDeveloper]);

  // --- Content Moderation Handlers ---
  const handleAddBlockedWord = () => {
    addBlockedWord(newBlockedWord);
    setNewBlockedWord("");
  };

  // --- User Management Handlers ---
  const handleSuspendUser = async (userId: string) => {
    if (userId === user?.$id) {
      toast.error("Cannot suspend your own account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to SUSPEND user ID: ${userId}? This action is reversible.`)) return;

    toast.warning(`Simulated suspension of user ${userId}. Actual suspension must be performed via Appwrite Console or Function.`);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.$id) {
      toast.error("Cannot delete your own account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE user ID: ${userId}? This action is irreversible.`)) return;

    try {
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

      toast.warning(`Simulated deletion of user ${userId}. Actual deletion must be performed via Appwrite Console or Function.`);
      
      toast.success(`User ${userId} has been deleted (simulated).`);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user.");
    }
  };

  // --- Transaction Handlers (updated logic) ---
  const handleProcessPayment = async (transaction: Transaction) => {
    if (transaction.status !== "payment_confirmed_to_developer") {
      toast.error("Transaction is not in 'Payment Confirmed' status.");
      return;
    }

    setLoadingTransactions(true);
    try {
      const sellerProfileResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', transaction.sellerId)]
      );

      if (sellerProfileResponse.documents.length === 0) {
        toast.error("Seller profile not found. Cannot calculate commission.");
        setLoadingTransactions(false);
        return;
      }

      const sellerProfile = sellerProfileResponse.documents[0] as any;
      const sellerLevel = sellerProfile.level ?? 1;
      
      const commissionRate = calculateCommissionRate(sellerLevel);
      
      const commissionAmount = transaction.amount * commissionRate;
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
      toast.success(`Commission (${(commissionRate * 100).toFixed(2)}%) deducted for transaction ${transaction.$id}. Ready to pay seller.`);
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error(error.message || "Failed to process payment.");
    } finally {
      setLoadingTransactions(false);
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

    setLoadingTransactions(true);
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
      setLoadingTransactions(false);
    }
  };

  // NEW: Handle developer reply
  const handleDeveloperReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReply = developerReply.trim();

    if (!trimmedReply) {
      toast.error("Reply message cannot be empty.");
      return;
    }
    if (!user || !userProfile) {
      toast.error("Developer not logged in.");
      return;
    }

    setIsReplying(true);
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          senderId: user.$id,
          senderName: user.name,
          message: trimmedReply,
          isDeveloper: true,
          collegeName: userProfile.collegeName,
        }
      );
      setDeveloperReply("");
      toast.success("Developer reply sent!");
      refetchMessages();
    } catch (error: any) {
      console.error("Error sending developer reply:", error);
      toast.error(error.message || "Failed to send reply.");
    } finally {
      setIsReplying(false);
    }
  };

  const getStatusBadgeClass = (status: Transaction["status"] | Report["status"]) => {
    switch (status) {
      case "initiated":
      case "Pending":
        return "bg-yellow-500 text-white";
      case "payment_confirmed_to_developer":
      case "Reviewed":
        return "bg-blue-500 text-white";
      case "commission_deducted":
        return "bg-orange-500 text-white";
      case "paid_to_seller":
      case "Resolved":
        return "bg-green-500 text-white";
      case "failed":
      case "Dismissed":
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

  if (loadingTransactions && isMessagesLoading && isReportsLoading && isBlockedWordsLoading) {
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
        
        {/* --- Developer Messages Section --- */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-secondary-neon" /> User Messages (Last 48h)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" /> Messages are automatically filtered to show only those posted in the last 48 hours.
            </p>
            {isMessagesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading messages...</p>
              </div>
            ) : messagesError ? (
              <p className="text-center text-destructive py-4">Error loading messages: {messagesError}</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No recent user messages found.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.map((msg) => (
                  <div key={msg.$id} className={cn(
                    "p-3 rounded-md border",
                    msg.isDeveloper ? "bg-primary/10 border-primary" : "bg-background border-border"
                  )}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-foreground">{msg.senderName} ({msg.collegeName})</span>
                      <span className="text-muted-foreground">{new Date(msg.$createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-foreground break-words">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleDeveloperReply} className="flex gap-2 mt-4">
              <Input
                type="text"
                placeholder="Reply to users..."
                value={developerReply}
                onChange={(e) => setDeveloperReply(e.target.value)}
                className="flex-grow bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                disabled={isReplying}
              />
              <Button type="submit" size="icon" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={isReplying}>
                {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Send Reply</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* --- Reports Section --- */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" /> User Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 overflow-x-auto">
            {isReportsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading reports...</p>
              </div>
            ) : reportsError ? (
              <p className="text-center text-destructive py-4">Error loading reports: {reportsError}</p>
            ) : reports.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No new reports found.</p>
            ) : (
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Product</TableHead>
                    <TableHead className="text-foreground">Reporter</TableHead>
                    <TableHead className="text-foreground">Seller</TableHead>
                    <TableHead className="text-foreground">College</TableHead>
                    <TableHead className="text-foreground">Reason</TableHead>
                    <TableHead className="text-foreground">Message</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-right text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.$id}>
                      <TableCell className="font-medium text-foreground">{report.productTitle}</TableCell>
                      <TableCell className="text-muted-foreground">{report.reporterName}</TableCell>
                      <TableCell className="text-muted-foreground">{report.sellerId}</TableCell>
                      <TableCell className="text-muted-foreground">{report.collegeName}</TableCell>
                      <TableCell className="text-muted-foreground">{report.reason}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{report.message || "N/A"}</TableCell>
                      <TableCell>
                        <Badge className={cn("px-2 py-1 text-xs font-semibold", getStatusBadgeClass(report.status))}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-y-1 min-w-[150px]">
                        {report.status === "Pending" && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => updateReportStatus(report.$id, "Reviewed")}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            >
                              Mark Reviewed
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => updateReportStatus(report.$id, "Dismissed")}
                              className="w-full bg-red-600 hover:bg-red-700 text-white text-xs"
                            >
                              Dismiss
                            </Button>
                          </>
                        )}
                        {(report.status === "Reviewed" || report.status === "Dismissed") && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateReportStatus(report.$id, "Resolved")}
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Separator className="my-6" />
        
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
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="targetUserIdAction"
                type="text"
                placeholder="Enter target User ID"
                value={targetUserIdAction}
                onChange={(e) => setTargetUserIdAction(e.target.value)}
                className="flex-grow bg-input text-foreground border-border focus:ring-ring focus:border-ring"
              />
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleDeleteUser(targetUserIdAction)}
                disabled={!targetUserIdAction}
                className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:hover:bg-destructive/90"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete User
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSuspendUser(targetUserIdAction)}
                disabled={!targetUserIdAction}
                className="w-full sm:w-auto border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
              >
                <Ban className="mr-2 h-4 w-4" /> Suspend User
              </Button>
            </div>
            <p className="text-xs text-destructive-foreground mt-1">
              Note: Deletion and Suspension are simulated on the client side due to Appwrite SDK limitations.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* --- Content Moderation Section (Word Blocking) --- */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-secondary-neon" /> Content Moderation (Blocked Words)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              This list is used to filter inappropriate language in user feedback and reports.
            </p>
            {isBlockedWordsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading blocked words...</p>
              </div>
            ) : blockedWordsError ? (
              <p className="text-center text-destructive py-4">Error loading blocked words: {blockedWordsError}</p>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Add new blocked word"
                    value={newBlockedWord}
                    onChange={(e) => setNewBlockedWord(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddBlockedWord()}
                    className="flex-grow bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                    disabled={isBlockedWordsLoading}
                  />
                  <Button onClick={handleAddBlockedWord} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isBlockedWordsLoading}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 p-3 border border-border rounded-md bg-background">
                  {blockedWords.length > 0 ? (
                    blockedWords.map((blockedWord) => (
                      <Badge key={blockedWord.$id} variant="destructive" className="cursor-pointer" onClick={() => removeBlockedWord(blockedWord.$id)}>
                        {blockedWord.word} <XCircle className="ml-1 h-3 w-3" />
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No words currently blocked.</p>
                  )}
                </div>
              </>
            )}
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
            {loadingTransactions ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No transactions found.</p>
            ) : (
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Product</TableHead>
                    <TableHead className="text-foreground">Buyer</TableHead>
                    <TableHead className="text-foreground">Seller</TableHead>
                    <TableHead className="text-foreground">College</TableHead>
                    <TableHead className="text-foreground">Amount</TableHead>
                    <TableHead className="text-foreground">Commission</TableHead>
                    <TableHead className="text-foreground">Net to Seller</TableHead>
                    <TableHead className="text-foreground">Seller UPI</TableHead>
                    <TableHead className="text-foreground">Delivery</TableHead>
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
                      <TableCell className="text-muted-foreground">{tx.collegeName}</TableCell>
                      <TableCell className="text-foreground">₹{tx.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-foreground">₹{(tx.commissionAmount || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-foreground">₹{(tx.netSellerAmount || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.sellerUpiId}</TableCell>
                      <TableCell>
                        {tx.ambassadorDelivery ? (
                          <Badge variant="outline" className="flex items-center gap-1 bg-blue-100 text-blue-800">
                            <Truck className="h-3 w-3" /> Ambassador
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Direct</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("px-2 py-1 text-xs font-semibold", getStatusBadgeClass(tx.status))}>
                          {tx.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-y-1 min-w-[150px]">
                        {tx.status === "payment_confirmed_to_developer" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleProcessPayment(tx)}
                            disabled={loadingTransactions}
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
                            disabled={loadingTransactions}
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