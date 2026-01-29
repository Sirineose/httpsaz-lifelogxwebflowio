import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStripe } from "@/hooks/useStripe";
import { toast } from "sonner";

// Price IDs - à configurer dans Stripe Dashboard
const STRIPE_PRICE_IDS = {
  pro: 'price_pro_monthly', // Remplacer par votre vrai price_id
  premium: 'price_premium_monthly', // Remplacer par votre vrai price_id
};

const plans = [
  {
    name: "Gratuit",
    price: "0€",
    period: "/mois",
    description: "Parfait pour découvrir PRAGO",
    icon: Zap,
    popular: false,
    priceId: null,
    features: [
      "10 requêtes IA par jour",
      "Quiz illimités",
      "3 notes max",
      "Accès communauté",
    ],
    limitations: [
      "Pas de Snap & Solve",
      "Pas de cours en BD",
      "Support limité",
    ],
    cta: "Commencer gratuitement",
    ctaVariant: "secondary" as const,
  },
  {
    name: "Pro",
    price: "9,99€",
    period: "/mois",
    description: "Pour les étudiants sérieux",
    icon: Sparkles,
    popular: true,
    priceId: STRIPE_PRICE_IDS.pro,
    features: [
      "100 requêtes IA par jour",
      "Snap & Solve illimité",
      "Notes illimitées",
      "Cours en BD",
      "Export PDF",
      "Support prioritaire",
    ],
    limitations: [],
    cta: "Essai gratuit 7 jours",
    ctaVariant: "primary" as const,
  },
  {
    name: "Premium",
    price: "19,99€",
    period: "/mois",
    description: "L'expérience complète",
    icon: Crown,
    popular: false,
    priceId: STRIPE_PRICE_IDS.premium,
    features: [
      "Requêtes IA illimitées",
      "Toutes les fonctionnalités Pro",
      "Exam Prep avancé",
      "Tuteur IA personnalisé",
      "Analytics détaillés",
      "Support 24/7",
      "Accès anticipé nouveautés",
    ],
    limitations: [],
    cta: "Passer à Premium",
    ctaVariant: "primary" as const,
  },
];

const faqs = [
  {
    question: "Puis-je changer de plan à tout moment ?",
    answer: "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement.",
  },
  {
    question: "Y a-t-il un engagement ?",
    answer: "Non, tous nos plans sont sans engagement. Vous pouvez annuler à tout moment.",
  },
  {
    question: "Comment fonctionne l'essai gratuit ?",
    answer: "L'essai Pro de 7 jours vous donne accès à toutes les fonctionnalités. Aucune carte requise.",
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading, plan: currentPlan, createCheckoutSession } = useStripe();

  const handleSubscribe = async (priceId: string | null) => {
    if (!priceId) {
      // Free plan - go to dashboard
      navigate('/dashboard');
      return;
    }

    if (!user) {
      toast.error('Vous devez être connecté pour vous abonner');
      navigate('/auth');
      return;
    }

    try {
      await createCheckoutSession(priceId);
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Erreur lors de la création du paiement');
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
            <NavLink to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </NavLink>
            <NavLink to="/dashboard" className="prago-btn-secondary text-sm">
              Dashboard
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
          <span className="prago-badge-primary mb-4 inline-block">Tarifs simples</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Des formules adaptées à chaque étudiant. Commencez gratuitement et évoluez selon vos besoins.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "prago-card p-6 relative",
                plan.popular && "ring-2 ring-primary"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="prago-badge-primary">Le plus populaire</span>
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
                  <h3 className="font-display font-semibold text-lg">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <button
                onClick={() => handleSubscribe(plan.priceId)}
                disabled={loading || (plan.priceId && currentPlan === plan.name.toLowerCase())}
                className={cn(
                  "w-full mb-6 flex items-center justify-center gap-2",
                  plan.ctaVariant === "primary" ? "prago-btn-primary" : "prago-btn-secondary",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {loading && plan.priceId && <Loader2 className="w-4 h-4 animate-spin" />}
                {currentPlan === plan.name.toLowerCase() ? "Plan actuel" : plan.cta}
              </button>

              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation) => (
                  <div key={limitation} className="flex items-start gap-2 text-muted-foreground">
                    <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-center">—</span>
                    <span className="text-sm">{limitation}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mini FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-bold mb-2">Questions fréquentes</h2>
            <p className="text-muted-foreground">
              Besoin de plus d'infos ?{" "}
              <NavLink to="/faq" className="text-primary hover:underline">
                Voir toutes les FAQ
              </NavLink>
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="prago-card p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">{faq.question}</h4>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
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
              Prêt à transformer tes études ?
            </h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Rejoins des milliers d'étudiants qui utilisent PRAGO pour réussir leurs examens.
            </p>
            <button className="bg-white text-primary font-semibold px-8 py-3 rounded-xl hover:bg-white/90 transition-colors">
              Commencer maintenant
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
