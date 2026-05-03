import { Film, Tv, Eye, Plus } from 'lucide-react';
import { MediaItem } from '../../types/media';

interface SearchResultCardProps {
  result: MediaItem;
  onPreview: (result: MediaItem) => void;
  onSelect: (result: MediaItem) => void;
}

export default function SearchResultCard({ result, onPreview, onSelect }: SearchResultCardProps) {
  return (
    <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden hover:border-[#8B5CF6] transition-all group">
      <div className="aspect-[2/3] relative overflow-hidden bg-[#0A0A0A]">
        {result.poster && result.poster !== 'N/A' ? (
          <img
            src={result.poster}
            alt={result.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const icon = document.createElement('div');
                icon.className = 'w-full h-full flex items-center justify-center';
                icon.innerHTML = result.type === 'movie'
                  ? '<svg class="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path></svg>'
                  : '<svg class="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>';
                parent.appendChild(icon);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {result.type === 'movie' ? (
              <Film className="w-16 h-16 text-[#9CA3AF]" />
            ) : (
              <Tv className="w-16 h-16 text-[#9CA3AF]" />
            )}
          </div>
        )}
        <div className="absolute top-2 right-2">
          <div className="px-2 py-1 bg-black/80 backdrop-blur-sm rounded-lg flex items-center gap-1 text-xs">
            {result.type === 'movie' ? (
              <Film className="w-3 h-3" />
            ) : (
              <Tv className="w-3 h-3" />
            )}
            <span className="capitalize">{result.type}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-white line-clamp-2">{result.title}</h3>
          <p className="text-sm text-[#9CA3AF]">{result.year}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onPreview(result)}
            className="flex-1 px-3 py-2 border border-[#06B6D4] text-[#06B6D4] rounded-lg text-sm font-medium hover:bg-[#06B6D4] hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => onSelect(result)}
            className="flex-1 px-3 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Select
          </button>
        </div>
      </div>
    </div>
  );
}
