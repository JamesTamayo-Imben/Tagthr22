import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Film } from 'lucide-react';
import Navigation from './Navigation';
import SearchBar from './SearchBar';
import SearchResultCard from './SearchResultCard';
import MediaDetailModal from './MediaDetailModal';
import SearchResultsPagination from './SearchResultsPagination';
import { MediaItem } from '../../types/media';
import { isMediaSearchConfigured } from '../../lib/tmdbApi';
import { resolvePlaybackUrl } from '../../lib/tmdbTrailer';
import { usePagedMediaSearch } from '../../hooks/usePagedMediaSearch';
import { useSessionLimit } from '../../hooks/useSessionLimit';
import { sessionOperations, participantOperations, getParticipantToken } from '../../lib/supabaseClient';

export default function SearchPage() {
  const navigate = useNavigate();
  const { checkCanCreateSession } = useSessionLimit();
  const {
    displayedItems: searchResults,
    currentPage: searchPage,
    canGoNext: searchCanGoNext,
    canGoPrev: searchCanGoPrev,
    loading: searchLoading,
    searchError,
    runNewSearch,
    goNext: searchGoNext,
    goPrev: searchGoPrev,
  } = usePagedMediaSearch();
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [creatingParty, setCreatingParty] = useState(false);

  const debounce = <T extends (...args: any[]) => void>(func: T, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedSearch = useMemo(
    () => debounce((q: string) => void runNewSearch(q), 500),
    [runNewSearch]
  );

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      void runNewSearch('');
    } else {
      debouncedSearch(query);
    }
  };

  const handleMediaSelect = (media: MediaItem) => {
    setSelectedMedia(media);
  };

  const generateSlug = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleCreateParty = async (media: MediaItem) => {
    const { canCreate } = await checkCanCreateSession();
    if (!canCreate) {
      setSelectedMedia(null);
      return;
    }

    const token = getParticipantToken();
    if (!token) {
      console.error('No participant token found');
      return;
    }

    setCreatingParty(true);
    try {
      const slug = generateSlug();
      const playbackUrl = (await resolvePlaybackUrl(media)) || undefined;
      const mediaWithPlayback: MediaItem = { ...media, playbackUrl };

      const metadata = {
        title: media.title,
        poster: media.poster,
        year: media.year,
        rating: media.rating,
        imdbId: media.imdbId,
        type: media.type,
        tmdbId: media.tmdbId,
      };

      const session = await sessionOperations.createSession(
        slug,
        token,
        playbackUrl,
        undefined,
        metadata
      );
      await participantOperations.joinSession(session.id, token, 'host');

      navigate(`/party/${slug}`, { state: { media: mediaWithPlayback } });
    } catch (error) {
      console.error('Error creating party:', error);
    } finally {
      setCreatingParty(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-24 pb-12 mt-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <SearchIcon className="w-8 h-8 text-[#8B5CF6]" />
            <h1 className="text-4xl font-bold">Search Movies & Series</h1>
          </div>
          <p className="text-[#9CA3AF]">Find your favorite content and create a watch party</p>
        </div>

        <div className="mb-12">
          <SearchBar
            onSearch={handleSearch}
            loading={searchLoading}
            placeholder="Search for movies, TV series, actors..."
            className="mb-8"
          />
        </div>

        {!isMediaSearchConfigured() && (
          <p className="text-center text-sm text-amber-400/90 max-w-xl mx-auto mb-6">
            Add <code className="text-amber-200/90">VITE_TMDB_READ_ACCESS_TOKEN</code> or{' '}
            <code className="text-amber-200/90">VITE_TMDB_API_KEY</code> to{' '}
            <code className="text-amber-200/90">.env</code> (
            <a
              href="https://www.themoviedb.org/settings/api"
              className="underline text-amber-200 hover:text-white"
              target="_blank"
              rel="noreferrer"
            >
              themoviedb.org/settings/api
            </a>
            ).
          </p>
        )}

        {searchError && (
          <p className="text-center text-sm text-red-400 max-w-xl mx-auto mb-6">{searchError}</p>
        )}

        {searchResults.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
              {searchResults.map((result) => (
                <SearchResultCard
                  key={result.id}
                  result={result}
                  onPreview={handleMediaSelect}
                  onSelect={handleCreateParty}
                />
              ))}
            </div>
            <SearchResultsPagination
              currentPage={searchPage}
              onPrev={searchGoPrev}
              onNext={searchGoNext}
              canPrev={searchCanGoPrev}
              canNext={searchCanGoNext}
              loading={searchLoading}
            />
          </>
        ) : !searchLoading ? (
          <div className="text-center py-20">
            <Film className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4 opacity-50" />
            <p className="text-[#9CA3AF] text-lg">Start searching to discover movies and TV series</p>
          </div>
        ) : null}
      </div>

      <MediaDetailModal
        media={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        onCreateParty={handleCreateParty}
        createDisabled={creatingParty}
      />
    </div>
  );
}
