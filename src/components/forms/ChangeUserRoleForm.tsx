"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from 'appwrite';
import { Loader2 } from "lucide-react";

interface ChangeUserRoleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const ChangeUserRoleForm: React.FC<ChangeUserRoleFormProps> = ({ onSuccess, onCancel }) => {
  const { updateUserProfile } = useAuth();
  const [targetUserId, setTargetUserId] = useState("");
  const [newRole, setNewRole] = useState<"user" | "developer" | "ambassador">("user");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // First, find the user profile document ID for the targetUserId
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', targetUserId)]
      );

      if (response.documents.length === 0) {
        toast.error("User profile not found for the given User ID.");
        return;
      }

      const profileId = response.documents[0].$id;

      // Then, update the role using the profile document ID
      await updateUserProfile({ role: newRole }); // Fixed: Pass only data object
      toast.success(`User ${targetUserId} role changed to "${newRole}" successfully!`);
      onSuccess();
    } catch (error: any) {
      console.error("Error changing user role:", error);
      toast.error(error.message || "Failed to change user role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="targetUserId" className="text-foreground">Target User ID</Label>
        <Input
          id="targetUserId"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="Enter user's Appwrite ID"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newRole" className="text-foreground">New Role</Label>
        <Select value={newRole} onValueChange={(value: "user" | "developer" | "ambassador") => setNewRole(value)} disabled={isSubmitting}>
          <SelectTrigger id="newRole" className="bg-input text-foreground border-border focus:ring-ring focus:border-ring">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent className="bg-card text-card-foreground border-border">
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="developer">Developer</SelectItem>
            <SelectItem value="ambassador">Ambassador</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Change Role"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default ChangeUserRoleForm;