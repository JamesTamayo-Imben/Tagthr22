import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Film } from 'lucide-react';
import Navigation from './Navigation';
import SearchBar from './SearchBar';
import SearchResultCard from './SearchResultCard';
import MediaDetailModal from './MediaDetailModal';
import { MediaItem, SearchResponse } from '../../types/media';

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

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
      // Use IMDb API (no API key required, free tier)
      const imdbResponse = await fetch(
        `https://imdb.iamidiotareyoutoo.com/search?title=${encodeURIComponent(query)}`
      );

      if (!imdbResponse.ok) {
        throw new Error('IMDb API failed');
      }

      const imdbData: SearchResponse = await imdbResponse.json();
      let items: MediaItem[] = [];

      if (imdbData && Array.isArray(imdbData.description)) {
        items = imdbData.description
          .filter((item) => item['#IMG_POSTER'] && item['#IMG_POSTER'] !== 'N/A') // Only items with posters
          .slice(0, 12)
          .map((item) => ({
            title: item['#TITLE'] || 'Unknown Title',
            year: item['#YEAR'] || 'N/A',
            type: (item['#ACTORS'] ? 'movie' : 'series') as 'movie' | 'series',
            imdbId: item['#IMDB_ID'] || '',
            poster: item['#IMG_POSTER'] || '',
            rating: item['#RANK'] || 'N/A',
          }));
      }

      setSearchResults(items);
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

  const handleMediaSelect = (media: MediaItem) => {
    setSelectedMedia(media);
  };

  const handleCreateParty = (media: MediaItem) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const slug = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    navigate(`/party/${slug}`, { state: { media } });
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
            loading={loading}
            placeholder="Search for movies, TV series, actors..."
            className="mb-8"
          />
        </div>

        {searchResults.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {searchResults.map((result) => (
              <SearchResultCard
                key={result.imdbId}
                result={result}
                onPreview={handleMediaSelect}
                onSelect={handleCreateParty}
              />
            ))}
          </div>
        ) : !loading ? (
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
      />
    </div>
  );
}
