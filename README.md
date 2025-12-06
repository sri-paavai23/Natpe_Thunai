# Welcome to Natpe🤝Thunai

## Appwrite Setup (Mandatory for Deployment)

To ensure your application functions correctly and securely, especially regarding authentication and database interactions, you must configure the following environment variables in your deployment platform (e.g., Vercel) and ensure your Appwrite project is correctly set up.

### 1. Environment Variables (Vercel/Vite)

These variables are used by your client-side React application and must be set in your Vercel project settings:

| Variable Name | Description | Example Value |
|---|---|---|
| `VITE_APPWRITE_ENDPOINT` | The URL of your Appwrite instance. | `https://cloud.appwrite.io/v1` |
| `VITE_APPWRITE_PROJECT_ID` | Your unique Appwrite Project ID. | `690f3ae200352dd0534a` |
| `VITE_APP_HOST_URL` | The public URL of your deployed application. Used for email verification/password reset redirects. | `https://your-app-name.vercel.app` |
| `VITE_DEVELOPER_UPI_ID` | The UPI ID for developer payments (e.g., for tournament fees, market transactions). | `8903480105@superyes` |
| `VITE_APPWRITE_DATABASE_ID` | Your Appwrite Database ID. | `691008840006510c1e38` |
| `VITE_APPWRITE_USER_PROFILES_COLLECTION_ID` | Collection ID for user profiles. | `user_profiles` |
| `VITE_APPWRITE_COLLEGE_ID_BUCKET_ID` | Bucket ID for college ID photos. | `69100b27002c8fea5167` |
| `VITE_APPWRITE_PRODUCTS_COLLECTION_ID` | Collection ID for market products. | `products` |
| `VITE_APPWRITE_TRANSACTIONS_COLLECTION_ID` | Collection ID for market transactions. | `transactions` |
| `VITE_APPWRITE_CANTEEN_COLLECTION_ID` | Collection ID for canteen data. | `canteen_data` |
| `VITE_APPWRITE_CASH_EXCHANGE_COLLECTION_ID` | Collection ID for cash exchange posts. | `cash_exchange` |
| `VITE_APPWRITE_SERVICES_COLLECTION_ID` | Collection ID for freelance services. | `services` |
| `VITE_APPWRITE_ERRANDS_COLLECTION_ID` | Collection ID for errands. | `errands` |
| `VITE_APPWRITE_COLLABORATORS_COLLECTION_ID` | Collection ID for project collaborator posts. | `collaborators` |
| `VITE_APPWRITE_TOURNAMENTS_COLLECTION_ID` | Collection ID for tournament data. | `tournaments` |
| `VITE_APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID` | Collection ID for developer messages. | `developer_messages` |
| `VITE_APPWRITE_FOOD_ORDERS_COLLECTION_ID` | Collection ID for food orders. | `food_orders` |
| `VITE_APPWRITE_AMBASSADOR_APPLICATIONS_COLLECTION_ID` | Collection ID for ambassador applications. | `ambassador_applications` |
| `VITE_APPWRITE_REPORTS_COLLECTION_ID` | Collection ID for user-submitted reports. | `reports` |
| `VITE_APPWRITE_SERVICE_REVIEWS_COLLECTION_ID` | Collection ID for service reviews. | `service_reviews` |

**Important Security Note:**
The `APPWRITE_API_KEY` is a sensitive secret and **must NOT be exposed in client-side code or environment variables accessible by the browser.** It should only be used in secure server-side environments, such as Appwrite Functions. For example, the `processPaymentAndNotify` Appwrite Function uses this key.

### 2. Appwrite Console Configuration (CORS)

You must register your deployed domain in the Appwrite Console to prevent CORS (Cross-Origin Resource Sharing) errors:

1.  Go to your Appwrite Project.
2.  Navigate to **Platform** -> **Web**.
3.  Add your Vercel domain (e.g., `https://your-app-name.vercel.app`) as a new Web platform.
4.  Ensure the **Host URL** and **Redirect URLs** are correctly configured to allow traffic from your deployed application.