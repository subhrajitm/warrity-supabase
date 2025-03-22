import { Amplify } from 'aws-amplify';

// Configure Amplify with minimal configuration focusing on API only
Amplify.configure({
  API: {
    REST: {
      'warrity-api': {
        endpoint: process.env.NEXT_PUBLIC_API_URL || 'https://api.warrity.com',
        region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      }
    }
  },
  // Add App ID configuration in the right format
  // This will help identify the application in AWS Amplify
  Notifications: {
    InAppMessaging: {
      Pinpoint: {
        appId: 'd2aemy150tlfm7',
        region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
      }
    }
  }
});

// Future enhancement: Add Auth and Storage configurations when Amplify backend is initialized
// Auth configuration can be added here after running 'amplify add auth'
// Storage configuration can be added here after running 'amplify add storage'

export default Amplify; 