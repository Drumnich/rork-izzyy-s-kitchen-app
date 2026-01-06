import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  try {
    const { record } = await req.json();
    
    console.log('New order webhook triggered:', record.id);

    if (record.status !== 'pending') {
      console.log('Order is not pending, skipping notification');
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: tokens, error } = await supabase
      .from('device_tokens')
      .select('token');

    if (error) {
      console.error('Error fetching device tokens:', error);
      throw error;
    }

    if (!tokens || tokens.length === 0) {
      console.log('No device tokens found');
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messages = tokens.map(({ token }) => ({
      to: token,
      sound: 'default',
      title: '🎂 New Order Added',
      body: `Order for ${record.customer_name} has been added to Active Orders`,
      data: { orderId: record.id },
    }));

    console.log(`Sending notifications to ${messages.length} devices`);

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('Expo push notification result:', result);

    return new Response(JSON.stringify({ success: true, sent: messages.length, result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in notify-new-order function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
})
