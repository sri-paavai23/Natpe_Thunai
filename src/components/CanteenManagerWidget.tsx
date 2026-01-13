"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RefreshCw, Utensils, Plus, Trash2, Loader2, Store, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddCanteenForm from "./forms/AddCanteenForm";
import { useCanteenData } from "@/hooks/useCanteenData"; 
import { cn } from "@/lib/utils";

// 

const CanteenManagerWidget = () => {
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
    setIsAddingCanteen(true);
    try {
      const newCanteen = await addCanteen(canteenName);
      if (newCanteen) {
        toast.success(`"${canteenName}" is ready for business!`);
        setSelectedCanteenId(newCanteen.$id);
      }
      setIsAddCanteenDialogOpen(false);
    } catch (e) {
      // Error handled in hook
    } finally {
      setIsAddingCanteen(false);
    }
  };

  const handleToggleCanteenStatus = async (checked: boolean) => {
    if (!selectedCanteenId) return;
    setIsUpdating(true);
    try {
      await updateCanteen(selectedCanteenId, { isOpen: checked });
      toast.success(checked ? "We are open! Students can now order." : "Outlet closed. Orders paused.");
    } catch (e) {
      // Error handled in hook
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
      // No toast needed for quick toggles to keep UI clean, or use a subtle one
    } catch (e) {
      // Error handled in hook
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedCanteen || !selectedCanteenId) return;
    if (newItemName.trim() === "") {
      toast.error("Please name the dish.");
      return;
    }
    setIsUpdating(true);
    try {
      const newItems = [...selectedCanteen.items, { name: newItemName.trim(), available: true }];
      await updateCanteen(selectedCanteenId, { items: newItems });
      toast.success(`Delicious! "${newItemName.trim()}" added.`);
      setNewItemName("");
      setIsAddingItem(false);
    } catch (e) {
      // Error handled in hook
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
    } catch (e) {
      // Error handled in hook
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border p-8 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-neon mb-4" />
        <p className="text-muted-foreground font-medium">Setting up the kitchen...</p>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive p-6 text-center">
        <p className="text-destructive font-semibold mb-2">Failed to load canteen data</p>
        <p className="text-sm text-destructive/80 mb-4">{error}</p>
        <Button onClick={refetch} variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">Retry Connection</Button>
      </Card>
    );
  }

  const isOpen = selectedCanteen?.isOpen ?? false;
  const items = selectedCanteen?.items ?? [];

  return (
    <Card className="bg-card text-card-foreground shadow-xl border-border overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-secondary-neon/10 to-transparent p-6 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Store className="h-6 w-6 text-secondary-neon" /> 
              Campus Bites Manager
            </CardTitle>
            <CardDescription>Manage menus and availability in real-time.</CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog open={isAddCanteenDialogOpen} onOpenChange={setIsAddCanteenDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 shadow-sm">
                  <Plus className="h-4 w-4 mr-1" /> New Outlet
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Launch New Outlet</DialogTitle>
                </DialogHeader>
                <AddCanteenForm 
                  onSubmit={handleAddCanteen} 
                  onCancel={() => setIsAddCanteenDialogOpen(false)} 
                  loading={isAddingCanteen}
                />
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="icon" onClick={refetch} disabled={isUpdating}>
              <RefreshCw className={cn("h-4 w-4", isUpdating && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {allCanteens.length > 0 ? (
          <div className="space-y-6">
            
            {/* Canteen Selector & Status Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end bg-muted/30 p-4 rounded-xl border border-border/50">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Select Outlet</Label>
                <Select value={selectedCanteenId || ""} onValueChange={setSelectedCanteenId} disabled={isUpdating}>
                  <SelectTrigger className="w-full h-10 font-medium">
                    <SelectValue placeholder="Choose a Canteen" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCanteens.map(canteen => (
                      <SelectItem key={canteen.$id} value={canteen.$id}>{canteen.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCanteen && (
                <div className="flex items-center justify-between bg-card p-2 px-4 rounded-lg border border-border shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Live Status</span>
                    <span className={cn("font-bold flex items-center gap-1.5", isOpen ? "text-green-500" : "text-red-500")}>
                      {isOpen ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {isOpen ? "Accepting Orders" : "Currently Closed"}
                    </span>
                  </div>
                  <Switch
                    checked={isOpen}
                    onCheckedChange={handleToggleCanteenStatus}
                    className="data-[state=checked]:bg-green-500"
                    disabled={isUpdating}
                  />
                </div>
              )}
            </div>

            {selectedCanteen && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-muted-foreground" /> Today's Menu
                  </h3>
                  <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-secondary-neon hover:bg-secondary-neon/10 hover:text-secondary-neon">
                        <Plus className="h-4 w-4 mr-1" /> Add Dish
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add to Menu</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <Label>Item Name</Label>
                        <Input 
                          value={newItemName} 
                          onChange={(e) => setNewItemName(e.target.value)} 
                          placeholder="e.g. Spicy Chicken Wrap"
                          className="mt-2"
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddingItem(false)}>Cancel</Button>
                        <Button onClick={handleAddItem} className="bg-secondary-neon text-primary-foreground">Add to Menu</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          "group flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
                          item.available 
                            ? "bg-card border-border shadow-sm hover:border-secondary-neon/50" 
                            : "bg-muted/30 border-transparent opacity-70"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            item.available ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"
                          )} />
                          <span className={cn("font-medium", !item.available && "line-through text-muted-foreground")}>
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground hidden sm:inline-block">
                              {item.available ? "In Stock" : "Sold Out"}
                            </span>
                            <Switch
                              checked={item.available}
                              onCheckedChange={() => handleToggleAvailability(index)}
                              className="data-[state=checked]:bg-secondary-neon h-5 w-9"
                              disabled={isUpdating}
                            />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveItem(index)}
                            className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                            disabled={isUpdating}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
                      <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-muted-foreground font-medium">Menu is empty</p>
                      <p className="text-xs text-muted-foreground/70">Add items to start selling.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="h-16 w-16 bg-secondary-neon/10 rounded-full flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-secondary-neon" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Outlets Configured</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Get started by adding your first canteen or food outlet to manage orders.
            </p>
            <Button onClick={() => setIsAddCanteenDialogOpen(true)} className="bg-secondary-neon text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> Create First Outlet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CanteenManagerWidget;