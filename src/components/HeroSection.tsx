import { motion } from "framer-motion";
import { Sparkles, Zap, Cpu } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>
      
      <div className="container relative z-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Créateur de Sites IA Premium
            </span>
          </motion.div>
          
          {/* Main heading */}
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-foreground">Designs IA</span>
            <br />
            <span className="gradient-text">Qui Impressionnent</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Découvrez les différents styles de sites web IA que je peux créer — 
            des interfaces chatbot aux dashboards analytiques, en passant par les landing pages futuristes.
          </p>
          
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-8 md:gap-16"
          >
            {[
              { icon: Zap, label: "Styles Uniques", value: "10+" },
              { icon: Cpu, label: "Composants IA", value: "50+" },
              { icon: Sparkles, label: "Animations", value: "∞" },
            ].map((stat, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="glass-card p-3 rounded-xl">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
