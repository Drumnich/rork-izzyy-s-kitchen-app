-- Izzyy's Kitchen Database Setup Script
-- Run this entire script in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  pin TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone_number TEXT,
  items JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'ready', 'completed')),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  special_notes TEXT,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipes table
CREATE TABLE recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('cookie', 'cake', 'other')),
  servings INTEGER NOT NULL,
  prep_time INTEGER NOT NULL,
  cook_time INTEGER NOT NULL,
  ingredients JSONB NOT NULL,
  instructions JSONB NOT NULL,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default users
INSERT INTO users (name, role, pin) VALUES 
('Kitchen Manager', 'admin', '1234'),
('Kitchen Staff', 'employee', '5678');

-- Insert sample customers
INSERT INTO customers (name, phone, email, address, notes) VALUES 
('Sarah Johnson', '(555) 123-4567', 'sarah@email.com', '123 Main St, City, State', 'Regular customer - loves chocolate chip cookies'),
('Mike Chen', '(555) 987-6543', 'mike.chen@email.com', '456 Oak Ave, City, State', 'Prefers less sweet options'),
('Lisa Park', '(555) 456-7890', 'lisa.park@email.com', '789 Pine Rd, City, State', 'Always orders for large events');

-- Insert sample orders
INSERT INTO orders (customer_name, items, status, deadline, special_notes, paid) VALUES 
('Sarah Johnson', '[{"id":"1","name":"Classic Chocolate Chip Cookies","quantity":24,"notes":"Extra crispy"},{"id":"2","name":"Red Velvet Cake","quantity":1,"notes":"8-inch round"}]'::jsonb, 'pending', NOW() + INTERVAL '2 days', 'Birthday party - please add "Happy Birthday Emma" on cake', false),
('Mike Chen', '[{"id":"1","name":"Snickerdoodle Cookies","quantity":48}]'::jsonb, 'in-progress', NOW() + INTERVAL '1 day', null, true),
('Lisa Park', '[{"id":"1","name":"Chocolate Birthday Cake","quantity":1,"notes":"10-inch round, chocolate frosting"}]'::jsonb, 'ready', NOW() + INTERVAL '4 hours', 'Customer will pick up at noon', false);

-- Insert sample recipes
INSERT INTO recipes (name, category, servings, prep_time, cook_time, ingredients, instructions, image) VALUES 
('Classic Chocolate Chip Cookies', 'cookie', 24, 15, 12, 
 '[{"name":"All-purpose flour","amount":"2.25","unit":"cups"},{"name":"Baking soda","amount":"1","unit":"tsp"},{"name":"Salt","amount":"1","unit":"tsp"},{"name":"Butter","amount":"1","unit":"cup"},{"name":"Granulated sugar","amount":"0.75","unit":"cup"},{"name":"Brown sugar","amount":"0.75","unit":"cup"},{"name":"Vanilla extract","amount":"2","unit":"tsp"},{"name":"Large eggs","amount":"2","unit":"pieces"},{"name":"Chocolate chips","amount":"2","unit":"cups"}]'::jsonb,
 '["Preheat oven to 375°F (190°C).","In a medium bowl, whisk together flour, baking soda, and salt.","In a large bowl, cream together butter and both sugars until light and fluffy.","Beat in eggs one at a time, then add vanilla.","Gradually mix in the flour mixture until just combined.","Fold in chocolate chips.","Drop rounded tablespoons of dough onto ungreased baking sheets.","Bake for 9-11 minutes or until golden brown.","Cool on baking sheet for 2 minutes before transferring to wire rack."]'::jsonb,
 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400'),
('Red Velvet Cake', 'cake', 12, 30, 25,
 '[{"name":"All-purpose flour","amount":"2.5","unit":"cups"},{"name":"Cocoa powder","amount":"2","unit":"tbsp"},{"name":"Baking soda","amount":"1","unit":"tsp"},{"name":"Salt","amount":"1","unit":"tsp"},{"name":"Vegetable oil","amount":"1.5","unit":"cups"},{"name":"Granulated sugar","amount":"1.5","unit":"cups"},{"name":"Large eggs","amount":"2","unit":"pieces"},{"name":"Red food coloring","amount":"2","unit":"tbsp"},{"name":"Vanilla extract","amount":"1","unit":"tsp"},{"name":"Buttermilk","amount":"1","unit":"cup"},{"name":"White vinegar","amount":"1","unit":"tbsp"}]'::jsonb,
 '["Preheat oven to 350°F (175°C). Grease two 9-inch round pans.","In a medium bowl, sift together flour, cocoa powder, baking soda, and salt.","In a large bowl, whisk together oil and sugar.","Beat in eggs one at a time, then add food coloring and vanilla.","Alternate adding dry ingredients and buttermilk, beginning and ending with flour mixture.","Stir in vinegar.","Divide batter between prepared pans.","Bake for 25-30 minutes or until a toothpick comes out clean.","Cool in pans for 10 minutes, then turn out onto wire racks."]'::jsonb,
 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400'),
('Snickerdoodle Cookies', 'cookie', 36, 20, 10,
 '[{"name":"All-purpose flour","amount":"2.75","unit":"cups"},{"name":"Cream of tartar","amount":"2","unit":"tsp"},{"name":"Baking soda","amount":"1","unit":"tsp"},{"name":"Salt","amount":"0.5","unit":"tsp"},{"name":"Butter","amount":"1","unit":"cup"},{"name":"Granulated sugar","amount":"1.5","unit":"cups"},{"name":"Large eggs","amount":"2","unit":"pieces"},{"name":"Vanilla extract","amount":"1","unit":"tsp"},{"name":"Cinnamon","amount":"2","unit":"tbsp"},{"name":"Sugar for rolling","amount":"0.25","unit":"cup"}]'::jsonb,
 '["Preheat oven to 400°F (200°C).","In a medium bowl, whisk together flour, cream of tartar, baking soda, and salt.","In a large bowl, cream butter and 1.5 cups sugar until fluffy.","Beat in eggs and vanilla.","Gradually mix in flour mixture.","In a small bowl, combine cinnamon and 1/4 cup sugar.","Roll dough into 1.5-inch balls, then roll in cinnamon sugar.","Place 2 inches apart on ungreased baking sheets.","Bake for 8-10 minutes until set but still soft.","Cool on baking sheet for 2 minutes before transferring."]'::jsonb,
 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- In case of existing schema, add paid and phone_number columns safely
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='orders' AND column_name='paid'
  ) THEN
    ALTER TABLE orders ADD COLUMN paid BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='orders' AND column_name='phone_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN phone_number TEXT;
  END IF;
END $;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all operations on orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on recipes" ON recipes FOR ALL USING (true);

-- Verify tables were created
SELECT 'Tables created successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;