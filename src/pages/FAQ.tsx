import { motion } from "framer-motion";
import { Sparkles, Search, MessageCircle, CreditCard, Shield, BookOpen, Zap, Lock, Server, Eye, FileCheck, Users, Globe, Heart, Wallet, Database, Cloud, CheckCircle2, Star, TrendingUp, GraduationCap } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { LanguageSelector } from "@/components/LanguageSelector";

const categories = [
  { id: "general", label: "Général", icon: BookOpen },
  { id: "features", label: "Fonctionnalités", icon: Zap },
  { id: "pricing", label: "Accessibilité & Tarifs", icon: Wallet },
  { id: "security", label: "Sécurité", icon: Shield },
];

const faqData: Record<string, Array<{ question: string; answer: string }>> = {
  general: [
    {
      question: "Qu'est-ce que PRAGO et que signifie son nom ?",
      answer: "PRAGO signifie : PR pour Progression, A pour Accomplissement, et GO pour 'En avant'. C'est une plateforme d'apprentissage assistée par IA qui transforme ta façon d'étudier. Notre mission : rendre l'éducation de qualité accessible à tous, en t'aidant à progresser efficacement vers tes objectifs académiques.",
    },
    {
      question: "Quel problème PRAGO résout-il ?",
      answer: "Les étudiants perdent des heures à chercher des explications, manquent de méthode efficace et n'ont pas accès à un accompagnement personnalisé. PRAGO résout ces problèmes en offrant un tuteur IA disponible 24/7 qui s'adapte à ton niveau, génère des quiz sur mesure, résout tes exercices avec explications, et crée des synthèses visuelles — le tout sans frais de cours particuliers.",
    },
    {
      question: "À qui s'adresse PRAGO ?",
      answer: "PRAGO s'adresse à tous les étudiants, du collège à l'université. Que tu prépares le brevet, le bac, des concours ou tes examens universitaires, notre IA s'adapte à ton niveau et tes besoins spécifiques.",
    },
    {
      question: "Comment commencer à utiliser PRAGO ?",
      answer: "Inscris-toi gratuitement en quelques secondes, sans carte bancaire. Tu as immédiatement accès à toutes les fonctionnalités de base : chat IA, quiz illimités, et plus encore. Aucun engagement, tu peux essayer en toute liberté.",
    },
    {
      question: "PRAGO est-il disponible sur mobile ?",
      answer: "Oui ! PRAGO est entièrement responsive et fonctionne parfaitement sur smartphone et tablette. Révise dans le bus, entre deux cours, ou confortablement chez toi. Une application mobile dédiée est également en cours de développement.",
    },
    {
      question: "Quelles matières sont supportées ?",
      answer: "PRAGO supporte toutes les matières principales : Mathématiques, Physique-Chimie, SVT, Histoire-Géographie, Français, Langues étrangères, Philosophie, Sciences de l'ingénieur, et bien d'autres. Notre IA polyvalente s'adapte à chaque discipline.",
    },
    {
      question: "PRAGO peut-il remplacer un professeur ?",
      answer: "PRAGO est un complément puissant à l'enseignement, pas un remplacement. Il t'aide à comprendre tes cours, t'entraîner et réviser efficacement. Mais l'interaction avec tes professeurs reste essentielle pour ton parcours académique.",
    },
  ],
  features: [
    {
      question: "Comment fonctionne le Chat IA ?",
      answer: "Notre Chat IA est spécialement conçu pour l'éducation. Il ne te donne PAS les réponses directement — il te guide par des questions et indices pour que tu comprennes vraiment. Si tu veux la réponse directe, il suffit de le demander explicitement. Cette approche développe ta réflexion et ta compréhension profonde.",
    },
    {
      question: "L'IA me donne-t-elle les réponses aux exercices ?",
      answer: "Par défaut, NON. Notre IA est conçue pour t'aider à APPRENDRE, pas à copier. Elle te guide étape par étape, pose des questions de réflexion, et te donne des indices. Tu peux demander explicitement 'donne-moi la réponse' si tu es vraiment bloqué, mais nous t'encourageons à essayer d'abord par toi-même.",
    },
    {
      question: "Qu'est-ce que Snap & Solve ?",
      answer: "Snap & Solve te permet de prendre en photo un exercice ou un problème, et notre IA l'analyse pour te fournir une explication détaillée étape par étape. Elle ne te donne pas juste la réponse — elle t'explique le raisonnement pour que tu puisses résoudre des problèmes similaires seul.",
    },
    {
      question: "Comment fonctionnent les Quiz & Flashcards ?",
      answer: "Nos quiz sont générés intelligemment selon tes cours et ta progression. Les flashcards utilisent la répétition espacée scientifiquement prouvée pour optimiser ta mémorisation. Plus tu révises, plus l'IA comprend tes points faibles et s'adapte.",
    },
    {
      question: "Que sont les Cours en BD ?",
      answer: "Les Cours en BD transforment tes leçons en bandes dessinées illustrées et engageantes. C'est une façon ludique de comprendre et mémoriser des concepts complexes, générée par notre IA à partir de tes propres cours.",
    },
    {
      question: "Comment fonctionne Exam Prep ?",
      answer: "Exam Prep crée un planning de révision personnalisé basé sur tes examens à venir, ton niveau actuel et le temps disponible. L'IA génère automatiquement des sessions d'étude optimisées, suit ta progression, et ajuste le plan en temps réel.",
    },
    {
      question: "Pourquoi l'IA répond-elle si vite ?",
      answer: "PRAGO utilise les modèles IA les plus rapides et performants du marché (Google Gemini 3 Flash). Nous avons optimisé chaque aspect de notre infrastructure pour offrir des réponses quasi-instantanées, même pour des requêtes complexes.",
    },
  ],
  pricing: [
    {
      question: "Le plan gratuit est-il vraiment gratuit ?",
      answer: "Oui, 100% gratuit, SANS carte bancaire requise, SANS engagement. Tu as accès à 10 requêtes IA par jour, des quiz illimités, et jusqu'à 3 notes. C'est suffisant pour découvrir PRAGO et décider si tu veux aller plus loin.",
    },
    {
      question: "PRAGO est-il accessible financièrement pour les étudiants ?",
      answer: "Absolument ! Nous avons conçu PRAGO pour être accessible à TOUS les budgets. Le plan gratuit est déjà très complet. Nos plans payants démarrent à 99 DH/mois — soit moins qu'une heure de cours particuliers. Nous offrons aussi des réductions pendant les périodes d'examens.",
    },
    {
      question: "Y a-t-il des réductions pour les étudiants ?",
      answer: "Nos tarifs sont DÉJÀ les plus bas du marché pour la qualité offerte. En plus, nous offrons régulièrement des promotions pendant le bac, les partiels et la rentrée. Les écoles et universités peuvent aussi bénéficier de tarifs groupés très avantageux.",
    },
    {
      question: "Puis-je changer de plan à tout moment ?",
      answer: "Oui, aucun piège ! Tu peux upgrader ou downgrader ton plan quand tu veux. Si tu upgrades, tu paies la différence au prorata. Si tu downgrades, le crédit restant est appliqué au mois suivant. Résiliation possible en 1 clic.",
    },
    {
      question: "Comment fonctionne l'essai gratuit Pro ?",
      answer: "L'essai Pro de 7 jours te donne accès à TOUTES les fonctionnalités Pro sans aucun engagement. AUCUNE carte bancaire demandée. À la fin, tu repasses automatiquement au plan gratuit — aucune facturation surprise.",
    },
    {
      question: "Quels moyens de paiement acceptez-vous ?",
      answer: "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express), PayPal, Apple Pay, et le paiement mobile. Tous les paiements sont sécurisés et cryptés via Stripe, leader mondial du paiement en ligne.",
    },
    {
      question: "Y a-t-il une garantie satisfait ou remboursé ?",
      answer: "Nous offrons une garantie de remboursement de 14 jours sur tous les plans payants. Si PRAGO ne te convient pas, contacte-nous et nous te remboursons intégralement, sans question.",
    },
    {
      question: "Puis-je partager mon compte avec des amis ?",
      answer: "Chaque compte est personnel pour garantir une expérience optimale et une IA adaptée à TON profil. Mais tu peux parrainer tes amis pour obtenir des jours gratuits supplémentaires !",
    },
  ],
  security: [
    {
      question: "Mes données sont-elles sécurisées ?",
      answer: "Sécurité MAXIMALE garantie. Nous utilisons un chiffrement de bout en bout (TLS 1.3), identique aux banques. Nos serveurs sont hébergés en Europe, conformément au RGPD. Tes données d'apprentissage ne sont JAMAIS vendues à des tiers.",
    },
    {
      question: "Comment fonctionnent les APIs et le traitement des données ?",
      answer: "Quand tu utilises PRAGO, tes requêtes sont envoyées de façon sécurisée à nos serveurs via des APIs chiffrées. L'IA traite ta demande en temps réel sans stocker le contenu sur les serveurs externes. Seuls les résultats sont conservés dans ton compte personnel, hébergé sur nos serveurs européens sécurisés.",
    },
    {
      question: "Que faites-vous de mes données d'apprentissage ?",
      answer: "Tes données servent UNIQUEMENT à personnaliser TON expérience. Nous utilisons des données anonymisées et agrégées pour améliorer nos algorithmes, mais ton contenu personnel reste confidentiel. Tu peux exporter ou supprimer toutes tes données à tout moment.",
    },
    {
      question: "L'IA a-t-elle accès à mes informations personnelles ?",
      answer: "Notre IA n'a accès qu'aux informations nécessaires pour t'aider (matières, niveau, contenu des conversations). Elle n'accède JAMAIS à tes informations sensibles (email, paiement, localisation). Les requêtes sont anonymisées avant traitement.",
    },
    {
      question: "Comment sont protégées mes données de paiement ?",
      answer: "Les paiements sont gérés par Stripe, leader mondial certifié PCI-DSS niveau 1 (le plus haut niveau de sécurité). PRAGO n'a JAMAIS accès à tes informations bancaires complètes. Même nos employés ne peuvent pas voir tes données de carte.",
    },
    {
      question: "Puis-je supprimer mon compte et mes données ?",
      answer: "Oui, tu as le CONTRÔLE TOTAL. Tu peux supprimer ton compte et toutes tes données définitivement à tout moment depuis les paramètres. La suppression prend effet immédiatement et est irréversible — nous ne gardons rien.",
    },
    {
      question: "Êtes-vous conformes au RGPD ?",
      answer: "100% conformes. PRAGO respecte intégralement le Règlement Général sur la Protection des Données européen. Tu disposes de tous tes droits : accès, rectification, effacement, portabilité, opposition. Notre DPO (Délégué à la Protection des Données) veille au respect de ces obligations.",
    },
    {
      question: "Que se passe-t-il en cas de violation de données ?",
      answer: "En cas d'incident (hautement improbable vu nos mesures), nous nous engageons à te notifier dans les 72 heures conformément au RGPD, avec les mesures prises pour te protéger. Nous effectuons des audits de sécurité réguliers pour prévenir tout risque.",
    },
  ],
};

const trustBadges = [
  { icon: Lock, label: "Chiffrement bancaire" },
  { icon: Server, label: "Serveurs UE" },
  { icon: FileCheck, label: "RGPD" },
  { icon: Shield, label: "Données protégées" },
];

const securityFeatures = [
  {
    icon: Lock,
    title: "Chiffrement militaire TLS 1.3",
    description: "Toutes tes communications sont chiffrées avec les mêmes protocoles que les banques et gouvernements.",
  },
  {
    icon: Server,
    title: "Serveurs 100% Européens",
    description: "Données hébergées exclusivement en Europe, conformes aux normes RGPD les plus strictes au monde.",
  },
  {
    icon: Eye,
    title: "Zéro Revente de Données",
    description: "Tes données ne sont JAMAIS vendues, louées ou partagées. C'est une promesse, pas une option.",
  },
  {
    icon: FileCheck,
    title: "Conformité RGPD Totale",
    description: "Respect intégral de tes droits : accès, rectification, suppression, portabilité. Tu gardes le contrôle.",
  },
  {
    icon: Users,
    title: "Accès Ultra-Restreint",
    description: "Seuls 3 employés autorisés peuvent accéder aux données, avec audit complet de chaque accès.",
  },
  {
    icon: Cloud,
    title: "Sauvegardes Sécurisées",
    description: "Backups automatiques quotidiens chiffrés avec rétention de 30 jours. Tes données sont en sécurité.",
  },
];

const aiSecurityInfo = [
  {
    icon: Database,
    title: "APIs Sécurisées & Chiffrées",
    content: "Chaque requête transite via des APIs sécurisées en HTTPS. Les données sont chiffrées en transit et au repos. Aucune information personnelle n'est envoyée aux fournisseurs d'IA.",
  },
  {
    icon: Zap,
    title: "Traitement en Temps Réel",
    content: "Tes requêtes sont traitées instantanément et ne sont PAS stockées sur les serveurs des fournisseurs d'IA (Google, OpenAI). Seuls les résultats sont conservés dans ton compte.",
  },
  {
    icon: Eye,
    title: "Anonymisation Complète",
    content: "Avant d'être envoyées à l'IA, tes requêtes sont anonymisées et ne contiennent aucune information permettant de t'identifier personnellement.",
  },
];

const socialProof = [
  { number: "10,000+", label: "Étudiants actifs" },
  { number: "98%", label: "Satisfaits" },
  { number: "4.9/5", label: "Note moyenne" },
  { number: "0", label: "Incidents sécurité" },
];

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
            <LanguageSelector variant="icon" />
            <NavLink to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </NavLink>
            <NavLink to="/dashboard" className="prago-btn-secondary text-sm">
              Dashboard
            </NavLink>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero with Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="prago-badge-primary mb-4 inline-block">Centre d'aide & Confiance</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            FAQ & Sécurité
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Toutes les réponses à tes questions. Découvre comment PRAGO protège tes données et rend l'éducation accessible à tous.
          </p>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {trustBadges.map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium">
                <badge.icon className="w-4 h-4" />
                {badge.label}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {socialProof.map((item) => (
            <div key={item.label} className="prago-card p-4 text-center">
              <p className="text-2xl font-bold text-primary">{item.number}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </motion.div>

        <Tabs defaultValue="faq" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Sécurité
            </TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
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
                className="flex flex-wrap gap-2"
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
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-8">
            {/* Hero Security Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="prago-card prago-gradient-border p-8 text-center"
            >
              <div className="w-16 h-16 rounded-2xl prago-gradient-bg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">Ta sécurité, notre priorité absolue</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Nous appliquons les standards de sécurité les plus stricts de l'industrie. Tes données sont chiffrées, protégées et ne sont JAMAIS vendues.
              </p>
            </motion.div>

            {/* Security Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="font-display text-2xl font-bold mb-6 text-center">
                Infrastructure de Niveau Bancaire
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {securityFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="prago-card p-6"
                  >
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-success" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* AI & API Security */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="prago-card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl prago-gradient-bg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Sécurité de l'IA & APIs</h2>
                  <p className="text-sm text-muted-foreground">Comment tes données transitent en toute sécurité</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {aiSecurityInfo.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* RGPD Compliance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="prago-card p-6 border-2 border-success/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
                <h2 className="font-display text-xl font-bold">100% Conforme RGPD</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    Droit d'accès à toutes tes données
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    Droit de rectification immédiate
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    Droit à l'effacement (oubli) en 1 clic
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    Droit à la portabilité des données
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    Droit d'opposition au traitement
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    Notification sous 72h en cas d'incident
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Guarantee Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="prago-card p-6 prago-gradient-bg text-white text-center"
            >
              <Heart className="w-10 h-10 mx-auto mb-3" />
              <h3 className="font-display text-xl font-bold mb-2">Notre Engagement</h3>
              <p className="text-white/90 max-w-lg mx-auto">
                Nous nous engageons à ne JAMAIS vendre, louer ou partager tes données. Ta confiance est notre bien le plus précieux.
              </p>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
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
              Notre équipe répond généralement en moins de 24h. Tu peux aussi demander à notre IA pour une réponse instantanée.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="mailto:support@prago.ma" className="prago-btn-primary">
                Contacter le support
              </a>
              <NavLink to="/chat" className="prago-btn-secondary">
                Demander à l'IA
              </NavLink>
            </div>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <NavLink 
            to="/auth" 
            className="inline-flex items-center gap-2 prago-btn-primary text-lg px-8 py-4"
          >
            <GraduationCap className="w-5 h-5" />
            Commencer gratuitement
          </NavLink>
          <p className="text-sm text-muted-foreground mt-3">
            Sans carte bancaire • Sans engagement • Résultats immédiats
          </p>
        </motion.div>
      </main>
    </div>
  );
}
