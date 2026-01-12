"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  RefreshCw, UtensilsCrossed, Plus, Trash2, Loader2, 
  Search, Power, Store, ChefHat 
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddCanteenForm from "@/components/forms/AddCanteenForm";
import { useCanteenData } from "@/hooks/useCanteenData"; 
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CanteenManagerWidget = () => {
  const { userProfile } = useAuth();
  const { allCanteens, isLoading, error, refetch, updateCanteen, addCanteen } = useCanteenData();
  
  const [selectedCanteenId, setSelectedCanteenId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddCanteenDialogOpen, setIsAddCanteenDialogOpen] = useState(false);
  const [isAddingCanteen, setIsAddingCanteen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Determine selected canteen
  const selectedCanteen = allCanteens.find(c => c.$id === selectedCanteenId);

  // Initialize selection
  useEffect(() => {
    if (!selectedCanteenId && allCanteens.length > 0) {
      setSelectedCanteenId(allCanteens[0].$id);
    } else if (selectedCanteenId && !allCanteens.some(c => c.$id === selectedCanteenId)) {
      setSelectedCanteenId(allCanteens.length > 0 ? allCanteens[0].$id : null);
    }
  }, [allCanteens, selectedCanteenId]);

  // Handlers
  const handleAddCanteen = async (canteenName: string, collegeName: string) => {
    setIsAddingCanteen(true);
    try {
      const newCanteen = await addCanteen(canteenName, collegeName);
      if (newCanteen) {
        toast.success(`Broadcasting: ${canteenName} is online!`);
        setSelectedCanteenId(newCanteen.$id);
      }
      setIsAddCanteenDialogOpen(false);
    } catch (e) {
      // hook handles error
    } finally {
      setIsAddingCanteen(false);
    }
  };

  const handleToggleCanteenStatus = async (checked: boolean) => {
    if (!selectedCanteenId) return;
    setIsUpdating(true);
    try {
      await updateCanteen(selectedCanteenId, { isOpen: checked });
      toast.success(checked ? "Canteen is LIVE & Accepting orders!" : "Canteen marked as Offline.");
      refetch();
    } catch (e) {
      // hook handles error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAvailability = async (index: number) => {
    if (!selectedCanteen || !selectedCanteenId) return;
    setIsUpdating(true);
    try {
      // Use the *filtered* index mapping or direct modification if possible. 
      // Since we map filtered items in UI, we need to find the actual index in the main array.
      // For simplicity here, we assume 'items' is the source of truth.
      const newItems = selectedCanteen.items.map((item, i) =>
        i === index ? { ...item, available: !item.available } : item
      );
      await updateCanteen(selectedCanteenId, { items: newItems });
      // No toast needed for rapid toggling, maybe a sound effect in future?
      refetch();
    } catch (e) {
      // hook handles error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedCanteen || !selectedCanteenId) return;
    if (!newItemName.trim()) {
      toast.error("Item name required");
      return;
    }
    setIsUpdating(true);
    try {
      const newItems = [...selectedCanteen.items, { name: newItemName.trim(), available: true }];
      await updateCanteen(selectedCanteenId, { items: newItems });
      toast.success("Menu updated!");
      setNewItemName("");
      setIsAddingItem(false);
      refetch();
    } catch (e) {
      // hook handles error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (index: number) => {
    if (!selectedCanteen || !selectedCanteenId) return;
    setIsUpdating(true);
    try {
      const newItems = selectedCanteen.items.filter((_, i) => i !== index);
      await updateCanteen(selectedCanteenId, { items: newItems });
      toast.info("Item removed from menu.");
      refetch();
    } catch (e) {
      // hook handles error
    } finally {
      setIsUpdating(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <Card className="bg-card border-border shadow-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-neon mb-4" />
        <p className="text-muted-foreground animate-pulse">Syncing Canteen Grid...</p>
      </Card>
    );
  }

  const isOpen = selectedCanteen?.isOpen ?? false;
  const allItems = selectedCanteen?.items ?? [];
  
  // Filter items for search
  const filteredItems = allItems.map((item, originalIndex) => ({ ...item, originalIndex }))
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Card className="bg-card text-card-foreground shadow-xl border-border overflow-hidden">
      
      {/* --- HEADER --- */}
      <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-border/50 bg-secondary/5">
        <div>
          <CardTitle className="text-xl font-black italic tracking-tight text-foreground flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-secondary-neon" /> 
            CANTEEN<span className="text-secondary-neon">OPS</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground font-medium">Manage availability in real-time</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={refetch} disabled={isUpdating} className="hover:text-secondary-neon hover:bg-secondary-neon/10">
            <RefreshCw className={cn("h-4 w-4", isUpdating && "animate-spin")} />
          </Button>
          
          <Dialog open={isAddCanteenDialogOpen} onOpenChange={setIsAddCanteenDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 shadow-md">
                <Store className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle>Register New Outlet</DialogTitle></DialogHeader>
              <AddCanteenForm onSubmit={handleAddCanteen} onCancel={() => setIsAddCanteenDialogOpen(false)} loading={isAddingCanteen} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        
        {allCanteens.length > 0 ? (
          <>
            {/* --- SELECTOR --- */}
            <div className="relative">
                <Select value={selectedCanteenId || ""} onValueChange={setSelectedCanteenId} disabled={isUpdating}>
                    <SelectTrigger className="w-full bg-input/50 border-border h-12 text-lg font-bold">
                    <SelectValue placeholder="Select Canteen" />
                    </SelectTrigger>
                    <SelectContent>
                    {allCanteens.map(c => (
                        <SelectItem key={c.$id} value={c.$id} className="font-medium">
                        {c.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                {/* Status Indicator Dot on Selector */}
                <div className={cn("absolute right-10 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full", isOpen ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500")} />
            </div>

            {selectedCanteen && (
              <>
                {/* --- STATUS DASHBOARD --- */}
                <div className={cn(
                    "rounded-xl p-4 border transition-all duration-500 flex items-center justify-between",
                    isOpen 
                        ? "bg-green-500/10 border-green-500/30 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]" 
                        : "bg-red-500/10 border-red-500/30"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-full", isOpen ? "bg-green-500 text-white" : "bg-red-500 text-white")}>
                            <Power className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className={cn("font-bold uppercase tracking-wider text-sm", isOpen ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                {isOpen ? "System Online" : "System Offline"}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                {isOpen ? "Students can see the menu." : "Menu hidden from students."}
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={isOpen}
                        onCheckedChange={handleToggleCanteenStatus}
                        disabled={isUpdating}
                        className="scale-125 data-[state=checked]:bg-green-500"
                    />
                </div>

                {/* --- MENU MANAGEMENT --- */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                            <ChefHat className="h-4 w-4" /> Menu Control
                        </h3>
                        <Badge variant="outline" className="text-xs font-mono">
                            {allItems.filter(i => i.available).length} / {allItems.length} Active
                        </Badge>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search food items..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-input/50 border-border focus:ring-secondary-neon"
                        />
                    </div>

                    {/* Items List */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <div 
                                    key={item.originalIndex} 
                                    className={cn(
                                        "group flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
                                        item.available 
                                            ? "bg-card border-border hover:border-secondary-neon/50" 
                                            : "bg-muted/30 border-transparent opacity-70"
                                    )}
                                >
                                    <span className={cn(
                                        "font-medium transition-colors",
                                        item.available ? "text-foreground" : "text-muted-foreground line-through decoration-destructive"
                                    )}>
                                        {item.name}
                                    </span>
                                    
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={item.available}
                                            onCheckedChange={() => handleToggleAvailability(item.originalIndex)}
                                            disabled={isUpdating}
                                            className="data-[state=checked]:bg-secondary-neon"
                                        />
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleRemoveItem(item.originalIndex)} 
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            disabled={isUpdating}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                                <p className="text-muted-foreground text-sm">No items found.</p>
                            </div>
                        )}
                    </div>

                    {/* Add Item Button */}
                    <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
                        <DialogTrigger asChild>
                            <Button className="w-full bg-secondary-neon/10 text-secondary-neon hover:bg-secondary-neon/20 border border-secondary-neon/20 h-12 font-bold dashed-border">
                                <Plus className="mr-2 h-5 w-5" /> Add to Menu
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader><DialogTitle>New Menu Item</DialogTitle></DialogHeader>
                            <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                    <Label>Food Name</Label>
                                    <Input 
                                        placeholder="e.g. Chicken Biryani, Veg Puff..." 
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        className="text-lg"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddingItem(false)}>Cancel</Button>
                                <Button onClick={handleAddItem} className="bg-secondary-neon text-primary-foreground">Add Item</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-12 flex flex-col items-center gap-4">
            <div className="bg-secondary/10 p-4 rounded-full">
                <Store className="h-8 w-8 text-secondary-neon" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-foreground">No Canteens Configured</h3>
                <p className="text-muted-foreground text-sm">Set up your first outlet to start managing operations.</p>
            </div>
            <Dialog open={isAddCanteenDialogOpen} onOpenChange={setIsAddCanteenDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-bold">
                  <Plus className="mr-2 h-4 w-4" /> Setup Canteen
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader><DialogTitle>Register New Outlet</DialogTitle></DialogHeader>
                <AddCanteenForm onSubmit={handleAddCanteen} onCancel={() => setIsAddCanteenDialogOpen(false)} loading={isAddingCanteen} />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CanteenManagerWidget;