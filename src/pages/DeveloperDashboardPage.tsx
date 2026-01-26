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
  Wallet, User, Activity, RefreshCw, Zap // FIXED: Added missing icons
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
  sellerUpiId: string; 
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
  const { reports, updateReportStatus } = useReports();
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

  // --- 3. Handlers ---
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("UPI ID Copied");
  };

  const handleAddBlockedWord = () => {
    if (!newBlockedWord.trim()) return;
    addBlockedWord(newBlockedWord);
    setNewBlockedWord("");
  };

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
      toast.success("Broadcast Dispatched!");
      refetchMessages();
    } catch (error) {
      toast.error("Failed to broadcast.");
    } finally {
      setIsReplying(false);
    }
  };

  const handleProcessCommission = async (transaction: Transaction) => {
    setLoadingTransactions(true);
    try {
      const sellerRes = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', transaction.sellerId)]
      );

      if (sellerRes.documents.length === 0) throw new Error("Seller missing.");

      const sellerProfile = sellerRes.documents[0] as any;
      const rate = calculateCommissionRate(sellerProfile.level ?? 1);
      const commission = transaction.amount * rate;
      const net = transaction.amount - commission;

      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        transaction.$id,
        { status: "commission_deducted", commissionAmount: commission, netSellerAmount: net }
      );
      toast.success("Accounting updated.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleManualPayout = async (transaction: Transaction) => {
    const upiLink = `upi://pay?pa=${transaction.sellerUpiId}&pn=${encodeURIComponent(transaction.sellerName)}&am=${transaction.netSellerAmount?.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Payout: ${transaction.productTitle}`)}`;
    window.open(upiLink, "_blank");

    setTimeout(async () => {
        if(window.confirm(`Release ₹${transaction.netSellerAmount?.toFixed(2)} to ${transaction.sellerName}?`)) {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, transaction.$id, { status: "paid_to_seller" });
            toast.success("Settled.");
        }
    }, 1500);
  };

  if (!isDeveloper) return <div className="h-screen flex items-center justify-center font-black text-2xl uppercase italic">Unauthorized</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 pb-24 font-sans">
      
      {/* HEADER */}
      <div className="max-w-[1600px] mx-auto mb-8 flex justify-between items-end">
        <div>
           <h1 className="text-4xl font-black italic tracking-tighter uppercase">Mission<span className="text-secondary-neon">Control</span></h1>
           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Admin Financial Ledger • Landscape View</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => window.location.reload()} className="rounded-xl border-secondary-neon/20 hover:border-secondary-neon">
            <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* LEDGER CARD */}
        <Card className="border-2 border-border/60 bg-card/50 shadow-2xl overflow-hidden rounded-2xl">
          <CardHeader className="bg-muted/30 pb-6 border-b">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-secondary-neon/10 rounded-2xl flex items-center justify-center border border-secondary-neon/20">
                    <Wallet className="h-6 w-6 text-secondary-neon" />
                </div>
                <CardTitle className="text-2xl font-black italic uppercase">Student Payout Ledger</CardTitle>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <Input 
                  placeholder="Search ID, UPI, UTR..." 
                  className="lg:w-80 h-11 bg-background border-2 font-bold uppercase text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={filterType} onValueChange={setFilterType}>
                   <SelectTrigger className="w-40 h-11 border-2 font-black uppercase text-[10px]">
                      <SelectValue placeholder="Type" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="service">Gig</SelectItem>
                      <SelectItem value="errand">Errand</SelectItem>
                   </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="text-[10px] font-black uppercase text-center">Type</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Item & Ref</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Seller Payout Details</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-right">Ledger (₹)</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-center">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.map((tx) => (
                            <TableRow key={tx.$id} className="h-20 hover:bg-muted/20 transition-all">
                                <TableCell className="text-center">
                                    <div className="p-2 bg-muted rounded-xl inline-block">
                                        {tx.type === 'food' ? <Utensils className="h-4 w-4 text-orange-500" /> : tx.type === 'service' ? <Briefcase className="h-4 w-4 text-blue-500" /> : <ShoppingBag className="h-4 w-4 text-secondary-neon" />}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="font-black text-xs uppercase italic tracking-tighter line-clamp-1">{tx.productTitle}</p>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-[9px] font-mono opacity-50">TX: {tx.$id.substring(tx.$id.length - 8)}</span>
                                        {tx.utrId && <Badge variant="outline" className="text-[8px] font-black bg-blue-500/5 text-blue-500 border-blue-500/20">UTR: {tx.utrId}</Badge>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] font-black uppercase flex items-center gap-1"><User className="h-3 w-3" /> {tx.sellerName}</p>
                                        <div className="flex items-center gap-2">
                                            <code className="text-[10px] font-mono text-secondary-neon bg-secondary-neon/5 px-2 py-0.5 rounded border border-secondary-neon/10">{tx.sellerUpiId || 'ERR_NO_UPI'}</code>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(tx.sellerUpiId)}><Copy className="h-3 w-3" /></Button>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <p className="text-xs font-black">₹{tx.amount}</p>
                                    {tx.commissionAmount && <p className="text-[9px] font-bold text-destructive">-₹{tx.commissionAmount.toFixed(2)} fee</p>}
                                    {tx.netSellerAmount && <Badge className="mt-1 text-[9px] font-black bg-green-500/10 text-green-600 border-green-500/20">PAYOUT: ₹{tx.netSellerAmount.toFixed(2)}</Badge>}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge className={cn("text-[9px] font-black uppercase px-3", tx.status === 'paid_to_seller' ? "bg-green-600" : "bg-yellow-600")}>
                                        {tx.status.replace(/_/g, ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {tx.status === "payment_confirmed_to_developer" && (
                                        <Button size="sm" onClick={() => handleProcessCommission(tx)} className="bg-blue-600 hover:bg-blue-700 h-8 text-[10px] font-black uppercase">Process</Button>
                                    )}
                                    {tx.status === "commission_deducted" && (
                                        <Button size="sm" onClick={() => handleManualPayout(tx)} className="bg-green-600 hover:bg-green-700 h-8 text-[10px] font-black uppercase shadow-neon"><ExternalLink className="h-3 w-3 mr-2" /> Pay Now</Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>

        {/* MODERATION & BROADCAST */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-2 rounded-2xl shadow-xl">
                <CardHeader className="border-b">
                    <CardTitle className="text-xl font-black italic uppercase flex items-center gap-2"><Flag className="h-5 w-5 text-orange-500" /> Conflict Management</CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                    {reports.length > 0 ? (
                        <Table>
                            <TableBody>
                                {reports.map((report) => (
                                    <TableRow key={report.$id}>
                                        <TableCell className="text-[10px] font-black uppercase text-destructive">{report.reason}</TableCell>
                                        <TableCell className="text-xs font-bold italic line-clamp-1">{report.productTitle}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" variant="ghost" className="h-7 text-[9px] font-black uppercase" onClick={() => updateReportStatus(report.$id, "Dismissed")}>Dismiss</Button>
                                                <Button size="sm" className="h-7 text-[9px] font-black uppercase bg-destructive text-white" onClick={() => updateReportStatus(report.$id, "Resolved")}>Resolve</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="p-20 text-center opacity-30 font-black uppercase text-xs">Everything is Clear</div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-2 rounded-2xl shadow-xl bg-secondary-neon/5 border-secondary-neon/20">
                <CardHeader>
                    <CardTitle className="text-xl font-black italic uppercase flex items-center gap-2"><Zap className="h-5 w-5 text-secondary-neon" /> Global Buzz</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleDeveloperReply} className="space-y-4">
                        <textarea 
                            className="w-full bg-background border-2 rounded-xl p-3 text-xs font-bold uppercase focus:border-secondary-neon outline-none min-h-[120px]"
                            placeholder="Announce to all students..."
                            value={developerReply}
                            onChange={(e) => setDeveloperReply(e.target.value)}
                        />
                        <Button type="submit" disabled={isReplying} className="w-full h-12 bg-secondary-neon text-primary-foreground font-black uppercase shadow-neon">
                            {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Dispatch Alert"}
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