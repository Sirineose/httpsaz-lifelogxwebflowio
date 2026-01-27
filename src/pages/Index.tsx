import { motion } from "framer-motion";
import { HeroSection } from "@/components/HeroSection";
import { AIShowcaseCard } from "@/components/AIShowcaseCard";

import aiChatbot from "@/assets/ai-chatbot.jpg";
import aiSaas from "@/assets/ai-saas.jpg";
import aiAnalytics from "@/assets/ai-analytics.jpg";
import aiImageGen from "@/assets/ai-image-gen.jpg";
import aiResearch from "@/assets/ai-research.jpg";
import aiVoice from "@/assets/ai-voice.jpg";

const showcaseItems = [
  {
    title: "Interface Chatbot IA",
    description: "Design conversationnel avec visualisation neuronale, bulles de messages flottantes et effets glassmorphism.",
    category: "Chatbot",
    image: aiChatbot,
    gradient: "cyan" as const,
  },
  {
    title: "Landing Page SaaS IA",
    description: "Page d'accueil futuriste avec formes 3D géométriques et gradients cyan/violet captivants.",
    category: "Landing Page",
    image: aiSaas,
    gradient: "violet" as const,
  },
  {
    title: "Dashboard Analytics IA",
    description: "Tableau de bord avec visualisations de données holographiques, graphiques lumineux et métriques en temps réel.",
    category: "Dashboard",
    image: aiAnalytics,
    gradient: "cyan" as const,
  },
  {
    title: "Plateforme Génération d'Images",
    description: "Studio créatif IA avec galerie d'œuvres générées et interface artistique immersive.",
    category: "Créatif",
    image: aiImageGen,
    gradient: "pink" as const,
  },
  {
    title: "Documentation Recherche IA",
    description: "Site de documentation académique moderne avec patterns de réseaux neuronaux et extraits de code.",
    category: "Documentation",
    image: aiResearch,
    gradient: "cyan" as const,
  },
  {
    title: "Assistant Vocal IA",
    description: "Interface audio avec visualisation d'ondes sonores, design minimaliste et effets d'éclairage ambient.",
    category: "Voice UI",
    image: aiVoice,
    gradient: "cyan" as const,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-background font-bold text-sm">AI</span>
            </div>
            <span className="font-display font-semibold text-lg">Lovable AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#showcase" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Showcase
            </a>
            <a href="#styles" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Styles
            </a>
            <button className="gradient-border px-4 py-2 text-sm font-medium hover:bg-primary/10 transition-colors">
              Commencer
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <div className="pt-20">
        <HeroSection />
      </div>

      {/* Showcase Grid */}
      <section id="showcase" className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Exemples de <span className="gradient-text">Designs IA</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Chaque projet est unique — voici un aperçu des différents styles que je peux créer pour votre produit IA.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showcaseItems.map((item, index) => (
              <AIShowcaseCard
                key={item.title}
                {...item}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-3xl p-12 md:p-16 text-center max-w-4xl mx-auto glow-effect"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Prêt à créer votre site IA ?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Décrivez-moi votre projet et je le construirai avec un design unique et moderne.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-background font-semibold hover:opacity-90 transition-opacity">
                Démarrer un projet
              </button>
              <button className="px-8 py-3 rounded-xl glass-card font-semibold hover:bg-muted/50 transition-colors">
                Voir plus d'exemples
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground text-sm">
            Créé avec Lovable — L'assistant IA qui transforme vos idées en réalité
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
