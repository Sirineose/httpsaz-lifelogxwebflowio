import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown, Star, HelpCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStripe } from "@/hooks/useStripe";
import { toast } from "sonner";
import { LanguageSelector } from "@/components/LanguageSelector";

// Price IDs - À configurer dans Stripe Dashboard
const STRIPE_PRICE_IDS = {
  essential: 'price_essential_monthly',
  pro: 'price_pro_monthly',
  ultimate: 'price_ultimate_monthly',
};

type PlanKey = 'free' | 'essential' | 'pro' | 'ultimate';

interface Plan {
  key: PlanKey;
  price: string;
  icon: typeof Zap;
  popular: boolean;
  priceId: string | null;
  ctaKey: string;
  ctaVariant: 'primary' | 'secondary';
}

const plans: Plan[] = [
  {
    key: 'free',
    price: "0",
    icon: Zap,
    popular: false,
    priceId: null,
    ctaKey: "startFree",
    ctaVariant: "secondary",
  },
  {
    key: 'essential',
    price: "99",
    icon: Star,
    popular: false,
    priceId: STRIPE_PRICE_IDS.essential,
    ctaKey: "freeTrial",
    ctaVariant: "secondary",
  },
  {
    key: 'pro',
    price: "120",
    icon: Sparkles,
    popular: true,
    priceId: STRIPE_PRICE_IDS.pro,
    ctaKey: "freeTrial",
    ctaVariant: "primary",
  },
  {
    key: 'ultimate',
    price: "189",
    icon: Crown,
    popular: false,
    priceId: STRIPE_PRICE_IDS.ultimate,
    ctaKey: "upgrade",
    ctaVariant: "primary",
  },
];

export default function Pricing() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading, plan: currentPlan, createCheckoutSession } = useStripe();
  const isRTL = i18n.language === 'ar';

  const handleSubscribe = async (priceId: string | null) => {
    if (!priceId) {
      navigate('/dashboard');
      return;
    }

    if (!user) {
      toast.error(i18n.language === 'ar' 
        ? 'يجب تسجيل الدخول للاشتراك'
        : i18n.language === 'en'
        ? 'You must be logged in to subscribe'
        : 'Vous devez être connecté pour vous abonner');
      navigate('/auth');
      return;
    }

    try {
      await createCheckoutSession(priceId);
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error(i18n.language === 'ar'
        ? 'خطأ في إنشاء الدفع'
        : i18n.language === 'en'
        ? 'Error creating payment'
        : 'Erreur lors de la création du paiement');
    }
  };

  const faqKeys = ['changePlan', 'commitment', 'trial'] as const;

  return (
    <div className={cn("min-h-screen bg-background", isRTL && "rtl")}>
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl prago-gradient-bg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">PRAGO</span>
          </NavLink>
          <div className="flex items-center gap-4">
            <LanguageSelector variant="icon" />
            <NavLink to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.faq')}
            </NavLink>
            <NavLink to="/dashboard" className="prago-btn-secondary text-sm">
              {t('nav.dashboard')}
            </NavLink>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="prago-badge-primary mb-4 inline-block">{t('pricing.badge')}</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            {t('pricing.title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {plans.map((plan, index) => {
            const planData = t(`pricing.plans.${plan.key}`, { returnObjects: true }) as {
              name: string;
              description: string;
              features: string[];
              limitations: string[];
            };

            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "prago-card p-6 relative flex flex-col",
                  plan.popular && "ring-2 ring-primary"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="prago-badge-primary">{t('pricing.popular')}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    plan.popular ? "prago-gradient-bg" : "bg-secondary"
                  )}>
                    <plan.icon className={cn(
                      "w-6 h-6",
                      plan.popular ? "text-white" : "text-foreground"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg">{planData.name}</h3>
                    <p className="text-xs text-muted-foreground">{planData.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground"> DH{t('pricing.perMonth')}</span>
                </div>

                <button
                  onClick={() => handleSubscribe(plan.priceId)}
                  disabled={loading || (plan.priceId && currentPlan === plan.key)}
                  className={cn(
                    "w-full mb-6 flex items-center justify-center gap-2",
                    plan.ctaVariant === "primary" ? "prago-btn-primary" : "prago-btn-secondary",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {loading && plan.priceId && <Loader2 className="w-4 h-4 animate-spin" />}
                  {currentPlan === plan.key ? t('pricing.currentPlan') : t(`pricing.${plan.ctaKey}`)}
                </button>

                <div className="space-y-3 flex-1">
                  {planData.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  {planData.limitations?.map((limitation) => (
                    <div key={limitation} className="flex items-start gap-2 text-muted-foreground">
                      <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-center">—</span>
                      <span className="text-sm">{limitation}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mini FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-bold mb-2">{t('pricing.faq')}</h2>
            <p className="text-muted-foreground">
              {t('pricing.moreFaq')}{" "}
              <NavLink to="/faq" className="text-primary hover:underline">
                {t('pricing.allFaq')}
              </NavLink>
            </p>
          </div>

          <div className="space-y-4">
            {faqKeys.map((faqKey) => {
              const faq = t(`pricing.faqs.${faqKey}`, { returnObjects: true }) as {
                question: string;
                answer: string;
              };
              return (
                <div key={faqKey} className="prago-card p-4">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium mb-1">{faq.question}</h4>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center"
        >
          <div className="prago-card p-8 md:p-12 prago-gradient-bg text-white">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              {t('pricing.ctaTitle')}
            </h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              {t('pricing.ctaDesc')}
            </p>
            <button 
              onClick={() => navigate('/auth')}
              className="bg-white text-primary font-semibold px-8 py-3 rounded-xl hover:bg-white/90 transition-colors"
            >
              {t('pricing.ctaButton')}
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
