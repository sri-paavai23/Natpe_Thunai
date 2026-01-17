"use client";

import React, { useEffect, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  databases, 
  APPWRITE_DATABASE_ID, 
  APPWRITE_TRANSACTIONS_COLLECTION_ID, 
  APPWRITE_USER_PROFILES_COLLECTION_ID, 
  APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID 
} from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { Loader2, DollarSign, Shield, XCircle, MessageSquareText, Clock, Send, Truck, Flag, Briefcase, Utensils, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Query, ID } from "appwrite";
import { useDeveloperMessages } from "@/hooks/useDeveloperMessages";
import { calculateCommissionRate } from "@/utils/commission";
import { useReports, Report } from "@/hooks/useReports";
import { useBlockedWords } from "@/hooks/useBlockedWords";

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
  type: "buy" | "rent" | "service" | "food" | "errand" | "cash-exchange";
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
  const { blockedWords, isLoading: isBlockedWordsLoading, error: blockedWordsError, addBlockedWord, removeBlockedWord } = useBlockedWords();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [newBlockedWord, setNewBlockedWord] = useState("");
  const [developerReply, setDeveloperReply] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const isDeveloper = userProfile?.role === "developer";

  // --- 1. Fetch Transactions ---
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
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          [Query.orderDesc("$createdAt")] // Show newest first
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

    // Real-time subscription for new/updated transactions
    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as Transaction;
        
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          setTransactions((prev) => [payload, ...prev]);
          toast.info(`New ${payload.type} transaction: "${payload.productTitle}"`);
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          setTransactions((prev) => prev.map((t) => t.$id === payload.$id ? payload : t));
          
          if (payload.status === 'payment_confirmed_to_developer' && payload.utrId) {
            toast.success(`Payment Verified: ${payload.type.toUpperCase()} - ${payload.amount}`);
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isDeveloper]);

  // --- 2. Moderation Handlers ---
  const handleAddBlockedWord = () => {
    if (!newBlockedWord.trim()) return;
    addBlockedWord(newBlockedWord);
    setNewBlockedWord("");
  };

  // --- 3. Transaction Logic (Universal for All Types) ---
  const handleProcessPayment = async (transaction: Transaction) => {
    if (transaction.status !== "payment_confirmed_to_developer") {
      toast.error("Transaction is not in 'Payment Confirmed' status.");
      return;
    }

    setLoadingTransactions(true);
    try {
      // Fetch Seller/Provider Profile to get Level for Commission
      const sellerProfileResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', transaction.sellerId)]
      );

      if (sellerProfileResponse.documents.length === 0) {
        toast.error("Seller/Provider profile not found. Cannot calculate commission.");
        return;
      }

      const sellerProfile = sellerProfileResponse.documents[0] as any;
      const sellerLevel = sellerProfile.level ?? 1;
      
      // Calculate Commission (Dynamic based on level)
      const commissionRate = calculateCommissionRate(sellerLevel);
      const commissionAmount = transaction.amount * commissionRate;
      const netSellerAmount = transaction.amount - commissionAmount;

      // Update Transaction
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
      toast.success(`Commission (${(commissionRate * 100).toFixed(2)}%) deducted. Net: ₹${netSellerAmount.toFixed(2)}`);
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error(error.message || "Failed to process payment.");
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handlePaySeller = async (transaction: Transaction) => {
    if (transaction.status !== "commission_deducted") {
      toast.error("Commission must be deducted first.");
      return;
    }
    if (!transaction.netSellerAmount || !transaction.sellerUpiId) {
      toast.error("Missing net amount or UPI ID.");
      return;
    }

    setLoadingTransactions(true);
    try {
      // 1. Open UPI App
      const upiDeepLink = `upi://pay?pa=${transaction.sellerUpiId}&pn=${encodeURIComponent(transaction.sellerName)}&am=${transaction.netSellerAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Payout: ${transaction.productTitle}`)}`;
      window.open(upiDeepLink, "_blank");
      
      toast.info(`Redirecting to pay ₹${transaction.netSellerAmount.toFixed(2)} to ${transaction.sellerName}.`);

      // 2. Mark as Paid (Delayed slightly to allow UI transition)
      setTimeout(async () => {
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          transaction.$id,
          { status: "paid_to_seller" }
        );
        toast.success(`Marked transaction ${transaction.$id} as Completed.`);
      }, 3000); 

    } catch (error: any) {
      console.error("Error paying seller:", error);
      toast.error("Failed to update status.");
    } finally {
      setLoadingTransactions(false);
    }
  };

  // --- 4. Developer Reply Logic ---
  const handleDeveloperReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReply = developerReply.trim();

    if (!trimmedReply || !user || !userProfile) return;

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
      toast.success("Reply sent!");
      refetchMessages();
    } catch (error: any) {
      toast.error("Failed to send reply.");
    } finally {
      setIsReplying(false);
    }
  };

  // --- Helpers ---
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "initiated": return "bg-yellow-500 text-white";
      case "payment_confirmed_to_developer": return "bg-blue-500 text-white";
      case "commission_deducted": return "bg-orange-500 text-white";
      case "paid_to_seller": return "bg-green-500 text-white";
      case "failed": return "bg-destructive text-white";
      case "Pending": return "bg-yellow-500 text-white"; // Report status
      case "Reviewed": return "bg-blue-500 text-white"; // Report status
      case "Resolved": return "bg-green-500 text-white"; // Report status
      case "Dismissed": return "bg-gray-500 text-white"; // Report status
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
        case 'buy': case 'rent': return <ShoppingBag className="h-3 w-3 mr-1" />;
        case 'service': return <Briefcase className="h-3 w-3 mr-1" />;
        case 'food': return <Utensils className="h-3 w-3 mr-1" />;
        case 'errand': return <Truck className="h-3 w-3 mr-1" />;
        default: return <DollarSign className="h-3 w-3 mr-1" />;
    }
  }

  // --- Access Check ---
  if (!isDeveloper) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <XCircle className="h-10 w-10 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Developer Dashboard</h1>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- 1. Developer Messages --- */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-secondary-neon" /> User Messages (Last 48h)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isMessagesLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No recent messages.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {messages.map((msg) => (
                  <div key={msg.$id} className={cn("p-3 rounded-md border", msg.isDeveloper ? "bg-primary/10 border-primary" : "bg-background border-border")}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold">{msg.senderName} ({msg.collegeName})</span>
                      <span className="text-muted-foreground">{new Date(msg.$createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleDeveloperReply} className="flex gap-2 mt-4">
              <Input placeholder="Reply to users..." value={developerReply} onChange={(e) => setDeveloperReply(e.target.value)} disabled={isReplying} />
              <Button type="submit" size="icon" disabled={isReplying} className="bg-secondary-neon text-primary-foreground">
                {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* --- 2. Transactions (Products, Services, Food, etc) --- */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-secondary-neon" /> All Transactions & Escrow
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 overflow-x-auto">
            {loadingTransactions ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No transactions found.</p>
            ) : (
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller/Provider</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Net Payout</TableHead>
                    <TableHead>Target UPI</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.$id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize flex items-center w-fit">
                            {getTypeIcon(tx.type)} {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{tx.productTitle}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.buyerName}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.sellerName}</TableCell>
                      <TableCell className="font-bold">₹{tx.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-red-500">
                        {tx.commissionAmount ? `₹${tx.commissionAmount.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-green-500 font-bold">
                        {tx.netSellerAmount ? `₹${tx.netSellerAmount.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{tx.sellerUpiId}</TableCell>
                      <TableCell>
                        <Badge className={cn("px-2 py-1 text-[10px]", getStatusBadgeClass(tx.status))}>
                          {tx.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-y-2">
                        {tx.status === "payment_confirmed_to_developer" && (
                          <Button size="sm" variant="secondary" onClick={() => handleProcessPayment(tx)} className="w-full bg-blue-600 text-white hover:bg-blue-700 h-8 text-xs">
                            Calc Commission
                          </Button>
                        )}
                        {tx.status === "commission_deducted" && (
                          <Button size="sm" variant="default" onClick={() => handlePaySeller(tx)} className="w-full bg-green-600 text-white hover:bg-green-700 h-8 text-xs">
                            Release Payout
                          </Button>
                        )}
                        {tx.status === "paid_to_seller" && <span className="text-green-500 text-xs flex items-center justify-end"><Shield className="h-3 w-3 mr-1"/> Settled</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* --- 3. Moderation (Blocked Words) --- */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-secondary-neon" /> Content Moderation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="flex gap-2">
                <Input placeholder="Block new word" value={newBlockedWord} onChange={(e) => setNewBlockedWord(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddBlockedWord()} />
                <Button onClick={handleAddBlockedWord} disabled={isBlockedWordsLoading}>Block</Button>
            </div>
            <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-background min-h-[50px]">
                {blockedWords.map((word) => (
                    <Badge key={word.$id} variant="destructive" className="cursor-pointer" onClick={() => removeBlockedWord(word.$id)}>
                        {word.word} <XCircle className="ml-1 h-3 w-3" />
                    </Badge>
                ))}
                {blockedWords.length === 0 && <span className="text-muted-foreground text-sm">No words blocked.</span>}
            </div>
          </CardContent>
        </Card>

        {/* --- 4. Reports --- */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" /> User Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 overflow-x-auto">
             {isReportsLoading ? <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Target</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.map((report) => (
                            <TableRow key={report.$id}>
                                <TableCell>{report.productTitle} (by {report.sellerId})</TableCell>
                                <TableCell>{report.reason}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{report.message}</TableCell>
                                <TableCell><Badge className={getStatusBadgeClass(report.status)}>{report.status}</Badge></TableCell>
                                <TableCell className="text-right space-x-1">
                                    {report.status === 'Pending' && (
                                        <>
                                            <Button size="sm" variant="secondary" onClick={() => updateReportStatus(report.$id, "Reviewed")}>Review</Button>
                                            <Button size="sm" variant="destructive" onClick={() => updateReportStatus(report.$id, "Dismissed")}>Dismiss</Button>
                                        </>
                                    )}
                                    {report.status === 'Reviewed' && <Button size="sm" className="bg-green-600" onClick={() => updateReportStatus(report.$id, "Resolved")}>Resolve</Button>}
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