import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LogIn, Search, Clock } from 'lucide-react';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [quickJoinSlug, setQuickJoinSlug] = useState('');

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isPartyActive = () => {
    return location.pathname.startsWith('/party/');
  };

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickJoinSlug.trim()) {
      navigate(`/party/${quickJoinSlug.trim()}`);
    }
  };

  const createParty = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const slug = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    navigate(`/party/${slug}`);
  };

  const navLinkClass = (path: string) => {
    const baseClass = "transition-colors";
    return isActive(path)
      ? `${baseClass} text-white border-b-2 border-[#06B6D4] pb-1`
      : `${baseClass} text-[#9CA3AF] hover:text-white`;
  };

  return (
    <nav className="relative z-10 flex flex-wrap items-center justify-between px-4 lg:px-8 py-6 max-w-7xl mx-auto gap-4">
      <Link to="/" className="flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] rounded-lg"></div>
        <span className="text-xl font-bold">Tagthr</span>
      </Link>

      <div className="flex items-center gap-8 flex-wrap flex-1 justify-center md:justify-start md:flex-1">
        <Link to="/" className={navLinkClass('/')}>
          Home
        </Link>
        <Link to="/recent" className={navLinkClass('/recent')}>
          Recent
        </Link>
        <button
          onClick={createParty}
          className={`transition-colors ${
            isPartyActive()
              ? 'text-white border-b-2 border-[#06B6D4] pb-1'
              : 'text-[#9CA3AF] hover:text-white'
          }`}
        >
          Party
        </button>
        <Link to="/about" className={navLinkClass('/about')}>
          About
        </Link>
        <Link to="/legal" className={navLinkClass('/legal')}>
          Legal
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/search')}
          className="p-2 text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        <form onSubmit={handleQuickJoin} className="flex gap-2">
          <input
            type="text"
            placeholder="Room slug"
            value={quickJoinSlug}
            onChange={(e) => setQuickJoinSlug(e.target.value)}
            className="px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-sm focus:outline-none focus:border-[#06B6D4] transition-colors"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#06B6D4] hover:bg-[#0891B2] rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Join
          </button>
        </form>
      </div>
    </nav>
  );
}
