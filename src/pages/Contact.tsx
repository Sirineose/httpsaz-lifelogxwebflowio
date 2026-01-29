import { motion } from "framer-motion";
import { Sparkles, Send, Mail, MessageSquare, Clock } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Le nom est requis" })
    .max(100, { message: "Le nom doit faire moins de 100 caractères" }),
  email: z
    .string()
    .trim()
    .email({ message: "Email invalide" })
    .max(255, { message: "L'email doit faire moins de 255 caractères" }),
  subject: z
    .string()
    .trim()
    .min(1, { message: "Le sujet est requis" })
    .max(200, { message: "Le sujet doit faire moins de 200 caractères" }),
  message: z
    .string()
    .trim()
    .min(10, { message: "Le message doit faire au moins 10 caractères" })
    .max(2000, { message: "Le message doit faire moins de 2000 caractères" }),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    description: "Notre équipe répond sous 24h",
    value: "support@prago.app",
  },
  {
    icon: MessageSquare,
    title: "Chat en direct",
    description: "Disponible du lundi au vendredi",
    value: "9h - 18h",
  },
  {
    icon: Clock,
    title: "Temps de réponse",
    description: "Nous nous engageons à répondre",
    value: "< 24 heures",
  },
];

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast({
      title: "Message envoyé !",
      description: "Nous vous répondrons dans les plus brefs délais.",
    });
    
    form.reset();
    setIsSubmitting(false);
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

      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="prago-badge-primary mb-4 inline-block">Contact</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Une question ? Parlons-en !
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Notre équipe est là pour t'aider. Envoie-nous un message et nous te répondrons rapidement.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-4"
          >
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="prago-card p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl prago-gradient-bg flex items-center justify-center shrink-0">
                    <info.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{info.title}</h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      {info.description}
                    </p>
                    <p className="text-sm font-medium text-primary">
                      {info.value}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* FAQ Link */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="prago-card p-5 bg-secondary/30"
            >
              <h3 className="font-semibold mb-2">Consulte notre FAQ</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Tu trouveras peut-être ta réponse dans notre centre d'aide.
              </p>
              <NavLink to="/faq" className="prago-btn-secondary text-sm w-full justify-center">
                Voir la FAQ
              </NavLink>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="prago-card p-6 md:p-8">
              <h2 className="font-display text-xl font-bold mb-6">
                Envoie-nous un message
              </h2>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom complet</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ton nom"
                              className="prago-input"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="ton@email.com"
                              className="prago-input"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sujet</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="De quoi souhaites-tu parler ?"
                            className="prago-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décris ta question ou ton problème en détail..."
                            className="prago-input min-h-[150px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="prago-btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Envoyer le message
                      </>
                    )}
                  </button>
                </form>
              </Form>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
