"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ID } from "appwrite";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from "@/lib/appwrite";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { getColleges } from "@/lib/utils";
import { toast } from "sonner";

const productFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  type: z.enum(["sell", "rent"]),
  status: z.enum(["available", "sold", "rented"]).default("available"),
  servedCollegeIds: z.array(z.string()).min(1, "At least one college must be selected"),
  imageUrl: z.string().url("Invalid URL").optional().or(z.literal('')),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface MerchantProductFormProps {
  sellerId: string;
  onClose: () => void;
  product?: any; // Existing product data for editing
}

export const MerchantProductForm: React.FC<MerchantProductFormProps> = ({ sellerId, onClose, product }) => {
  const colleges = getColleges().map(c => ({ label: c.name, value: c.id }));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          ...product,
          price: parseFloat(product.price), // Ensure price is a number
          servedCollegeIds: product.servedCollegeIds || [],
        }
      : {
          title: "",
          description: "",
          price: 0,
          type: "sell",
          status: "available",
          servedCollegeIds: [],
          imageUrl: "",
        },
  });

  const servedCollegeIds = watch("servedCollegeIds");
  const productType = watch("type");

  const onSubmit = async (values: ProductFormValues) => {
    try {
      const data = {
        ...values,
        sellerId: sellerId,
        price: parseFloat(values.price.toFixed(2)), // Ensure price is stored as a number with 2 decimal places
      };

      if (product) {
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_PRODUCTS_COLLECTION_ID,
          product.$id,
          data
        );
        toast.success("Product updated successfully!");
      } else {
        await databases.createDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_PRODUCTS_COLLECTION_ID,
          ID.unique(),
          data
        );
        toast.success("Product created successfully!");
      }
      onClose();
    } catch (error: any) {
      console.error("Product form error:", error);
      toast.error(error.message || "Failed to save product.");
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-background mb-6">
      <h3 className="text-xl font-bold mb-4">{product ? "Edit Product" : "Add New Product"}</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} />
          {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>
        <div>
          <Label htmlFor="price">Price</Label>
          <Input id="price" type="number" step="0.01" {...register("price")} />
          {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select onValueChange={(value: "sell" | "rent") => setValue("type", value)} value={productType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sell">Sell</SelectItem>
              <SelectItem value="rent">Rent</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
        </div>
        {product && ( // Only show status for existing products
          <div>
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value: "available" | "sold" | "rented") => setValue("status", value)} value={watch("status")}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
          </div>
        )}
        <div>
          <Label htmlFor="servedCollegeIds">Colleges Available In</Label>
          <MultiSelect
            options={colleges}
            selected={servedCollegeIds || []}
            onSelect={(values) => setValue("servedCollegeIds", values, { shouldValidate: true })}
            placeholder="Select colleges"
          />
          {errors.servedCollegeIds && <p className="text-red-500 text-sm">{errors.servedCollegeIds.message}</p>}
        </div>
        <div>
          <Label htmlFor="imageUrl">Image URL (Optional)</Label>
          <Input id="imageUrl" {...register("imageUrl")} />
          {errors.imageUrl && <p className="text-red-500 text-sm">{errors.imageUrl.message}</p>}
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </form>
    </div>
  );
};