"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RefreshCw, UtensilsCrossed, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddCanteenForm from "./forms/AddCanteenForm";
import { useCanteenData, CanteenData } from "@/hooks/useCanteenData"; // Import the new hook
import { useAuth } from "@/context/AuthContext"; // NEW: Import useAuth

interface CanteenItem {
  name: string;
  available: boolean;
}

const CanteenManagerWidget = () => {
  const { userProfile } = useAuth(); // NEW: Use useAuth hook
  const { allCanteens, isLoading, error, refetch, updateCanteen, addCanteen } = useCanteenData();
  
  const [selectedCanteenId, setSelectedCanteenId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddCanteenDialogOpen, setIsAddCanteenDialogOpen] = useState(false);
  const [isAddingCanteen, setIsAddingCanteen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const selectedCanteen = allCanteens.find(c => c.$id === selectedCanteenId);

  // Effect to manage selected canteen ID when data changes
  useEffect(() => {
    if (!selectedCanteenId && allCanteens.length > 0) {
      // Set the first canteen as default if none is selected
      setSelectedCanteenId(allCanteens[0].$id);
    } else if (selectedCanteenId && !allCanteens.some(c => c.$id === selectedCanteenId)) {
      // If the currently selected canteen was deleted, select the first one or null
      setSelectedCanteenId(allCanteens.length > 0 ? allCanteens[0].$id : null);
    }
  }, [allCanteens, selectedCanteenId]);

  const handleAddCanteen = async (canteenName: string, collegeName: string) => { // NEW: Accept collegeName
    setIsAddingCanteen(true);
    try {
      const newCanteen = await addCanteen(canteenName, collegeName); // NEW: Pass collegeName
      if (newCanteen) {
        toast.success(`Canteen "${canteenName}" added successfully!`);
        // Automatically select the newly added canteen
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
      toast.success(`${selectedCanteen?.name} is now ${checked ? "Open" : "Closed"}!`);
      refetch(); // Refresh data to update UI
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
      toast.success("Item availability updated!");
      refetch(); // Refresh data to update UI
    } catch (e) {
      // Error handled in hook
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedCanteen || !selectedCanteenId) return;
    if (newItemName.trim() === "") {
      toast.error("Food item name cannot be empty.");
      return;
    }
    setIsUpdating(true);
    try {
      const newItems = [...selectedCanteen.items, { name: newItemName.trim(), available: true }];
      await updateCanteen(selectedCanteenId, { items: newItems });
      toast.success(`"${newItemName.trim()}" added to the menu!`);
      setNewItemName("");
      setIsAddingItem(false);
      refetch(); // Refresh data to update UI
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
      const removedItemName = selectedCanteen.items[index].name;
      const newItems = selectedCanteen.items.filter((_, i) => i !== index);
      await updateCanteen(selectedCanteenId, { items: newItems });
      toast.info(`"${removedItemName}" removed from the menu.`);
      refetch(); // Refresh data to update UI
    } catch (e) {
      // Error handled in hook
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
        <p className="ml-3 text-muted-foreground">Loading Canteen Status...</p>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border p-6">
        <p className="text-destructive">Error loading canteen data: {error}</p>
        <Button onClick={refetch} className="mt-2">Retry</Button>
      </Card>
    );
  }

  const isOpen = selectedCanteen?.isOpen ?? false;
  const items = selectedCanteen?.items ?? [];

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-secondary-neon" /> Canteen Manager
        </CardTitle>
        <div className="flex items-center gap-2">
          <Dialog open={isAddCanteenDialogOpen} onOpenChange={setIsAddCanteenDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-secondary-neon" disabled={isUpdating}>
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add Canteen</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add New Canteen</DialogTitle>
              </DialogHeader>
              <AddCanteenForm 
                onSubmit={handleAddCanteen} 
                onCancel={() => setIsAddCanteenDialogOpen(false)} 
                loading={isAddingCanteen}
              />
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" onClick={refetch} className="text-muted-foreground hover:text-secondary-neon" disabled={isUpdating}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh Status</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {allCanteens.length > 0 ? (
          <>
            <div className="mb-4 space-y-3">
              <Label htmlFor="canteen-select" className="text-sm text-foreground font-medium">Select Canteen</Label>
              <Select value={selectedCanteenId || ""} onValueChange={setSelectedCanteenId} disabled={isUpdating}>
                <SelectTrigger id="canteen-select" className="w-full bg-input text-foreground border-border focus:ring-ring focus:border-ring">
                  <SelectValue placeholder="Choose a Canteen" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  {allCanteens.map(canteen => (
                    <SelectItem key={canteen.$id} value={canteen.$id}>
                      {canteen.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCanteen && (
              <>
                <div className="flex items-center justify-between mb-4 border-t border-border pt-4">
                  <Label htmlFor="canteen-status-toggle" className="text-sm text-foreground font-medium">
                    {selectedCanteen.name} is {isOpen ? "Open" : "Closed"}
                  </Label>
                  <Switch
                    id="canteen-status-toggle"
                    checked={isOpen}
                    onCheckedChange={handleToggleCanteenStatus}
                    className="data-[state=checked]:bg-secondary-neon data-[state=unchecked]:bg-muted-foreground"
                    disabled={isUpdating}
                  />
                </div>
                
                <h4 className="text-md font-semibold text-foreground mb-2">Menu Items</h4>
                <ul className="space-y-2 text-sm border border-border rounded-md p-3 bg-background">
                  {items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center py-1 border-b border-border last:border-b-0">
                      <span className="text-foreground font-medium truncate max-w-[calc(100%-100px)]">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.available}
                          onCheckedChange={() => handleToggleAvailability(index)}
                          className="data-[state=checked]:bg-secondary-neon data-[state=unchecked]:bg-muted-foreground"
                          disabled={isUpdating}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="text-destructive hover:bg-destructive/10" disabled={isUpdating}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove {item.name}</span>
                        </Button>
                      </div>
                    </li>
                  ))}
                  {items.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No items on the menu. Add some!</p>
                  )}
                </ul>

                <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full mt-4 border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10" disabled={isUpdating}>
                      <Plus className="mr-2 h-4 w-4" /> Add New Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Add New Food Item to {selectedCanteen.name}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="food-item-name" className="text-right text-foreground">
                          Name
                        </Label>
                        <Input
                          id="food-item-name"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                          placeholder="e.g., Pizza Slice"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingItem(false)} className="border-border text-primary-foreground hover:bg-muted">Cancel</Button>
                      <Button onClick={handleAddItem} className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">Add Item</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </>
        ) : (
          <div className="text-center space-y-4 py-4">
            <p className="text-muted-foreground">No canteens found. Be the first to add one!</p>
            <Dialog open={isAddCanteenDialogOpen} onOpenChange={setIsAddCanteenDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                  <Plus className="mr-2 h-4 w-4" /> Add First Canteen
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Add New Canteen</DialogTitle>
                </DialogHeader>
                <AddCanteenForm 
                  onSubmit={handleAddCanteen} 
                  onCancel={() => setIsAddCanteenDialogOpen(false)} 
                  loading={isAddingCanteen}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CanteenManagerWidget;