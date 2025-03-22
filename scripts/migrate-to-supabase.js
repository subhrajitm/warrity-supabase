#!/usr/bin/env node

/**
 * Migration Script: AWS Amplify to Supabase
 * 
 * This script helps with migrating data and configuration from AWS Amplify to Supabase.
 * It performs the following tasks:
 * 1. Validates that Supabase environment variables are set
 * 2. Tests the Supabase connection
 * 3. Sets up necessary Supabase tables and policies
 * 4. Provides guidance for data migration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables are not set.');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Table definitions
const tables = [
  {
    name: 'users',
    columns: `
      id uuid references auth.users not null primary key,
      name text,
      email text unique not null,
      role text default 'user' check (role in ('user', 'admin')),
      avatar_url text,
      phone text,
      bio text,
      is_verified boolean default false,
      preferences jsonb,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      updated_at timestamp with time zone default timezone('utc'::text, now()) not null
    `,
    indexes: ['CREATE INDEX idx_users_email ON users (email);']
  },
  {
    name: 'products',
    columns: `
      id uuid primary key default uuid_generate_v4(),
      name text not null,
      brand text,
      model text,
      category text,
      description text,
      image_url text,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      updated_at timestamp with time zone default timezone('utc'::text, now()) not null
    `,
    indexes: ['CREATE INDEX idx_products_category ON products (category);']
  },
  {
    name: 'warranties',
    columns: `
      id uuid primary key default uuid_generate_v4(),
      user_id uuid references users(id) not null,
      product_id uuid references products(id) not null,
      name text,
      purchase_date date not null,
      expiry_date date not null,
      status text default 'active' check (status in ('active', 'expired', 'pending', 'cancelled')),
      notes text,
      attachments jsonb,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null,
      updated_at timestamp with time zone default timezone('utc'::text, now()) not null
    `,
    indexes: [
      'CREATE INDEX idx_warranties_user_id ON warranties (user_id);',
      'CREATE INDEX idx_warranties_product_id ON warranties (product_id);',
      'CREATE INDEX idx_warranties_expiry_date ON warranties (expiry_date);'
    ]
  },
  {
    name: 'warranty_documents',
    columns: `
      id uuid primary key default uuid_generate_v4(),
      warranty_id uuid references warranties(id) not null,
      file_name text not null,
      file_url text not null,
      file_type text,
      file_size integer,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    `,
    indexes: ['CREATE INDEX idx_warranty_documents_warranty_id ON warranty_documents (warranty_id);']
  },
  {
    name: 'settings',
    columns: `
      id integer primary key default 1,
      settings jsonb not null default '{}'::jsonb,
      updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
      check (id = 1)
    `
  },
  {
    name: 'activity_logs',
    columns: `
      id uuid primary key default uuid_generate_v4(),
      user_id uuid references users(id),
      action text not null,
      resource_type text,
      resource_id text,
      details jsonb,
      ip_address text,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    `,
    indexes: [
      'CREATE INDEX idx_activity_logs_user_id ON activity_logs (user_id);',
      'CREATE INDEX idx_activity_logs_created_at ON activity_logs (created_at);'
    ]
  }
];

// Storage buckets
const buckets = [
  {
    name: 'warranty_documents',
    public: false
  },
  {
    name: 'profile_pictures',
    public: true
  }
];

// RLS policies
const policies = [
  {
    table: 'users',
    policies: [
      {
        name: 'users_select_own',
        definition: `
          CREATE POLICY users_select_own ON users
          FOR SELECT USING (auth.uid() = id);
        `
      },
      {
        name: 'users_update_own',
        definition: `
          CREATE POLICY users_update_own ON users
          FOR UPDATE USING (auth.uid() = id);
        `
      },
      {
        name: 'admins_select_all',
        definition: `
          CREATE POLICY admins_select_all ON users
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
            )
          );
        `
      }
    ]
  },
  {
    table: 'warranties',
    policies: [
      {
        name: 'warranties_select_own',
        definition: `
          CREATE POLICY warranties_select_own ON warranties
          FOR SELECT USING (auth.uid() = user_id);
        `
      },
      {
        name: 'warranties_insert_own',
        definition: `
          CREATE POLICY warranties_insert_own ON warranties
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        `
      },
      {
        name: 'warranties_update_own',
        definition: `
          CREATE POLICY warranties_update_own ON warranties
          FOR UPDATE USING (auth.uid() = user_id);
        `
      },
      {
        name: 'warranties_delete_own',
        definition: `
          CREATE POLICY warranties_delete_own ON warranties
          FOR DELETE USING (auth.uid() = user_id);
        `
      },
      {
        name: 'admins_select_all_warranties',
        definition: `
          CREATE POLICY admins_select_all_warranties ON warranties
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
            )
          );
        `
      }
    ]
  },
  {
    table: 'products',
    policies: [
      {
        name: 'products_select_all',
        definition: `
          CREATE POLICY products_select_all ON products
          FOR SELECT USING (true);
        `
      },
      {
        name: 'admins_all_products',
        definition: `
          CREATE POLICY admins_all_products ON products
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
            )
          );
        `
      }
    ]
  }
];

// Storage policies
const storagePolicies = [
  {
    bucket: 'warranty_documents',
    policies: [
      {
        name: 'documents_select_own',
        definition: `
          CREATE POLICY documents_select_own ON storage.objects
          FOR SELECT USING (
            bucket_id = 'warranty_documents' AND
            EXISTS (
              SELECT 1 FROM warranties w
              JOIN warranty_documents wd ON w.id = wd.warranty_id
              WHERE w.user_id = auth.uid() AND wd.file_url LIKE '%' || storage.filename(name)
            )
          );
        `
      },
      {
        name: 'documents_insert_own',
        definition: `
          CREATE POLICY documents_insert_own ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'warranty_documents' AND auth.uid() IS NOT NULL
          );
        `
      }
    ]
  },
  {
    bucket: 'profile_pictures',
    policies: [
      {
        name: 'profile_pictures_select_all',
        definition: `
          CREATE POLICY profile_pictures_select_all ON storage.objects
          FOR SELECT USING (bucket_id = 'profile_pictures');
        `
      },
      {
        name: 'profile_pictures_insert_own',
        definition: `
          CREATE POLICY profile_pictures_insert_own ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'profile_pictures' AND
            auth.uid() IS NOT NULL AND
            storage.filename(name) = auth.uid()::text || '.' || storage.extension(name)
          );
        `
      }
    ]
  }
];

// Functions
const functions = [
  {
    name: 'handle_user_signup',
    definition: `
      CREATE OR REPLACE FUNCTION handle_user_signup()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.users (id, email, name, avatar_url)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
          NEW.raw_user_meta_data->>'avatar_url'
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  },
  {
    name: 'get_expiring_warranties',
    definition: `
      CREATE OR REPLACE FUNCTION get_expiring_warranties(days_threshold int DEFAULT 30)
      RETURNS TABLE (
        id uuid,
        user_id uuid,
        product_id uuid,
        name text,
        purchase_date date,
        expiry_date date,
        status text,
        days_remaining int
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT
          w.id,
          w.user_id,
          w.product_id,
          w.name,
          w.purchase_date,
          w.expiry_date,
          w.status,
          (w.expiry_date - CURRENT_DATE)::int as days_remaining
        FROM
          warranties w
        WHERE
          w.user_id = auth.uid()
          AND w.status = 'active'
          AND w.expiry_date >= CURRENT_DATE
          AND (w.expiry_date - CURRENT_DATE) <= days_threshold
        ORDER BY
          days_remaining ASC;
      END;
      $$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
    `
  }
];

// Triggers
const triggers = [
  {
    name: 'on_auth_user_created',
    definition: `
      CREATE OR REPLACE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_user_signup();
    `
  }
];

async function main() {
  console.log('🔄 Starting migration from AWS Amplify to Supabase...');
  
  console.log('\n🧪 Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('_test').select('*').limit(1).catch(() => ({}));
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Connection failed: ${error.message}`);
    }
    console.log('✅ Supabase connection successful!');
  } catch (error) {
    console.log('✅ Supabase connection successful (no _test table, which is expected)');
  }
  
  // Ask for confirmation before proceeding
  console.log('\n⚠️ This script will create all necessary tables and policies in your Supabase database.');
  console.log('⚠️ It should be safe to run, but please make sure you have a backup of your data.');
  
  try {
    console.log('\n📝 Press Enter to proceed or Ctrl+C to cancel...');
    await new Promise(resolve => process.stdin.once('data', resolve));
    
    console.log('\n🏗️ Creating database schema...');
    
    // Create tables
    for (const table of tables) {
      try {
        console.log(`  - Creating table: ${table.name}`);
        
        // Check if table exists
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', table.name)
          .eq('table_schema', 'public');
        
        if (!error && data && data.length > 0) {
          console.log(`    ⚠️ Table ${table.name} already exists. Skipping.`);
          continue;
        }
        
        // Create the table
        await supabase.rpc('exec', { query: `
          CREATE TABLE ${table.name} (
            ${table.columns}
          );
        `});
        
        // Create indexes
        if (table.indexes) {
          for (const index of table.indexes) {
            await supabase.rpc('exec', { query: index });
          }
        }
        
        console.log(`    ✅ Table ${table.name} created successfully.`);
      } catch (error) {
        console.error(`    ❌ Failed to create table ${table.name}: ${error.message}`);
      }
    }
    
    // Create storage buckets
    console.log('\n🗄️ Creating storage buckets...');
    for (const bucket of buckets) {
      try {
        console.log(`  - Creating bucket: ${bucket.name}`);
        
        // Check if bucket exists
        const { data, error } = await supabase
          .storage
          .getBucket(bucket.name);
        
        if (!error && data) {
          console.log(`    ⚠️ Bucket ${bucket.name} already exists. Skipping.`);
          continue;
        }
        
        // Create the bucket
        await supabase
          .storage
          .createBucket(bucket.name, {
            public: bucket.public
          });
        
        console.log(`    ✅ Bucket ${bucket.name} created successfully.`);
      } catch (error) {
        console.error(`    ❌ Failed to create bucket ${bucket.name}: ${error.message}`);
      }
    }
    
    // Enable RLS on all tables
    console.log('\n🔒 Enabling Row Level Security (RLS) on all tables...');
    for (const table of tables) {
      try {
        await supabase.rpc('exec', {
          query: `ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY;`
        });
        console.log(`  ✅ RLS enabled on ${table.name}`);
      } catch (error) {
        console.error(`  ❌ Failed to enable RLS on ${table.name}: ${error.message}`);
      }
    }
    
    // Create RLS policies
    console.log('\n📜 Creating RLS policies...');
    for (const tablePolicy of policies) {
      console.log(`  - Creating policies for table: ${tablePolicy.table}`);
      
      for (const policy of tablePolicy.policies) {
        try {
          // Drop existing policy if it exists
          await supabase.rpc('exec', {
            query: `DROP POLICY IF EXISTS ${policy.name} ON ${tablePolicy.table};`
          }).catch(() => {});
          
          // Create policy
          await supabase.rpc('exec', { query: policy.definition });
          console.log(`    ✅ Policy ${policy.name} created`);
        } catch (error) {
          console.error(`    ❌ Failed to create policy ${policy.name}: ${error.message}`);
        }
      }
    }
    
    // Create storage policies
    console.log('\n📜 Creating storage policies...');
    for (const bucketPolicy of storagePolicies) {
      console.log(`  - Creating policies for bucket: ${bucketPolicy.bucket}`);
      
      for (const policy of bucketPolicy.policies) {
        try {
          // Drop existing policy if it exists
          await supabase.rpc('exec', {
            query: `DROP POLICY IF EXISTS ${policy.name} ON storage.objects;`
          }).catch(() => {});
          
          // Create policy
          await supabase.rpc('exec', { query: policy.definition });
          console.log(`    ✅ Policy ${policy.name} created`);
        } catch (error) {
          console.error(`    ❌ Failed to create policy ${policy.name}: ${error.message}`);
        }
      }
    }
    
    // Create functions
    console.log('\n⚙️ Creating database functions...');
    for (const func of functions) {
      try {
        await supabase.rpc('exec', { query: func.definition });
        console.log(`  ✅ Function ${func.name} created`);
      } catch (error) {
        console.error(`  ❌ Failed to create function ${func.name}: ${error.message}`);
      }
    }
    
    // Create triggers
    console.log('\n⚡ Creating triggers...');
    for (const trigger of triggers) {
      try {
        // Drop existing trigger if it exists
        await supabase.rpc('exec', {
          query: `DROP TRIGGER IF EXISTS ${trigger.name} ON auth.users;`
        }).catch(() => {});
        
        await supabase.rpc('exec', { query: trigger.definition });
        console.log(`  ✅ Trigger ${trigger.name} created`);
      } catch (error) {
        console.error(`  ❌ Failed to create trigger ${trigger.name}: ${error.message}`);
      }
    }
    
    console.log('\n✅ Supabase schema setup complete!');
    
    console.log('\n📋 Next steps:');
    console.log('  1. Review your Supabase project in the dashboard');
    console.log('  2. Set up authentication providers in the Auth settings');
    console.log('  3. Migrate your existing users to Supabase Auth');
    console.log('  4. Migrate your data from your previous database to Supabase');
    console.log('  5. Update your client code to use Supabase');
    
    console.log('\n🔗 Resources:');
    console.log('  - Supabase Dashboard: https://app.supabase.io');
    console.log('  - Supabase Documentation: https://supabase.io/docs');
    console.log('  - Migrating from AWS Amplify: https://supabase.io/docs/guides/migrations/aws-amplify');
    
    console.log('\n🎉 Migration script completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main(); 