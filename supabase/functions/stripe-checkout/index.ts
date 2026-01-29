import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// Price IDs - à configurer dans Stripe Dashboard
const PRICE_IDS = {
  pro_monthly: Deno.env.get('STRIPE_PRICE_PRO_MONTHLY') || 'price_pro_monthly',
  premium_monthly: Deno.env.get('STRIPE_PRICE_PREMIUM_MONTHLY') || 'price_premium_monthly',
};

// Helper function to authenticate user
async function authenticateUser(req: Request): Promise<{ user: { id: string; email: string } | null; error: string | null }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    console.error('Auth error:', error?.message);
    return { user: null, error: 'Unauthorized' };
  }

  return { 
    user: { 
      id: data.user.id, 
      email: data.user.email || '' 
    }, 
    error: null 
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Authenticate user for all routes
    const { user, error: authError } = await authenticateUser(req);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id, user.email);

    // Route: Create checkout session
    if (path === 'create-checkout' && req.method === 'POST') {
      const { priceId, successUrl, cancelUrl } = await req.json();

      // Use authenticated user's email and ID - ignore client-provided values
      const email = user.email;
      const userId = user.id;

      console.log('Creating checkout session for authenticated user:', { priceId, userId, email });

      // Check if customer already exists
      let customerId: string | undefined;
      if (email) {
        const existingCustomers = await stripe.customers.list({ email, limit: 1 });
        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        }
      }

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl || `${req.headers.get('origin')}/dashboard?success=true`,
        cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing?canceled=true`,
        metadata: {
          user_id: userId,
        },
      };

      if (customerId) {
        sessionParams.customer = customerId;
      } else if (email) {
        sessionParams.customer_email = email;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      console.log('Checkout session created:', session.id);

      return new Response(
        JSON.stringify({ sessionId: session.id, url: session.url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: Create customer portal session
    if (path === 'customer-portal' && req.method === 'POST') {
      const { returnUrl } = await req.json();

      // Get customer ID from Stripe using authenticated user's email
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      
      if (customers.data.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No Stripe customer found for this account' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const customerId = customers.data[0].id;
      console.log('Creating portal session for authenticated customer:', customerId);

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl || `${req.headers.get('origin')}/profile`,
      });

      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: Get subscription status
    if (path === 'subscription-status' && req.method === 'POST') {
      // Use authenticated user's email - ignore client-provided email
      const email = user.email;

      console.log('Checking subscription for authenticated user:', email);

      const customers = await stripe.customers.list({ email, limit: 1 });
      
      if (customers.data.length === 0) {
        return new Response(
          JSON.stringify({ subscription: null, plan: 'free' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: customers.data[0].id,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return new Response(
          JSON.stringify({ 
            subscription: null, 
            plan: 'free',
            customerId: customers.data[0].id 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0]?.price.id;
      
      let plan = 'free';
      if (priceId === PRICE_IDS.pro_monthly) {
        plan = 'pro';
      } else if (priceId === PRICE_IDS.premium_monthly) {
        plan = 'premium';
      }

      return new Response(
        JSON.stringify({
          subscription: {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
          plan,
          customerId: customers.data[0].id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Stripe error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
