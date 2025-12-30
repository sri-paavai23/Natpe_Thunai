"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ID } from "appwrite";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from "@/lib/appwrite";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { getColleges } from "@/lib/utils";
import { toast } from "sonner";

const foodOfferingFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["available", "unavailable"]).default("available"),
  servedCollegeIds: z.array(z.string()).min(1, "At least one college must be selected"),
  imageUrl: z.string().url("Invalid URL").optional().or(z.literal('')),
});

type FoodOfferingFormValues = z.infer<typeof foodOfferingFormSchema>;

interface MerchantFoodOfferingFormProps {
  sellerId: string;
  onClose: () => void;
  foodOffering?: any; // Existing food offering data for editing
}

export const MerchantFoodOfferingForm: React.FC<MerchantFoodOfferingFormProps> = ({ sellerId, onClose, foodOffering }) => {
  const colleges = getColleges().map(c => ({ label: c.name, value: c.id }));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FoodOfferingFormValues>({
    resolver: zodResolver(foodOfferingFormSchema),
    defaultValues: foodOffering
      ? {
          ...foodOffering,
          price: parseFloat(foodOffering.price), // Ensure price is a number
          servedCollegeIds: foodOffering.servedCollegeIds || [],
        }
      : {
          name: "",
          description: "",
          price: 0,
          category: "",
          status: "available",
          servedCollegeIds: [],
          imageUrl: "",
        },
  });

  const servedCollegeIds = watch("servedCollegeIds");
  const foodStatus = watch("status");

  const onSubmit = async (values: FoodOfferingFormValues) => {
    try {
      const data = {
        ...values,
        sellerId: sellerId,
        price: parseFloat(values.price.toFixed(2)), // Ensure price is stored as a number with 2 decimal places
      };

      if (foodOffering) {
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_FOOD_ORDERS_COLLECTION_ID,
          foodOffering.$id,
          data
        );
        toast.success("Food offering updated successfully!");
      } else {
        await databases.createDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_FOOD_ORDERS_COLLECTION_ID,
          ID.unique(),
          data
        );
        toast.success("Food offering created successfully!");
      }
      onClose();
    } catch (error: any) {
      console.error("Food offering form error:", error);
      toast.error(error.message || "Failed to save food offering.");
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-background mb-6">
      <h3 className="text-xl font-bold mb-4">{foodOffering ? "Edit Food Offering" : "Add New Food Offering"}</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
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
          <Label htmlFor="category">Category</Label>
          <Input id="category" {...register("category")} />
          {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select onValueChange={(value: "available" | "unavailable") => setValue("status", value)} value={foodStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
        </div>
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
            {isSubmitting ? "Saving..." : "Save Offering"}
          </Button>
        </div>
      </form>
    </div>
  );
};