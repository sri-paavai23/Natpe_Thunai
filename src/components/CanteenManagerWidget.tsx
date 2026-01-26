"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  RefreshCw, Utensils, Plus, Trash2, Loader2, Store, 
  CheckCircle2, XCircle, Zap, Power, Package 
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddCanteenForm from "./forms/AddCanteenForm";
import { useCanteenData } from "@/hooks/useCanteenData"; 
import { useAuth } from "@/context/AuthContext"; 
import { cn } from "@/lib/utils";

const CanteenManagerWidget = () => {
  const { userProfile } = useAuth(); 
  const { allCanteens, isLoading, error, refetch, updateCanteen, addCanteen } = useCanteenData();
  
  const [selectedCanteenId, setSelectedCanteenId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddCanteenDialogOpen, setIsAddCanteenDialogOpen] = useState(false);
  const [isAddingCanteen, setIsAddingCanteen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const selectedCanteen = allCanteens.find(c => c.$id === selectedCanteenId);

  useEffect(() => {
    if (!selectedCanteenId && allCanteens.length > 0) {
      setSelectedCanteenId(allCanteens[0].$id);
    } else if (selectedCanteenId && !allCanteens.some(c => c.$id === selectedCanteenId)) {
      setSelectedCanteenId(allCanteens.length > 0 ? allCanteens[0].$id : null);
    }
  }, [allCanteens, selectedCanteenId]);

  const handleAddCanteen = async (canteenName: string) => {
    if (!userProfile?.collegeName) {
        toast.error("Profile not loaded.");
        return;
    }
    setIsAddingCanteen(true);
    try {
      const newCanteen = await addCanteen(canteenName, userProfile.collegeName);
      if (newCanteen) {
        toast.success(`"${canteenName}" launched!`);
        setSelectedCanteenId(newCanteen.$id);
      }
      setIsAddCanteenDialogOpen(false);
    } catch (e) {
      toast.error("Failed to create canteen");
    } finally {
      setIsAddingCanteen(false);
    }
  };

  /**
   * ENHANCEMENT: CASCADING STATUS TOGGLE
   * When canteen opens/closes, all items follow suit instantly.
   */
  const handleToggleCanteenStatus = async (checked: boolean) => {
    if (!selectedCanteenId || !selectedCanteen) return;
    setIsUpdating(true);
    
    // Sync all items with the canteen status
    const synchronizedItems = selectedCanteen.items.map(item => ({
      ...item,
      available: checked
    }));

    try {
      await updateCanteen(selectedCanteenId, { 
        isOpen: checked, 
        items: synchronizedItems 
      });
      toast.success(checked ? "Outlet Active: All items online." : "Outlet Inactive: All items offline.");
    } catch (e) {
      toast.error("Sync failed.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAvailability = async (index: number) => {
    if (!selectedCanteen || !selectedCanteenId) return;
    setIsUpdating(true);
    try {
      const newItems = selectedCanteen.items.map((item, i) =>
        i === index ? { ...item, available: !item.available } : item
      );
      await updateCanteen(selectedCanteenId, { items: newItems });
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedCanteen || !selectedCanteenId) return;
    if (newItemName.trim() === "") {
      toast.error("Name the dish first!");
      return;
    }
    setIsUpdating(true);
    try {
      const newItems = [...selectedCanteen.items, { name: newItemName.trim(), available: selectedCanteen.isOpen }];
      await updateCanteen(selectedCanteenId, { items: newItems });
      toast.success(`"${newItemName.trim()}" added to menu.`);
      setNewItemName("");
      setIsAddingItem(false);
    } catch (e) {
      console.error(e);
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
      toast.info("Item removed.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-md border-border p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-secondary-neon mb-4" />
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-secondary-neon animate-pulse" />
        </div>
        <p className="text-secondary-neon font-black italic tracking-tighter uppercase animate-pulse">Syncing Kitchen...</p>
      </Card>
    );
  }

  const isOpen = selectedCanteen?.isOpen ?? false;
  const items = selectedCanteen?.items ?? [];

  return (
    <Card className="bg-card text-card-foreground shadow-2xl border-border overflow-hidden group">
      {/* Dynamic Header Section */}
      <div className={cn(
        "transition-colors duration-500 p-6 border-b border-border relative",
        isOpen ? "bg-secondary-neon/5" : "bg-destructive/5 grayscale-[0.5]"
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black italic tracking-tighter flex items-center gap-2 uppercase">
              <Store className={cn("h-7 w-7 transition-colors", isOpen ? "text-secondary-neon" : "text-muted-foreground")} /> 
              Kitchen<span className="text-secondary-neon">Control</span>
            </CardTitle>
            <CardDescription className="font-medium text-xs uppercase tracking-widest opacity-70">Live Menu Management</CardDescription>
          </div>
          
          <div className="flex items-center gap-3">
            <Dialog open={isAddCanteenDialogOpen} onOpenChange={setIsAddCanteenDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-secondary-neon text-primary-foreground font-bold shadow-neon hover:shadow-none active:scale-95 transition-all">
                  <Plus className="h-4 w-4 mr-1 stroke-[3px]" /> NEW OUTLET
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="font-black italic uppercase">Register New Canteen</DialogTitle>
                </DialogHeader>
                <AddCanteenForm 
                  onSubmit={handleAddCanteen} 
                  onCancel={() => setIsAddCanteenDialogOpen(false)} 
                  loading={isAddingCanteen}
                />
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="icon" onClick={refetch} disabled={isUpdating} className="rounded-full border-secondary-neon/20 hover:border-secondary-neon">
              <RefreshCw className={cn("h-4 w-4 text-secondary-neon", isUpdating && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-8">
        {allCanteens.length > 0 ? (
          <div className="space-y-8">
            
            {/* Control Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Active Outlet</Label>
                <Select value={selectedCanteenId || ""} onValueChange={setSelectedCanteenId} disabled={isUpdating}>
                  <SelectTrigger className="w-full h-12 font-bold text-base border-2 bg-muted/20">
                    <SelectValue placeholder="Choose Canteen" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCanteens.map(canteen => (
                      <SelectItem key={canteen.$id} value={canteen.$id} className="font-bold">{canteen.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCanteen && (
                <div className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-500 shadow-sm",
                  isOpen ? "border-secondary-neon/30 bg-secondary-neon/5" : "border-destructive/20 bg-muted/50 opacity-80"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-xl transition-colors",
                      isOpen ? "bg-secondary-neon text-primary-foreground shadow-neon" : "bg-muted text-muted-foreground"
                    )}>
                      <Power className="h-5 w-5 stroke-[3px]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Kitchen Master Switch</span>
                      <p className={cn("text-sm font-black uppercase", isOpen ? "text-secondary-neon" : "text-destructive")}>
                        {isOpen ? "Online & Serving" : "Kitchen Offline"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isOpen}
                    onCheckedChange={handleToggleCanteenStatus}
                    className="data-[state=checked]:bg-secondary-neon scale-110"
                    disabled={isUpdating}
                  />
                </div>
              )}
            </div>

            {selectedCanteen && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Package className="h-4 w-4 text-secondary-neon" /> DISH LISTINGS
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsAddingItem(true)}
                    className="text-secondary-neon hover:bg-secondary-neon/10 font-bold h-8 text-[10px] uppercase tracking-tighter"
                  >
                    <Plus className="h-3 w-3 mr-1 stroke-[3px]" /> Add Item
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          "group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300",
                          item.available 
                            ? "bg-card border-secondary-neon/10 shadow-sm hover:border-secondary-neon/40" 
                            : "bg-muted/10 border-transparent opacity-50 grayscale"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-3 w-3 rounded-full transition-all duration-500",
                            item.available ? "bg-secondary-neon shadow-neon scale-110" : "bg-muted"
                          )} />
                          <span className={cn("text-sm font-bold tracking-tight uppercase transition-all", !item.available && "text-muted-foreground")}>
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <span className={cn("text-[9px] font-black uppercase tracking-widest hidden sm:inline-block", item.available ? "text-secondary-neon" : "text-muted-foreground")}>
                              {item.available ? "AVAILABLE" : "OUT OF STOCK"}
                            </span>
                            <Switch
                              checked={item.available}
                              onCheckedChange={() => handleToggleAvailability(index)}
                              className="data-[state=checked]:bg-secondary-neon h-5 w-9"
                              disabled={isUpdating || !isOpen} // Disable if canteen is closed
                            />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveItem(index)}
                            className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10 rounded-full"
                            disabled={isUpdating}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-3xl bg-muted/5 opacity-50">
                      <Utensils className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">Menu Empty</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 flex flex-col items-center animate-in zoom-in-95 duration-500">
            <div className="h-20 w-20 bg-secondary-neon/10 rounded-3xl flex items-center justify-center mb-6 rotate-6 shadow-neon">
              <Store className="h-10 w-10 text-secondary-neon" />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">No Active Outlets</h3>
            <p className="text-muted-foreground text-xs font-medium max-w-xs mb-8 uppercase tracking-widest leading-relaxed">
              Launch your first canteen to start dominating campus hunger.
            </p>
            <Button onClick={() => setIsAddCanteenDialogOpen(true)} className="bg-secondary-neon text-primary-foreground font-black px-8 py-6 rounded-2xl shadow-neon hover:shadow-none active:scale-95 transition-all uppercase tracking-widest">
              Create First Outlet
            </Button>
          </div>
        )}
      </CardContent>

      {/* Item Addition Dialog */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-black italic uppercase">Add Dish to Menu</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Dish Identity</Label>
              <Input 
                value={newItemName} 
                onChange={(e) => setNewItemName(e.target.value)} 
                placeholder="e.g. EXTRA CHEESE DOSA"
                className="h-12 font-bold uppercase"
                autoFocus
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-bold italic">* New items will match the current kitchen status ({isOpen ? 'LIVE' : 'OFFLINE'})</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddingItem(false)} className="font-bold">ABORT</Button>
            <Button onClick={handleAddItem} className="bg-secondary-neon text-primary-foreground font-bold px-8">CONFIRM DISH</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CanteenManagerWidget;