# Izzyy's Kitchen Management App

A React Native app built with Expo for managing kitchen orders, recipes, and customers, with Supabase database integration.

## 🚨 CRITICAL: Database Setup Required

**The app will NOT work until you complete this setup!**

### Step 1: Set Up Database Tables

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `tnywgwiofmvskychmsce`
3. **Open SQL Editor**: Click "SQL Editor" in the left sidebar
4. **Create New Query**: Click the "New Query" button
5. **Copy the SQL Script**: 
   - Open the file `lib/database-setup.sql` in your project
   - Copy ALL the content (the entire file)
6. **Paste and Run**: 
   - Paste the SQL into the Supabase SQL Editor
   - Click the "Run" button (or press Ctrl/Cmd + Enter)
7. **Verify Success**: You should see "Tables created successfully!" message

### Step 2: Verify Tables Were Created

After running the SQL script:
1. Go to **Table Editor** in your Supabase dashboard
2. You should see these 4 tables:
   - `users` (with 2 sample users)
   - `customers` (with 3 sample customers)
   - `orders` (with 3 sample orders)
   - `recipes` (with 3 sample recipes)

### Step 3: Test the App

1. **Restart your development server**: 
   ```bash
   npm start
   ```
2. **Login with default credentials**:
   - Kitchen Manager (Admin): PIN `1234`
   - Kitchen Staff (Employee): PIN `5678`
3. **Test functionality**:
   - Try adding a new customer
   - Try creating a new order
   - Verify data appears in your Supabase dashboard

## Default Users (Available after database setup)

- **Kitchen Manager** (Admin): PIN `1234`
  - Can create/edit orders, customers, recipes, and manage users
- **Kitchen Staff** (Employee): PIN `5678`
  - Can view orders and recipes (read-only access)

## Troubleshooting

### "relation does not exist" errors:
- ❌ **Problem**: Database tables not created
- ✅ **Solution**: Run the SQL setup script in Supabase SQL Editor

### "Unknown database error" when adding data:
- ❌ **Problem**: Tables exist but have wrong structure
- ✅ **Solution**: Re-run the SQL setup script (it will recreate tables)

### Connection Issues:
- **ERR_NGROK_3200**: Restart the server with `npm start`
- **Tunnel offline**: Wait a moment and restart the server

### Still having issues?
1. Check your Supabase project URL and anon key in `lib/supabase.ts`
2. Make sure you're using the correct Supabase project
3. Verify the SQL script ran without errors in the Supabase SQL Editor

## Features

- **Authentication**: PIN-based login system
- **Order Management**: Create, view, update, and delete orders
- **Recipe Management**: Store and view recipes with ingredients and instructions
- **Customer Database**: Manage customer information and reuse for orders
- **User Management**: Admin can manage kitchen staff accounts
- **Real-time Database**: All data stored in Supabase with real-time updates

## Development

```bash
npm install
npm start
```

The app works on iOS, Android, and Web with full database functionality.

---

## Quick Setup Checklist

- [ ] Run SQL script in Supabase SQL Editor
- [ ] Verify 4 tables created in Table Editor
- [ ] Restart development server
- [ ] Login with PIN 1234 or 5678
- [ ] Test adding a customer
- [ ] Test creating an order