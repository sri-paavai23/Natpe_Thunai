import { Client, Account, Databases, Storage, Functions, ID } from 'appwrite';

const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '690f3ae200352dd0534a';

if (!import.meta.env.VITE_APPWRITE_ENDPOINT || !import.meta.env.VITE_APPWRITE_PROJECT_ID) {
    console.warn("Appwrite environment variables (VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID) are missing. Using fallback values.");
}

console.log(`Appwrite Client Initializing with Endpoint: ${APPWRITE_ENDPOINT} and Project ID: ${APPWRITE_PROJECT_ID}`);


const client = new Client();

client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

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