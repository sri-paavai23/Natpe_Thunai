"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RefreshCw, UtensilsCrossed, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CANTEEN_COLLECTION_ID } from "@/lib/appwrite";
import { ID, Models } from "appwrite";

interface CanteenItem {
  name: string;
  available: boolean;
}

interface CanteenData extends Models.Document {
  isOpen: boolean;
  items: CanteenItem[];
}

// We use a fixed ID for the single canteen status document
const CANTEEN_DOC_ID = "campus_canteen_status";

const CanteenStatusWidget = () => {
  const [canteenData, setCanteenData] = useState<CanteenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchCanteenData = useCallback(async () => {
    setLoading(true);
    try {
      const doc = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        CANTEEN_DOC_ID
      ) as unknown as CanteenData;
      setCanteenData(doc);
    } catch (error: any) {
      if (error.code === 404) {
        // Document not found, initialize it
        await initializeCanteenData();
      } else {
        console.error("Error fetching canteen data:", error);
        toast.error("Failed to load canteen status.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeCanteenData = async () => {
    const initialData = {
      isOpen: true,
      items: [
        { name: "Samosa", available: true },
        { name: "Coffee", available: true },
        { name: "Sandwich", available: false },
      ],
    };
    try {
      const newDoc = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        CANTEEN_DOC_ID,
        initialData
      ) as unknown as CanteenData;
      setCanteenData(newDoc);
      toast.info("Canteen status initialized.");
    } catch (e) {
      console.error("Error initializing canteen data:", e);
      toast.error("Failed to initialize canteen status.");
    }
  };

  const updateCanteenData = async (updates: Partial<CanteenData>) => {
    if (!canteenData) return;
    setIsUpdating(true);
    try {
      const updatedDoc = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        CANTEEN_DOC_ID,
        updates
      ) as unknown as CanteenData;
      setCanteenData(updatedDoc);
      return updatedDoc;
    } catch (error: any) {
      console.error("Error updating canteen data:", error);
      toast.error(error.message || "Failed to update canteen status.");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchCanteenData();
  }, [fetchCanteenData]);

  const handleRefresh = () => {
    toast.info("Refreshing canteen status...");
    fetchCanteenData();
  };

  const handleToggleCanteenStatus = (checked: boolean) => {
    updateCanteenData({ isOpen: checked });
    toast.success(`Canteen is now ${checked ? "Open" : "Closed"}!`);
  };

  const handleToggleAvailability = (index: number) => {
    if (!canteenData) return;
    const newItems = canteenData.items.map((item, i) =>
      i === index ? { ...item, available: !item.available } : item
    );
    updateCanteenData({ items: newItems });
    toast.success("Item availability updated!");
  };

  const handleAddItem = () => {
    if (!canteenData) return;
    if (newItemName.trim() === "") {
      toast.error("Food item name cannot be empty.");
      return;
    }
    const newItems = [...canteenData.items, { name: newItemName.trim(), available: true }];
    updateCanteenData({ items: newItems });
    setNewItemName("");
    setIsAddingItem(false);
    toast.success(`"${newItemName.trim()}" added to the menu!`);
  };

  const handleRemoveItem = (index: number) => {
    if (!canteenData) return;
    const removedItemName = canteenData.items[index].name;
    const newItems = canteenData.items.filter((_, i) => i !== index);
    updateCanteenData({ items: newItems });
    toast.info(`"${removedItemName}" removed from the menu.`);
  };

  if (loading) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
        <p className="ml-3 text-muted-foreground">Loading Canteen Status...</p>
      </Card>
    );
  }

  const isOpen = canteenData?.isOpen ?? false;
  const items = canteenData?.items ?? [];

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-secondary-neon" /> Canteen Status
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsAddingItem(true)} className="text-muted-foreground hover:text-secondary-neon" disabled={isUpdating}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add Item</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRefresh} className="text-muted-foreground hover:text-secondary-neon" disabled={isUpdating}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh Status</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between mb-4">
          <Label htmlFor="canteen-status-toggle" className="text-sm text-foreground font-medium">Canteen is {isOpen ? "Open" : "Closed"}</Label>
          <Switch
            id="canteen-status-toggle"
            checked={isOpen}
            onCheckedChange={handleToggleCanteenStatus}
            className="data-[state=checked]:bg-secondary-neon data-[state=unchecked]:bg-muted-foreground"
            disabled={isUpdating}
          />
        </div>
        <ul className="space-y-2 text-sm">
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
      </CardContent>

      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New Food Item</DialogTitle>
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
    </Card>
  );
};

export default CanteenStatusWidget;