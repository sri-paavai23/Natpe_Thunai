import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function MarketWarningBanner() {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-semibold">Important Refund Policy</AlertTitle>
      <AlertDescription className="text-sm text-foreground">
        Full refund required if product is damaged by the user within the return period. Please review our full policy for details.
      </AlertDescription>
    </Alert>
  );
}