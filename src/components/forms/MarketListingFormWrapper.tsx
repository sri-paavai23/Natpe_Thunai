import React, { useState } from "react";
    import { Button } from "@/components/ui/button";
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Textarea } from "@/components/ui/textarea";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { useAuth } from "@/context/AuthContext";
    import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from "@/lib/appwrite";
    import { ID } from 'appwrite';
    import { toast } from "sonner";

    interface MarketListingFormWrapperProps {
      isOpen: boolean;
      onClose: () => void;
      type: 'product' | 'service' | 'errand' | 'cash_exchange' | 'collaborator'; // Added type for recordMarketListing
    }

    const MarketListingFormWrapper: React.FC<MarketListingFormWrapperProps> = ({ isOpen, onClose, type }) => {
      const { user, userProfile, recordMarketListing } = useAuth();
      const [title, setTitle] = useState("");
      const [description, setDescription] = useState("");
      const [price, setPrice] = useState<number | string>("");
      const [listingType, setListingType] = useState<'sell' | 'rent'>('sell');
      const [imageUrl, setImageUrl] = useState("");
      const [isLoading, setIsLoading] = useState(false);

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile) {
          toast.error("You must be logged in to create a listing.");
          return;
        }
        if (!userProfile.collegeName) {
          toast.error("Your profile is missing college information. Please update your profile first.");
          return;
        }
        if (typeof price !== 'number' || price <= 0) {
          toast.error("Price must be a positive number.");
          return;
        }

        setIsLoading(true);
        try {
          await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_PRODUCTS_COLLECTION_ID,
            ID.unique(),
            {
              title,
              description,
              price,
              type: listingType,
              status: 'available',
              sellerId: user.$id,
              sellerName: user.name,
              sellerUpiId: userProfile.upiId || '', // Assuming UPI ID is in user profile
              sellerRating: userProfile.level, // Using level as a placeholder for rating
              location: userProfile.collegeName, // Using collegeName as location
              collegeName: userProfile.collegeName,
              servedCollegeIds: [userProfile.collegeId || ''], // Assuming product serves user's college
              imageUrl: imageUrl || undefined,
              userId: user.$id, // Redundant but kept for consistency with Product interface
            }
          );
          toast.success(`New ${type} listing created successfully!`);
          recordMarketListing(type); // Corrected call signature
          onClose();
        } catch (error: any) {
          console.error("Error creating listing:", error);
          toast.error(error.message || "Failed to create listing.");
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border-dark">
            <DialogHeader>
              <DialogTitle>Create New {type === 'product' ? 'Product' : type === 'service' ? 'Service' : 'Listing'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Price
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || '')}
                  className="col-span-3"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              {type === 'product' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="listingType" className="text-right">
                    Type
                  </Label>
                  <Select value={listingType} onValueChange={(value: 'sell' | 'rent') => setListingType(value)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select listing type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sell">Sell</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imageUrl" className="text-right">
                  Image URL (Optional)
                </Label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Listing'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );
    };

    export default MarketListingFormWrapper;