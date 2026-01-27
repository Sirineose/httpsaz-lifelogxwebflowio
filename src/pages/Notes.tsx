import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, FileText, Sparkles, MoreVertical, Clock, Folder, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  updatedAt: string;
  isSynthesis: boolean;
}

const notes: Note[] = [
  {
    id: "1",
    title: "Intégrales et primitives",
    content: "Les intégrales sont l'opération inverse de la dérivation. Une primitive F de f est une fonction telle que F'(x) = f(x)...",
    subject: "Mathématiques",
    tags: ["Calcul", "Analyse"],
    updatedAt: "Il y a 2h",
    isSynthesis: true,
  },
  {
    id: "2",
    title: "La Révolution française",
    content: "La Révolution française (1789-1799) est une période de bouleversements politiques et sociaux majeurs...",
    subject: "Histoire",
    tags: ["XVIIIe siècle", "France"],
    updatedAt: "Hier",
    isSynthesis: false,
  },
  {
    id: "3",
    title: "Photosynthèse",
    content: "La photosynthèse est le processus par lequel les plantes convertissent la lumière du soleil en énergie...",
    subject: "Biologie",
    tags: ["Plantes", "Énergie"],
    updatedAt: "Il y a 3 jours",
    isSynthesis: true,
  },
];

const subjects = ["Tous", "Mathématiques", "Histoire", "Biologie", "Physique", "Français"];

export default function Notes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Tous");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === "Tous" || note.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

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
        <button className="prago-btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" />
          Nouvelle note
        </button>
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
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={cn(
                  "w-full text-left p-4 rounded-xl transition-all",
                  selectedNote?.id === note.id
                    ? "prago-card border-primary/30"
                    : "hover:bg-secondary/50"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-sm line-clamp-1">{note.title}</h3>
                  {note.isSynthesis && (
                    <span className="prago-badge-primary text-[10px] flex-shrink-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      IA
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {note.content}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Folder className="w-3 h-3" />
                  {note.subject}
                  <span className="mx-1">•</span>
                  <Clock className="w-3 h-3" />
                  {note.updatedAt}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Note Editor */}
        <div className="flex-1 prago-card p-6 overflow-hidden flex flex-col">
          {selectedNote ? (
            <>
              <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-secondary text-xs">{selectedNote.subject}</span>
                    {selectedNote.isSynthesis && (
                      <span className="prago-badge-primary text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Synthèse IA
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-xl font-semibold">{selectedNote.title}</h2>
                </div>
                <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedNote.content}</p>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-border mt-4">
                <Tag className="w-4 h-4 text-muted-foreground" />
                {selectedNote.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-md bg-secondary text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </>
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
