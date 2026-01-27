// CONFIGURATION
const ONESIGNAL_APP_ID = "YOUR_ONESIGNAL_APP_ID"; // Get from OneSignal > Settings > Keys & IDs
const REST_API_KEY = "YOUR_REST_API_KEY";         // Get from OneSignal > Settings > Keys & IDs

/**
 * Sends a Push Notification directly via OneSignal
 * @param recipientPlayerIds - Array of 'oneSignalPlayerId' strings (from user.prefs)
 * @param title - Notification Title
 * @param message - Notification Body
 */
export const sendPushNotification = async (
  recipientPlayerIds: string[], 
  title: string, 
  message: string,
  data: any = {}
) => {
  if (!recipientPlayerIds.length) return;

  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${REST_API_KEY}`
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: recipientPlayerIds,
      headings: { en: title },
      contents: { en: message },
      data: data // Custom data to handle clicks (e.g., navigate to chat)
    })
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', options);
    const result = await response.json();
    console.log("🚀 Notification Sent:", result);
    return result;
  } catch (err) {
    console.error("❌ Notification Failed:", err);
  }
};