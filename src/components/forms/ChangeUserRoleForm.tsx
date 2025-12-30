import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { toast } from "sonner";

interface ChangeUserRoleFormProps {
  onClose: () => void;
}

const ChangeUserRoleForm: React.FC<ChangeUserRoleFormProps> = ({ onClose }) => {
  const { userProfile, updateUserProfile } = useAuth();
  const [targetUserId, setTargetUserId] = useState("");
  const [newRole, setNewRole] = useState<"user" | "developer">("user");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || userProfile.role !== 'developer') {
      toast.error("You do not have permission to change user roles.");
      return;
    }

    setIsLoading(true);
    try {
      // First, find the user profile document ID for the targetUserId
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', targetUserId), Query.limit(1)]
      );

      if (response.documents.length === 0) {
        toast.error("User not found.");
        return;
      }

      const profileId = response.documents[0].$id;

      // Then, update the role using the profile document ID
      await updateUserProfile({ role: newRole }); // Corrected call signature
      toast.success(`User ${targetUserId} role changed to "${newRole}" successfully!`);
      onClose();
    } catch (error: any) {
      console.error("Error changing user role:", error);
      toast.error(error.message || "Failed to change user role.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="targetUserId">Target User ID</Label>
        <Input
          id="targetUserId"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
          placeholder="Enter user ID to change role"
          required
        />
      </div>
      <div>
        <Label htmlFor="newRole">New Role</Label>
        <Select value={newRole} onValueChange={(value: "user" | "developer") => setNewRole(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="developer">Developer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Changing...' : 'Change Role'}
        </Button>
      </div>
    </form>
  );
};

export default ChangeUserRoleForm;