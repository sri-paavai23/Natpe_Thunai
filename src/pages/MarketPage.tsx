"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import MarketTabs from "@/components/MarketTabs";
import EcommerceLinks from "@/components/EcommerceLinks";
import ProductListingCard from "@/components/ProductListingCard";
import MarketWarningBanner from "@/components/MarketWarningBanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext"; // Corrected import path
import { Card, CardContent } from "@/components/ui/card";
import client, { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite'; // Import ID

// Import the new specialized forms with .tsx extension
import SellListingForm from "@/components/forms/SellListingForm.tsx";
import RentListingForm from "@/components/forms/RentListingForm.tsx";
import GiftCraftListingForm from "@/components/forms/GiftCraftListingForm.tsx";
import SportsGearListingForm from "@/components/forms/SportsGearListingForm.tsx";
import GiftCraftRequestForm from "@/components/forms/GiftCraftRequestForm.tsx"; // New import

interface Product {
  $id: string; // Appwrite document ID
  imageUrl: string;
  title: string;
  price: string;
  sellerRating: number;
  sellerBadge?: string;
  type: "sell" | "rent" | "gift" | "sports" | "gift-request";
  description: string;
  damages?: string;
  policies?: string;
  condition?: string;
  ambassadorDelivery?: boolean;
  ambassadorMessage?: string;
  referenceImageUrl?: string;
  budget?: string;
  contact?: string;
  sellerId: string; // Made required
  sellerName: string; // Made required
}

type MarketTabValue = "all" | "buy" | "sell" | "rent" | "gifts" | "sports";

export const dummyProducts: Product[] = [ // Exported dummyProducts
  {
    $id: "prod1",
    imageUrl: "/placeholder.svg",
    title: "Gaming Laptop (Used)",
    price: "₹45000",
    sellerRating: 4.8,
    sellerBadge: "Top Seller",
    type: "sell",
    description: "Lightly used gaming laptop, perfect for college work and casual gaming. Comes with charger.",
    damages: "Minor scratch on lid.",
    policies: "7-day return policy if not as described.",
    condition: "Used - Like New",
    sellerId: "user123",
    sellerName: "Alice Smith",
  },
  {
    $id: "prod2",
    imageUrl: "/placeholder.svg",
    title: "Mountain Bicycle",
    price: "₹150/day",
    sellerRating: 4.5,
    type: "rent",
    description: "Rent a sturdy mountain bike for campus commutes or weekend adventures.",
    policies: "Return by 8 PM. Security deposit required.",
    condition: "Used - Good",
    sellerId: "user124",
    sellerName: "Bob Johnson",
  },
  {
    $id: "prod3",
    imageUrl: "/placeholder.svg",
    title: "Handmade Friendship Bracelet",
    price: "₹200",
    sellerRating: 5.0,
    sellerBadge: "Craft Master",
    type: "gift",
    description: "Unique, hand-braided friendship bracelet. Customizable colors available.",
    damages: "None",
    policies: "No refunds on custom orders.",
    sellerId: "user125",
    sellerName: "Charlie Brown",
  },
  {
    $id: "prod4",
    imageUrl: "/placeholder.svg",
    title: "Cricket Bat (Willow)",
    price: "₹2500",
    sellerRating: 4.7,
    type: "sports",
    description: "Good quality English willow cricket bat, suitable for intermediate players.",
    condition: "Used - Good",
    sellerId: "user126",
    sellerName: "David Lee",
  },
  {
    $id: "prod5",
    imageUrl: "/placeholder.svg",
    title: "Custom Portrait Sketch Request",
    price: "₹500-₹1000",
    sellerRating: 4.9,
    type: "gift-request",
    description: "Looking for an artist to sketch a custom portrait from a photo. Budget negotiable.",
    referenceImageUrl: "https://example.com/portrait_ref.jpg",
    budget: "₹500-₹1000",
    contact: "requester@example.com",
    sellerId: "user127",
    sellerName: "Eve Davis",
  },
  {
    $id: "prod6",
    imageUrl: "/placeholder.svg",
    title: "Textbook: Data Structures",
    price: "₹700",
    sellerRating: 4.6,
    type: "sell",
    description: "Required textbook for CS301. Good condition, minimal highlighting.",
    damages: "Cover slightly worn.",
    policies: "Final sale.",
    condition: "Used - Good",
    sellerId: "user123",
    sellerName: "Alice Smith",
  },
  {
    $id: "prod7",
    imageUrl: "/placeholder.svg",
    title: "Badminton Racket",
    price: "₹50/hour",
    sellerRating: 4.2,
    type: "rent",
    description: "Rent a Yonex badminton racket for a quick game. Shuttlecocks not included.",
    policies: "Handle with care. Late return fee applies.",
    condition: "Used - Fair",
    sellerId: "user124",
    sellerName: "Bob Johnson",
  },
];

const MarketPage = () => {
  const [products, setProducts] = useState<Product[]>(dummyProducts); // Initialize with dummy data
  const [isSellFormOpen, setIsSellFormOpen] = useState(false);
  const [isRentFormOpen, setIsRentFormOpen] = useState(false);
  const [isGiftFormOpen, setIsGiftFormOpen] = useState(false);
  const [isSportsFormOpen, setIsSportsFormOpen] = useState(false);
  const [isGiftRequestFormOpen, setIsGiftRequestFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MarketTabValue>("all");
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [searchParams] = useSearchParams();
  const { userProfile, user } = useAuth();
  const isDeveloper = userProfile?.role === "developer";

  // Function to fetch products from Appwrite
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID
      );
      console.log("Fetched products response:", response); // Log the full response
      if (!Array.isArray(response.documents)) {
        throw new Error("Appwrite response documents is not an array.");
      }
      // Merge fetched products with dummy data, prioritizing fetched if IDs overlap
      const fetchedMap = new Map(response.documents.map(doc => [doc.$id, doc as unknown as Product]));
      const mergedProducts = dummyProducts.map(dummy => fetchedMap.get(dummy.$id) || dummy);
      response.documents.forEach(doc => {
        if (!fetchedMap.has(doc.$id)) {
          mergedProducts.push(doc as unknown as Product);
        }
      });

      setProducts(mergedProducts);
    } catch (error: any) { // Explicitly type error as any for broader logging
      console.error("Error fetching products from Appwrite:", error);
      console.error("Error details:", error.message, error.code, error.response); // Log more details
      toast.error(`Failed to load market listings: ${error.message || 'Unknown error'}`);
      // If fetching fails, we still want to display dummy data, so no need to clear products
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const unsubscribe = client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_PRODUCTS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          setProducts((prev) => [response.payload as unknown as Product, ...prev]);
          toast.info(`New listing: "${(response.payload as any).title}" added!`);
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          setProducts((prev) => prev.filter((p) => p.$id !== (response.payload as any).$id)); // Use $id for Appwrite documents
          toast.info(`Listing "${(response.payload as any).title}" removed.`);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "list-sell") {
      setActiveTab("sell");
      setIsSellFormOpen(true);
    }
  }, [searchParams]);

  const handleAddNewListing = async (type: Product["type"], data: any) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to create a listing.");
      return;
    }

    try {
      const newProduct = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID,
        ID.unique(), // Use unique() for Appwrite ID generation
        {
          ...data,
          sellerId: user.$id, // Link product to the current user's ID
          sellerName: `${userProfile.firstName} ${userProfile.lastName}`, // Set sellerName from profile
          sellerRating: 5.0, // Default rating for new sellers
          sellerBadge: "New Seller", // Default badge
          type: type,
          price: data.price || data.rentPrice || data.budget, // Price can be from different forms
        }
      );
      toast.success(`"${newProduct.title}" listed successfully!`);

      if (data.ambassadorDelivery) {
        toast.info(`Ambassador delivery requested for "${newProduct.title}". Message: "${data.ambassadorMessage || 'No message provided.'}"`);
      }
    } catch (error: any) {
      console.error("Error creating listing:", error);
      toast.error(error.message || "Failed to create listing.");
    }
  };

  const handleDeveloperDelete = async (productId: string) => {
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID,
        productId
      );
      toast.success(`Product (ID: ${productId}) deleted by developer.`);
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error(error.message || "Failed to delete product.");
    }
  };

  const renderListingDialog = (formType: Product["type"], label: string, isOpen: boolean, setIsOpen: React.Dispatch<React.SetStateAction<boolean>>) => {
    let FormComponent;
    let dialogTitle = "";
    let onSubmit: (data: any) => void = () => {};

    switch (formType) {
      case "sell":
        FormComponent = SellListingForm;
        dialogTitle = "List Item for Sale";
        onSubmit = (data) => handleAddNewListing("sell", data);
        break;
      case "rent":
        FormComponent = RentListingForm;
        dialogTitle = "List Item for Rent";
        onSubmit = (data) => handleAddNewListing("rent", data);
        break;
      case "gift":
        FormComponent = GiftCraftListingForm;
        dialogTitle = "List Gift/Craft Item";
        onSubmit = (data) => handleAddNewListing("gift", data);
        break;
      case "sports":
        FormComponent = SportsGearListingForm;
        dialogTitle = "List Sports Gear";
        onSubmit = (data) => handleAddNewListing("sports", data);
        break;
      case "gift-request":
        FormComponent = GiftCraftRequestForm;
        dialogTitle = "Post Gift/Craft Request";
        onSubmit = (data) => handleAddNewListing("gift-request", data);
        break;
      default:
        return null;
    }

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            <PlusCircle className="mr-2 h-4 w-4" /> {label}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{dialogTitle}</DialogTitle>
          </DialogHeader>
          <FormComponent onSubmit={onSubmit} onCancel={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    );
  };

  const filteredProducts = products.filter(p => {
    if (activeTab === "all") return true;
    if (activeTab === "buy") return p.type === "sell";
    if (activeTab === "gifts") return p.type === "gift" || p.type === "gift-request";
    return p.type === activeTab;
  });

  const renderProductCards = (items: Product[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {loadingProducts ? (
        <p className="col-span-full text-center text-muted-foreground py-4">Loading listings...</p>
      ) : items.length > 0 ? (
        items.map((product) => (
          <ProductListingCard key={product.$id} {...product} onDeveloperDelete={isDeveloper ? handleDeveloperDelete : undefined} />
        ))
      ) : (
        <p className="col-span-full text-center text-muted-foreground py-4">No listings found for this category.</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">The Exchange (Market)</h1>
      <div className="max-w-md mx-auto space-y-6">
        <MarketTabs
          onValueChange={setActiveTab}
          products={products}
          filteredProducts={filteredProducts}
          activeTab={activeTab}
        />

        {activeTab === "sell" && renderListingDialog("sell", "Create New Sell Listing", isSellFormOpen, setIsSellFormOpen)}
        {activeTab === "rent" && renderListingDialog("rent", "Create New Rent Listing", isRentFormOpen, setIsRentFormOpen)}
        {activeTab === "gifts" && (
          <div className="space-y-3">
            {renderListingDialog("gift", "Create New Gift/Craft Listing", isGiftFormOpen, setIsGiftFormOpen)}
            {renderListingDialog("gift-request", "Post Gift/Craft Request", isGiftRequestFormOpen, setIsGiftRequestFormOpen)}
          </div>
        )}
        {activeTab === "sports" && renderListingDialog("sports", "Create New Sports Gear Listing", isSportsFormOpen, setIsSportsFormOpen)}

        <EcommerceLinks />

        <MarketWarningBanner />

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            {renderProductCards(filteredProducts)}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default MarketPage;