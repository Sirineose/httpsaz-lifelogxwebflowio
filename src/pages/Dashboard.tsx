import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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
  const { t } = useTranslation();
  const { user } = useAuth();

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || '';

  const stats = [
    { labelKey: "studyTime", value: "24.5h", icon: Clock, trend: "+12%" },
    { labelKey: "quizzesCompleted", value: "47", icon: Target, trend: "+8%" },
    { labelKey: "streak", value: "12", icon: Flame, trend: "" },
    { labelKey: "notesCreated", value: "23", icon: FileText, trend: "+5%" },
  ];

  const recentActivities = [
    { title: "Quiz Mathématiques", subject: "Algèbre linéaire", score: 85, timeKey: "2h" },
    { title: "Flashcards Histoire", subject: "Révolution française", score: 92, timeKey: "5h" },
    { title: "Note synthèse", subject: "Biologie cellulaire", score: null, timeKey: "yesterday" },
  ];

  const quickActions = [
    { titleKey: "chatAI", descKey: "chatAIDesc", icon: Sparkles, href: "/chat", color: "primary" },
    { titleKey: "snapSolve", descKey: "snapSolveDesc", icon: Brain, href: "/snap-solve", color: "info" },
    { titleKey: "newQuiz", descKey: "newQuizDesc", icon: Target, href: "/quiz", color: "success" },
    { titleKey: "comics", descKey: "comicsDesc", icon: BookOpen, href: "/comics", color: "warning" },
  ];

  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Welcome */}
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">
            {user ? t('dashboard.welcome') : t('dashboard.welcomeGuest')} 👋
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.labelKey} className="prago-card p-4 md:p-5">
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
            <p className="text-sm text-muted-foreground">{t(`dashboard.${stat.labelKey}`)}</p>
          </div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="font-display text-lg font-semibold mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.titleKey}
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
                {t(`dashboard.actions.${action.titleKey}`)}
              </h3>
              <p className="text-sm text-muted-foreground">{t(`dashboard.actions.${action.descKey}`)}</p>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress */}
        <motion.div variants={itemVariants} className="lg:col-span-2 prago-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-semibold">{t('dashboard.weeklyProgress')}</h2>
            <button className="text-sm text-primary hover:underline">{t('dashboard.viewDetails')}</button>
          </div>

          {/* Weekly Chart Placeholder */}
          <div className="h-48 flex items-end justify-between gap-2 mb-4">
            {days.map((day, i) => {
              const heights = [60, 45, 80, 55, 90, 40, 70];
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end h-36">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heights[i]}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="w-full rounded-t-lg prago-gradient-bg"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{t(`dashboard.days.${day}`)}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-2xl font-bold">8.2h</p>
              <p className="text-sm text-muted-foreground">{t('dashboard.thisWeek')}</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="text-2xl font-bold">+23%</p>
              <p className="text-sm text-muted-foreground">{t('dashboard.vsLastWeek')}</p>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="prago-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-semibold">{t('dashboard.recentActivity')}</h2>
          </div>

          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  {activity.score !== null ? (
                    <Target className="w-5 h-5 text-primary" />
                  ) : (
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.timeKey === 'yesterday' 
                      ? t('time.yesterday') 
                      : `${t('time.ago')} ${activity.timeKey}`}
                  </p>
                </div>
                {activity.score !== null && (
                  <div className="prago-badge-success">{activity.score}%</div>
                )}
              </div>
            ))}
          </div>

          <Link
            to="/profile"
            className="flex items-center justify-center gap-2 text-sm text-primary mt-4 hover:underline"
          >
            {t('dashboard.viewHistory')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      {/* Continue Learning */}
      <motion.div variants={itemVariants} className="prago-card prago-gradient-border p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl prago-gradient-bg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-lg mb-1">
              {t('dashboard.continueLearning')} Mathématiques
            </h3>
            <p className="text-sm text-muted-foreground">
              Chapitre 4 : Intégrales et primitives — 65% complété
            </p>
            <div className="mt-3 prago-progress max-w-md">
              <div className="prago-progress-bar" style={{ width: "65%" }} />
            </div>
          </div>
          <Link to="/chat" className="prago-btn-primary flex items-center gap-2 mt-2 md:mt-0">
            {t('dashboard.continue')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
