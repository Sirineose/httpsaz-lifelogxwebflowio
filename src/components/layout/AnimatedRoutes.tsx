import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Auth
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Layouts
import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/layout/PageTransition";

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

export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={
          <PageTransition>
            <Landing />
          </PageTransition>
        } />
        <Route path="/auth" element={
          <PageTransition>
            <Auth />
          </PageTransition>
        } />
        <Route path="/pricing" element={
          <PageTransition>
            <Pricing />
          </PageTransition>
        } />
        <Route path="/faq" element={
          <PageTransition>
            <FAQ />
          </PageTransition>
        } />
        
        {/* Protected app routes with sidebar layout */}
        <Route element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={
            <PageTransition>
              <Dashboard />
            </PageTransition>
          } />
          <Route path="/chat" element={
            <PageTransition>
              <ChatIA />
            </PageTransition>
          } />
          <Route path="/snap-solve" element={
            <PageTransition>
              <SnapSolve />
            </PageTransition>
          } />
          <Route path="/quiz" element={
            <PageTransition>
              <QuizFlashcards />
            </PageTransition>
          } />
          <Route path="/notes" element={
            <PageTransition>
              <Notes />
            </PageTransition>
          } />
          <Route path="/comics" element={
            <PageTransition>
              <Comics />
            </PageTransition>
          } />
          <Route path="/exam-prep" element={
            <PageTransition>
              <ExamPrep />
            </PageTransition>
          } />
          <Route path="/profile" element={
            <PageTransition>
              <Profile />
            </PageTransition>
          } />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={
          <PageTransition>
            <NotFound />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
}
