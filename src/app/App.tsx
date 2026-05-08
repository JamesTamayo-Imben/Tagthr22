import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import LandingPage from './components/LandingPage';
import SessionPage from './components/SessionPage';
import AboutPage from './components/AboutPage';
import LegalPage from './components/LegalPage';
import RecentParties from './components/RecentParties';
import SearchPage from './components/SearchPage';
import { useAuth } from '../hooks/useAuth';

export default function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[#9CA3AF]">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter basename="/Tagthr22">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/party/:slug" element={<SessionPage />} />
        <Route path="/recent" element={<RecentParties />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/legal" element={<LegalPage />} />
      </Routes>
    </BrowserRouter>
  );
}
