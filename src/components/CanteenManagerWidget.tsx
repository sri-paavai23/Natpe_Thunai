"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useCanteenData } from '@/hooks/useCanteenData';
import AddCanteenForm from '@/components/forms/AddCanteenForm';
import { toast } from 'sonner';

const CanteenManagerWidget = () => {
  const { userProfile } = useAuth(); // NEW: Use useAuth hook
  const { allCanteens, isLoading, error, refetch, updateCanteen, addCanteen } = useCanteenData();
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const handleToggleCanteenStatus = async (canteenId: string, currentStatus: 'open' | 'closed') => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    await updateCanteen(canteenId, { status: newStatus });
  };

  const handleAddCanteenSubmit = async (name: string, collegeId: string) => {
    await addCanteen(name, collegeId);
    setIsAddFormOpen(false);
  };

  if (userProfile?.userType !== 'developer' && userProfile?.userType !== 'staff') {
    return null; // Only developers and staff can manage canteens
  }

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Canteen Manager</CardTitle>
        <Button size="sm" onClick={() => setIsAddFormOpen(true)}>Add Canteen</Button>
      </CardHeader>
      <CardContent>
        {isAddFormOpen && (
          <AddCanteenForm
            onSubmit={handleAddCanteenSubmit}
            onCancel={() => setIsAddFormOpen(false)}
            loading={isLoading}
          />
        )}
        {isLoading ? (
          <p>Loading canteens...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : allCanteens.length === 0 ? (
          <p className="text-muted-foreground">No canteens managed yet.</p>
        ) : (
          <div className="space-y-4 mt-4">
            {allCanteens.map((canteen) => (
              <div key={canteen.$id} className="flex items-center justify-between border p-3 rounded-md">
                <div>
                  <p className="font-semibold">{canteen.name}</p>
                  <p className="text-sm text-muted-foreground">College ID: {canteen.collegeId}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`canteen-status-${canteen.$id}`}>{canteen.status === 'open' ? 'Open' : 'Closed'}</Label>
                  <Switch
                    id={`canteen-status-${canteen.$id}`}
                    checked={canteen.status === 'open'}
                    onCheckedChange={() => handleToggleCanteenStatus(canteen.$id, canteen.status)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CanteenManagerWidget;