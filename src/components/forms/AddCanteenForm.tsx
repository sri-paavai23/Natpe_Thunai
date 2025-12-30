"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface AddCanteenFormProps {
  onSubmit: (canteenName: string, collegeId: string) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const AddCanteenForm: React.FC<AddCanteenFormProps> = ({ onSubmit, onCancel, loading }) => {
  const { userProfile } = useAuth(); // NEW: Use useAuth hook
  const [canteenName, setCanteenName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.collegeId) {
      toast.error("Your college information is missing. Cannot add canteen.");
      return;
    }
    await onSubmit(canteenName, userProfile.collegeId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-background">
      <h3 className="text-xl font-bold">Add New Canteen</h3>
      <div>
        <Label htmlFor="canteenName">Canteen Name</Label>
        <Input
          id="canteenName"
          value={canteenName}
          onChange={(e) => setCanteenName(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Canteen"}
        </Button>
      </div>
    </form>
  );
};

export default AddCanteenForm;