import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type SubscriptionPlan = 'free' | 'essential' | 'pro' | 'ultimate';

interface SubscriptionData {
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
  } | null;
  plan: SubscriptionPlan;
  customerId: string | null;
}

export function useStripe() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    subscription: null,
    plan: 'free',
    customerId: null,
  });

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user) return;

    try {
      // Server uses authenticated user's email - no need to send it
      const { data, error } = await supabase.functions.invoke('stripe-checkout/subscription-status', {
        body: {},
      });

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscriptionData({
        subscription: data.subscription,
        plan: data.plan || 'free',
        customerId: data.customerId || null,
      });
    } catch (err) {
      console.error('Error fetching subscription status:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  const createCheckoutSession = async (priceId: string) => {
    if (!user) {
      throw new Error('User must be logged in to subscribe');
    }

    setLoading(true);
    try {
      // Server uses authenticated user - no need to send userId/email
      const { data, error } = await supabase.functions.invoke('stripe-checkout/create-checkout', {
        body: {
          priceId,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Redirect to Stripe Checkout
      if (data?.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      throw new Error('User must be logged in');
    }

    setLoading(true);
    try {
      // Server looks up customer from authenticated user - no need to send customerId
      const { data, error } = await supabase.functions.invoke('stripe-checkout/customer-portal', {
        body: {
          returnUrl: `${window.location.origin}/profile`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    plan: subscriptionData.plan,
    subscription: subscriptionData.subscription,
    customerId: subscriptionData.customerId,
    createCheckoutSession,
    openCustomerPortal,
    refreshSubscription: fetchSubscriptionStatus,
  };
}
