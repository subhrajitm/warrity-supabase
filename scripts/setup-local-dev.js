#!/usr/bin/env node

/**
 * Local Development Setup Script
 * 
 * This script helps set up the local development environment for Warrity with Supabase.
 * It performs the following:
 * 1. Checks if needed environment variables are set
 * 2. Creates a .env.local file if it doesn't exist
 * 3. Tests connectivity to Supabase
 * 4. Creates required storage buckets if they don't exist
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load any existing env file
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Define default values
const defaults = {
  NEXT_PUBLIC_API_URL: 'http://localhost:3000',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SUPABASE_URL: 'https://avhubonvfquxgmontvaw.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2aHVib252ZnF1eGdtb250dmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzMzMTYsImV4cCI6MjA1ODI0OTMxNn0.bvPpp34JSBPhn8sakA2qBgYTyw5OZ8D_CFDxbIKfXDM'
};

// Check for missing values and create .env.local if needed
async function setupEnvFile() {
  console.log('🔍 Checking environment variables...');
  
  let envContent = '';
  let needsUpdate = false;
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  } else {
    needsUpdate = true;
    console.log('🆕 Creating new .env.local file');
  }

  // Check for each required variable
  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (!process.env[key] && !envContent.includes(`${key}=`)) {
      envContent += `${key}=${defaultValue}\n`;
      needsUpdate = true;
      console.log(`✅ Added ${key} with default value`);
    }
  }

  // Add comment for legacy AWS Amplify config
  if (!envContent.includes('# Legacy AWS Amplify')) {
    envContent += '\n# Legacy AWS Amplify config (commented out)\n';
    envContent += '# NEXT_PUBLIC_AWS_REGION=us-east-1\n';
    envContent += '# NEXT_PUBLIC_AWS_USER_POOLS_ID=us-east-1_XXXXXXXXX\n';
    envContent += '# NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX\n';
    needsUpdate = true;
  }

  // Write the file if needed
  if (needsUpdate) {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env.local file');

    // Reload environment variables
    dotenv.config({ path: envPath, override: true });
  } else {
    console.log('✅ Environment variables are properly set');
  }
}

// Test Supabase connection
async function testSupabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaults.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaults.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('\n🧪 Testing Supabase connection...');
  console.log(`URL: ${supabaseUrl}`);
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Try to get the session - this should work even if no tables exist
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.warn('⚠️ Warning: Supabase Auth connection issue');
      console.warn(authError.message);
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('✅ Supabase Auth is configured correctly');
    }
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.log('\nPlease check your Supabase URL and API key in .env.local');
  }
  
  return supabase;
}

// Set up storage buckets
async function setupStorageBuckets(supabase) {
  console.log('\n🗄️ Setting up Supabase storage buckets...');
  
  try {
    // Create profile_pictures bucket if it doesn't exist
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing storage buckets:', listError.message);
      return;
    }
    
    // Check if profile_pictures bucket exists
    const profilePicturesBucket = buckets.find(bucket => bucket.name === 'profile_pictures');
    
    if (!profilePicturesBucket) {
      console.log('Creating profile_pictures bucket...');
      const { data, error } = await supabase.storage.createBucket('profile_pictures', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2, // 2MB limit
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif']
      });
      
      if (error) {
        console.error('❌ Error creating profile_pictures bucket:', error.message);
      } else {
        console.log('✅ Created profile_pictures bucket');
      }
    } else {
      console.log('✅ profile_pictures bucket already exists');
    }
    
    // Check if warranty_documents bucket exists
    const warrantyDocumentsBucket = buckets.find(bucket => bucket.name === 'warranty_documents');
    
    if (!warrantyDocumentsBucket) {
      console.log('Creating warranty_documents bucket...');
      const { data, error } = await supabase.storage.createBucket('warranty_documents', {
        public: false,
        fileSizeLimit: 1024 * 1024 * 10, // 10MB limit
        allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg']
      });
      
      if (error) {
        console.error('❌ Error creating warranty_documents bucket:', error.message);
      } else {
        console.log('✅ Created warranty_documents bucket');
      }
    } else {
      console.log('✅ warranty_documents bucket already exists');
    }
    
  } catch (error) {
    console.error('❌ Error setting up storage buckets:', error.message);
  }
}

// Make directory executable
async function makeScriptsExecutable() {
  console.log('\n🔧 Making scripts executable...');
  
  try {
    // Check if we're on a Unix-like system
    const isUnix = process.platform !== 'win32';
    
    if (isUnix) {
      const scriptsDir = path.resolve(process.cwd(), 'scripts');
      const files = fs.readdirSync(scriptsDir);
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const filePath = path.join(scriptsDir, file);
          fs.chmodSync(filePath, '755');
        }
      }
      
      console.log('✅ Scripts are now executable');
    } else {
      console.log('✅ Script permissions not changed (Windows detected)');
    }
  } catch (error) {
    console.error('❌ Failed to make scripts executable:', error.message);
  }
}

// Main function
async function main() {
  console.log('🚀 Setting up local development environment...');
  
  await setupEnvFile();
  const supabase = await testSupabaseConnection();
  await setupStorageBuckets(supabase);
  await makeScriptsExecutable();
  
  console.log('\n📋 Local Development Setup Complete!');
  console.log('\nNext steps:');
  console.log('  1. Run the application: pnpm dev');
  console.log('  2. Run database migration: pnpm migrate-to-supabase');
  console.log('  3. Access app at: http://localhost:3000');
}

main().catch(console.error); 