"use client";

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ID } from "appwrite";
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { getColleges } from "@/lib/utils";
import { toast } from "sonner";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  userType: z.enum(["student", "teacher", "merchant"]),
  merchantName: z.string().optional(),
  businessDescription: z.string().optional(),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  servedCollegeIds: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (data.userType === "merchant") {
    if (!data.merchantName || data.merchantName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Merchant name is required for merchants",
        path: ["merchantName"],
      });
    }
    if (!data.businessDescription || data.businessDescription.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Business description is required for merchants",
        path: ["businessDescription"],
      });
    }
    if (!data.servedCollegeIds || data.servedCollegeIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one college must be selected for merchants",
        path: ["servedCollegeIds"],
      });
    }
  }
});

type SignUpFormValues = z.infer<typeof formSchema>;

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const colleges = getColleges().map(c => ({ label: c.name, value: c.id }));

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      userType: "student",
      merchantName: "",
      businessDescription: "",
      contactEmail: "",
      contactPhone: "",
      servedCollegeIds: [],
    },
  });

  const userType = watch("userType");
  const servedCollegeIds = watch("servedCollegeIds");

  const onSubmit = async (values: SignUpFormValues) => {
    try {
      const user = await account.create(ID.unique(), values.email, values.password, `${values.firstName} ${values.lastName}`);
      
      const profileData: any = {
        userId: user.$id,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        userType: values.userType,
        level: 1, // Default level
        xp: 0, // Default XP
        collegeId: values.userType === "student" || values.userType === "teacher" ? values.servedCollegeIds?.[0] : null, // Assuming student/teacher picks one primary college
        profilePictureUrl: "",
        bio: "",
        socialLinks: {},
        isVerified: false,
        isProfileComplete: false,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (values.userType === "merchant") {
        profileData.merchantName = values.merchantName;
        profileData.businessDescription = values.businessDescription;
        profileData.contactEmail = values.contactEmail;
        profileData.contactPhone = values.contactPhone;
        profileData.servedCollegeIds = values.servedCollegeIds;
      }

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        ID.unique(),
        profileData
      );

      toast.success("Account created successfully! Please verify your email.");
      navigate("/auth/verify-email");
    } catch (error: any) {
      console.error("Sign-up error:", error);
      toast.error(error.message || "Failed to create account.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-foreground">Sign Up</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" {...register("firstName")} />
            {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" {...register("lastName")} />
            {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>

          <div>
            <Label>Register as:</Label>
            <RadioGroup
              onValueChange={(value: "student" | "teacher" | "merchant") => setValue("userType", value)}
              value={userType}
              className="flex space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="student" id="student" />
                <Label htmlFor="student">Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="teacher" id="teacher" />
                <Label htmlFor="teacher">Teacher</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="merchant" id="merchant" />
                <Label htmlFor="merchant">Merchant</Label>
              </div>
            </RadioGroup>
            {errors.userType && <p className="text-red-500 text-sm">{errors.userType.message}</p>}
          </div>

          {userType === "merchant" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="merchantName">Merchant Name</Label>
                <Input id="merchantName" {...register("merchantName")} />
                {errors.merchantName && <p className="text-red-500 text-sm">{errors.merchantName.message}</p>}
              </div>
              <div>
                <Label htmlFor="businessDescription">Business Description</Label>
                <Textarea id="businessDescription" {...register("businessDescription")} />
                {errors.businessDescription && <p className="text-red-500 text-sm">{errors.businessDescription.message}</p>}
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
                <Input id="contactEmail" type="email" {...register("contactEmail")} />
                {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail.message}</p>}
              </div>
              <div>
                <Label htmlFor="contactPhone">Contact Phone (Optional)</Label>
                <Input id="contactPhone" {...register("contactPhone")} />
                {errors.contactPhone && <p className="text-red-500 text-sm">{errors.contactPhone.message}</p>}
              </div>
              <div>
                <Label htmlFor="servedCollegeIds">Colleges Served</Label>
                <MultiSelect
                  options={colleges}
                  selected={servedCollegeIds || []}
                  onSelect={(values) => setValue("servedCollegeIds", values, { shouldValidate: true })}
                  placeholder="Select colleges"
                />
                {errors.servedCollegeIds && <p className="text-red-500 text-sm">{errors.servedCollegeIds.message}</p>}
              </div>
            </div>
          )}
          {(userType === "student" || userType === "teacher") && (
            <div>
              <Label htmlFor="collegeId">Your College</Label>
              <MultiSelect
                options={colleges}
                selected={servedCollegeIds && servedCollegeIds.length > 0 ? [servedCollegeIds[0]] : []}
                onSelect={(values) => setValue("servedCollegeIds", values.slice(0,1), { shouldValidate: true })}
                placeholder="Select your college"
              />
              {errors.servedCollegeIds && <p className="text-red-500 text-sm">{errors.servedCollegeIds.message}</p>}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing Up..." : "Sign Up"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-primary hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;