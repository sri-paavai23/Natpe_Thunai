"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";

interface ChangeUserRoleFormProps {
  onRoleChanged?: () => void; // Optional callback after role is changed
}

const ChangeUserRoleForm: React.FC<ChangeUserRoleFormProps> = ({ onRoleChanged }) => {
  const { updateUserProfile } = useAuth();
  const [targetUserId, setTargetUserId] = useState("");
  const [newRole, setNewRole] = useState<string>("user");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!targetUserId.trim()) {
      toast.error("Please enter a User ID.");
      setLoading(false);
      return;
    }

    try {
      // First, find the user's profile document ID using their userId
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', targetUserId.trim())]
      );

      if (response.documents.length === 0) {
        toast.error("User profile not found for the given User ID.");
        setLoading(false);
        return;
      }

      const userProfileDoc = response.documents[0];
      const profileId = userProfileDoc.$id;

      // Then, update the role using the profile document ID
      await updateUserProfile(profileId, { role: newRole });
      toast.success(`User ${targetUserId} role changed to "${newRole}" successfully!`);
      setTargetUserId("");
      setNewRole("user");
      onRoleChanged?.(); // Call optional callback
    } catch (error: any) {
      console.error("Error changing user role:", error);
      toast.error(error.message || "Failed to change user role.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="targetUserId" className="text-foreground">Target User ID</Label>
        <Input
          id="targetUserId"
          type="text"
          placeholder="Enter user's Appwrite ID (e.g., 65e...)"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          You can find this ID in the Appwrite Console under "Auth" {"->"} "Users".
        </p>
      </div>
      <div>
        <Label htmlFor="newRole" className="text-foreground">New Role</Label>
        <Select value={newRole} onValueChange={setNewRole} required disabled={loading}>
          <SelectTrigger className="w-full bg-input text-foreground border-border focus:ring-ring focus:border-ring">
            <SelectValue placeholder="Select new role" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="developer">Developer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={loading}>
        {loading ? "Changing Role..." : "Change User Role"}
      </Button>
    </form>
  );
};

export default ChangeUserRoleForm;