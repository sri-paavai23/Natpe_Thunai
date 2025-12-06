import { Client, Databases, Account, Storage } from 'appwrite'; // Import Storage

export const client = new Client();

client
    .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
    .setProject('6560a052123c42a7411e'); // Your Project ID

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client); // Export storage

export const APPWRITE_DATABASE_ID = '6560a101123c42a7412e'; // Replace with your actual database ID

// Collection IDs
export const APPWRITE_USER_PROFILES_COLLECTION_ID = '6560a11a123c42a7413f';
export const APPWRITE_PRODUCTS_COLLECTION_ID = '6560a12f123c42a7414a';
export const APPWRITE_SERVICES_COLLECTION_ID = '6560a141123c42a74155';
export const APPWRITE_TRANSACTIONS_COLLECTION_ID = '6560a153123c42a74160';
export const APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID = '6560a165123c42a7416b';
export const APPWRITE_FOOD_OFFERINGS_COLLECTION_ID = '6560a177123c42a74176';
export const APPWRITE_FOOD_ORDERS_COLLECTION_ID = '6560a189123c42a74181';
export const APPWRITE_TOURNAMENTS_COLLECTION_ID = '6560a19b123c42a7418c';
export const APPWRITE_CASH_EXCHANGE_COLLECTION_ID = '6560a1ad123c42a74197';
export const APPWRITE_SERVICE_REQUESTS_COLLECTION_ID = '6560a1bf123c42a741a2';
export const APPWRITE_COLLEGE_ID_BUCKET_ID = '6560a1d1123c42a741ad'; // Added
export const APPWRITE_CANTEEN_COLLECTION_ID = '6560a1e3123c42a741b8'; // Added
export const APPWRITE_ERRANDS_COLLECTION_ID = '6560a1f5123c42a741c3'; // Added
export const APPWRITE_COLLABORATORS_COLLECTION_ID = '6560a207123c42a741ce'; // Added