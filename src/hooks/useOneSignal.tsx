import { useEffect, useRef } from 'react';
import { account, ID } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from "sonner";

interface OneSignalData {
  oneSignalUserId: string;
  pushToken?: string;
  token?: string;          // Alternative name
  registrationId?: string; // Alternative name
  subscribed: boolean;
}

const useOneSignal = () => {
  const { user } = useAuth();
  const retryCount = useRef(0);
  const maxRetries = 10; // Increase to 10 attempts (30 seconds)

  useEffect(() => {
    (window as any).median_onesignal_info = async (data: OneSignalData) => {
      // 1. DUMP DATA TO CONSOLE (For debugging)
      console.log("🔥 FULL MEDIAN DATA:", JSON.stringify(data));

      // 2. HUNT FOR THE TOKEN (Check all possible names)
      const fcmToken = data?.pushToken || data?.token || data?.registrationId;

      // 3. RETRY LOGIC
      if (!fcmToken) {
        if (retryCount.current < maxRetries) {
          console.log(`⚠️ Token missing. Retrying... (${retryCount.current + 1}/${maxRetries})`);
          retryCount.current += 1;
          setTimeout(() => {
            window.location.href = 'median://onesignal/info';
          }, 3000);
        } else {
          // FINAL FALLBACK: If we have Player ID but no Token, warn the user
          if (data?.oneSignalUserId) {
            console.error("❌ TOKEN NOT FOUND. Use Player ID instead?");
            toast.error("Push Error: Token hidden. Contact Developer.");
          }
        }
        return;
      }

      // 4. FOUND IT! REGISTER WITH APPWRITE
      if (user?.$id) {
        try {
          // Use the verified Provider ID you gave me
          await account.createPushTarget(
            ID.unique(),
            fcmToken, 
            '69788b1f002fcdf4fae1' 
          );
          console.log("🎉 SUCCESS: Target Created!");
          toast.success("Notifications Active!"); 
        } catch (error: any) {
          // Ignore "Target already exists" (409)
          if (error.code !== 409) {
            console.error("Appwrite Error:", error.message);
          }
        }
      }
    };

    // 5. START LISTENER
    if (navigator.userAgent.includes('wv') || window.location.href.includes('median')) {
      const timer = setTimeout(() => {
        window.location.href = 'median://onesignal/info';
      }, 2000);
      return () => clearTimeout(timer);
    }

  }, [user]); 
};

export default useOneSignal;