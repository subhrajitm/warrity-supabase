-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    email TEXT UNIQUE,
    name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (id)
);

-- Create warranties table
CREATE TABLE IF NOT EXISTS warranties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active',
    provider TEXT,
    warranty_number TEXT,
    documents TEXT[] DEFAULT '{}',
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Warranties policies
CREATE POLICY "Users can view their own warranties"
    ON warranties FOR SELECT
    USING (true);

CREATE POLICY "Users can create warranties"
    ON warranties FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own warranties"
    ON warranties FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete their own warranties"
    ON warranties FOR DELETE
    USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warranties_updated_at
    BEFORE UPDATE ON warranties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 