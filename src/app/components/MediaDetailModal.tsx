import { X, Star, Film, Tv } from 'lucide-react';
import { MediaItem } from '../../types/media';

interface MediaDetailModalProps {
  media: MediaItem | null;
  onClose: () => void;
  onCreateParty: (media: MediaItem) => void;
}

export default function MediaDetailModal({ media, onClose, onCreateParty }: MediaDetailModalProps) {
  if (!media) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1A1A1A] border-b border-[#2A2A2A] p-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold">Media Details</h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-[300px_1fr] gap-6">
            <div className="aspect-[2/3] relative overflow-hidden bg-[#0A0A0A] rounded-xl">
              {media.poster && media.poster !== 'N/A' ? (
                <img
                  src={media.poster}
                  alt={media.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const iconContainer = document.createElement('div');
                      iconContainer.className = 'w-full h-full flex items-center justify-center';
                      parent.appendChild(iconContainer);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {media.type === 'movie' ? (
                    <Film className="w-24 h-24 text-[#9CA3AF]" />
                  ) : (
                    <Tv className="w-24 h-24 text-[#9CA3AF]" />
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-start gap-3 mb-2">
                  <h1 className="text-3xl font-bold flex-1">{media.title}</h1>
                  <div className="px-3 py-1 bg-[#0A0A0A] rounded-lg flex items-center gap-2">
                    {media.type === 'movie' ? (
                      <Film className="w-4 h-4" />
                    ) : (
                      <Tv className="w-4 h-4" />
                    )}
                    <span className="text-sm capitalize">{media.type}</span>
                  </div>
                </div>
                <p className="text-[#9CA3AF]">{media.year}</p>
              </div>

              {media.rating && media.rating !== 'N/A' && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#F59E0B] fill-[#F59E0B]" />
                  <span className="text-lg font-semibold">{media.rating}</span>
                  <span className="text-[#9CA3AF]">IMDb Rating</span>
                </div>
              )}

              {media.genre && media.genre !== 'N/A' && (
                <div>
                  <h3 className="text-sm font-semibold text-[#9CA3AF] mb-2">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {media.genre.split(',').map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#0A0A0A] rounded-lg text-sm"
                      >
                        {genre.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {media.synopsis && media.synopsis !== 'N/A' && (
                <div>
                  <h3 className="text-sm font-semibold text-[#9CA3AF] mb-2">Synopsis</h3>
                  <p className="text-[#E5E7EB] leading-relaxed">{media.synopsis}</p>
                </div>
              )}

              {media.cast && media.cast !== 'N/A' && (
                <div>
                  <h3 className="text-sm font-semibold text-[#9CA3AF] mb-2">Cast</h3>
                  <p className="text-[#E5E7EB]">{media.cast}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-[#9CA3AF] mb-2">IMDb ID</h3>
                <code className="px-3 py-1 bg-[#0A0A0A] rounded-lg text-sm">{media.imdbId}</code>
              </div>

              <button
                onClick={() => onCreateParty(media)}
                className="w-full px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-xl font-medium text-lg hover:opacity-90 transition-opacity"
              >
                Create Party with this Media
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
