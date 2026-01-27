import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, User, Paperclip, Mic, MoreHorizontal, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Bonjour ! 👋 Je suis ton assistant IA pédagogique. Comment puis-je t'aider dans ton apprentissage aujourd'hui ?",
    timestamp: new Date(),
  },
];

const suggestions = [
  "Explique-moi les dérivées",
  "Quiz sur la révolution française",
  "Résume ce chapitre",
  "Aide-moi avec cet exercice",
];

export default function ChatIA() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `J'ai bien compris ta question sur "${input.slice(0, 50)}...". 

Voici une explication détaillée :

**Concept principal**
Le sujet que tu mentionnes est fondamental pour comprendre les bases. Commençons par les éléments essentiels.

**Points clés à retenir :**
1. Premier point important à mémoriser
2. Deuxième élément crucial
3. Troisième aspect à ne pas négliger

**Exemple pratique**
Prenons un cas concret pour illustrer...

As-tu des questions supplémentaires sur ce sujet ?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl prago-gradient-bg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-semibold">Chat IA Pédagogique</h1>
            <p className="text-xs text-muted-foreground">Toujours prêt à t'aider</p>
          </div>
        </div>
        <button className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn("flex gap-3", message.role === "user" && "justify-end")}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg prago-gradient-bg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] md:max-w-[70%]",
                  message.role === "user" ? "order-first" : ""
                )}
              >
                <div
                  className={cn(
                    message.role === "user"
                      ? "prago-chat-bubble-user"
                      : "prago-chat-bubble-ai"
                  )}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                </div>
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mt-2 ml-1">
                    <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-lg prago-gradient-bg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="prago-chat-bubble-ai">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-subtle" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-subtle" style={{ animationDelay: "0.2s" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-subtle" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="pb-4">
          <p className="text-sm text-muted-foreground mb-3">Suggestions :</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestion(suggestion)}
                className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="pt-4 border-t border-border">
        <div className="prago-card flex items-end gap-2 p-2">
          <button className="p-2.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pose ta question..."
            rows={1}
            className="flex-1 bg-transparent border-0 resize-none text-sm placeholder:text-muted-foreground focus:outline-none py-2.5 max-h-32"
            style={{ minHeight: "44px" }}
          />
          <button className="p-2.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <Mic className="w-5 h-5" />
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              "p-2.5 rounded-xl transition-all",
              input.trim()
                ? "prago-gradient-bg text-white hover:opacity-90"
                : "bg-secondary text-muted-foreground"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          PRAGO peut faire des erreurs. Vérifie les informations importantes.
        </p>
      </div>
    </div>
  );
}
