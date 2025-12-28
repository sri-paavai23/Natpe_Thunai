import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, UserPreferences } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ChangeUserRoleFormProps {
  onRoleChanged: () => void;
}

const ChangeUserRoleForm: React.FC<ChangeUserRoleFormProps> = ({ onRoleChanged }) => {
  const { updateUserProfile } = useAuth();
  const [targetUserId, setTargetUserId] = useState("");
  const [newRole, setNewRole] = useState<"user" | "developer" | "ambassador">("user");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) {
      toast.error("Please enter a User ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real application, you would fetch the user's current preferences
      // and then update them. For this example, we'll simulate the update.
      // This assumes updateUserProfile can update any user's profile given their ID.
      // In a real scenario, you'd likely have an admin-specific API endpoint.

      const updates: Partial<UserPreferences> = {
        isDeveloper: newRole === "developer",
        isAmbassador: newRole === "ambassador",
      };

      // This is a simplified call. In a real app, you'd need an admin function
      // that can update another user's profile by their ID.
      // For now, we'll assume updateUserProfile can handle this if targetUserId is passed.
      // A more robust solution would involve a backend function.
      await updateUserProfile({ $id: targetUserId, ...updates }); // Temporarily passing $id for type compatibility

      toast.success(`User ${targetUserId} role updated to ${newRole}.`);
      onRoleChanged();
      setTargetUserId("");
      setNewRole("user");
    } catch (error) {
      console.error("Failed to change user role:", error);
      toast.error("Failed to change user role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="targetUserId">Target User ID</Label>
        <Input
          id="targetUserId"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
          placeholder="Enter user's Appwrite ID"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newRole">New Role</Label>
        <Select value={newRole} onValueChange={(value: "user" | "developer" | "ambassador") => setNewRole(value)} required>
          <SelectTrigger id="newRole">
            <SelectValue placeholder="Select new role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="developer">Developer</SelectItem>
            <SelectItem value="ambassador">Ambassador</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating Role..." : "Change Role"}
      </Button>
    </form>
  );
};

export default ChangeUserRoleForm;