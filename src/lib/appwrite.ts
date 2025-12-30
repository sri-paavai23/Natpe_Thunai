import { Client, Account, Databases, ID, Query } from 'appwrite';

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT as string) // Your Appwrite Endpoint
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID as string); // Your project ID

const account = new Account(client);
const databases = new Databases(client);

// Export Appwrite Collection IDs as constants
export const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID as string;
export const APPWRITE_USER_PROFILES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USER_PROFILES_COLLECTION_ID as string;
export const APPWRITE_PRODUCTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID as string;
export const APPWRITE_TRANSACTIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TRANSACTIONS_COLLECTION_ID as string;
export const APPWRITE_CANTEEN_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CANTEEN_COLLECTION_ID as string;
export const APPWRITE_CASH_EXCHANGE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CASH_EXCHANGE_COLLECTION_ID as string;
export const APPWRITE_SERVICES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SERVICES_COLLECTION_ID as string;
export const APPWRITE_ERRANDS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ERRANDS_COLLECTION_ID as string;
export const APPWRITE_COLLABORATORS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLABORATORS_COLLECTION_ID as string;
export const APPWRITE_TOURNAMENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TOURNAMENTS_COLLECTION_ID as string;
export const APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID as string;
export const APPWRITE_FOOD_ORDERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FOOD_ORDERS_COLLECTION_ID as string;
export const APPWRITE_AMBASSADOR_APPLICATIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_AMBASSADOR_APPLICATIONS_COLLECTION_ID as string;
export const APPWRITE_REPORTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID as string;
export const APPWRITE_SERVICE_REVIEWS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SERVICE_REVIEWS_COLLECTION_ID as string;
export const APPWRITE_MISSING_COLLEGES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MISSING_COLLEGES_COLLECTION_ID as string;
export const APPWRITE_LOST_FOUND_COLLECTION_ID = import.meta.env.VITE_APPWRITE_LOST_FOUND_COLLECTION_ID as string;
export const APPWRITE_BLOCKED_WORDS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_BLOCKED_WORDS_COLLECTION_ID as string;
export const APPWRITE_CHAT_ROOMS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CHAT_ROOMS_COLLECTION_ID as string;
export const APPWRITE_CHAT_MESSAGES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CHAT_MESSAGES_COLLECTION_ID as string;


export { client, account, databases, ID, Query };