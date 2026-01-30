import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, FileText, Sparkles, MoreVertical, Clock, Folder, Tag, Trash2, Edit3, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotes, Note } from "@/hooks/useNotes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const subjects = ["Tous", "Mathématiques", "Histoire", "Biologie", "Physique", "Français", "Général"];

export default function Notes() {
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Tous");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formSubject, setFormSubject] = useState("Général");
  const [formTags, setFormTags] = useState("");
  const [formIsSynthesis, setFormIsSynthesis] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    setFormIsSynthesis(false);
  };

  const handleCreate = async () => {
    if (!formTitle.trim()) return;
    setIsSaving(true);
    const result = await createNote({
      title: formTitle,
      content: formContent,
      subject: formSubject,
      tags: formTags.split(",").map(t => t.trim()).filter(Boolean),
      is_synthesis: formIsSynthesis,
    });
    setIsSaving(false);
    if (result) {
      setIsCreateOpen(false);
      resetForm();
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
      is_synthesis: formIsSynthesis,
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
        is_synthesis: formIsSynthesis,
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
    setFormIsSynthesis(selectedNote.is_synthesis);
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">
            Notes & Synthèses
          </h1>
          <p className="text-muted-foreground text-sm">
            Organise tes cours et génère des synthèses IA
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <button className="prago-btn-primary flex items-center gap-2 w-fit">
              <Plus className="w-4 h-4" />
              Nouvelle note
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Titre</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="prago-input w-full"
                  placeholder="Titre de la note"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Matière</label>
                <select
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="prago-input w-full"
                >
                  {subjects.filter(s => s !== "Tous").map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Contenu</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="prago-input w-full min-h-[120px] resize-y"
                  placeholder="Contenu de la note..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="prago-input w-full"
                  placeholder="Calcul, Analyse, ..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_synthesis"
                  checked={formIsSynthesis}
                  onChange={(e) => setFormIsSynthesis(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="is_synthesis" className="text-sm">Synthèse IA</label>
              </div>
              <button
                onClick={handleCreate}
                disabled={!formTitle.trim() || isSaving}
                className="prago-btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Créer la note
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100%-5rem)]">
        {/* Sidebar */}
        <div className="lg:w-80 flex-shrink-0 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="prago-input w-full pl-10"
            />
          </div>

          {/* Subject Filter */}
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm transition-colors",
                  selectedSubject === subject
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                {subject}
              </button>
            ))}
          </div>

          {/* Notes List */}
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-20rem)]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune note trouvée</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => { setSelectedNote(note); setIsEditing(false); }}
                  className={cn(
                    "w-full text-left p-4 rounded-xl transition-all",
                    selectedNote?.id === note.id
                      ? "prago-card border-primary/30"
                      : "hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-sm line-clamp-1">{note.title}</h3>
                    {note.is_synthesis && (
                      <span className="prago-badge-primary text-[10px] flex-shrink-0">
                        <Sparkles className="w-3 h-3 mr-1" />
                        IA
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {note.content || "Aucun contenu"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Folder className="w-3 h-3" />
                    {note.subject}
                    <span className="mx-1">•</span>
                    <Clock className="w-3 h-3" />
                    {formatDate(note.updated_at)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Note Editor */}
        <div className="flex-1 prago-card p-6 overflow-hidden flex flex-col">
          {selectedNote ? (
            isEditing ? (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold">Modifier la note</h2>
                  <button onClick={() => setIsEditing(false)} className="p-2 rounded-lg hover:bg-secondary">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Titre</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="prago-input w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Matière</label>
                    <select
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      className="prago-input w-full"
                    >
                      {subjects.filter(s => s !== "Tous").map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block">Contenu</label>
                    <textarea
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      className="prago-input w-full min-h-[200px] resize-y"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Tags</label>
                    <input
                      type="text"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      className="prago-input w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit_is_synthesis"
                      checked={formIsSynthesis}
                      onChange={(e) => setFormIsSynthesis(e.target.checked)}
                      className="rounded border-border"
                    />
                    <label htmlFor="edit_is_synthesis" className="text-sm">Synthèse IA</label>
                  </div>
                </div>
                <button
                  onClick={handleUpdate}
                  disabled={!formTitle.trim() || isSaving}
                  className="prago-btn-primary w-full mt-4 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-secondary text-xs">{selectedNote.subject}</span>
                      {selectedNote.is_synthesis && (
                        <span className="prago-badge-primary text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Synthèse IA
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-xl font-semibold">{selectedNote.title}</h2>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={startEditing}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(selectedNote.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedNote.content || "Aucun contenu"}
                  </p>
                </div>

                {selectedNote.tags.length > 0 && (
                  <div className="flex items-center gap-2 pt-4 border-t border-border mt-4">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    {selectedNote.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded-md bg-secondary text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">Sélectionne une note</h3>
                <p className="text-sm text-muted-foreground">
                  Choisis une note dans la liste ou crées-en une nouvelle
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
