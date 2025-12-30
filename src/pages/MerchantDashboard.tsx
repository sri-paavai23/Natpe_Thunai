"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { MerchantProductForm } from "@/components/MerchantProductForm";
import { MerchantFoodOfferingForm } from "@/components/MerchantFoodOfferingForm";
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { toast } from "sonner";
import { getCollegeNameById } from "@/lib/utils";

interface Product {
  $id: string;
  title: string;
  description: string;
  price: number;
  type: 'sell' | 'rent';
  status: 'available' | 'sold' | 'rented';
  servedCollegeIds: string[];
  imageUrl?: string;
}

interface FoodOffering {
  $id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  status: 'available' | 'unavailable';
  servedCollegeIds: string[];
  imageUrl?: string;
}

interface Transaction {
  $id: string;
  productId: string;
  productTitle: string;
  buyerName: string;
  amount: number;
  status: string;
  createdAt: string;
}

const MerchantDashboard: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [foodOfferings, setFoodOfferings] = useState<FoodOffering[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isFoodFormOpen, setIsFoodFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingFoodOffering, setEditingFoodOffering] = useState<FoodOffering | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await account.get();
        setCurrentUserId(user.$id);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast.error("Failed to load user data.");
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchMerchantData();
    }
  }, [currentUserId]);

  const fetchMerchantData = async () => {
    if (!currentUserId) return;

    try {
      // Fetch Products
      const productsResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID,
        [Query.equal('sellerId', currentUserId)]
      );
      setProducts(productsResponse.documents as unknown as Product[]);

      // Fetch Food Offerings
      const foodResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID, // Assuming food offerings are stored here
        [Query.equal('sellerId', currentUserId)]
      );
      setFoodOfferings(foodResponse.documents as unknown as FoodOffering[]);

      // Fetch Transactions
      const transactionsResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [Query.equal('sellerId', currentUserId), Query.orderDesc('$createdAt')]
      );
      setTransactions(transactionsResponse.documents as unknown as Transaction[]);

    } catch (error) {
      console.error("Failed to fetch merchant data:", error);
      toast.error("Failed to load merchant data.");
    }
  };

  const handleProductFormClose = () => {
    setIsProductFormOpen(false);
    setEditingProduct(null);
    fetchMerchantData();
  };

  const handleFoodFormClose = () => {
    setIsFoodFormOpen(false);
    setEditingFoodOffering(null);
    fetchMerchantData();
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const handleEditFoodOffering = (food: FoodOffering) => {
    setEditingFoodOffering(food);
    setIsFoodFormOpen(true);
  };

  const handleUpdateTransactionStatus = async (transactionId: string, newStatus: string) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        transactionId,
        { status: newStatus }
      );
      toast.success("Transaction status updated.");
      fetchMerchantData(); // Refresh transactions
    } catch (error) {
      console.error("Failed to update transaction status:", error);
      toast.error("Failed to update transaction status.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Merchant Dashboard</h1>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Exchange Listings</TabsTrigger>
          <TabsTrigger value="food">Food Offerings</TabsTrigger>
          <TabsTrigger value="orders">Orders & Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Your Products</CardTitle>
              <Button onClick={() => setIsProductFormOpen(true)} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
              </Button>
            </CardHeader>
            <CardContent>
              {isProductFormOpen && (
                <MerchantProductForm
                  sellerId={currentUserId!}
                  onClose={handleProductFormClose}
                  product={editingProduct}
                />
              )}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                {products.length === 0 ? (
                  <p className="text-muted-foreground">No products listed yet.</p>
                ) : (
                  products.map((product) => (
                    <Card key={product.$id} className="flex flex-col">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.title} className="w-full h-48 object-cover rounded-t-lg" />
                      )}
                      <CardHeader>
                        <CardTitle>{product.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{product.type === 'sell' ? 'For Sale' : 'For Rent'}</p>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                        <p className="font-semibold text-lg">₹{product.price}</p>
                        <p className="text-xs text-muted-foreground">
                          Available in: {product.servedCollegeIds.map(getCollegeNameById).join(', ')}
                        </p>
                        <p className={`text-sm font-medium ${product.status === 'available' ? 'text-green-500' : 'text-red-500'}`}>
                          Status: {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        </p>
                      </CardContent>
                      <div className="p-4 border-t flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>Edit</Button>
                        {/* Add delete functionality if needed */}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="food" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Your Food Offerings</CardTitle>
              <Button onClick={() => setIsFoodFormOpen(true)} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Offering
              </Button>
            </CardHeader>
            <CardContent>
              {isFoodFormOpen && (
                <MerchantFoodOfferingForm
                  sellerId={currentUserId!}
                  onClose={handleFoodFormClose}
                  foodOffering={editingFoodOffering}
                />
              )}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                {foodOfferings.length === 0 ? (
                  <p className="text-muted-foreground">No food offerings listed yet.</p>
                ) : (
                  foodOfferings.map((food) => (
                    <Card key={food.$id} className="flex flex-col">
                      {food.imageUrl && (
                        <img src={food.imageUrl} alt={food.name} className="w-full h-48 object-cover rounded-t-lg" />
                      )}
                      <CardHeader>
                        <CardTitle>{food.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{food.category}</p>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground mb-2">{food.description}</p>
                        <p className="font-semibold text-lg">₹{food.price}</p>
                        <p className="text-xs text-muted-foreground">
                          Available in: {food.servedCollegeIds.map(getCollegeNameById).join(', ')}
                        </p>
                        <p className={`text-sm font-medium ${food.status === 'available' ? 'text-green-500' : 'text-red-500'}`}>
                          Status: {food.status.charAt(0).toUpperCase() + food.status.slice(1)}
                        </p>
                      </CardContent>
                      <div className="p-4 border-t flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditFoodOffering(food)}>Edit</Button>
                        {/* Add delete functionality if needed */}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Your Orders & Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-muted-foreground">No transactions yet.</p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <Card key={transaction.$id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{transaction.productTitle}</p>
                          <p className="text-sm text-muted-foreground">Buyer: {transaction.buyerName}</p>
                          <p className="text-lg font-bold">₹{transaction.amount}</p>
                          <p className="text-xs text-muted-foreground">Order Date: {new Date(transaction.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${transaction.status === 'paid_to_seller' ? 'text-green-500' : 'text-orange-500'}`}>
                            Status: {transaction.status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                          </p>
                          {transaction.status === 'commission_deducted' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="mt-2"
                              onClick={() => handleUpdateTransactionStatus(transaction.$id, 'seller_confirmed_delivery')}
                            >
                              Confirm Delivery
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MerchantDashboard;