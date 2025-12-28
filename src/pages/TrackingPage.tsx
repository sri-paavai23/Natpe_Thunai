import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, Truck, Utensils, MapPin, Phone, User, Clock } from 'lucide-react';
import { useFoodOrders, FoodOrder, OrderStatus } from '@/hooks/useFoodOrders';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const TrackingPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { orders: foodOrders, isLoading: isLoadingFood, refetch: refetchFoodOrders, updateOrderStatus } = useFoodOrders();
  const [order, setOrder] = useState<FoodOrder | null>(null);

  useEffect(() => {
    if (orderId && foodOrders.length > 0) {
      const foundOrder = foodOrders.find(o => o.$id === orderId);
      setOrder(foundOrder || null);
    }
  }, [orderId, foodOrders]);

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order || !user) return;

    try {
      await updateOrderStatus(order.$id, newStatus, user.$id, user.name);
      toast.success(`Order status updated to ${newStatus}.`);
      refetchFoodOrders(); // Refresh orders to get latest status
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast.error("Failed to update order status.");
    }
  };

  if (isLoadingFood) {
    return <div className="text-center py-8">Loading order details...</div>;
  }

  if (!order) {
    return <div className="text-center py-8 text-red-500">Order not found or you do not have permission to view it.</div>;
  }

  const isBuyer = user?.$id === order.buyerId;
  const isAmbassador = user?.$id === order.ambassadorId;
  const isCanteenOwner = userProfile?.collegeName === order.collegeName && userProfile?.isDeveloper; // Assuming developers can manage canteen orders

  const canAcceptDelivery = userProfile?.isAmbassador && !order.ambassadorId && order.status === "Ready for Pickup";
  const canMarkAsDelivered = isAmbassador && order.status === "Ready for Pickup";
  const canCancelOrder = isBuyer && (order.status === "Pending" || order.status === "Preparing");
  const canManageStatus = isCanteenOwner || isAmbassador;

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "Pending": return "text-yellow-500";
      case "Preparing": return "text-blue-500";
      case "Ready for Pickup": return "text-orange-500";
      case "Delivered": return "text-green-500";
      case "Cancelled": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Order Tracking #{order.$id.substring(0, 8)}
            <span className={`text-sm font-semibold ${getStatusColor(order.status)}`}>{order.status}</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Placed on {new Date(order.$createdAt).toLocaleString()}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Order Details</h3>
              <p className="flex items-center gap-2 text-sm"><Utensils className="h-4 w-4 text-muted-foreground" /> {order.offeringName} (x{order.quantity})</p>
              <p className="flex items-center gap-2 text-sm"><DollarSign className="h-4 w-4 text-muted-foreground" /> Total: ₹{order.totalPrice.toFixed(2)}</p>
              <p className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-muted-foreground" /> Canteen: {order.canteenName}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Delivery Information</h3>
              <p className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /> {order.deliveryLocation}</p>
              <p className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {order.contactNumber}</p>
              {order.notes && <p className="text-sm text-muted-foreground mt-1">Notes: {order.notes}</p>}
            </div>
          </div>

          <Separator className="my-6" />

          <h3 className="font-semibold text-lg mb-4">People Involved</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-muted-foreground" /> Buyer: {order.buyerName}</p>
            </div>
            <div>
              {order.ambassadorId ? (
                <p className="flex items-center gap-2 text-sm"><Truck className="h-4 w-4 text-muted-foreground" /> Ambassador: {order.ambassadorName}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No ambassador assigned yet.</p>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          <h3 className="font-semibold text-lg mb-4">Actions</h3>
          <div className="flex flex-wrap gap-2">
            {canAcceptDelivery && (
              <Button onClick={() => handleUpdateStatus("Delivered")} className="bg-blue-500 hover:bg-blue-600">
                Accept Delivery
              </Button>
            )}
            {canMarkAsDelivered && (
              <Button onClick={() => handleUpdateStatus("Delivered")} className="bg-green-500 hover:bg-green-600">
                Mark as Delivered
              </Button>
            )}
            {canCancelOrder && (
              <Button onClick={() => handleUpdateStatus("Cancelled")} variant="destructive">
                Cancel Order
              </Button>
            )}
            {isCanteenOwner && order.status === "Pending" && (
              <Button onClick={() => handleUpdateStatus("Preparing")} variant="secondary">
                Start Preparing
              </Button>
            )}
            {isCanteenOwner && order.status === "Preparing" && (
              <Button onClick={() => handleUpdateStatus("Ready for Pickup")} variant="secondary">
                Ready for Pickup
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackingPage;