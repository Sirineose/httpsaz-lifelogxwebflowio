import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Layouts
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import ChatIA from "@/pages/ChatIA";
import SnapSolve from "@/pages/SnapSolve";
import QuizFlashcards from "@/pages/QuizFlashcards";
import Notes from "@/pages/Notes";
import Comics from "@/pages/Comics";
import ExamPrep from "@/pages/ExamPrep";
import Profile from "@/pages/Profile";
import Pricing from "@/pages/Pricing";
import FAQ from "@/pages/FAQ";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<FAQ />} />
            
            {/* Protected app routes with sidebar layout */}
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat" element={<ChatIA />} />
              <Route path="/snap-solve" element={<SnapSolve />} />
              <Route path="/quiz" element={<QuizFlashcards />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/comics" element={<Comics />} />
              <Route path="/exam-prep" element={<ExamPrep />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
