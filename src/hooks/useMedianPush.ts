import { useEffect } from 'react';
import { account, ID } from '@/lib/appwrite';
import { toast } from "sonner";

// Define the interface for local usage
interface OneSignalInfo {
  userId: string;    // OneSignal Player ID
  pushToken: string; // The raw FCM Token (We need this for Appwrite)
  subscribed: boolean;
}

const useMedianPush = () => {
  useEffect(() => {
    // 1. Define the Listener
    // FIX: Cast window to 'any' to avoid the "Subsequent property declarations" error
    // caused by conflicting type definitions in other files.
    (window as any).median_onesignal_info = async (info: OneSignalInfo) => {
      console.log("📲 Median Info Received:", info);

      if (info && info.pushToken) {
        // 1. VISUAL CONFIRMATION (Temporary Debug)
        toast.info("NATIVE DEBUG: OneSignal Info Received");

        try {
          // 2. Register the Token with Appwrite
          // YOUR SPECIFIC PROVIDER ID: '69788b1f002fcdf4fae1'
          await account.createPushTarget(
            ID.unique(),    // Appwrite generates a unique ID for this target link
            info.pushToken, // The raw FCM token from Google
            '69788b1f002fcdf4fae1' 
          );

          console.log("✅ Appwrite Push Target Registered!");
          toast.success("NATIVE DEBUG: Target Created!");

        } catch (error: any) {
          // 409 means "Conflict" - the device is already registered, which is perfectly fine.
          if (error.code === 409) {
            console.log("ℹ️ Device already registered.");
            // Optional: toast.info("Device already registered");
          } else {
            console.error("❌ Failed to register push target:", error);
            toast.error("NATIVE DEBUG Error: " + error.message);
          }
        }
      }
    };

    // 2. Force a Request (Trigger)
    // We cast window to any here as well to access the native median object safely
    const medianGlobal = (window as any).median;
    
    if (medianGlobal && medianGlobal.onesignal) {
        medianGlobal.onesignal.info();
    } else {
        console.log("⚠️ Median/OneSignal object not found (Are you testing in browser?)");
    }

  }, []);
};

export default useMedianPush;