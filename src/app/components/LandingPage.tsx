import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Lock, LogIn, AlertCircle } from 'lucide-react';
import Navigation from './Navigation';
import SearchBar from './SearchBar';
import SearchResultCard from './SearchResultCard';
import MediaDetailModal from './MediaDetailModal';
import RecentParties from './RecentParties';
import { MediaItem, SearchResponse } from '../../types/media';
import { useSessionLimit } from '../../hooks/useSessionLimit';
import { sessionOperations, participantOperations, getParticipantToken } from '../../lib/supabaseClient';

export default function LandingPage() {
  const navigate = useNavigate();
  const { checkCanCreateSession } = useSessionLimit();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPrivateModal, setShowPrivateModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [roomSlug, setRoomSlug] = useState('');
  const [pin, setPin] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [activeSessionCount, setActiveSessionCount] = useState(0);

  const createPublicParty = async () => {
    const { canCreate, activeCount } = await checkCanCreateSession();

    if (!canCreate) {
      setActiveSessionCount(activeCount);
      setShowLimitModal(true);
      return;
    }

    const slug = generateSlug();
    const token = getParticipantToken();

    if (!token) {
      console.error('No participant token found');
      return;
    }

    try {
      // Create session in database
      const session = await sessionOperations.createSession(slug, token);
      
      // Join as host
      await participantOperations.joinSession(session.id, token, 'host');

      navigate(`/party/${slug}`);
    } catch (error) {
      console.error('Error creating party:', error);
    }
  };

  const createPrivateParty = async () => {
    if (pin.length !== 4) return;

    const { canCreate, activeCount } = await checkCanCreateSession();

    if (!canCreate) {
      setActiveSessionCount(activeCount);
      setShowLimitModal(true);
      setShowPrivateModal(false);
      return;
    }

    const slug = generateSlug();
    const token = getParticipantToken();

    if (!token) {
      console.error('No participant token found');
      return;
    }

    try {
      // Hash the PIN (simple hash - in production use bcrypt)
      const pinHash = btoa(pin); // Base64 encode for now

      // Create session in database with PIN
      const session = await sessionOperations.createSession(slug, token, undefined, pinHash);
      
      // Join as host
      await participantOperations.joinSession(session.id, token, 'host');

      navigate(`/party/${slug}?pin=${pin}`);
    } catch (error) {
      console.error('Error creating private party:', error);
    }
  };

  const joinRoom = () => {
    if (roomSlug.trim()) {
      const url = pin ? `/party/${roomSlug}?pin=${pin}` : `/party/${roomSlug}`;
      navigate(url);
    }
  };

  const generateSlug = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const debounce = <T extends (...args: any[]) => void>(func: T, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const searchMedia = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://imdb.iamidiotareyoutoo.com/search?title=${encodeURIComponent(query)}`);
      const data: SearchResponse = await response.json();

      if (data && Array.isArray(data.description)) {
        const items: MediaItem[] = data.description.slice(0, 12).map((item) => ({
          title: item['#TITLE'] || 'Unknown Title',
          year: item['#YEAR'] || 'N/A',
          type: (item['#ACTORS'] ? 'movie' : 'series') as 'movie' | 'series',
          imdbId: item['#IMDB_ID'] || '',
          poster: item['#IMG_POSTER'] || '',
          rating: item['#RANK'] || 'N/A',
        }));
        setSearchResults(items);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(searchMedia, 500), []);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setLoading(false);
    } else {
      setLoading(true);
      debouncedSearch(query);
    }
  };

  const handlePreview = (result: MediaItem) => {
    setSelectedMedia(result);
  };

  const handleSelect = (result: MediaItem) => {
    setSelectedMedia(result);
  };

  const handleCreateParty = async (media: MediaItem) => {
    const { canCreate, activeCount } = await checkCanCreateSession();

    if (!canCreate) {
      setActiveSessionCount(activeCount);
      setShowLimitModal(true);
      setSelectedMedia(null);
      return;
    }

    const slug = generateSlug();
    const token = getParticipantToken();

    if (!token) {
      console.error('No participant token found');
      return;
    }

    try {
      // Create session with media metadata
      const metadata = {
        title: media.title,
        poster: media.poster,
        year: media.year,
        rating: media.rating,
        imdbId: media.imdbId,
      };

      const session = await sessionOperations.createSession(
        slug,
        token,
        media.poster, // Use poster as video_url for display
        undefined,
        metadata
      );
      
      // Join as host
      await participantOperations.joinSession(session.id, token, 'host');

      navigate(`/party/${slug}`, { state: { media } });
    } catch (error) {
      console.error('Error creating party:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <Navigation />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 lg:pb-20 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-20">
          <div className="space-y-6 z-10 max-w-2xl">
            <div className="space-y-4">
              <p className="text-[#9CA3AF] text-base sm:text-lg">Tag along. Watch together.</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Search, Sync, <span className="text-[#F59E0B]">Share</span>
                <br />
                <span className="text-[#8B5CF6]">Together</span>
              </h1>
              <p className="text-[#9CA3AF] text-base sm:text-lg max-w-xl">
                No accounts. No downloads. Just a link.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <button
                onClick={createPublicParty}
                className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-4 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-2xl font-medium text-sm sm:text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Public Party
              </button>
              <button
                onClick={() => setShowPrivateModal(true)}
                className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-4 border-2 border-[#8B5CF6] text-[#8B5CF6] rounded-2xl font-medium text-sm sm:text-base hover:bg-[#8B5CF6] hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                Private Party
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-4 border-2 border-[#06B6D4] text-[#06B6D4] rounded-2xl font-medium text-sm sm:text-base hover:bg-[#06B6D4] hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                Join Room
              </button>
            </div>
          </div>

          <div className="relative h-[500px] lg:h-[600px] hidden lg:block">
            <div className="floating-container">
              <div className="floating-element" style={{ animationDelay: '0s' }}>
                <div className="glass-card w-64 h-80 bg-gradient-to-br from-[#1A1A1A] to-[#2A2A3A] rounded-2xl p-6 shadow-2xl transform -rotate-12">
                  <div className="space-y-3">
                    <div className="w-full h-32 bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] rounded-xl"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-[#06B6D4] rounded-full w-3/4"></div>
                      <div className="h-3 bg-[#F59E0B] rounded-full w-1/2"></div>
                      <div className="h-3 bg-[#10B981] rounded-full w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="floating-element" style={{ animationDelay: '1s' }}>
                <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-white to-[#E5E7EB] rounded-full shadow-2xl"></div>
              </div>

              <div className="floating-element" style={{ animationDelay: '0.5s' }}>
                <div className="absolute top-40 left-20 w-20 h-20 bg-gradient-to-br from-white to-[#F3F4F6] rounded-full shadow-xl"></div>
              </div>

              <div className="floating-element" style={{ animationDelay: '1.5s' }}>
                <div className="absolute bottom-40 right-10 w-24 h-24 bg-gradient-to-br from-white to-[#D1D5DB] rounded-full shadow-xl"></div>
              </div>

              <div className="floating-element" style={{ animationDelay: '0.3s' }}>
                <div className="absolute top-10 left-40 glass-card bg-[#8B5CF6] rounded-2xl px-6 py-3 shadow-xl">
                  <span className="font-medium">Hosting</span>
                </div>
              </div>

              <div className="floating-element" style={{ animationDelay: '1.2s' }}>
                <div className="absolute bottom-20 left-10 glass-card bg-[#06B6D4] rounded-2xl px-6 py-3 shadow-xl">
                  <span className="font-medium">Chatting</span>
                </div>
              </div>

              <div className="floating-element" style={{ animationDelay: '0.8s' }}>
                <div className="absolute top-60 right-40 glass-card bg-[#F59E0B] rounded-2xl px-6 py-3 shadow-xl">
                  <span className="font-medium">30 Max</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-8 mb-20">
          <div className="text-center space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold">Or start with a movie or series</h2>
            <p className="text-[#9CA3AF] text-lg">Search our vast library and create a watch party instantly</p>
          </div>

          <SearchBar onSearch={handleSearch} loading={loading} />

          {searchResults.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {searchResults.map((result) => (
                <SearchResultCard
                  key={result.imdbId}
                  result={result}
                  onPreview={handlePreview}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}

          {!loading && searchResults.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#9CA3AF]">Search for movies and TV series to get started</p>
            </div>
          )}
        </section>

        <section className="space-y-6 pt-8">
          <h3 className="text-2xl font-semibold text-center">How it works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#8B5CF6] flex items-center justify-center">
                <span className="text-xl font-bold">1</span>
              </div>
              <h4 className="font-semibold text-lg">Create or join a room</h4>
              <p className="text-[#9CA3AF]">Start a new party or join an existing one with a room code</p>
            </div>
            <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#06B6D4] flex items-center justify-center">
                <span className="text-xl font-bold">2</span>
              </div>
              <h4 className="font-semibold text-lg">Add a video or search</h4>
              <p className="text-[#9CA3AF]">Search our library or paste a YouTube/Vimeo URL</p>
            </div>
            <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#10B981] flex items-center justify-center">
                <span className="text-xl font-bold">3</span>
              </div>
              <h4 className="font-semibold text-lg">Watch together in sync</h4>
              <p className="text-[#9CA3AF]">Invite friends and enjoy perfectly synced playback</p>
            </div>
          </div>
        </section>

        <RecentParties />
      </main>

      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] rounded-2xl p-8 max-w-md w-full space-y-6 border border-[#2A2A2A]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#EF4444]/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-[#EF4444]" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Party Limit Reached</h2>
                <p className="text-[#9CA3AF]">
                  You already have {activeSessionCount} active parties. You can host a maximum of 3 parties at once.
                </p>
                <p className="text-[#9CA3AF] mt-3">
                  Please wait for a party to expire (24 hours) or end an existing session to create a new one.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowLimitModal(false)}
              className="w-full px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-xl font-medium text-lg hover:opacity-90 transition-opacity"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] rounded-2xl p-8 max-w-md w-full space-y-6 border border-[#2A2A2A]">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Join Room</h2>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-[#9CA3AF] hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-2">Room Slug</label>
                <input
                  type="text"
                  placeholder="abc123"
                  value={roomSlug}
                  onChange={(e) => setRoomSlug(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl focus:outline-none focus:border-[#06B6D4] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-[#9CA3AF] mb-2">4-digit PIN (optional)</label>
                <input
                  type="text"
                  placeholder="1234"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl focus:outline-none focus:border-[#8B5CF6] transition-colors"
                />
              </div>
            </div>

            <button
              onClick={joinRoom}
              className="w-full px-8 py-4 bg-gradient-to-r from-[#06B6D4] to-[#0891B2] rounded-xl font-medium text-lg hover:opacity-90 transition-opacity"
            >
              Join
            </button>
          </div>
        </div>
      )}

      {showPrivateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] rounded-2xl p-8 max-w-md w-full space-y-6 border border-[#2A2A2A]">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Create Private Party</h2>
              <button
                onClick={() => setShowPrivateModal(false)}
                className="text-[#9CA3AF] hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block text-sm text-[#9CA3AF] mb-2">Set 4-digit PIN</label>
              <input
                type="text"
                placeholder="1234"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl focus:outline-none focus:border-[#8B5CF6] transition-colors"
              />
            </div>

            <button
              onClick={createPrivateParty}
              disabled={pin.length !== 4}
              className="w-full px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-xl font-medium text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Private Room
            </button>
          </div>
        </div>
      )}

      <MediaDetailModal
        media={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        onCreateParty={handleCreateParty}
      />

      <style>{`
        .floating-container {
          position: relative;
          width: 100%;
          height: 100%;
          perspective: 1000px;
        }

        .floating-element {
          animation: float 6s ease-in-out infinite;
        }

        .glass-card {
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotateZ(0deg);
          }
          25% {
            transform: translateY(-20px) translateX(10px) rotateZ(2deg);
          }
          50% {
            transform: translateY(0px) translateX(-10px) rotateZ(-2deg);
          }
          75% {
            transform: translateY(20px) translateX(5px) rotateZ(1deg);
          }
        }
      `}</style>

      <footer className="relative z-10 mt-32 pb-8 text-center text-[#9CA3AF] text-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex justify-center gap-6 flex-wrap">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/legal" className="hover:text-white transition-colors">Legal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
