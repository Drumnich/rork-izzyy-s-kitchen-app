# Push Notifications Setup

This guide will help you set up push notifications so all devices receive alerts when a new order is added, even when the app is completely closed.

## Step 1: Update Database

Run the updated `lib/database-setup.sql` script in your Supabase SQL Editor. This adds a `device_tokens` table to store push notification tokens from all devices.

The script is safe to re-run - it won't delete existing data.

## Step 2: Deploy Supabase Edge Function

1. Install Supabase CLI if you haven't:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project (use your project ref from Supabase dashboard):
   ```bash
   supabase link --project-ref tnywgwiofmvskychmsce
   ```

4. Deploy the edge function:
   ```bash
   supabase functions deploy notify-new-order
   ```

## Step 3: Create Database Webhook

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/tnywgwiofmvskychmsce
2. Navigate to **Database** → **Webhooks**
3. Click **Create a new hook**
4. Configure:
   - **Name**: notify-new-order
   - **Table**: orders
   - **Events**: Check only **INSERT**
   - **Type**: Supabase Edge Function
   - **Edge Function**: notify-new-order
5. Click **Create webhook**

## How It Works

1. When the app opens, it registers the device's push token in the `device_tokens` table
2. When a new order is created with `status = 'pending'`, Supabase triggers the webhook
3. The Edge Function fetches all device tokens from the database
4. It sends push notifications to all registered devices via Expo's push service
5. All devices receive the notification, even if the app is closed

## Testing

1. Open the app on multiple devices (or use the QR code to test on a physical device)
2. Create a new order with "Active" status
3. All devices should receive a push notification

## Troubleshooting

- **No notifications received**: Check Supabase Edge Function logs in the Dashboard
- **"Permission not granted" in console**: Make sure you accept notification permissions on device
- **Webhook not triggering**: Verify the webhook is enabled in Supabase Dashboard

## TypeScript Errors (Can be ignored)

The file `supabase/functions/notify-new-order/index.ts` will show TypeScript errors in your editor. This is normal - it's a Deno runtime file that uses different module resolution than Node.js. The errors don't affect functionality.
