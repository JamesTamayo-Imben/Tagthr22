import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LogIn } from 'lucide-react';

export default function Navigation() {
  const navigate = useNavigate();
  const [quickJoinSlug, setQuickJoinSlug] = useState('');

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

  return (
    <nav className="relative z-10 flex flex-wrap items-center justify-between px-4 lg:px-8 py-6 max-w-7xl mx-auto gap-4">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] rounded-lg"></div>
        <span className="text-xl font-bold">Tagthr</span>
      </Link>

      <div className="flex items-center gap-6 flex-wrap">
        <Link to="/" className="text-[#9CA3AF] hover:text-white transition-colors">
          Home
        </Link>
        <button
          onClick={createParty}
          className="text-[#9CA3AF] hover:text-white transition-colors"
        >
          Create Party
        </button>
        <Link to="/about" className="text-[#9CA3AF] hover:text-white transition-colors">
          About
        </Link>
        <Link to="/legal" className="text-[#9CA3AF] hover:text-white transition-colors">
          Legal
        </Link>

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
