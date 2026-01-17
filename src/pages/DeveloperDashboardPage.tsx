"use client";

import React, { useEffect, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  databases, 
  APPWRITE_DATABASE_ID, 
  APPWRITE_TRANSACTIONS_COLLECTION_ID, 
  APPWRITE_USER_PROFILES_COLLECTION_ID, 
  APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID 
} from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { 
  Loader2, DollarSign, Shield, XCircle, MessageSquareText, 
  Send, Truck, Flag, Briefcase, Utensils, ShoppingBag, 
  Search, Filter, CheckCircle2, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Query, ID } from "appwrite";
import { useDeveloperMessages } from "@/hooks/useDeveloperMessages";
import { calculateCommissionRate } from "@/utils/commission";
import { useReports } from "@/hooks/useReports";
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
  status: string;
  type: "buy" | "rent" | "service" | "food" | "errand" | "cash-exchange";
  productTitle: string;
  commissionAmount?: number;
  netSellerAmount?: number;
  $createdAt: string;
  collegeName: string;
  ambassadorDelivery?: boolean;
  utrId?: string;
}

const DeveloperDashboardPage = () => {
  const { user, userProfile } = useAuth();
  const { messages, isLoading: isMessagesLoading, refetch: refetchMessages } = useDeveloperMessages(); 
  const { reports, isLoading: isReportsLoading, updateReportStatus } = useReports();
  const { blockedWords, isLoading: isBlockedWordsLoading, addBlockedWord, removeBlockedWord } = useBlockedWords();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  // Moderation
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
          [Query.orderDesc("$createdAt"), Query.limit(100)] 
        );
        setTransactions(response.documents as unknown as Transaction[]);
        setFilteredTransactions(response.documents as unknown as Transaction[]);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to load transactions.");
      } finally {
        setLoadingTransactions(false);
      }
    };

    fetchTransactions();

    // Real-time subscription
    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as Transaction;
        if (response.events.includes("create")) {
          setTransactions(prev => [payload, ...prev]);
          toast.info(`New Transaction: ${payload.productTitle}`);
        } else if (response.events.includes("update")) {
          setTransactions(prev => prev.map(t => t.$id === payload.$id ? payload : t));
        }
      }
    );

    return () => { unsubscribe(); };
  }, [isDeveloper]);

  // --- 2. Filter Logic ---
  useEffect(() => {
    let result = transactions;

    if (filterType !== "all") {
        result = result.filter(t => t.type === filterType);
    }

    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(t => 
            t.productTitle.toLowerCase().includes(lowerTerm) ||
            t.buyerName.toLowerCase().includes(lowerTerm) ||
            t.sellerName.toLowerCase().includes(lowerTerm) ||
            t.$id.includes(lowerTerm) ||
            (t.utrId && t.utrId.includes(lowerTerm))
        );
    }

    setFilteredTransactions(result);
  }, [transactions, filterType, searchTerm]);

  // --- 3. Moderation Handlers ---
  const handleAddBlockedWord = () => {
    if (!newBlockedWord.trim()) return;
    addBlockedWord(newBlockedWord);
    setNewBlockedWord("");
  };

  // --- 4. Transaction Logic ---
  const handleProcessPayment = async (transaction: Transaction) => {
    setLoadingTransactions(true);
    try {
      // Fetch Seller Profile
      const sellerProfileResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', transaction.sellerId)]
      );

      if (sellerProfileResponse.documents.length === 0) {
        throw new Error("Seller profile not found.");
      }

      const sellerProfile = sellerProfileResponse.documents[0] as any;
      const commissionRate = calculateCommissionRate(sellerProfile.level ?? 1);
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
      toast.success(`Commission calculated. Net: ₹${netSellerAmount.toFixed(2)}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handlePaySeller = async (transaction: Transaction) => {
    setLoadingTransactions(true);
    try {
      const upiDeepLink = `upi://pay?pa=${transaction.sellerUpiId}&pn=${encodeURIComponent(transaction.sellerName)}&am=${transaction.netSellerAmount?.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Payout: ${transaction.productTitle}`)}`;
      window.open(upiDeepLink, "_blank");
      
      // Simulate confirmation after redirect
      setTimeout(async () => {
        if(window.confirm("Did the UPI payment succeed? Mark as Paid?")) {
            await databases.updateDocument(
              APPWRITE_DATABASE_ID,
              APPWRITE_TRANSACTIONS_COLLECTION_ID,
              transaction.$id,
              { status: "paid_to_seller" }
            );
            toast.success("Transaction Settled.");
        }
      }, 2000); 
    } catch (error: any) {
      toast.error("Failed to process payout.");
    } finally {
      setLoadingTransactions(false);
    }
  };

  // --- 5. Developer Reply ---
  const handleDeveloperReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!developerReply.trim() || !user || !userProfile) return;

    setIsReplying(true);
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          senderId: user.$id,
          senderName: user.name,
          message: developerReply,
          isDeveloper: true,
          collegeName: userProfile.collegeName,
        }
      );
      setDeveloperReply("");
      toast.success("Reply sent!");
      refetchMessages();
    } catch (error) {
      toast.error("Failed to send.");
    } finally {
      setIsReplying(false);
    }
  };

  // --- Helpers ---
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
  if (!isDeveloper) return <div className="flex h-screen items-center justify-center font-bold text-xl">Access Denied</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-3xl font-black mb-6 text-center tracking-tight">DEVELOPER <span className="text-secondary-neon">DASHBOARD</span></h1>
      
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* === SECTION 1: FINANCIALS === */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="h-5 w-5 text-green-500" /> Financial Operations
            </CardTitle>
            <CardDescription>Verify payments, calculate commissions, and release payouts.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search ID, Name, UTR..." 
                        className="pl-9" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="buy">Market</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Transactions Table */}
            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[100px]">Type</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Financials</TableHead>
                            <TableHead>User Status</TableHead>
                            <TableHead>Dev Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.map((tx) => (
                            <TableRow key={tx.$id}>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize flex w-fit items-center">
                                        {getTypeIcon(tx.type)} {tx.type}
                                    </Badge>
                                    <div className="text-[10px] text-muted-foreground mt-1 font-mono">{tx.$id.substring(0,6)}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-bold text-sm">{tx.productTitle}</div>
                                    <div className="text-xs text-muted-foreground">
                                        <span className="text-green-600">From: {tx.buyerName}</span> <br/>
                                        <span className="text-blue-600">To: {tx.sellerName}</span>
                                    </div>
                                    {tx.utrId && <Badge variant="secondary" className="mt-1 text-[10px] font-mono">UTR: {tx.utrId}</Badge>}
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm font-bold">Total: ₹{tx.amount}</div>
                                    {tx.commissionAmount && (
                                        <div className="text-xs text-red-500">Comm: -₹{tx.commissionAmount.toFixed(2)}</div>
                                    )}
                                    {tx.netSellerAmount && (
                                        <div className="text-xs text-green-600 font-bold border-t border-dashed border-gray-300 mt-1 pt-1">
                                            Pay: ₹{tx.netSellerAmount.toFixed(2)}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn(
                                        "capitalize",
                                        tx.status === 'completed' || tx.status === 'seller_confirmed_delivery' ? "bg-green-500 hover:bg-green-600" :
                                        tx.status === 'payment_confirmed_to_developer' ? "bg-blue-500 hover:bg-blue-600" :
                                        "bg-yellow-500 hover:bg-yellow-600"
                                    )}>
                                        {tx.status.replace(/_/g, ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {tx.status === "payment_confirmed_to_developer" && (
                                        <Button size="sm" onClick={() => handleProcessPayment(tx)} className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-8">
                                            Calculate Fee
                                        </Button>
                                    )}
                                    {tx.status === "commission_deducted" && (
                                        <Button size="sm" onClick={() => handlePaySeller(tx)} className="w-full bg-green-600 hover:bg-green-700 text-xs h-8">
                                            Release Payout
                                        </Button>
                                    )}
                                    {tx.status === "paid_to_seller" && (
                                        <div className="flex items-center text-green-600 text-xs font-bold justify-end">
                                            <CheckCircle2 className="h-4 w-4 mr-1" /> Settled
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {filteredTransactions.length === 0 && <div className="p-8 text-center text-muted-foreground">No transactions found.</div>}
            </div>
          </CardContent>
        </Card>

        {/* === SECTION 2: MODERATION & REPORTS === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Blocked Words */}
            <Card className="bg-card border-border shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5 text-red-500" /> Chat Moderation
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Block offensive word..." 
                            value={newBlockedWord} 
                            onChange={(e) => setNewBlockedWord(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleAddBlockedWord()}
                        />
                        <Button onClick={handleAddBlockedWord} variant="secondary">Block</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/20 min-h-[100px]">
                        {blockedWords.map((word) => (
                            <Badge key={word.$id} variant="destructive" className="cursor-pointer hover:opacity-80" onClick={() => removeBlockedWord(word.$id)}>
                                {word.word} <XCircle className="ml-1 h-3 w-3" />
                            </Badge>
                        ))}
                        {blockedWords.length === 0 && <span className="text-xs text-muted-foreground">No words blocked yet.</span>}
                    </div>
                </CardContent>
            </Card>

            {/* Reports */}
            <Card className="bg-card border-border shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Flag className="h-5 w-5 text-orange-500" /> User Reports
                    </CardTitle>
                </CardHeader>
                <CardContent className="overflow-y-auto max-h-[300px]">
                    {isReportsLoading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin"/></div> : (
                        <div className="space-y-3">
                            {reports.map((report) => (
                                <div key={report.$id} className="p-3 border rounded-md bg-background flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-sm">{report.productTitle}</div>
                                        <Badge variant="outline" className={cn("text-[10px]", 
                                            report.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        )}>{report.status}</Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        <span className="font-semibold text-red-500">{report.reason}</span> • Reported by {report.reporterName}
                                    </div>
                                    <div className="text-xs bg-muted p-2 rounded italic">"{report.message}"</div>
                                    {report.status === 'Pending' && (
                                        <div className="flex gap-2 justify-end">
                                            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => updateReportStatus(report.$id, "Dismissed")}>Dismiss</Button>
                                            <Button size="sm" className="h-6 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={() => updateReportStatus(report.$id, "Resolved")}>Resolve</Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {reports.length === 0 && <div className="text-center text-muted-foreground text-xs py-4">No active reports.</div>}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* === SECTION 3: MESSAGES === */}
        <Card className="bg-card border-border shadow-md">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquareText className="h-5 w-5 text-blue-500" /> Global Announcements
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleDeveloperReply} className="flex gap-2">
                    <Input 
                        placeholder="Broadcast message to all users (Appears in 'Buzz')..." 
                        value={developerReply} 
                        onChange={(e) => setDeveloperReply(e.target.value)} 
                        disabled={isReplying}
                    />
                    <Button type="submit" disabled={isReplying} className="bg-secondary-neon text-primary-foreground">
                        {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
                <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
                    {messages.slice(0, 5).map(msg => (
                        <div key={msg.$id} className="text-xs p-2 border-b last:border-0">
                            <span className="font-bold">{msg.senderName}:</span> {msg.message}
                            <span className="text-muted-foreground float-right">{new Date(msg.$createdAt).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

      </div>
      <MadeWithDyad />
    </div>
  );
};

export default DeveloperDashboardPage;