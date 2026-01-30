import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { User, Mail, BookOpen, Trophy, Settings, Bell, Shield, LogOut, ChevronRight, Edit3, Camera, Loader2, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useStripe } from "@/hooks/useStripe";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

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
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile, uploadAvatar } = useProfile();
  const { plan, subscription, openCustomerPortal, loading: stripeLoading } = useStripe();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    school: '',
    grade: '',
    bio: '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleEditOpen = () => {
    setEditForm({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      school: profile?.school || '',
      grade: profile?.grade || '',
      bio: profile?.bio || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProfile(editForm);
    setSaving(false);
    setIsEditing(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2MB");
      return;
    }

    setUploading(true);
    await uploadAvatar(file);
    setUploading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      toast.error("Erreur lors de l'ouverture du portail");
    }
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email?.split('@')[0] || 'Utilisateur';
  };

  const getPlanBadge = () => {
    switch (plan) {
      case 'ultimate':
        return <span className="prago-badge-warning">Ultime</span>;
      case 'pro':
        return <span className="prago-badge-primary">Pro</span>;
      case 'essential':
        return <span className="prago-badge bg-info/10 text-info">Essentiel</span>;
      default:
        return <span className="prago-badge-secondary">Gratuit</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Avatar"
                className="w-24 h-24 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl prago-gradient-bg flex items-center justify-center text-3xl font-bold text-white">
                {getInitials()}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="font-display text-2xl font-bold mb-1">{getDisplayName()}</h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground mb-4">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user?.email}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              {getPlanBadge()}
              {plan === 'free' ? (
                <button 
                  onClick={() => navigate('/pricing')}
                  className="text-sm text-primary hover:underline"
                >
                  Passer à Premium
                </button>
              ) : (
                <button 
                  onClick={handleManageSubscription}
                  disabled={stripeLoading}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <CreditCard className="w-3 h-3" />
                  Gérer l'abonnement
                </button>
              )}
            </div>
          </div>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <button onClick={handleEditOpen} className="prago-btn-secondary flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Modifier le profil
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier le profil</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prénom</Label>
                    <Input
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      placeholder="Jean"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      placeholder="Dupont"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>École</Label>
                  <Input
                    value={editForm.school}
                    onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                    placeholder="Lycée Victor Hugo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Niveau</Label>
                  <Input
                    value={editForm.grade}
                    onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                    placeholder="Terminale S"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Input
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Passionné par les sciences..."
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Enregistrer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="prago-card p-4 text-center">
          <p className="text-2xl font-bold prago-gradient-text mb-1">124h</p>
          <p className="text-xs text-muted-foreground">Heures d'étude</p>
        </div>
        <div className="prago-card p-4 text-center">
          <p className="text-2xl font-bold prago-gradient-text mb-1">89</p>
          <p className="text-xs text-muted-foreground">Quiz complétés</p>
        </div>
        <div className="prago-card p-4 text-center">
          <p className="text-2xl font-bold prago-gradient-text mb-1">45</p>
          <p className="text-xs text-muted-foreground">Notes créées</p>
        </div>
        <div className="prago-card p-4 text-center">
          <p className="text-2xl font-bold prago-gradient-text mb-1">12 jours</p>
          <p className="text-xs text-muted-foreground">Série actuelle</p>
        </div>
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
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* School & Grade */}
      {(profile?.school || profile?.grade) && (
        <div className="prago-card p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Informations scolaires
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {profile?.school && (
              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-xs text-muted-foreground">École</p>
                <p className="text-sm font-medium mt-1">{profile.school}</p>
              </div>
            )}
            {profile?.grade && (
              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-xs text-muted-foreground">Niveau</p>
                <p className="text-sm font-medium mt-1">{profile.grade}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
