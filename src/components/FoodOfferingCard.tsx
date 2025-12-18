"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServicePost } from "@/hooks/useServiceListings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PlaceFoodOrderForm from "./forms/PlaceFoodOrderForm";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface FoodOfferingCardProps {
  offering: ServicePost;
}

const FoodOfferingCard: React.FC<FoodOfferingCardProps> = ({ offering }) => {
  const { user } = useAuth();
  const [isOrderDialogOpen, setIsOrderDialogOpen] = React.useState(false);

  const handleOrderClick = () => {
    if (!user) {
      toast.error("You must be logged in to place an order.");
      return;
    }
    if (user.$id === offering.providerId) {
      toast.error("You cannot order your own offering.");
      return;
    }
    setIsOrderDialogOpen(true);
  };

  return (
    <Card className="bg-card text-card-foreground shadow-md border-border">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-card-foreground">{offering.title}</CardTitle>
          <CardDescription className="text-secondary-neon font-bold text-md">{offering.price}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-1">
        <p className="text-sm text-muted-foreground line-clamp-3">{offering.description}</p>
        <p className="text-xs text-muted-foreground">Provider: {offering.providerName}</p>
        <p className="text-xs text-muted-foreground">Contact: {offering.contact}</p>
        {offering.ambassadorDelivery && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 mt-2">
            Ambassador Delivery Available
          </Badge>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogTrigger asChild>
            <Button<dyad-problem-report summary="90 problems">
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="8" column="18" code="1005">'from' expected.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="16" column="12" code="1128">Declaration or statement expected.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="17" column="9" code="1161">Unterminated regular expression literal.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="18" column="12" code="1005">';' expected.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="18" column="60" code="1005">';' expected.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="18" column="156" code="1005">';' expected.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="20" column="9" code="2657">JSX expressions must have one parent element.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="67" column="7" code="1128">Declaration or statement expected.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="68" column="5" code="1109">Expression expected.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="69" column="3" code="1109">Expression expected.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="70" column="1" code="1128">Declaration or statement expected.</problem>
<problem file="src/context/AuthContext.tsx" line="56" column="32" code="2339">Property 'children' does not exist on type '{ ReactNode: any; }'.</problem>
<problem file="src/components/ProfileWidget.tsx" line="9" column="35" code="2307">Cannot find module '@/utils/avatar' or its corresponding type declarations.</problem>
<problem file="src/components/ProfileWidget.tsx" line="75" column="10" code="2304">Cannot find name 'Badge'.</problem>
<problem file="src/components/ProfileWidget.tsx" line="77" column="11" code="2304">Cannot find name 'Badge'.</problem>
<problem file="src/hooks/useCanteenData.ts" line="4" column="43" code="2724">'&quot;@/lib/appwrite&quot;' has no exported member named 'APPWRITE_CANTEEN_COLLECTION_ID'. Did you mean 'APPWRITE_ERRANDS_COLLECTION_ID'?</problem>
<problem file="src/hooks/useMarketListings.ts" line="4" column="43" code="2724">'&quot;@/lib/appwrite&quot;' has no exported member named 'APPWRITE_PRODUCTS_COLLECTION_ID'. Did you mean 'APPWRITE_REPORTS_COLLECTION_ID'?</problem>
<problem file="src/components/forms/MarketListingFormWrapper.tsx" line="18" column="43" code="2724">'&quot;@/lib/appwrite&quot;' has no exported member named 'APPWRITE_MARKETPLACE_COLLECTION_ID'. Did you mean 'APPWRITE_REPORTS_COLLECTION_ID'?</problem>
<problem file="src/pages/MarketPage.tsx" line="31" column="41" code="2322">Type '{ onClose: () =&gt; void; }' is not assignable to type 'IntrinsicAttributes &amp; MarketListingFormWrapperProps'.
  Property 'onClose' does not exist on type 'IntrinsicAttributes &amp; MarketListingFormWrapperProps'.</problem>
<problem file="src/hooks/useBargainRequests.ts" line="4" column="84" code="2724">'&quot;@/lib/appwrite&quot;' has no exported member named 'APPWRITE_PRODUCTS_COLLECTION_ID'. Did you mean 'APPWRITE_REPORTS_COLLECTION_ID'?</problem>
<problem file="src/components/GraduationMeter.tsx" line="8" column="41" code="2307">Cannot find module '@/utils/graduation' or its corresponding type declarations.</problem>
<problem file="src/hooks/useTournamentData.ts" line="4" column="43" code="2724">'&quot;@/lib/appwrite&quot;' has no exported member named 'APPWRITE_TOURNAMENTS_COLLECTION_ID'. Did you mean 'APPWRITE_ERRANDS_COLLECTION_ID'?</problem>
<problem file="src/components/forms/PostTournamentForm.tsx" line="15" column="43" code="2724">'&quot;@/lib/appwrite&quot;' has no exported member named 'APPWRITE_TOURNAMENTS_COLLECTION_ID'. Did you mean 'APPWRITE_ERRANDS_COLLECTION_ID'?</problem>
<problem file="src/components/layout/Header.tsx" line="11" column="35" code="2307">Cannot find module '@/utils/avatar' or its corresponding type declarations.</problem>
<problem file="src/components/CashExchangeListings.tsx" line="10" column="43" code="2724">'&quot;@/lib/appwrite&quot;' has no exported member named 'APPWRITE_CASH_EXCHANGE_COLLECTION_ID'. Did you mean 'APPWRITE_SERVICES_COLLECTION_ID'?</problem>
<problem file="src/pages/CashExchangePage.tsx" line="15" column="43" code="2724">'&quot;@/lib/appwrite&quot;' has no exported member named 'APPWRITE_CASH_EXCHANGE_COLLECTION_ID'. Did you mean 'APPWRITE_SERVICES_COLLECTION_ID'?</problem>
<problem file="src/hooks/useLostAndFoundListings.ts" line="4" column="43" code="2724">'&quot;@/lib/appwrite&quot;' has no exported member named 'APPWRITE_LOST_FOUND_COLLECTION_ID'. Did you mean 'APPWRITE_ERRANDS_COLLECTION_ID'?</problem>
<problem file="src/pages/ProfileDetailsPage.tsx" line="9" column="35" code="2307">Cannot find module '@/utils/avatar' or its corresponding type declarations.</problem>
<problem file="src/pages/ProfileDetailsPage.tsx" line="110" column="21" code="2322">Type '&quot;male&quot; | &quot;female&quot; | &quot;other&quot; | &quot;prefer-not-to-say&quot;' is not assignable to type '&quot;male&quot; | &quot;female&quot; | &quot;prefer-not-to-say&quot;'.
  Type '&quot;other&quot;' is not assignable to type '&quot;male&quot; | &quot;female&quot; | &quot;prefer-not-to-say&quot;'.</problem>
<problem file="src/pages/ProfileDetailsPage.tsx" line="111" column="21" code="2322">Type '&quot;student&quot; | &quot;staff&quot; | &quot;faculty&quot;' is not assignable to type '&quot;student&quot; | &quot;staff&quot;'.
  Type '&quot;faculty&quot;' is not assignable to type '&quot;student&quot; | &quot;staff&quot;'.</problem>
<problem file="src/pages/ProfileDetailsPage.tsx" line="125" column="16" code="2552">Cannot find name 'Progress'. Did you mean 'onprogress'?</problem>
<problem file="src/pages/ErrandsPage.tsx" line="108" column="19" code="2322">Type '{ onSubmit: (data: Omit&lt;ErrandPost, &quot;$id&quot; | &quot;$collectionId&quot; | &quot;$databaseId&quot; | &quot;$createdAt&quot; | &quot;$updatedAt&quot; | &quot;$permissions&quot; | &quot;collegeName&quot; | &quot;status&quot; | &quot;posterId&quot; | &quot;posterName&quot;&gt;) =&gt; Promise&lt;...&gt;; ... 6 more ...; contactPlaceholder: string; }' is not assignable to type 'IntrinsicAttributes &amp; PostErrandFormProps'.
  Property 'titlePlaceholder' does not exist on type 'IntrinsicAttributes &amp; PostErrandFormProps'.</problem>
<problem file="src/pages/ShortTermNeedsPage.tsx" line="108" column="19" code="2322">Type '{ onSubmit: (data: Omit&lt;ErrandPost, &quot;$id&quot; | &quot;$collectionId&quot; | &quot;$databaseId&quot; | &quot;$createdAt&quot; | &quot;$updatedAt&quot; | &quot;$permissions&quot; | &quot;collegeName&quot; | &quot;status&quot; | &quot;posterId&quot; | &quot;posterName&quot;&gt;) =&gt; Promise&lt;...&gt;; ... 6 more ...; contactPlaceholder: string; }' is not assignable to type 'IntrinsicAttributes &amp; PostErrandFormProps'.
  Property 'titlePlaceholder' does not exist on type 'IntrinsicAttributes &amp; PostErrandFormProps'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="8" column="18" code="1141">String literal expected.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="18" column="10" code="2304">Cannot find name 'p'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="18" column="12" code="2304">Cannot find name 'className'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="18" column="54" code="2304">Cannot find name 'Total'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="18" column="117" code="2304">Cannot find name 'calculatedTotalPrice'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="18" column="158" code="2304">Cannot find name 'p'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="20" column="10" code="2304">Cannot find name 'FormField'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="21" column="20" code="2304">Cannot find name 'form'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="24" column="14" code="2304">Cannot find name 'FormItem'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="25" column="16" code="2304">Cannot find name 'FormLabel'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="25" column="87" code="2304">Cannot find name 'FormLabel'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="26" column="16" code="2304">Cannot find name 'FormControl'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="27" column="18" code="2304">Cannot find name 'Textarea'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="27" column="94" code="2304">Cannot find name 'isSubmitting'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="28" column="17" code="2304">Cannot find name 'FormControl'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="29" column="16" code="2304">Cannot find name 'FormMessage'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="30" column="15" code="2304">Cannot find name 'FormItem'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="33" column="10" code="2304">Cannot find name 'FormField'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="34" column="20" code="2304">Cannot find name 'form'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="37" column="14" code="2304">Cannot find name 'FormItem'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="38" column="16" code="2304">Cannot find name 'FormLabel'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="38" column="72" code="2304">Cannot find name 'FormLabel'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="39" column="16" code="2304">Cannot find name 'FormControl'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="40" column="90" code="2304">Cannot find name 'isSubmitting'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="41" column="17" code="2304">Cannot find name 'FormControl'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="42" column="16" code="2304">Cannot find name 'FormMessage'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="43" column="15" code="2304">Cannot find name 'FormItem'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="46" column="10" code="2304">Cannot find name 'FormField'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="47" column="20" code="2304">Cannot find name 'form'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="50" column="14" code="2304">Cannot find name 'FormItem'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="51" column="16" code="2304">Cannot find name 'FormLabel'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="51" column="70" code="2304">Cannot find name 'FormLabel'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="52" column="16" code="2304">Cannot find name 'FormControl'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="53" column="87" code="2304">Cannot find name 'isSubmitting'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="54" column="17" code="2304">Cannot find name 'FormControl'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="55" column="16" code="2304">Cannot find name 'FormMessage'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="56" column="15" code="2304">Cannot find name 'FormItem'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="59" column="10" code="2304">Cannot find name 'DialogFooter'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="60" column="60" code="2304">Cannot find name 'onClose'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="60" column="79" code="2304">Cannot find name 'isSubmitting'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="63" column="43" code="2304">Cannot find name 'isSubmitting'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="64" column="14" code="2304">Cannot find name 'isSubmitting'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="64" column="30" code="2304">Cannot find name 'Loader2'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="66" column="11" code="2304">Cannot find name 'DialogFooter'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="67" column="9" code="2304">Cannot find name 'form'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="68" column="7" code="2304">Cannot find name 'Form'.</problem>
<problem file="src/components/forms/PlaceFoodOrderForm.tsx" line="72" column="16" code="2304">Cannot find name 'PlaceFoodOrderForm'.</problem>
<problem file="src/components/FoodOfferingCard.tsx" line="32" column="74" code="2339">Property 'posterName' does not exist on type 'ServicePost'.</problem>
<problem file="src/components/FoodCustomRequestsList.tsx" line="42" column="73" code="2339">Property 'posterName' does not exist on type 'ServicePost'.</problem>
<problem file="src/components/FoodCustomRequestsList.tsx" line="48" column="58" code="2339">Property 'posterName' does not exist on type 'ServicePost'.</problem>
<problem file="src/hooks/useCollaboratorPosts.ts" line="4" column="43" code="2724">'&quot;@/lib/appwrite&quot;' has no exported member named 'APPWRITE_COLLABORATORS_COLLECTION_ID'. Did you mean 'APPWRITE_REPORTS_COLLECTION_ID'?</problem>
<problem file="src/pages/CollaboratorsPage.tsx" line="14" column="43" code="2724">'&quot;@/lib/appwrite&quot;' has no exported member named 'APPWRITE_COLLABORATORS_COLLECTION_ID'. Did you mean 'APPWRITE_REPORTS_COLLECTION_ID'?</problem>
<problem file="src/pages/ProductDetailsPage.tsx" line="15" column="80" code="2724">'&quot;@/lib/appwrite&quot;' has no exported member named 'APPWRITE_PRODUCTS_COLLECTION_ID'. Did you mean 'APPWRITE_REPORTS_COLLECTION_ID'?</problem>
<problem file="src/components/forms/ChangeUserRoleForm.tsx" line="51" column="42" code="2554">Expected 1 arguments, but got 2.</problem>
<problem file="src/App.tsx" line="173" column="12" code="2741">Property 'ReactNode' is missing in type '{ children: Element; }' but required in type '{ ReactNode: any; }'.</problem>
<problem file="src/components/forms/ReportMissingCollegeForm.tsx" line="12" column="43" code="2724">'&quot;@/lib/appwrite&quot;' has no exported member named 'APPWRITE_MISSING_COLLEGES_COLLECTION_ID'. Did you mean 'APPWRITE_SERVICES_COLLECTION_ID'?</problem>
<problem file="src/hooks/useServiceReviews.ts" line="4" column="43" code="2724">'&quot;@/lib/appwrite&quot;' has no exported member named 'APPWRITE_SERVICE_REVIEWS_COLLECTION_ID'. Did you mean 'APPWRITE_SERVICES_COLLECTION_ID'?</problem>
</dyad-problem-report><think>**Examining Compile Errors**

I'm currently focused on the deluge of TypeScript errors. The initial glance at the `PlaceFoodOrderForm.tsx` snippet revealed significant syntax issues, hinting at a broader problem with the code's structure.  I'm now diving deeper into these syntax errors to understand the root cause.


**Resolving TypeScript Issues**

I'm systematically tackling the cascade of TypeScript errors. The priority is reconstructing the `PlaceFoodOrderForm.tsx` file due to its critical syntax problems. I've identified the absence of `Badge` import in `ProfileWidget.tsx` and am also dealing with missing utility imports for functions like `generateAvatarUrl`.  Furthermore, I'm working on adding the necessary Appwrite collection IDs to `src/lib/appwrite.ts` and correcting the `children` prop type in `AuthContext.tsx`.


**Analyzing Persistent Issues**

I've identified several key areas of concern. The `PlaceFoodOrderForm.tsx` file is still a priority, requiring complete reconstruction due to severe syntax errors. I've also added the missing collection IDs in `appwrite.ts` and corrected the `children` prop in `AuthContext.tsx`. I'm now looking at the type mismatches in `ProfileDetailsPage.tsx` for `gender` and `userType`, aiming to align `EditProfileFormProps` and `UserProfile`. Finally, I'm cleaning up inconsistent prop naming issues in `MarketListingFormWrapper.tsx`.


**Organizing Errors & Solutions**

I've been meticulously sorting through the remaining TypeScript issues.  I've identified key areas:  `PlaceFoodOrderForm.tsx` requires reconstruction, and utility imports are missing.  Also, the `children` prop type in `AuthContext.tsx` is incorrect.  I need to add Appwrite collection IDs to `appwrite.ts` and address type mismatches in `ProfileDetailsPage.tsx`. I also am working on missing exports and inconsistencies with the `MarketListingFormWrapper.tsx` file.


**Implementing Critical Fixes**

I'm now implementing the core fixes, prioritizing the reconstruction of `PlaceFoodOrderForm.tsx` due to its critical errors. I've added missing Appwrite collection IDs to `src/lib/appwrite.ts` and corrected the `children` prop in `AuthContext.tsx`. I'm also creating the necessary utility files for `generateAvatarUrl` and `calculateGraduationData`. I'll address type mismatches in `ProfileDetailsPage.tsx` next and will address `onClose` to `onListingPosted` and `onCancel` in `MarketListingFormWrapper.tsx`.


**Refining Fix Implementation**

I'm now methodically implementing the previously outlined fixes. Priority remains on reconstructing the syntax of `PlaceFoodOrderForm.tsx`. I've added missing collection IDs to `appwrite.ts` and corrected the `children` prop in `AuthContext.tsx`. I'm creating the necessary utility files for `generateAvatarUrl` and `calculateGraduationData` and addressing type mismatches in `ProfileDetailsPage.tsx`. Finally, I'm updating `onClose` to `onListingPosted` and `onCancel` in `MarketListingFormWrapper.tsx` and ensuring consistency with `provider` and `poster` naming. I'm also ensuring that `ErrandPost` has the correct `type` property.


**Addressing File-Specific Issues**

I'm now implementing the individual file fixes identified. This includes adding missing imports and correcting type errors in `AuthContext.tsx`. I'm also addressing the type mismatches in `ProfileDetailsPage.tsx` and ensuring that `MarketListingFormWrapper.tsx` handles `onListingPosted` and `onCancel` correctly. The reconstruction of the corrupted `PlaceFoodOrderForm.tsx` is underway. Finally, I am updating the `ErrandPost` type to include the `type` property.

**Finalizing Code Cleanup**

I'm wrapping up the final touches. I've reconstructed `PlaceFoodOrderForm.tsx` and addressed the numerous type mismatches across the project. Missing utility files for avatar and graduation are also in place, and imports are correctly managed. All required collection IDs are added. Finally, all the `ErrandPost` type properties are correct and all the prop inconsistencies are resolved.  I've implemented the `EditProfileForm` in several places as well.

**Tackling Remaining Issues**

I'm now methodically working through the remaining errors. The focus is on rebuilding `PlaceFoodOrderForm.tsx` and adding the necessary utility files and collection IDs. I've corrected the `children` prop type in `AuthContext.tsx` and addressed type mismatches in `ProfileDetailsPage.tsx`. I'm also ensuring consistent prop naming in `MarketListingFormWrapper.tsx`.


</think>Okay, I will fix all 90 TypeScript compile-time errors. These errors are primarily due to missing imports, incorrect type definitions in interfaces, inconsistent property names, and some syntax issues. I will also create the necessary utility files and update component props to match their usage.

Here's a breakdown of the fixes:

1.  **`src/lib/appwrite.ts`**: I will add exports for all missing Appwrite collection IDs.
2.  **`src/context/AuthContext.tsx`**:
    *   Correct the type annotation for the `children` prop.
    *   Import `Query` directly from `appwrite`.
    *   Expand the `UserProfile` interface to include all properties used across the application (e.g., `currentXp`, `maxXp`, `gender`, `userType`, `avatarStyle`, `itemsListedToday`, `lastQuestCompletedDate`, `firstName`, `lastName`, `mobileNumber`, `ambassadorDeliveriesCount`).
    *   Update the `AuthContextType` interface to include `isAuthenticated`, `isVerified`, `addXp`, `recordMarketListing`, and `incrementAmbassadorDeliveriesCount`.
    *   Ensure correct type casting for documents fetched from Appwrite.
3.  **`src/components/forms/PlaceFoodOrderForm.tsx`**: This file appears to have significant syntax errors. I will rewrite it to be syntactically correct and align with its intended functionality, including correct imports and JSX structure. I will also correct `posterId`/`posterName` to `providerId`/`providerName`.
4.  **`src/components/ProfileWidget.tsx`**: Import `Badge` and ensure `generateAvatarUrl` is correctly imported (I will create `src/utils/avatar.ts`).
5.  **`src/hooks/*.ts` files (e.g., `useCanteenData.ts`, `useMarketListings.ts`, `useBargainRequests.ts`, `useTournamentData.ts`, `useLostAndFoundListings.ts`, `useCollaboratorPosts.ts`, `useServiceReviews.ts`)**: Update Appwrite collection ID imports.
6.  **`src/components/forms/MarketListingFormWrapper.tsx`**: Update Appwrite collection ID import and correct `MarketListingFormWrapperProps` to accept `onListingPosted` and `onCancel`.
7.  **`src/pages/MarketPage.tsx`**: Pass the correct props (`onListingPosted`, `onCancel`) to `MarketListingFormWrapper`.
8.  **`src/components/GraduationMeter.tsx`**: Ensure `calculateGraduationData` is correctly imported (I will create `src/utils/graduation.ts`).
9.  **`src/components/forms/PostTournamentForm.tsx`**: Update Appwrite collection ID import.
10. **`src/components/layout/Header.tsx`**: Ensure `generateAvatarUrl` is correctly imported.
11. **`src/components/CashExchangeListings.tsx`**: Update Appwrite collection ID import.
12. **`src/pages/CashExchangePage.tsx`**: Update Appwrite collection ID import.
13. **`src/pages/ProfileDetailsPage.tsx`**:
    *   Import `Badge` and `Progress`.
    *   Ensure `generateAvatarUrl` is correctly imported.
    *   Adjust `EditProfileForm`'s `initialData` types for `gender` and `userType` to match the `UserProfile` interface.
    *   Correct the `updateUserProfile` call to pass only the data object.
14. **`src/pages/ErrandsPage.tsx` and `src/pages/ShortTermNeedsPage.tsx`**:
    *   Update the `ErrandPost` interface in `src/hooks/useErrandListings.ts` to include the `type` property.
    *   Update `PostErrandForm` props to include `titlePlaceholder`, `descriptionPlaceholder`, `compensationPlaceholder`, `deadlinePlaceholder`, `contactPlaceholder` (I will update `src/components/forms/PostErrandForm.tsx` to accept these).
15. **`src/components/FoodOfferingCard.tsx` and `src/components/FoodCustomRequestsList.tsx`**: Correct `posterName` to `providerName`.
16. **`src/pages/CollaboratorsPage.tsx`**: Update Appwrite collection ID import.
17. **`src/pages/ProductDetailsPage.tsx`**: Update Appwrite collection ID import.
18. **`src/components/forms/ChangeUserRoleForm.tsx`**: Correct the `updateUserProfile` call.
19. **`src/App.tsx`**: The `AuthProvider` children prop error will be resolved by the fix in `AuthContext.tsx`.
20. **`src/components/forms/ReportMissingCollegeForm.tsx`**: Update Appwrite collection ID import.
21. **`src/hooks/useServiceReviews.ts`**: Update Appwrite collection ID import.

**New Files to Create:**

*   **`src/utils/avatar.ts`**: A utility file to generate avatar URLs.
*   **`src/utils/graduation.ts`**: A utility file to calculate graduation data.
*   **`src/components/forms/EditProfileForm.tsx`**: A placeholder for the edit profile form component.
*   **`src/components/forms/PostErrandForm.tsx`**: A placeholder for the post errand form component.

Here are the code changes:

<dyad-write path="src/lib/appwrite.ts" description="Adding exports for all missing Appwrite collection IDs.">
// This file should contain your Appwrite client setup and configuration.

import { Client, Account, Databases } from 'appwrite';

export const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'YOUR_APPWRITE_PROJECT_ID';
export const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'YOUR_APPWRITE_DATABASE_ID';
export const APPWRITE_USER_PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USER_PROFILES_COLLECTION_ID || 'YOUR_USER_PROFILES_COLLECTION_ID';
export const APPWRITE_TRANSACTIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID || 'YOUR_TRANSACTIONS_COLLECTION_ID';
export const APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID || 'YOUR_DEVELOPER_MESSAGES_COLLECTION_ID';
export const APPWRITE_SERVICES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SERVICES_COLLECTION_ID || 'YOUR_SERVICES_COLLECTION_ID';
export const APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID || 'YOUR_BARGAIN_REQUESTS_COLLECTION_ID';
export const APPWRITE_ERRANDS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ERRANDS_COLLECTION_ID || 'YOUR_ERRANDS_COLLECTION_ID';
export const APPWRITE_REPORTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_REPORTS_COLLECTION_ID || 'YOUR_REPORTS_COLLECTION_ID';
export const APPWRITE_FOOD_ORDERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_FOOD_ORDERS_COLLECTION_ID || 'YOUR_FOOD_ORDERS_COLLECTION_ID';
export const APPWRITE_CANTEEN_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CANTEEN_COLLECTION_ID || 'YOUR_CANTEEN_COLLECTION_ID'; // Added
export const APPWRITE_MARKETPLACE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_MARKETPLACE_COLLECTION_ID || 'YOUR_MARKETPLACE_COLLECTION_ID'; // Added
export const APPWRITE_PRODUCTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID || 'YOUR_PRODUCTS_COLLECTION_ID'; // Added
export const APPWRITE_TOURNAMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TOURNAMENTS_COLLECTION_ID || 'YOUR_TOURNAMENTS_COLLECTION_ID'; // Added
export const APPWRITE_CASH_EXCHANGE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_CASH_EXCHANGE_COLLECTION_ID || 'YOUR_CASH_EXCHANGE_COLLECTION_ID'; // Added
export const APPWRITE_LOST_FOUND_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_LOST_FOUND_COLLECTION_ID || 'YOUR_LOST_FOUND_COLLECTION_ID'; // Added
export const APPWRITE_COLLABORATORS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLABORATORS_COLLECTION_ID || 'YOUR_COLLABORATORS_COLLECTION_ID'; // Added
export const APPWRITE_MISSING_COLLEGES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_MISSING_COLLEGES_COLLECTION_ID || 'YOUR_MISSING_COLLEGES_COLLECTION_ID'; // Added
export const APPWRITE_SERVICE_REVIEWS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SERVICE_REVIEWS_COLLECTION_ID || 'YOUR_SERVICE_REVIEWS_COLLECTION_ID'; // Added


const client = new Client();

client
  .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
  .setProject(APPWRITE_PROJECT_ID); // Your project ID

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases };