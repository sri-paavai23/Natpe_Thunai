// This file should contain your Appwrite client setup and configuration.
// Assuming APPWRITE_PROJECT_ID was missing or not exported correctly.

import { Client, Account, Databases } from 'appwrite';

export const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'YOUR_APPWRITE_PROJECT_ID'; // Replace with your actual project ID or env var
export const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'YOUR_APPWRITE_DATABASE_ID'; // Replace
export const APPWRITE_USER_PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USER_PROFILES_COLLECTION_ID || 'YOUR_USER_PROFILES_COLLECTION_ID'; // Replace
export const APPWRITE_TRANSACTIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID || 'YOUR_TRANSACTIONS_COLLECTION_ID'; // Replace
export const APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID || 'YOUR_DEVELOPER_MESSAGES_COLLECTION_ID'; // Replace
export const APPWRITE_SERVICES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SERVICES_COLLECTION_ID || 'YOUR_SERVICES_COLLECTION_ID'; // Replace
export const APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID || 'YOUR_BARGAIN_REQUESTS_COLLECTION_ID'; // Replace
export const APPWRITE_ERRANDS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ERRANDS_COLLECTION_ID || 'YOUR_ERRANDS_COLLECTION_ID'; // Replace
export const APPWRITE_REPORTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_REPORTS_COLLECTION_ID || 'YOUR_REPORTS_COLLECTION_ID'; // Replace
export const APPWRITE_FOOD_ORDERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_FOOD_ORDERS_COLLECTION_ID || 'YOUR_FOOD_ORDERS_COLLECTION_ID'; // Replace


const client = new Client();

client
  .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
  .setProject(APPWRITE_PROJECT_ID); // Your project ID

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases };