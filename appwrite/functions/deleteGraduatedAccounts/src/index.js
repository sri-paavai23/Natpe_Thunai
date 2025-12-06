const sdk = require('node-appwrite');

module.exports = async function (req, res) {
  const client = new new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);
  const users = new sdk.Users(client);

  const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
  const APPWRITE_USER_PROFILES_COLLECTION_ID = process.env.APPWRITE_USER_PROFILES_COLLECTION_ID;
  const APP_CREATION_DATE_ISO = process.env.APP_CREATION_DATE; // e.g., '2024-01-01T00:00:00Z'

  if (!APP_CREATION_DATE_ISO) {
    console.error("APP_CREATION_DATE environment variable is not set for the function.");
    return res.json({ success: false, error: "APP_CREATION_DATE not configured." });
  }

  const appCreationDate = new Date(APP_CREATION_DATE_ISO);
  const fourYearsInMs = 4 * 365 * 24 * 60 * 60 * 1000; // Approximately 4 years in milliseconds

  try {
    let offset = 0;
    const limit = 100; // Process 100 users at a time

    while (true) {
      const profilesResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [sdk.Query.limit(limit), sdk.Query.offset(offset)]
      );

      if (profilesResponse.documents.length === 0) {
        break; // No more profiles to process
      }

      for (const profile of profilesResponse.documents) {
        // Skip developers and staff accounts
        if (profile.role === 'developer' || profile.userType === 'staff') {
          console.log(`Skipping account ${profile.userId} (Role: ${profile.role}, Type: ${profile.userType}) from graduation protocol.`);
          continue;
        }

        const userCreationDate = new Date(profile.$createdAt); // Assuming profile creation date is close to user creation date
        const graduationDate = new Date(appCreationDate.getTime() + fourYearsInMs);

        if (new Date() >= graduationDate) {
          console.log(`User ${profile.userId} (${profile.firstName} ${profile.lastName}) has passed their 4-year mark. Initiating deletion.`);
          
          try {
            // Delete user account
            await users.delete(profile.userId);
            console.log(`Successfully deleted user account: ${profile.userId}`);

            // Delete user profile document
            await databases.deleteDocument(
              APPWRITE_DATABASE_ID,
              APPWRITE_USER_PROFILES_COLLECTION_ID,
              profile.$id
            );
            console.log(`Successfully deleted user profile document: ${profile.$id}`);
          } catch (deleteError) {
            console.error(`Failed to delete user ${profile.userId} or their profile:`, deleteError);
          }
        } else {
          // console.log(`User ${profile.userId} is not yet graduated. Remaining: ${Math.ceil((graduationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days.`);
        }
      }
      
      offset += limit;
    }

    res.json({ success: true, message: "Graduated accounts processed." });

  } catch (error) {
    console.error('Function execution failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};