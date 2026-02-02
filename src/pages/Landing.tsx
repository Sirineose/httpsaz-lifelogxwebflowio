import { motion } from "framer-motion";
import { ArrowRight, Sparkles, BookOpen, Brain, Zap, CheckCircle2 } from "lucide-react";
import pragoRobotMascot from "@/assets/prago-robot-mascot.png";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Brain,
    title: "Chat IA Pédagogique",
    description: "Pose tes questions et obtiens des explications adaptées à ton niveau.",
  },
  {
    icon: Sparkles,
    title: "Snap & Solve",
    description: "Prends une photo d'un exercice et obtiens la solution détaillée.",
  },
  {
    icon: BookOpen,
    title: "Cours en BD",
    description: "Apprends des concepts complexes grâce à des bandes dessinées éducatives.",
  },
  {
    icon: Zap,
    title: "Quiz Adaptatifs",
    description: "Des quiz qui s'adaptent à ton niveau pour une progression optimale.",
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
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl prago-gradient-bg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">PRAGO</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Fonctionnalités
            </a>
            <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Démo
            </a>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </Link>
            <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="prago-btn-ghost text-sm py-2">
              Connexion
            </Link>
            <Link to="/auth" className="prago-btn-primary text-sm py-2 hidden sm:flex">
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 relative">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Propulsé par l'Intelligence Artificielle
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              Apprends plus vite,
              <br />
              <span className="prago-gradient-text">plus efficacement</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            >
              PRAGO est ta plateforme d'apprentissage personnalisée. L'IA comprend tes besoins et t'accompagne vers la réussite.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/auth"
                className="prago-btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                Démarrer gratuitement
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#demo"
                className="prago-btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <Sparkles className="w-4 h-4" />
                Voir l'assistant
              </a>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-4 mt-10"
            >
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  {benefit}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl md:text-4xl font-bold mb-4"
            >
              Tout ce dont tu as besoin pour réussir
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground max-w-xl mx-auto"
            >
              Des outils intelligents conçus pour optimiser ton apprentissage et te faire gagner du temps.
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
                className="prago-card prago-card-hover p-6"
              >
                <div className="w-12 h-12 rounded-xl prago-gradient-bg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet PRAGO */}
      <section id="demo" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-display text-3xl md:text-4xl font-bold mb-4"
              >
                Rencontre ton assistant IA
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground max-w-xl mx-auto"
              >
                PRAGO est là pour t'accompagner 24h/24, répondre à tes questions et t'aider à progresser à ton rythme.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative flex justify-center"
            >
              <motion.img 
                src={pragoRobotMascot} 
                alt="PRAGO - Ton assistant IA pédagogique" 
                className="w-full max-w-md rounded-3xl shadow-prago-lg"
                animate={{ 
                  y: [0, -12, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Prêt à transformer ton apprentissage ?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Rejoins des milliers d'étudiants qui utilisent déjà PRAGO pour réussir leurs études.
            </p>
            <Link
              to="/auth"
              className="prago-btn-primary inline-flex items-center gap-2"
            >
              Commencer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg prago-gradient-bg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-semibold">PRAGO</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground transition-colors">
                Tarifs
              </Link>
              <Link to="/faq" className="hover:text-foreground transition-colors">
                FAQ & Sécurité
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 PRAGO. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
