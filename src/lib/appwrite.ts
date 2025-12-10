import { Client, Account, Databases, Storage, Avatars } from 'appwrite';

export const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
export const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
export const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

// Collection IDs
export const APPWRITE_USER_PROFILES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USER_PROFILES_COLLECTION_ID;
export const APPWRITE_PRODUCTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID;
export const APPWRITE_SERVICES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SERVICES_COLLECTION_ID;
export const APPWRITE_ERRANDS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ERRANDS_COLLECTION_ID;
export const APPWRITE_LOST_FOUND_COLLECTION_ID = import.meta.env.VITE_APPWRITE_LOST_FOUND_COLLECTION_ID;
export const APPWRITE_FOOD_OFFERINGS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FOOD_OFFERINGS_COLLECTION_ID; // NEW
export const APPWRITE_FOOD_REQUESTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FOOD_REQUESTS_COLLECTION_ID; // NEW
export const APPWRITE_TOURNAMENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TOURNAMENTS_COLLECTION_ID;
export const APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID;
export const APPWRITE_REPORTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_REPORTS_COLLECTION_ID;
export const APPWRITE_TRANSACTIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TRANSACTIONS_COLLECTION_ID;
export const APPWRITE_CHAT_ROOMS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CHAT_ROOMS_COLLECTION_ID;
export const APPWRITE_MESSAGES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID;


// Bucket IDs
export const APPWRITE_COLLEGE_ID_BUCKET_ID = import.meta.env.VITE_APPWRITE_COLLEGE_ID_BUCKET_ID;
export const APPWRITE_PRODUCT_IMAGES_BUCKET_ID = import.meta.env.VITE_APPWRITE_PRODUCT_IMAGES_BUCKET_ID;

const client = new Client();

client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);

export default client;