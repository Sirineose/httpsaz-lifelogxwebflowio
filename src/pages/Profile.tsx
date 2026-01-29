import { motion } from "framer-motion";
import { User, Mail, BookOpen, Trophy, Settings, Bell, Shield, LogOut, ChevronRight, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Heures d'étude", value: "124h" },
  { label: "Quiz complétés", value: "89" },
  { label: "Notes créées", value: "45" },
  { label: "Série actuelle", value: "12 jours" },
];

const achievements = [
  { title: "Première semaine", description: "7 jours consécutifs", icon: "🔥", unlocked: true },
  { title: "Quiz Master", description: "50 quiz complétés", icon: "🏆", unlocked: true },
  { title: "Note parfaite", description: "100% à un quiz", icon: "⭐", unlocked: true },
  { title: "Polyglotte", description: "Étudie 5 matières", icon: "🌍", unlocked: false },
];

const menuItems = [
  { icon: Settings, label: "Paramètres du compte", href: "#" },
  { icon: Bell, label: "Notifications", href: "#", badge: "3" },
  { icon: Shield, label: "Confidentialité", href: "#" },
];

export default function Profile() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Profile Header */}
      <div className="prago-card p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl prago-gradient-bg flex items-center justify-center text-3xl font-bold text-white shadow-prago-lg prago-glow">
              JD
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-secondary transition-colors">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="font-display text-2xl font-bold mb-1">Jean Dupont</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground mb-4">
              <Mail className="w-4 h-4" />
              <span className="text-sm">jean.dupont@email.com</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="prago-badge-primary">Plan Gratuit</span>
              <button className="text-sm text-primary hover:underline">Passer à Premium</button>
            </div>
          </div>
          <button className="prago-btn-secondary flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Modifier le profil
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="prago-card p-4 text-center">
            <p className="text-2xl font-bold prago-gradient-text mb-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Achievements */}
        <div className="prago-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Succès
            </h2>
            <span className="text-sm text-muted-foreground">3/4</span>
          </div>
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.title}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl",
                  achievement.unlocked ? "bg-secondary/50" : "bg-secondary/20 opacity-50"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-xl">
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
                {achievement.unlocked && (
                  <span className="prago-badge-success text-xs">Débloqué</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div className="prago-card p-6">
          <h2 className="font-display font-semibold mb-4">Paramètres</h2>
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            ))}
            <hr className="border-border my-2" />
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 text-destructive transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="prago-card p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Matières étudiées
          </h2>
          <button className="text-sm text-primary hover:underline">Voir tout</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Mathématiques", "Histoire", "Biologie", "Physique"].map((subject) => (
            <div key={subject} className="p-4 rounded-xl bg-secondary/50 text-center">
              <p className="text-sm font-medium">{subject}</p>
              <p className="text-xs text-muted-foreground mt-1">12h étudiées</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
