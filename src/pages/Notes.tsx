import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, FileText, Sparkles, MoreVertical, Clock, Folder, Tag, Trash2, Edit3, X, Loader2, Wand2, BookOpen, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotes, Note } from "@/hooks/useNotes";
import { useAIGeneration } from "@/hooks/useAIGeneration";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DocumentUpload } from "@/components/DocumentUpload";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const subjects = ["Tous", "Mathématiques", "Histoire", "Biologie", "Physique", "Français", "Général"];

export default function Notes() {
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes();
  const { isGenerating, progress, generateFromImage } = useAIGeneration();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Tous");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formSubject, setFormSubject] = useState("Général");
  const [formTags, setFormTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [aiSubject, setAISubject] = useState("Général");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === "Tous" || note.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormSubject("Général");
    setFormTags("");
  };

  const handleCreate = async () => {
    if (!formTitle.trim()) return;
    setIsSaving(true);
    const result = await createNote({
      title: formTitle,
      content: formContent,
      subject: formSubject,
      tags: formTags.split(",").map(t => t.trim()).filter(Boolean),
      is_synthesis: false,
    });
    setIsSaving(false);
    if (result) {
      setIsCreateOpen(false);
      resetForm();
    }
  };

  const handleAIGenerate = async () => {
    if (!selectedImage) {
      toast.error("Sélectionne une image de ton cours");
      return;
    }

    const result = await generateFromImage(selectedImage, "synthesis", aiSubject);

    if (!result || !result.title || !result.content) {
      toast.error("Erreur lors de la génération");
      return;
    }

    const newNote = await createNote({
      title: result.title,
      content: result.content,
      subject: aiSubject,
      tags: result.tags || [],
      is_synthesis: true,
    });

    if (newNote) {
      toast.success("Synthèse générée avec succès !");
      setIsAIOpen(false);
      setSelectedImage(null);
      setSelectedNote(newNote);
    }
  };

  const handleUpdate = async () => {
    if (!selectedNote || !formTitle.trim()) return;
    setIsSaving(true);
    const success = await updateNote(selectedNote.id, {
      title: formTitle,
      content: formContent,
      subject: formSubject,
      tags: formTags.split(",").map(t => t.trim()).filter(Boolean),
    });
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
      setSelectedNote({
        ...selectedNote,
        title: formTitle,
        content: formContent,
        subject: formSubject,
        tags: formTags.split(",").map(t => t.trim()).filter(Boolean),
      });
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteNote(id);
    if (success && selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

  const startEditing = () => {
    if (!selectedNote) return;
    setFormTitle(selectedNote.title);
    setFormContent(selectedNote.content);
    setFormSubject(selectedNote.subject);
    setFormTags(selectedNote.tags.join(", "));
    setIsEditing(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
    } catch {
      return dateString;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[calc(100vh-7rem)]"
    >
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl prago-gradient-bg flex items-center justify-center shadow-lg">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Notes & Synthèses</h1>
            <p className="text-muted-foreground">Organisation intelligente de tes cours</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Dialog open={isAIOpen} onOpenChange={setIsAIOpen}>
            <DialogTrigger asChild>
              <button className="prago-btn-primary flex items-center gap-2 shadow-lg">
                <Wand2 className="w-4 h-4" />
                Synthèse IA
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl prago-gradient-bg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  Générer une synthèse
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-4">
                <p className="text-sm text-muted-foreground">
                  Importe une image de ton cours et l'IA créera une synthèse structurée.
                </p>
                
                <DocumentUpload onFileSelected={(base64) => setSelectedImage(base64)} isLoading={isGenerating} />

                <div>
                  <label className="text-sm font-medium mb-2 block">Matière</label>
                  <select value={aiSubject} onChange={(e) => setAISubject(e.target.value)} className="prago-input w-full">
                    {subjects.filter(s => s !== "Tous").map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>

                {isGenerating && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm">{progress}</span>
                    </div>
                  </div>
                )}

                <button onClick={handleAIGenerate} disabled={!selectedImage || isGenerating} className="prago-btn-primary w-full flex items-center justify-center gap-2">
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  Générer la synthèse
                </button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <button className="prago-btn-secondary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Manuel
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Créer une note manuellement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Titre</label>
                  <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="prago-input w-full" placeholder="Titre de la note" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Matière</label>
                  <select value={formSubject} onChange={(e) => setFormSubject(e.target.value)} className="prago-input w-full">
                    {subjects.filter(s => s !== "Tous").map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Contenu</label>
                  <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} className="prago-input w-full min-h-[120px] resize-y" placeholder="Contenu de la note..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags (séparés par des virgules)</label>
                  <input type="text" value={formTags} onChange={(e) => setFormTags(e.target.value)} className="prago-input w-full" placeholder="Calcul, Analyse, ..." />
                </div>
                <button onClick={handleCreate} disabled={!formTitle.trim() || isSaving} className="prago-btn-primary w-full flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer la note
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100%-6rem)]">
        {/* Sidebar */}
        <div className="lg:w-80 flex-shrink-0 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="prago-input w-full pl-11" />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-2">
              {subjects.slice(0, 4).map((subject) => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    selectedSubject === subject ? "prago-gradient-bg text-white" : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-22rem)] pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">Aucune note trouvée</p>
                <button onClick={() => setIsAIOpen(true)} className="text-primary text-sm hover:underline">
                  Générer avec l'IA
                </button>
              </div>
            ) : (
              filteredNotes.map((note, index) => (
                <motion.button
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => { setSelectedNote(note); setIsEditing(false); }}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl transition-all border",
                    selectedNote?.id === note.id 
                      ? "bg-card border-primary/30 shadow-lg" 
                      : "border-transparent hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-sm line-clamp-1">{note.title}</h3>
                    {note.is_synthesis && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium flex-shrink-0">
                        <Sparkles className="w-3 h-3" />
                        IA
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{note.content || "Aucun contenu"}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Folder className="w-3 h-3" />
                      {note.subject}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(note.updated_at)}
                    </span>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* Note Editor */}
        <div className="flex-1 bg-card border border-border rounded-3xl overflow-hidden flex flex-col shadow-xl">
          {selectedNote ? (
            isEditing ? (
              <div className="flex-1 flex flex-col p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-lg font-bold">Modifier la note</h2>
                  <button onClick={() => setIsEditing(false)} className="p-2 rounded-xl hover:bg-secondary">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Titre</label>
                    <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="prago-input w-full" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Matière</label>
                    <select value={formSubject} onChange={(e) => setFormSubject(e.target.value)} className="prago-input w-full">
                      {subjects.filter(s => s !== "Tous").map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Contenu</label>
                    <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} className="prago-input w-full min-h-[250px] resize-y" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tags</label>
                    <input type="text" value={formTags} onChange={(e) => setFormTags(e.target.value)} className="prago-input w-full" />
                  </div>
                </div>
                <button onClick={handleUpdate} disabled={!formTitle.trim() || isSaving} className="prago-btn-primary w-full mt-4 flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            ) : (
              <>
                {/* Note Header */}
                <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 rounded-lg bg-secondary text-xs font-medium">{selectedNote.subject}</span>
                        {selectedNote.is_synthesis && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                            <Sparkles className="w-3 h-3" />
                            Synthèse IA
                          </span>
                        )}
                      </div>
                      <h2 className="font-display text-xl font-bold">{selectedNote.title}</h2>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-xl hover:bg-secondary transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={startEditing}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(selectedNote.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Note Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedNote.content || "Aucun contenu"}</p>
                </div>

                {/* Tags Footer */}
                {selectedNote.tags.length > 0 && (
                  <div className="p-4 border-t border-border bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      {selectedNote.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 rounded-lg bg-background text-xs font-medium">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">Sélectionne une note</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Clique sur une note dans la liste pour la visualiser et la modifier.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
