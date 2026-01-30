import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Clock,
  Target,
  Flame,
  BookOpen,
  Brain,
  FileText,
  ArrowRight,
  Sparkles,
  Loader2,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/hooks/useAuth";
import { QuickUploadModal } from "@/components/dashboard/QuickUploadModal";

const quickActions = [
  { title: "Chat IA", description: "Pose une question", icon: Sparkles, href: "/chat", color: "primary" },
  { title: "Snap & Solve", description: "Résous un exercice", icon: Brain, href: "/snap-solve", color: "info" },
  { title: "Nouveau Quiz", description: "Teste tes connaissances", icon: Target, href: "/quiz", color: "success" },
  { title: "Cours en BD", description: "Apprends visuellement", icon: BookOpen, href: "/comics", color: "warning" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  const displayName = stats?.firstName || user?.email?.split("@")[0] || "Étudiant";

  const statsData = [
    { 
      label: "Heures étudiées", 
      value: `${stats?.hoursStudied || 0}h`, 
      icon: Clock, 
      trend: stats?.hoursStudiedTrend ? `${stats.hoursStudiedTrend > 0 ? "+" : ""}${stats.hoursStudiedTrend}%` : "" 
    },
    { 
      label: "Quiz complétés", 
      value: stats?.quizCompleted?.toString() || "0", 
      icon: Target, 
      trend: stats?.quizCompletedTrend ? `${stats.quizCompletedTrend > 0 ? "+" : ""}${stats.quizCompletedTrend}%` : "" 
    },
    { 
      label: "Série en cours", 
      value: `${stats?.streakDays || 0} jour${(stats?.streakDays || 0) > 1 ? "s" : ""}`, 
      icon: Flame, 
      trend: "" 
    },
    { 
      label: "Notes créées", 
      value: stats?.notesCreated?.toString() || "0", 
      icon: FileText, 
      trend: stats?.notesCreatedTrend ? `${stats.notesCreatedTrend > 0 ? "+" : ""}${stats.notesCreatedTrend}%` : "" 
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <QuickUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Upload Modal */}
      <QuickUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />

      {/* Welcome */}
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">
            Bonjour, {displayName} 👋
          </h1>
          <p className="text-muted-foreground">
            {stats?.streakDays && stats.streakDays > 0
              ? `Continue ta série de ${stats.streakDays} jour${stats.streakDays > 1 ? "s" : ""} !`
              : "Commence une nouvelle session d'étude aujourd'hui."}
          </p>
        </div>
        {/* Quick upload button */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="w-12 h-12 rounded-2xl prago-gradient-bg flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </motion.div>
      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <div key={stat.label} className="prago-card p-4 md:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              {stat.trend && (
                <span className="flex items-center gap-1 text-xs text-success font-medium">
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="font-display text-lg font-semibold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="prago-card prago-card-interactive p-4 group"
            >
              <div
                className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${
                  action.color === "primary"
                    ? "bg-primary/10"
                    : action.color === "info"
                    ? "bg-info/10"
                    : action.color === "success"
                    ? "bg-success/10"
                    : "bg-warning/10"
                }`}
              >
                <action.icon
                  className={`w-5 h-5 ${
                    action.color === "primary"
                      ? "text-primary"
                      : action.color === "info"
                      ? "text-info"
                      : action.color === "success"
                      ? "text-success"
                      : "text-warning"
                  }`}
                />
              </div>
              <h3 className="font-medium mb-0.5 group-hover:text-primary transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress */}
        <motion.div variants={itemVariants} className="lg:col-span-2 prago-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-semibold">Progression hebdomadaire</h2>
            <Link to="/exam-prep" className="text-sm text-primary hover:underline">Voir détails</Link>
          </div>

          {/* Weekly Chart */}
          <div className="h-48 flex items-end justify-between gap-2 mb-4">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day, i) => {
              const height = stats?.weeklyProgress?.[i] || 0;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end h-36">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className={`w-full rounded-t-lg ${height > 0 ? "prago-gradient-bg" : "bg-muted"}`}
                      style={{ minHeight: height > 0 ? "8px" : "4px" }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{day}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-2xl font-bold">{stats?.weeklyTotal || 0}h</p>
              <p className="text-sm text-muted-foreground">Cette semaine</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="text-2xl font-bold">
                {stats?.weeklyTrend !== undefined && stats.weeklyTrend !== 0 
                  ? `${stats.weeklyTrend > 0 ? "+" : ""}${stats.weeklyTrend}%`
                  : "—"}
              </p>
              <p className="text-sm text-muted-foreground">vs semaine dernière</p>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="prago-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-semibold">Activités récentes</h2>
          </div>

          <div className="space-y-4">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    {activity.type === "session" ? (
                      <Clock className="w-5 h-5 text-primary" />
                    ) : activity.type === "quiz" ? (
                      <Target className="w-5 h-5 text-success" />
                    ) : (
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                  {activity.score !== null && (
                    <div className="prago-badge-success">{activity.score}%</div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune activité récente</p>
                <p className="text-xs">Commence à étudier pour voir ton historique</p>
              </div>
            )}
          </div>

          {stats?.recentActivities && stats.recentActivities.length > 0 && (
            <Link
              to="/profile"
              className="flex items-center justify-center gap-2 text-sm text-primary mt-4 hover:underline"
            >
              Voir tout l'historique
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </motion.div>
      </div>

      {/* Continue Learning CTA */}
      <motion.div variants={itemVariants} className="prago-card prago-gradient-border p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl prago-gradient-bg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-lg mb-1">
              {stats?.streakDays && stats.streakDays > 0
                ? "Continue ta progression"
                : "Commence une nouvelle session"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {stats?.hoursStudied && stats.hoursStudied > 0
                ? `Tu as déjà étudié ${stats.hoursStudied}h cette semaine. Continue !`
                : "Planifie ta prochaine session d'étude avec l'IA."}
            </p>
          </div>
          <Link to="/chat" className="prago-btn-primary flex items-center gap-2 mt-2 md:mt-0">
            {stats?.streakDays && stats.streakDays > 0 ? "Continuer" : "Commencer"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
