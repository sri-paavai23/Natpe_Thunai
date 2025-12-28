import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Tag, MapPin, User, Clock, AlertTriangle, Phone } from 'lucide-react'; // Import Phone
import { useMarketListings } from '@/hooks/useMarketListings';
import { useAuth } from '@/context/AuthContext';
import { useBargainRequests, BargainStatus } from '@/hooks/useBargainRequests';
import BuyProductDialog from '@/components/forms/BuyProductDialog';
import ReportListingForm from '@/components/forms/ReportListingForm';
import BargainProductDialog from '@/components/forms/BargainProductDialog'; // Assuming this component exists
import { toast } from 'sonner';

const ProductDetailsPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  const { products, isLoading, error, deleteProduct } = useMarketListings();
  const { sendBargainRequest, getBargainStatusForProduct } = useBargainRequests();

  const [product, setProduct] = useState<any>(null);
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isBargainDialogOpen, setIsBargainDialogOpen] = useState(false);
  const [currentBargainStatus, setCurrentBargainStatus] = useState<BargainStatus>("none"); // Initialize with "none"
  const [currentBargainRequestId, setCurrentBargainRequestId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (products.length > 0 && productId) {
      const foundProduct = products.find(p => p.$id === productId);
      setProduct(foundProduct);
    }
  }, [products, productId]);

  useEffect(() => {
    const fetchBargainStatus = async () => {
      if (productId) {
        const { status, requestId } = await getBargainStatusForProduct(productId);
        setCurrentBargainStatus(status);
        setCurrentBargainRequestId(requestId);
      }
    };
    fetchBargainStatus();
  }, [productId, getBargainStatusForProduct]);

  const handlePurchaseInitiated = (purchaseDetails: { productId: string; amount: number; paymentMethod: string; ambassadorId?: string }) => {
    // In a real app, this would trigger a payment process and then update product status
    console.log("Purchase Initiated:", purchaseDetails);
    toast.success("Purchase initiated! Seller will be notified.");
    setIsBuyDialogOpen(false);
    // navigate('/tracking/some-order-id'); // Navigate to tracking page
  };

  const handleBargainInitiated = async (bargainDetails: { productId: string; requestedPrice: number; message: string }) => {
    if (!product) return;
    try {
      await sendBargainRequest(product, bargainDetails.requestedPrice, bargainDetails.message);
      toast.success("Bargain request sent!");
      setIsBargainDialogOpen(false);
      // Refetch bargain status to update UI
      const { status, requestId } = await getBargainStatusForProduct(product.$id);
      setCurrentBargainStatus(status);
      setCurrentBargainRequestId(requestId);
    } catch (error) {
      console.error("Failed to send bargain request:", error);
      toast.error("Failed to send bargain request.");
    }
  };

  const handleDeleteProduct = async () => {
    if (!product || !user || product.sellerId !== user.$id) {
      toast.error("You are not authorized to delete this product.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(product.$id);
        toast.success("Product deleted successfully!");
        navigate('/market');
      } catch (err) {
        console.error("Failed to delete product:", err);
        toast.error("Failed to delete product.");
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading product details...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  if (!product) {
    return <div className="text-center py-8 text-red-500">Product not found.</div>;
  }

  const isSeller = user?.$id === product.sellerId;
  const isBargainInitiated = currentBargainStatus === "initiated";
  const isBargainAccepted = currentBargainStatus === "accepted";

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-foreground">{product.title}</CardTitle>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Tag className="h-4 w-4" /> {product.category} | Condition: {product.condition}
          </p>
        </CardHeader>
        <CardContent>
          {product.imageUrl && (
            <img src={product.imageUrl} alt={product.title} className="w-full h-64 object-cover rounded-md mb-6" />
          )}

          <div className="flex items-center justify-between mb-6">
            <span className="flex items-center text-4xl font-bold text-primary">
              <DollarSign className="h-6 w-6 mr-2" /> {product.price.toFixed(2)}
            </span>
            {product.negotiable && <span className="text-sm text-muted-foreground">Negotiable</span>}
          </div>

          <p className="text-lg text-gray-700 mb-6">{product.description}</p>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Seller Information</h3>
              <p className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-muted-foreground" /> {product.sellerName}</p>
              <p className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /> {product.collegeName}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Listing Details</h3>
              <p className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-muted-foreground" /> Posted: {new Date(product.$createdAt).toLocaleDateString()}</p>
              <p className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> Contact: {product.contactInfo}</p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-wrap gap-4 justify-center">
            {!isSeller && !isBargainAccepted && (
              <Button onClick={() => setIsBuyDialogOpen(true)} className="flex-1 min-w-[150px]">
                Buy Now
              </Button>
            )}
            {!isSeller && product.negotiable && !isBargainInitiated && !isBargainAccepted && (
              <Button variant="outline" onClick={() => setIsBargainDialogOpen(true)} className="flex-1 min-w-[150px]">
                Make an Offer
              </Button>
            )}
            {isBargainInitiated && (
              <Button variant="secondary" disabled className="flex-1 min-w-[150px]">
                Bargain Initiated
              </Button>
            )}
            {isBargainAccepted && (
              <Button variant="default" disabled className="flex-1 min-w-[150px]"> {/* Changed variant to default */}
                Bargain Accepted!
              </Button>
            )}
            {isSeller && (
              <>
                <Button variant="secondary" onClick={() => navigate(`/market/edit/${product.$id}`)} className="flex-1 min-w-[150px]">
                  Edit Listing
                </Button>
                <Button variant="destructive" onClick={handleDeleteProduct} className="flex-1 min-w-[150px]">
                  Delete Listing
                </Button>
              </>
            )}
            {!isSeller && (
              <Button variant="outline" onClick={() => setIsReportDialogOpen(true)} className="flex-1 min-w-[150px]">
                <AlertTriangle className="h-4 w-4 mr-2" /> Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {product && (
        <>
          <BuyProductDialog
            product={product}
            onPurchaseInitiated={handlePurchaseInitiated}
            onCancel={() => setIsBuyDialogOpen(false)}
          />
          <BargainProductDialog
            product={product}
            onBargainInitiated={handleBargainInitiated}
            onCancel={() => setIsBargainDialogOpen(false)}
          />
          <ReportListingForm
            listingId={product.$id}
            listingType="product"
            onReportSubmitted={() => setIsReportDialogOpen(false)}
            onCancel={() => setIsReportDialogOpen(false)}
          />
        </>
      )}
    </div>
  );
};

export default ProductDetailsPage;