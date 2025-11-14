"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface AddCanteenFormProps {
  onSubmit: (canteenName: string) => void;
  onCancel: () => void;
}

const AddCanteenForm: React.FC<AddCanteenFormProps> = ({ onSubmit, onCancel }) => {
  const [canteenName, setCanteenName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canteenName.trim()) {
      toast.error("Canteen name cannot be empty.");
      return;
    }
    setLoading(true);
    onSubmit(canteenName.trim());
    // Note: onSubmit handles setting loading=false and closing the dialog on success/failure
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="canteenName" className="text-left sm:text-right text-foreground">
          Canteen Name
        </Label>
        <Input
          id="canteenName"
          value={canteenName}
          onChange={(e) => setCanteenName(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="e.g., Main Mess, Annex Cafe"
          required
          disabled={loading}
        />
      </div>
      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {loading ? "Adding..." : "Add Canteen"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default AddCanteenForm;