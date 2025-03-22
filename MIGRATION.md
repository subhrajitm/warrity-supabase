# Migrating from AWS Amplify to Supabase

This guide covers the process of migrating the Warrity application from AWS Amplify to Supabase.

## Prerequisites

1. A Supabase account and project
2. Supabase API URL and anonymous key
3. Node.js and pnpm installed

## Step 1: Set up Supabase environment variables

Update your `.env.local` file with the Supabase URL and anonymous key:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 2: Install the Supabase client

Run the following command to install the Supabase JavaScript client:

```bash
pnpm add @supabase/supabase-js
```

## Step 3: Run the migration script

This will create the necessary tables, policies, and functions in your Supabase project:

```bash
pnpm migrate-to-supabase
```

## Step 4: Test the migration

Run the application to test that everything is working correctly:

```bash
pnpm dev
```

## Migration details

### What has been changed

1. **Configuration**:
   - Added Supabase client configuration in `lib/supabase-config.ts`
   - Updated environment variables in `.env.local`

2. **API Utilities**:
   - Created Supabase API utilities in `lib/supabase-api.ts`
   - Created Supabase auth utilities in `lib/supabase-auth.ts`
   - Modified existing API adapters to use Supabase in `lib/api-adapter.ts`
   - Updated compatibility layer in `lib/amplify-api.ts`

3. **Database Schema**:
   - Created tables for users, products, warranties, and more
   - Set up Row Level Security (RLS) policies for data protection
   - Created database triggers for events like user creation

### Tables Created

- `users`: User profiles linked to Supabase Auth
- `products`: Product catalog
- `warranties`: Warranty records
- `warranty_documents`: Files attached to warranties
- `settings`: Application settings
- `activity_logs`: User activity tracking

### Storage Buckets

- `warranty_documents`: Private bucket for warranty attachments
- `profile_pictures`: Public bucket for user avatars

## Troubleshooting

### Authentication issues

If you experience issues with authentication:

1. Verify that the Supabase URL and anonymous key are correct
2. Check that the auth helpers in `lib/supabase-auth.ts` are functioning
3. Ensure your users have been migrated to Supabase Auth

### API request failures

If API requests are failing:

1. Check the browser console for error messages
2. Verify that the database tables exist in Supabase
3. Ensure RLS policies are set up correctly

### Data migration

For migrating existing data:

1. Export data from your previous database
2. Transform data to match the Supabase schema
3. Import data into Supabase using the dashboard or API

## Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Supabase Migration Guides](https://supabase.io/docs/guides/migrations)
- [Supabase JavaScript Client](https://supabase.io/docs/reference/javascript) 