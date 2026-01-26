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
  Search, Filter, CheckCircle2, AlertCircle, Copy, ExternalLink,
  Wallet, User, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  sellerUpiId: string; // The destination for Payouts
  amount: number;
  status: string;
  type: "buy" | "rent" | "service" | "food" | "errand" | "cash-exchange";
  productTitle: string;
  commissionAmount?: number;
  netSellerAmount?: number;
  $createdAt: string;
  collegeName: string;
  utrId?: string;
}

const DeveloperDashboardPage = () => {
  const { user, userProfile } = useAuth();
  const { messages, isLoading: isMessagesLoading, refetch: refetchMessages } = useDeveloperMessages(); 
  const { reports, isLoading: isReportsLoading, updateReportStatus } = useReports();
  const { blockedWords, addBlockedWord, removeBlockedWord } = useBlockedWords();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [newBlockedWord, setNewBlockedWord] = useState("");
  const [developerReply, setDeveloperReply] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const isDeveloper = userProfile?.role === "developer";

  // --- 1. Fetch & Sync Ledger ---
  useEffect(() => {
    if (!isDeveloper) return;

    const fetchTransactions = async () => {
      setLoadingTransactions(true);
      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          [Query.orderDesc("$createdAt"), Query.limit(100)] 
        );
        setTransactions(response.documents as unknown as Transaction[]);
      } catch (error) {
        toast.error("Failed to sync financial ledger.");
      } finally {
        setLoadingTransactions(false);
      }
    };

    fetchTransactions();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as Transaction;
        if (response.events.includes("create")) {
          setTransactions(prev => [payload, ...prev]);
        } else if (response.events.includes("update")) {
          setTransactions(prev => prev.map(t => t.$id === payload.$id ? payload : t));
        }
      }
    );

    return () => { unsubscribe(); };
  }, [isDeveloper]);

  // --- 2. Filter Search Logic ---
  useEffect(() => {
    let result = transactions;
    if (filterType !== "all") result = result.filter(t => t.type === filterType);
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(t => 
            t.productTitle.toLowerCase().includes(lowerTerm) ||
            t.buyerName.toLowerCase().includes(lowerTerm) ||
            t.sellerUpiId?.toLowerCase().includes(lowerTerm) ||
            t.utrId?.includes(lowerTerm)
        );
    }
    setFilteredTransactions(result);
  }, [transactions, filterType, searchTerm]);

  // --- 3. Financial Actions ---
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("UPI ID Copied to clipboard");
  };

  const handleProcessCommission = async (transaction: Transaction) => {
    setLoadingTransactions(true);
    try {
      const sellerProfileRes = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', transaction.sellerId)]
      );

      if (sellerProfileRes.documents.length === 0) throw new Error("Seller profile missing.");

      const sellerProfile = sellerProfileRes.documents[0] as any;
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
      toast.success("Commission calculated. Ready for payout.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleManualPayout = async (transaction: Transaction) => {
    const amount = transaction.netSellerAmount?.toFixed(2);
    const upiLink = `upi://pay?pa=${transaction.sellerUpiId}&pn=${encodeURIComponent(transaction.sellerName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Payout: ${transaction.productTitle}`)}`;
    
    window.open(upiLink, "_blank");

    // UX Logic: Ask for confirmation after banking app opens
    setTimeout(async () => {
        if(window.confirm(`Mark ₹${amount} as successfully paid to ${transaction.sellerUpiId}?`)) {
            await databases.updateDocument(
              APPWRITE_DATABASE_ID,
              APPWRITE_TRANSACTIONS_COLLECTION_ID,
              transaction.$id,
              { status: "paid_to_seller" }
            );
            toast.success("Transaction Archived: Settled.");
        }
    }, 1500);
  };

  if (!isDeveloper) return <div className="h-screen flex items-center justify-center font-black text-2xl animate-pulse">UNAUTHORIZED ACCESS</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 pb-24">
      
      {/* LANDSCAPE HEADER */}
      <div className="max-w-[1600px] mx-auto mb-8 flex justify-between items-end">
        <div>
           <h1 className="text-4xl font-black italic tracking-tighter uppercase">Developer<span className="text-secondary-neon">Control</span></h1>
           <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Admin Financial Ledger & Moderation</p>
        </div>
        <div className="flex gap-4">
            <div className="text-right">
                <p className="text-[10px] font-black text-muted-foreground uppercase">Sync Status</p>
                <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5">
                    <Activity className="h-3 w-3 mr-1 animate-pulse" /> LIVE DATABASE
                </Badge>
            </div>
            <Button variant="outline" size="icon" onClick={() => window.location.reload()} className="h-10 w-10">
                <RefreshCw className="h-4 w-4" />
            </Button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* === MAIN FINANCIAL LEDGER (LANDSCAPE VIEW) === */}
        <Card className="border-2 border-border/60 bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 pb-6 border-b">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20">
                    <Wallet className="h-6 w-6 text-green-500" />
                </div>
                <div>
                    <CardTitle className="text-2xl font-black italic uppercase">Financial Ledger</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-tighter">Process student payouts and verify commissions</CardDescription>
                </div>
              </div>

              {/* Filters Toolbar */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input 
                      placeholder="Search ID, Payout UPI, UTR..." 
                      className="pl-10 h-11 bg-background border-2 font-medium"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                   <SelectTrigger className="w-40 h-11 border-2 font-bold uppercase text-[10px]">
                      <SelectValue placeholder="Type" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">All Gigs</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="service">Services</SelectItem>
                      <SelectItem value="errand">Errands</SelectItem>
                   </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50 border-b">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Type</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Deal Details</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest">Payout Destination (Seller UPI)</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-right">Accounting (₹)</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.map((tx) => (
                            <TableRow key={tx.$id} className="h-20 hover:bg-muted/20 transition-colors">
                                <TableCell className="text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="p-2 bg-muted rounded-xl">
                                            {tx.type === 'food' ? <Utensils className="h-4 w-4" /> : tx.type === 'service' ? <Briefcase className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                                        </div>
                                        <span className="text-[9px] font-black uppercase opacity-40">{tx.type}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="max-w-[200px]">
                                        <p className="font-black text-sm italic uppercase tracking-tighter line-clamp-1">{tx.productTitle}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-muted-foreground">ID: {tx.$id.substring(tx.$id.length - 6)}</span>
                                            {tx.utrId && <Badge variant="outline" className="text-[8px] font-mono bg-blue-500/5 border-blue-500/20 text-blue-500">UTR: {tx.utrId}</Badge>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[11px] font-black text-foreground uppercase">{tx.sellerName}</p>
                                        <div className="flex items-center gap-2">
                                            <code className="text-[10px] font-mono bg-muted p-1 rounded border border-border/50 text-secondary-neon">{tx.sellerUpiId || 'NO_UPI_SET'}</code>
                                            {tx.sellerUpiId && (
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-secondary-neon" onClick={() => copyToClipboard(tx.sellerUpiId)}>
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex flex-col items-end">
                                        <p className="text-sm font-black tracking-tighter italic">Total: ₹{tx.amount}</p>
                                        {tx.commissionAmount && (
                                            <span className="text-[10px] font-bold text-destructive">Fee: -₹{tx.commissionAmount.toFixed(2)}</span>
                                        )}
                                        {tx.netSellerAmount && (
                                            <Badge variant="outline" className="mt-1 font-black text-[10px] border-green-500/30 text-green-600 bg-green-500/5">
                                               PAYOUT: ₹{tx.netSellerAmount.toFixed(2)}
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge className={cn(
                                        "uppercase text-[9px] font-black tracking-widest px-3 py-1",
                                        tx.status === 'paid_to_seller' ? "bg-green-600 shadow-lg shadow-green-600/20" : 
                                        tx.status === 'commission_deducted' ? "bg-blue-600" : "bg-yellow-600 animate-pulse"
                                    )}>
                                        {tx.status.replace(/_/g, ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {tx.status === "payment_confirmed_to_developer" && (
                                            <Button size="sm" onClick={() => handleProcessCommission(tx)} className="h-9 bg-blue-600 hover:bg-blue-700 font-bold text-[10px] uppercase shadow-lg">
                                                Process Fee
                                            </Button>
                                        )}
                                        {tx.status === "commission_deducted" && (
                                            <Button size="sm" onClick={() => handleManualPayout(tx)} className="h-9 bg-green-600 hover:bg-green-700 font-bold text-[10px] uppercase shadow-lg">
                                                <ExternalLink className="h-3 w-3 mr-2" /> Send Payout
                                            </Button>
                                        )}
                                        {tx.status === "paid_to_seller" && (
                                            <div className="h-9 w-24 flex items-center justify-center border-2 border-dashed border-muted rounded-xl opacity-40">
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {filteredTransactions.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center opacity-30 grayscale">
                        <ShoppingBag className="h-12 w-12 mb-4" />
                        <p className="font-black uppercase tracking-widest">No matching transactions in ledger</p>
                    </div>
                )}
            </div>
          </CardContent>
        </Card>

        {/* === MODERATION & BROADCAST (LANDSCAPE SIDE-BY-SIDE) === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* User Reports Ledger */}
            <Card className="lg:col-span-2 border-2 shadow-xl bg-card">
                <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="flex items-center gap-2 text-xl font-black italic uppercase">
                        <Flag className="h-5 w-5 text-orange-500" /> Conflict Management
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                    {reports.length > 0 ? (
                        <Table>
                            <TableBody>
                                {reports.map((report) => (
                                    <TableRow key={report.$id} className="hover:bg-muted/10">
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black uppercase text-destructive">{report.reason}</span>
                                                <p className="text-xs font-bold italic line-clamp-1">{report.productTitle}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-muted-foreground italic">"{report.message}"</TableCell>
                                        <TableCell className="text-right">
                                            {report.status === 'Pending' && (
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" variant="ghost" className="h-8 text-[9px] font-black uppercase" onClick={() => updateReportStatus(report.$id, "Dismissed")}>Dismiss</Button>
                                                    <Button size="sm" className="h-8 text-[9px] font-black uppercase bg-destructive text-white" onClick={() => updateReportStatus(report.$id, "Resolved")}>Resolve</Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="p-20 text-center opacity-30 font-black uppercase tracking-widest">Campus is Peaceful</div>
                    )}
                </CardContent>
            </Card>

            {/* Broadcast System */}
            <Card className="border-2 shadow-xl bg-secondary-neon/5 border-secondary-neon/20">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-xl font-black italic uppercase">
                        <Zap className="h-5 w-5 text-secondary-neon fill-current" /> Global Buzz
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-tighter">Broadcast high-priority alerts to all students</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleDeveloperReply} className="space-y-3">
                        <textarea 
                            className="w-full bg-background border-2 border-border/50 rounded-xl p-3 text-xs font-medium focus:border-secondary-neon outline-none transition-all min-h-[100px]"
                            placeholder="Announce campus-wide updates..."
                            value={developerReply}
                            onChange={(e) => setDeveloperReply(e.target.value)}
                        />
                        <Button type="submit" disabled={isReplying} className="w-full h-12 bg-secondary-neon text-primary-foreground font-black uppercase shadow-neon">
                            {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> DISPATCH BROADCAST</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>

      </div>
      <MadeWithDyad />
    </div>
  );
};

export default DeveloperDashboardPage;