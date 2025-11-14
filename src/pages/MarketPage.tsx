import ProductListingCard from "@/components/ProductListingCard";
import { MarketWarningBanner } from "@/components/MarketWarningBanner";
import { Button } from "@/components/ui/button";
import { dummyProducts } from "@/lib/mockData"; // Import from lib/mockData

export default function MarketPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900">Community Marketplace</h1>
      
      <div className="mb-6">
        <MarketWarningBanner />
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Featured Listings</h2>
        <Button>Create New Listing</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {dummyProducts.map((product) => (
          <ProductListingCard key={product.$id} product={product} />
        ))}
      </div>
    </div>
  );
}