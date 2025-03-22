import { Amplify } from 'aws-amplify';

// Prepare configuration objects conditionally based on environment variables
const authConfig = process.env.NEXT_PUBLIC_USER_POOL_ID ? {
  Auth: {
    Cognito: {
      identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID as string,
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID as string,
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID as string,
    }
  }
} : {};

const apiConfig = {
  API: {
    REST: {
      'warrity-api': {
        endpoint: process.env.NEXT_PUBLIC_API_URL || 'https://api.warrity.com',
        region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      }
    }
  }
};

const storageConfig = process.env.NEXT_PUBLIC_S3_BUCKET ? {
  Storage: {
    S3: {
      bucket: process.env.NEXT_PUBLIC_S3_BUCKET as string,
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    }
  }
} : {};

// Configure Amplify by merging configurations
Amplify.configure({
  ...authConfig,
  ...apiConfig,
  ...storageConfig
});

export default Amplify; 