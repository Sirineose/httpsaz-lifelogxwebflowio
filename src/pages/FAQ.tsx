import { motion } from "framer-motion";
import { 
  Sparkles, Search, MessageCircle, CreditCard, Shield, BookOpen, Zap, 
  Lock, Eye, Database, Server, Key, FileCheck, Users, Globe, 
  CheckCircle2, AlertTriangle, Info, ChevronRight, ExternalLink,
  Fingerprint, ShieldCheck, CloudOff, Download, Trash2, Bell
} from "lucide-react";
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

const faqCategories = [
  { id: "general", label: "Général", icon: BookOpen },
  { id: "features", label: "Fonctionnalités", icon: Zap },
  { id: "pricing", label: "Tarifs", icon: CreditCard },
  { id: "account", label: "Compte", icon: Users },
];

const faqData: Record<string, Array<{ question: string; answer: string }>> = {
  general: [
    {
      question: "Qu'est-ce que PRAGO ?",
      answer: "PRAGO est une plateforme d'apprentissage assistée par intelligence artificielle. Elle t'aide à étudier plus efficacement grâce à des outils comme le chat IA pédagogique, les quiz intelligents, la résolution d'exercices par photo (Snap & Solve), les cours en BD, et la planification d'examens avec IA.",
    },
    {
      question: "À qui s'adresse PRAGO ?",
      answer: "PRAGO s'adresse à tous les étudiants, du collège à l'université. Que tu prépares le brevet, le bac, ou des concours, notre IA s'adapte à ton niveau et tes besoins spécifiques.",
    },
    {
      question: "Comment commencer à utiliser PRAGO ?",
      answer: "Tu peux commencer immédiatement en mode invité pour tester les fonctionnalités, ou t'inscrire gratuitement pour sauvegarder ta progression. Le plan gratuit te permet de découvrir toutes les fonctionnalités de base sans engagement ni carte bancaire.",
    },
    {
      question: "PRAGO est-il disponible sur mobile ?",
      answer: "Oui ! PRAGO est entièrement responsive et fonctionne parfaitement sur smartphone et tablette. Tu peux même utiliser l'appareil photo de ton téléphone pour Snap & Solve.",
    },
    {
      question: "Dans quelles langues PRAGO est-il disponible ?",
      answer: "PRAGO est actuellement disponible en français. L'IA peut cependant comprendre et répondre dans plusieurs langues si tu poses des questions dans une autre langue.",
    },
    {
      question: "PRAGO fonctionne-t-il hors ligne ?",
      answer: "Non, PRAGO nécessite une connexion internet car l'IA fonctionne dans le cloud. Cependant, tu peux exporter tes notes et flashcards pour les consulter hors ligne.",
    },
  ],
  features: [
    {
      question: "Comment fonctionne le Chat IA ?",
      answer: "Notre Chat IA utilise des modèles de langage avancés (Mistral) spécialement configurés pour l'éducation. Il peut t'expliquer des concepts, résoudre des exercices étape par étape, te poser des questions pour vérifier ta compréhension, et s'adapter à ton style d'apprentissage.",
    },
    {
      question: "Qu'est-ce que Snap & Solve ?",
      answer: "Snap & Solve te permet de photographier ou d'uploader un exercice (image ou PDF), et notre IA (Gemini) l'analyse pour te fournir une solution détaillée avec explications pédagogiques. Ça fonctionne pour les maths, la physique, la chimie, les langues et plus encore.",
    },
    {
      question: "Comment fonctionnent les Quiz & Flashcards ?",
      answer: "Tu peux créer des quiz et flashcards manuellement ou les générer automatiquement à partir de tes cours (image, PDF ou texte). L'IA crée des questions pertinentes et des flashcards optimisées pour la mémorisation.",
    },
    {
      question: "Que sont les Cours en BD ?",
      answer: "Les Cours en BD transforment tes leçons en bandes dessinées illustrées générées par IA. Chaque panel contient une illustration et une explication, rendant l'apprentissage plus engageant et mémorable.",
    },
    {
      question: "Comment fonctionne Exam Prep ?",
      answer: "Exam Prep te permet de planifier tes révisions. Ajoute tes examens avec leurs chapitres, et l'IA génère un planning de révision optimal basé sur le temps restant, ta disponibilité, et les sujets à couvrir.",
    },
    {
      question: "Les réponses de l'IA sont-elles fiables ?",
      answer: "Notre IA utilise des modèles de pointe et est optimisée pour l'éducation. Cependant, comme tout outil IA, elle peut parfois faire des erreurs. Nous te recommandons de toujours vérifier les informations importantes avec tes cours ou ton professeur.",
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
      answer: "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) via Stripe, notre processeur de paiement sécurisé. Tous les paiements sont chiffrés.",
    },
    {
      question: "Puis-je obtenir un remboursement ?",
      answer: "Oui, si tu n'es pas satisfait, contacte notre support dans les 14 jours suivant ton abonnement pour un remboursement complet, sans questions.",
    },
  ],
  account: [
    {
      question: "Comment modifier mes informations de profil ?",
      answer: "Va dans ton profil depuis le menu latéral. Tu peux y modifier ton nom, avatar, école, niveau, et autres informations personnelles.",
    },
    {
      question: "Comment réinitialiser mon mot de passe ?",
      answer: "Sur la page de connexion, clique sur 'Mot de passe oublié'. Tu recevras un email avec un lien pour réinitialiser ton mot de passe.",
    },
    {
      question: "Puis-je utiliser PRAGO sur plusieurs appareils ?",
      answer: "Oui ! Ton compte est synchronisé sur tous tes appareils. Connecte-toi simplement avec les mêmes identifiants.",
    },
    {
      question: "Comment exporter mes données ?",
      answer: "Tu peux exporter tes notes, flashcards et quiz depuis les paramètres de ton profil. Les données sont exportées en format JSON ou PDF selon le contenu.",
    },
    {
      question: "Comment supprimer mon compte ?",
      answer: "Dans les paramètres de ton profil, tu trouveras l'option 'Supprimer mon compte'. Cette action est irréversible et supprime toutes tes données.",
    },
  ],
};

const securityFeatures = [
  {
    icon: Lock,
    title: "Chiffrement de bout en bout",
    description: "Toutes les communications entre ton navigateur et nos serveurs sont chiffrées avec TLS 1.3, le standard le plus récent.",
    status: "active",
  },
  {
    icon: Server,
    title: "Hébergement en Europe",
    description: "Nos serveurs sont situés en Europe (Allemagne, France), garantissant la conformité avec les réglementations européennes.",
    status: "active",
  },
  {
    icon: Database,
    title: "Bases de données sécurisées",
    description: "Tes données sont stockées dans des bases de données PostgreSQL avec Row Level Security (RLS) pour une isolation complète.",
    status: "active",
  },
  {
    icon: Fingerprint,
    title: "Authentification sécurisée",
    description: "Mots de passe hachés avec bcrypt, tokens JWT sécurisés, et support de l'authentification à deux facteurs (2FA).",
    status: "active",
  },
  {
    icon: ShieldCheck,
    title: "Conformité RGPD",
    description: "PRAGO est entièrement conforme au Règlement Général sur la Protection des Données (RGPD) de l'Union Européenne.",
    status: "active",
  },
  {
    icon: Eye,
    title: "Transparence des données",
    description: "Tu as un accès complet à toutes les données que nous collectons, avec la possibilité de les exporter ou supprimer à tout moment.",
    status: "active",
  },
];

const dataUsageItems = [
  {
    icon: BookOpen,
    title: "Données d'apprentissage",
    what: "Notes, flashcards, quiz, historique de chat",
    purpose: "Personnaliser ton expérience et améliorer nos algorithmes pédagogiques",
    retention: "Conservées tant que ton compte est actif",
    canDelete: true,
  },
  {
    icon: Users,
    title: "Informations de profil",
    what: "Nom, email, école, niveau scolaire",
    purpose: "Identification et personnalisation du contenu",
    retention: "Conservées tant que ton compte est actif",
    canDelete: true,
  },
  {
    icon: Zap,
    title: "Données d'utilisation",
    what: "Pages visitées, fonctionnalités utilisées, temps passé",
    purpose: "Améliorer l'expérience utilisateur et corriger les bugs",
    retention: "Anonymisées après 90 jours",
    canDelete: false,
  },
  {
    icon: CreditCard,
    title: "Données de paiement",
    what: "Informations de facturation",
    purpose: "Traitement des paiements (via Stripe)",
    retention: "Gérées par Stripe, conformément à leurs politiques",
    canDelete: true,
  },
];

const securityCertifications = [
  { name: "RGPD", description: "Conforme au règlement européen" },
  { name: "TLS 1.3", description: "Chiffrement des communications" },
  { name: "SOC 2", description: "Via notre infrastructure Supabase" },
  { name: "ISO 27001", description: "Via notre infrastructure cloud" },
];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [mainTab, setMainTab] = useState("faq");

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

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="prago-badge-primary mb-4 inline-block">Centre d'aide</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            FAQ & Sécurité
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tout ce que tu dois savoir sur PRAGO, tes données et ta vie privée.
          </p>
        </motion.div>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] lg:mx-auto">
            <TabsTrigger value="faq" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Questions fréquentes
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Sécurité & Données
            </TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-8">
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
                {faqCategories.map((category) => (
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
            {/* Security Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="prago-card p-6 bg-gradient-to-br from-success/5 to-transparent border-success/20"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-7 h-7 text-success" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold mb-2">Ta sécurité est notre priorité</h2>
                  <p className="text-muted-foreground">
                    PRAGO utilise les meilleures pratiques de l'industrie pour protéger tes données. 
                    Notre infrastructure est construite sur Supabase, une plateforme open-source reconnue pour sa sécurité.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Certifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {securityCertifications.map((cert, index) => (
                <div key={index} className="prago-card p-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-bold text-sm">{cert.name}</p>
                  <p className="text-xs text-muted-foreground">{cert.description}</p>
                </div>
              ))}
            </motion.div>

            {/* Security Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-display font-semibold text-lg mb-4">Mesures de sécurité</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {securityFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="prago-card p-5 flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{feature.title}</h4>
                        <span className="w-2 h-2 rounded-full bg-success" />
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Data Usage */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="font-display font-semibold text-lg mb-4">Comment nous utilisons tes données</h3>
              <div className="prago-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Type de données</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Ce que nous collectons</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Pourquoi</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Conservation</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">Suppression</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {dataUsageItems.map((item, index) => (
                        <tr key={index} className="hover:bg-secondary/30">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <item.icon className="w-4 h-4 text-primary" />
                              <span className="font-medium text-sm">{item.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">{item.what}</td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">{item.purpose}</td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">{item.retention}</td>
                          <td className="px-4 py-4 text-center">
                            {item.canDelete ? (
                              <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                            ) : (
                              <Info className="w-5 h-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>

            {/* Your Rights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="font-display font-semibold text-lg mb-4">Tes droits</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="prago-card p-5">
                  <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center mb-3">
                    <Download className="w-5 h-5 text-info" />
                  </div>
                  <h4 className="font-medium mb-2">Droit d'accès</h4>
                  <p className="text-sm text-muted-foreground">
                    Tu peux demander une copie complète de toutes les données que nous avons sur toi.
                  </p>
                </div>
                <div className="prago-card p-5">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center mb-3">
                    <FileCheck className="w-5 h-5 text-warning" />
                  </div>
                  <h4 className="font-medium mb-2">Droit de rectification</h4>
                  <p className="text-sm text-muted-foreground">
                    Tu peux corriger ou mettre à jour tes informations personnelles à tout moment.
                  </p>
                </div>
                <div className="prago-card p-5">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center mb-3">
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </div>
                  <h4 className="font-medium mb-2">Droit à l'effacement</h4>
                  <p className="text-sm text-muted-foreground">
                    Tu peux supprimer ton compte et toutes tes données de façon permanente.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* AI & Privacy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="prago-card p-6"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl prago-gradient-bg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg mb-1">IA et vie privée</h3>
                  <p className="text-sm text-muted-foreground">
                    Comment nos modèles IA traitent tes données
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Pas d'entraînement sur tes données</p>
                    <p className="text-xs text-muted-foreground">
                      Tes conversations et documents ne sont PAS utilisés pour entraîner nos modèles IA.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Données traitées en temps réel</p>
                    <p className="text-xs text-muted-foreground">
                      Les données envoyées à l'IA sont traitées immédiatement et ne sont pas stockées par les fournisseurs d'IA.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Modèles de confiance</p>
                    <p className="text-xs text-muted-foreground">
                      Nous utilisons exclusivement des modèles de Google (Gemini) et Mistral, des entreprises européennes et américaines respectant les standards de confidentialité.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Security FAQ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="font-display font-semibold text-lg mb-4">Questions sur la sécurité</h3>
              <div className="prago-card p-6">
                <Accordion type="single" collapsible className="space-y-2">
                  <AccordionItem value="sec-1" className="border border-border rounded-xl px-4 data-[state=open]:bg-secondary/30">
                    <AccordionTrigger className="text-left font-medium hover:no-underline">
                      Que se passe-t-il si je perds l'accès à mon compte ?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      Tu peux réinitialiser ton mot de passe via l'email associé à ton compte. Si tu n'as plus accès à cet email, contacte notre support avec une preuve d'identité.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sec-2" className="border border-border rounded-xl px-4 data-[state=open]:bg-secondary/30">
                    <AccordionTrigger className="text-left font-medium hover:no-underline">
                      Mes photos d'exercices sont-elles conservées ?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      Non, les images envoyées à Snap & Solve sont traitées en temps réel puis supprimées immédiatement. Seul le texte extrait peut être sauvegardé dans ton historique si tu le choisis.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sec-3" className="border border-border rounded-xl px-4 data-[state=open]:bg-secondary/30">
                    <AccordionTrigger className="text-left font-medium hover:no-underline">
                      Partagez-vous mes données avec des tiers ?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      Non. Nous ne vendons jamais tes données. Les seuls tiers ayant accès à certaines données sont nos fournisseurs d'infrastructure (Supabase, Stripe) qui sont tous conformes au RGPD.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sec-4" className="border border-border rounded-xl px-4 data-[state=open]:bg-secondary/30">
                    <AccordionTrigger className="text-left font-medium hover:no-underline">
                      Comment signaler une faille de sécurité ?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      Si tu découvres une vulnérabilité, contacte immédiatement security@prago.app. Nous prenons très au sérieux les rapports de sécurité et répondons sous 24h.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sec-5" className="border border-border rounded-xl px-4 data-[state=open]:bg-secondary/30">
                    <AccordionTrigger className="text-left font-medium hover:no-underline">
                      Les mineurs peuvent-ils utiliser PRAGO ?
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      Oui, PRAGO est conçu pour les étudiants de tous âges. Pour les moins de 16 ans, le consentement parental est recommandé conformément au RGPD.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
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
              Notre équipe est là pour t'aider. Contacte-nous et nous te répondrons rapidement.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="mailto:support@prago.app" className="prago-btn-primary">
                Contacter le support
              </a>
              <NavLink to="/chat" className="prago-btn-secondary">
                Demander à l'IA
              </NavLink>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2026 PRAGO. Tous droits réservés.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Politique de confidentialité</a>
              <a href="#" className="hover:text-foreground transition-colors">Conditions d'utilisation</a>
              <a href="#" className="hover:text-foreground transition-colors">Mentions légales</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
