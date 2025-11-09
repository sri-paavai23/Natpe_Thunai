import { Client, Account, Databases, Storage, Functions, ID } from 'appwrite';

const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1') // Your Appwrite Endpoint
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '690f3ae200352dd0534a'); // Your project ID

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// Export Appwrite Database and Collection IDs
export const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '691008840006510c1e38';
export const APPWRITE_USER_PROFILES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USER_PROFILES_COLLECTION_ID || 'user_profiles';
export const APPWRITE_COLLEGE_ID_BUCKET_ID = import.meta.env.VITE_APPWRITE_COLLEGE_ID_BUCKET_ID || '69100b27002c8fea5167';
export const APPWRITE_PRODUCTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || 'products';
export const APPWRITE_TRANSACTIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TRANSACTIONS_COLLECTION_ID || 'transactions'; // New export

export default client;