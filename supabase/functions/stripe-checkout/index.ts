import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Price IDs - à configurer dans Stripe Dashboard
const PRICE_IDS = {
  pro_monthly: Deno.env.get('STRIPE_PRICE_PRO_MONTHLY') || 'price_pro_monthly',
  premium_monthly: Deno.env.get('STRIPE_PRICE_PREMIUM_MONTHLY') || 'price_premium_monthly',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Route: Create checkout session
    if (path === 'create-checkout' && req.method === 'POST') {
      const { priceId, userId, email, successUrl, cancelUrl } = await req.json();

      console.log('Creating checkout session for:', { priceId, userId, email });

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
          user_id: userId || '',
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
      const { customerId, returnUrl } = await req.json();

      console.log('Creating portal session for customer:', customerId);

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
      const { email } = await req.json();

      console.log('Checking subscription for:', email);

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
