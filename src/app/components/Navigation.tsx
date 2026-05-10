import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, LogIn, Search, Clock, Play, Info, Shield } from 'lucide-react';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [quickJoinSlug, setQuickJoinSlug] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <>
      <nav className={`fixed top-0 left-0 right-0 w-full z-50 transition-colors duration-300 backdrop-blur-sm ${
      isScrolled
        ? 'bg-[#0A0A0A] border-b border-[#2A2A2A] shadow-black/20'
        : 'bg-transparent border-b border-transparent shadow-none'
    }`}>
      <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-3 sm:px-4 lg:px-8 py-4 sm:py-6 gap-8 sm:gap-4">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img className="h-6 sm:h-7" src="/Tagthr22/images/Logo1.png" alt="Logo1" />
        </Link>

                  <div className="hidden md:flex items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 flex-wrap flex-1 justify-center md:justify-start md:flex-1 w-auto">
            <Link to="/" className={`${navLinkClass('/')} text-sm sm:text-base`}>
              Home
            </Link>
            <Link to="/recent" className={`${navLinkClass('/recent')} text-sm sm:text-base`}>
              Recent
            </Link>
            <button
              onClick={createParty}
              className={`transition-colors text-sm sm:text-base ${
                isPartyActive()
                  ? 'text-white border-b-2 border-[#06B6D4] pb-1'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Party
            </button>
            <Link to="/about" className={`${navLinkClass('/about')} text-sm sm:text-base`}>
              About
            </Link>
            <Link to="/legal" className={`${navLinkClass('/legal')} text-sm sm:text-base`}>
              Legal
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/search')}
              className="p-2 text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <form onSubmit={handleQuickJoin} className="flex flex-1 gap-2">
              <input
                type="text"
                placeholder="Room slug"
                value={quickJoinSlug}
                onChange={(e) => setQuickJoinSlug(e.target.value)}
                className="px-2 sm:px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#06B6D4] transition-colors w-28 sm:w-auto"
              />
              <button
                type="submit"
                className="px-3 sm:px-4 py-2 bg-[#06B6D4] hover:bg-[#0891B2] rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2"
              >
                <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Join</span>
              </button>
            </form>
          </div>


      </div>
      </nav>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A] border-t border-[#2A2A2A] shadow-black/20 md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-around px-3 py-3 gap-2 text-[10px] sm:text-xs">
          <Link to="/" className={`${navLinkClass('/')} flex flex-col items-center gap-1 text-[10px] sm:text-xs`}>
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>
          <Link to="/recent" className={`${navLinkClass('/recent')} flex flex-col items-center gap-1 text-[10px] sm:text-xs`}>
            <Clock className="w-5 h-5" />
            <span>Recent</span>
          </Link>
          <button
            type="button"
            onClick={createParty}
            className={`flex flex-col items-center gap-1 text-[10px] sm:text-xs transition-colors ${
              isPartyActive()
                ? 'text-white'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <Play className="w-5 h-5" />
            <span>Party</span>
          </button>
          <Link to="/about" className={`${navLinkClass('/about')} flex flex-col items-center gap-1 text-[10px] sm:text-xs`}>
            <Info className="w-5 h-5" />
            <span>About</span>
          </Link>
          <Link to="/legal" className={`${navLinkClass('/legal')} flex flex-col items-center gap-1 text-[10px] sm:text-xs`}>
            <Shield className="w-5 h-5" />
            <span>Legal</span>
          </Link>
        </div>
      </div>
    </>
  );
}
