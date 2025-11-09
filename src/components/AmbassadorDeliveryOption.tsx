"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AmbassadorDeliveryOptionProps {
  ambassadorDelivery: boolean;
  setAmbassadorDelivery: (checked: boolean) => void;
  ambassadorMessage: string;
  setAmbassadorMessage: (message: string) => void;
}

const AmbassadorDeliveryOption: React.FC<AmbassadorDeliveryOptionProps> = ({
  ambassadorDelivery,
  setAmbassadorDelivery,
  ambassadorMessage,
  setAmbassadorMessage,
}) => {
  return (
    <div className="space-y-3 border-t border-border pt-4 mt-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="ambassador-delivery"
          checked={ambassadorDelivery}
          onCheckedChange={(checked) => setAmbassadorDelivery(checked as boolean)}
          className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground"
        />
        <Label htmlFor="ambassador-delivery" className="text-sm text-primary-foreground font-medium">
          Opt for Ambassador-mediated delivery
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">
        If you feel uncomfortable meeting directly, our ambassadors can facilitate the exchange.
      </p>
      {ambassadorDelivery && (
        <div>
          <Label htmlFor="ambassador-message" className="text-primary-foreground">Message for Ambassador (Optional)</Label>
          <Textarea
            id="ambassador-message"
            placeholder="e.g., Please pick up from hostel room 301, available after 6 PM."
            value={ambassadorMessage}
            onChange={(e) => setAmbassadorMessage(e.target.value)}
            className="bg-input text-foreground border-border focus:ring-ring focus:border-ring mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This message will be shared with the ambassador to facilitate the delivery.
          </p>
        </div>
      )}
    </div>
  );
};

export default AmbassadorDeliveryOption;