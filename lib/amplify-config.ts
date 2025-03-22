import { Amplify } from 'aws-amplify';

// Get App ID from environment variables or use the correct App ID
const amplifyAppId = process.env.NEXT_PUBLIC_AMPLIFY_APP_ID || 'd37ec0x3muq59q';
const awsRegion = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';

// Configure Amplify with minimal configuration focusing on API only
Amplify.configure({
  API: {
    REST: {
      'warrity-api': {
        endpoint: process.env.NEXT_PUBLIC_API_URL || 'https://api.warrity.com',
        region: awsRegion,
      }
    }
  },
  // Add App ID configuration in the right format
  // This will help identify the application in AWS Amplify
  Notifications: {
    InAppMessaging: {
      Pinpoint: {
        appId: amplifyAppId,
        region: awsRegion
      }
    }
  }
});

// Future enhancement: Add Auth and Storage configurations when Amplify backend is initialized
// Auth configuration can be added here after running 'amplify add auth'
// Storage configuration can be added here after running 'amplify add storage'

export default Amplify; 