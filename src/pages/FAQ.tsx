import { motion } from "framer-motion";
import { Sparkles, Search, MessageCircle, CreditCard, Shield, BookOpen, Zap } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const categories = [
  { id: "general", label: "Général", icon: BookOpen },
  { id: "features", label: "Fonctionnalités", icon: Zap },
  { id: "pricing", label: "Tarifs", icon: CreditCard },
  { id: "security", label: "Sécurité", icon: Shield },
];

const faqData: Record<string, Array<{ question: string; answer: string }>> = {
  general: [
    {
      question: "Qu'est-ce que PRAGO ?",
      answer: "PRAGO est une plateforme d'apprentissage assistée par intelligence artificielle. Elle t'aide à étudier plus efficacement grâce à des outils comme le chat IA pédagogique, les quiz intelligents, la résolution d'exercices par photo, et bien plus encore.",
    },
    {
      question: "À qui s'adresse PRAGO ?",
      answer: "PRAGO s'adresse à tous les étudiants, du collège à l'université. Que tu prépares le brevet, le bac, ou des concours, notre IA s'adapte à ton niveau et tes besoins.",
    },
    {
      question: "Comment commencer à utiliser PRAGO ?",
      answer: "Inscris-toi gratuitement, choisis tes matières, et commence à explorer ! Le plan gratuit te permet de découvrir toutes les fonctionnalités de base sans engagement.",
    },
    {
      question: "PRAGO est-il disponible sur mobile ?",
      answer: "Oui ! PRAGO est entièrement responsive et fonctionne parfaitement sur smartphone et tablette. Une application mobile dédiée est également en cours de développement.",
    },
  ],
  features: [
    {
      question: "Comment fonctionne le Chat IA ?",
      answer: "Notre Chat IA est spécialement entraîné pour l'éducation. Il peut t'expliquer des concepts, résoudre des exercices étape par étape, te poser des questions pour vérifier ta compréhension, et s'adapter à ton style d'apprentissage.",
    },
    {
      question: "Qu'est-ce que Snap & Solve ?",
      answer: "Snap & Solve te permet de prendre en photo un exercice ou un problème, et notre IA l'analyse pour te fournir une solution détaillée avec explications. Ça fonctionne pour les maths, la physique, la chimie et plus encore.",
    },
    {
      question: "Comment fonctionnent les Quiz & Flashcards ?",
      answer: "Nos quiz sont générés intelligemment selon tes cours et ta progression. Les flashcards utilisent la répétition espacée pour optimiser ta mémorisation. Plus tu révises, plus l'IA comprend tes points faibles.",
    },
    {
      question: "Que sont les Cours en BD ?",
      answer: "Les Cours en BD transforment tes leçons en bandes dessinées illustrées et engageantes. C'est une façon ludique de comprendre et mémoriser des concepts complexes, générée par notre IA.",
    },
    {
      question: "Comment fonctionne Exam Prep ?",
      answer: "Exam Prep crée un planning de révision personnalisé basé sur tes examens à venir, ton niveau actuel et le temps disponible. L'IA priorise les sujets où tu as le plus besoin de progresser.",
    },
  ],
  pricing: [
    {
      question: "Le plan gratuit est-il vraiment gratuit ?",
      answer: "Oui, 100% gratuit, sans carte bancaire requise. Tu as accès à 10 requêtes IA par jour, des quiz illimités, et jusqu'à 3 notes. Parfait pour découvrir PRAGO.",
    },
    {
      question: "Puis-je changer de plan à tout moment ?",
      answer: "Absolument ! Tu peux upgrader ou downgrader ton plan quand tu veux. Si tu upgrades, tu paies la différence au prorata. Si tu downgrades, le crédit restant est appliqué au mois suivant.",
    },
    {
      question: "Comment fonctionne l'essai gratuit Pro ?",
      answer: "L'essai Pro de 7 jours te donne accès à toutes les fonctionnalités Pro sans aucun engagement. Aucune carte bancaire n'est demandée. À la fin de l'essai, tu repasses automatiquement au plan gratuit.",
    },
    {
      question: "Y a-t-il des réductions pour les étudiants ?",
      answer: "Nos tarifs sont déjà conçus pour être accessibles aux étudiants. Nous offrons également des réductions spéciales pendant les périodes d'examens et des tarifs de groupe pour les écoles.",
    },
    {
      question: "Quels moyens de paiement acceptez-vous ?",
      answer: "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express), PayPal, et Apple Pay. Tous les paiements sont sécurisés et cryptés.",
    },
  ],
  security: [
    {
      question: "Mes données sont-elles sécurisées ?",
      answer: "Absolument. Nous utilisons un chiffrement de bout en bout et nos serveurs sont hébergés en Europe, conformément au RGPD. Tes données d'apprentissage ne sont jamais vendues à des tiers.",
    },
    {
      question: "Que faites-vous de mes données d'apprentissage ?",
      answer: "Tes données servent uniquement à personnaliser ton expérience et améliorer nos algorithmes. Tu peux exporter ou supprimer toutes tes données à tout moment depuis ton profil.",
    },
    {
      question: "Puis-je supprimer mon compte ?",
      answer: "Oui, tu peux supprimer ton compte et toutes tes données à tout moment depuis les paramètres de ton profil. La suppression est définitive et prend effet immédiatement.",
    },
    {
      question: "L'IA a-t-elle accès à mes informations personnelles ?",
      answer: "Notre IA n'a accès qu'aux informations nécessaires pour t'aider dans ton apprentissage (matières, niveau, historique de conversation). Elle n'accède jamais à tes informations personnelles sensibles.",
    },
  ],
};

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = searchQuery
    ? Object.values(faqData)
        .flat()
        .filter(
          (faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : faqData[activeCategory];

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
            <NavLink to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </NavLink>
            <NavLink to="/dashboard" className="prago-btn-secondary text-sm">
              Dashboard
            </NavLink>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="prago-badge-primary mb-4 inline-block">Centre d'aide</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Questions fréquentes
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trouve rapidement les réponses à tes questions sur PRAGO.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher une question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="prago-input pl-12 w-full"
            />
          </div>
        </motion.div>

        {/* Categories */}
        {!searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  activeCategory === category.id
                    ? "prago-gradient-bg text-white"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                <category.icon className="w-4 h-4" />
                {category.label}
              </button>
            ))}
          </motion.div>
        )}

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="prago-card p-6"
        >
          {searchQuery && (
            <p className="text-sm text-muted-foreground mb-4">
              {filteredFaqs.length} résultat(s) pour "{searchQuery}"
            </p>
          )}

          {filteredFaqs.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-2">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-border rounded-xl px-4 data-[state=open]:bg-secondary/30"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucun résultat trouvé.</p>
            </div>
          )}
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <div className="prago-card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl prago-gradient-bg flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-display text-xl font-bold mb-2">
              Tu n'as pas trouvé ta réponse ?
            </h2>
            <p className="text-muted-foreground mb-6">
              Notre équipe est là pour t'aider. Contacte-nous et nous te répondrons rapidement.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <NavLink to="/contact" className="prago-btn-primary">
                Contacter le support
              </NavLink>
              <NavLink to="/chat" className="prago-btn-secondary">
                Demander à l'IA
              </NavLink>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
