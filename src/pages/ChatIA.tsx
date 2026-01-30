import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, User, Paperclip, Mic, Copy, ThumbsUp, ThumbsDown, Loader2, MessageSquare, Zap, BookOpen, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

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
  { icon: BookOpen, text: "Explique-moi les dérivées", color: "text-primary" },
  { icon: MessageSquare, text: "Quiz sur la révolution française", color: "text-info" },
  { icon: Zap, text: "Résume ce chapitre", color: "text-warning" },
  { icon: HelpCircle, text: "Aide-moi avec cet exercice", color: "text-success" },
];

export default function ChatIA() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

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
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    const isGuest = !user && localStorage.getItem('prago_guest_mode') === 'true';

    try {
      const apiMessages = messages
        .filter((m) => m.id !== "1")
        .map((m) => ({ role: m.role, content: m.content }));
      
      apiMessages.push({ role: "user", content: currentInput });

      let data;
      if (isGuest) {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, guestMode: true }),
        });
        if (!response.ok) throw new Error("API error");
        data = await response.json();
      } else {
        const result = await supabase.functions.invoke("chat-ai", {
          body: { messages: apiMessages },
        });
        if (result.error) throw result.error;
        data = result.data;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error calling chat-ai:", error);
      toast({
        title: "Erreur",
        description: "Impossible de contacter l'assistant IA. Réessayez.",
        variant: "destructive",
      });
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Désolé, une erreur s'est produite. Veuillez réessayer. 🙁",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
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

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copié !",
      description: "Le message a été copié dans le presse-papiers.",
    });
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col max-w-5xl mx-auto">
      {/* Premium Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pb-6 mb-2"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl prago-gradient-bg flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-background" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">Assistant IA</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              En ligne • Prêt à t'aider
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50">
          <Zap className="w-4 h-4 text-warning" />
          <span className="text-sm font-medium">{messages.length - 1} messages</span>
        </div>
      </motion.div>

      {/* Messages Area with Glass Effect */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 px-2">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className={cn("flex gap-3", message.role === "user" && "justify-end")}
            >
              {message.role === "assistant" && (
                <div className="w-10 h-10 rounded-xl prago-gradient-bg flex items-center justify-center flex-shrink-0 shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              )}
              <div className={cn("max-w-[85%] md:max-w-[75%]", message.role === "user" && "order-first")}>
                <div
                  className={cn(
                    "rounded-2xl px-5 py-3.5 shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                  )}
                </div>
                {message.role === "assistant" && message.id !== "1" && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-1 mt-2 ml-2"
                  >
                    <button 
                      onClick={() => copyToClipboard(message.content)}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-success/10 transition-colors text-muted-foreground hover:text-success">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-10 h-10 rounded-xl prago-gradient-bg flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-muted-foreground">En train de réfléchir...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Premium Suggestions Grid */}
      {messages.length <= 1 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pb-4"
        >
          <p className="text-sm font-medium text-muted-foreground mb-3">Suggestions pour commencer :</p>
          <div className="grid grid-cols-2 gap-3">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                onClick={() => handleSuggestion(suggestion.text)}
                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all text-left group"
              >
                <div className={cn("p-2 rounded-lg bg-secondary group-hover:scale-110 transition-transform", suggestion.color)}>
                  <suggestion.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{suggestion.text}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Premium Input Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-4 border-t border-border"
      >
        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          <div className="flex items-end gap-2 p-3">
            <button className="p-2.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-primary">
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pose ta question..."
              rows={1}
              disabled={isTyping}
              className="flex-1 bg-transparent border-0 resize-none text-sm placeholder:text-muted-foreground focus:outline-none py-2.5 max-h-32 disabled:opacity-50"
              style={{ minHeight: "44px" }}
            />
            <button className="p-2.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-primary">
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={cn(
                "p-3 rounded-xl transition-all",
                input.trim() && !isTyping
                  ? "prago-gradient-bg text-white shadow-lg hover:shadow-xl hover:scale-105"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3" />
          Propulsé par l'IA • Les réponses peuvent contenir des erreurs
        </p>
      </motion.div>
    </div>
  );
}
