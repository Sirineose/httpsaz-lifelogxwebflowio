import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, BookOpen, Brain, Zap, CheckCircle2, Shield, GraduationCap, MessageSquare, Camera } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: GraduationCap,
    title: "Pédagogique",
    description: "Explications claires et structurées, adaptées à votre niveau d'apprentissage avec des exemples concrets.",
    emoji: "🎓",
  },
  {
    icon: Brain,
    title: "Intelligent",
    description: "Détection des erreurs de raisonnement et suggestions d'amélioration personnalisées.",
    emoji: "🧠",
  },
  {
    icon: BookOpen,
    title: "Méthodique",
    description: "Propose des méthodes de travail et des stratégies d'apprentissage efficaces.",
    emoji: "📚",
  },
  {
    icon: Shield,
    title: "Sécurisé",
    description: "Vos données sont protégées. Aucune clé API côté client, conformité totale.",
    emoji: "🔒",
  },
];

const steps = [
  {
    number: "1",
    title: "Posez votre question",
    description: "Dans le chat ou en analysant une photo, posez votre question académique de manière naturelle.",
  },
  {
    number: "2",
    title: "PRAGO analyse",
    description: "Notre IA analyse votre demande et prépare une réponse pédagogique structurée adaptée à votre niveau.",
  },
  {
    number: "3",
    title: "Apprenez efficacement",
    description: "Recevez des explications claires, des méthodes et des vérifications pour progresser rapidement.",
  },
];

const benefits = [
  "Accès illimité aux fonctionnalités IA",
  "Progression personnalisée",
  "Disponible 24h/24",
  "Toutes les matières",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl prago-gradient-bg flex items-center justify-center shadow-prago">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight">PRAGO</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Fonctionnalités
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Comment ça marche
            </a>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </Link>
            <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="prago-btn-ghost text-sm py-2">
              Connexion
            </Link>
            <Link to="/dashboard" className="prago-btn-primary text-sm py-2 hidden sm:flex">
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 relative" style={{ background: "var(--prago-gradient-hero)" }}>
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo Icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="w-24 h-24 rounded-3xl prago-gradient-bg flex items-center justify-center mx-auto shadow-prago-lg prago-glow">
                <span className="text-white font-bold text-4xl">P</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            >
              <span className="prago-gradient-text">PRAGO</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl md:text-2xl text-foreground font-medium mb-4"
            >
              Votre mentor académique IA exigeant, pédagogique et structuré
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              PRAGO n'est pas un simple chat. C'est un assistant éducatif qui vous guide pas à pas, adapte son niveau à vos besoins et vous aide à développer votre raisonnement.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/chat"
                className="prago-btn-primary flex items-center gap-3 w-full sm:w-auto justify-center text-base px-8 py-4"
              >
                <MessageSquare className="w-5 h-5" />
                Commencer à discuter
              </Link>
              <Link
                to="/snap-solve"
                className="prago-btn-secondary flex items-center gap-3 w-full sm:w-auto justify-center text-base px-8 py-4"
              >
                <Camera className="w-5 h-5" />
                Snap & Solve
              </Link>
              <Link
                to="/exam-prep"
                className="prago-btn-ghost flex items-center gap-3 w-full sm:w-auto justify-center text-base px-8 py-4 border border-border"
              >
                <GraduationCap className="w-5 h-5" />
                Préparation Examens
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl md:text-4xl font-bold mb-4"
            >
              Pourquoi choisir <span className="prago-gradient-text">PRAGO</span> ?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-lg max-w-xl mx-auto"
            >
              Des fonctionnalités conçues pour votre réussite académique
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="prago-card prago-card-hover p-6 text-center"
              >
                <div className="text-4xl mb-4">{feature.emoji}</div>
                <h3 className="font-display font-semibold text-lg mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl md:text-4xl font-bold mb-4"
            >
              Comment ça fonctionne ?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-lg"
            >
              En 3 étapes simples
            </motion.p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="prago-card p-6 flex items-start gap-5"
              >
                <div className="w-12 h-12 rounded-2xl prago-gradient-bg flex items-center justify-center flex-shrink-0 shadow-prago">
                  <span className="text-white font-bold text-xl">{step.number}</span>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 prago-gradient-bg opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Prêt à commencer votre apprentissage ?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Rejoignez PRAGO et bénéficiez d'un mentor académique IA à votre service 24/7
            </p>
            <Link
              to="/chat"
              className="prago-btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
            >
              Essayer maintenant
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl prago-gradient-bg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="font-display font-semibold">PRAGO</span>
            </div>
            <div className="flex items-center gap-8">
              <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Tarifs
              </Link>
              <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ & Sécurité
              </Link>
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 PRAGO. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
