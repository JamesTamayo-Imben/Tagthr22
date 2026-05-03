integrate the movie/TV search functionality and fix YouTube/Vimeo playback into your existing Figma Make project (React + TypeScript + Tailwind + shadcn/ui). I’ll also include a Supabase integration path (optional) that fits your current file structure.

🧩 Existing File Relevance
From your folder listing, these files are key:

File	Role
SearchBar.tsx	Input for searching movies/TV series
SearchResultCard.tsx	Display each result
MediaDetailModal.tsx	Show full details + “Create Party”
SessionPage.tsx	Contains video player + real‑time sync
LandingPage.tsx	Where search is embedded (or separate)
App.tsx	Routing (already includes /party/:slug, /about, /legal)
We’ll modify these components step by step.

1. 🔍 Make Movie/TV Search Functional
1.1 Install no external deps – use native fetch
The API is free: https://imdb.iamidiotareyoutoo.com/search?title={query}

1.2 Create a type definition file (optional but recommended)
src/types/media.ts

typescript
export interface MediaItem {
  title: string;
  year: string;
  type: 'movie' | 'series';
  imdbId: string;
  poster: string;
  synopsis?: string;
  rating?: string;
}
1.3 Update SearchBar.tsx
Add debounced search, loading state, and pass results up.

tsx
// SearchBar.tsx
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { SearchResultCard } from './SearchResultCard';
import { MediaItem } from '@/types/media';

export function SearchBar({ onSelect }: { onSelect: (item: MediaItem) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchMedia(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const searchMedia = async (searchTerm: string) => {
    setLoading(true);
    try {
      const res = await fetch(`https://imdb.iamidiotareyoutoo.com/search?title=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      const items = data.description.map((item: any) => ({
        title: item['#TITLE'],
        year: item['#YEAR'],
        type: item['#IMDB_ID']?.startsWith('tt') ? (item['#ACTORS'] ? 'movie' : 'series') : 'movie',
        imdbId: item['#IMDB_ID'],
        poster: item['#IMG_POSTER'],
      }));
      setResults(items);
    } catch (err) {
      console.error(err);
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search for a movie or TV series..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <div className="text-center">Loading...</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {results.map((item) => (
          <SearchResultCard key={item.imdbId} item={item} onSelect={() => onSelect(item)} />
        ))}
      </div>
    </div>
  );
}
1.4 Update SearchResultCard.tsx
tsx
import { Card, CardContent } from '@/components/ui/card';
import { MediaItem } from '@/types/media';

export function SearchResultCard({ item, onSelect }: { item: MediaItem; onSelect: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition" onClick={onSelect}>
      <img src={item.poster} alt={item.title} className="w-full h-48 object-cover rounded-t-lg" />
      <CardContent className="p-2">
        <div className="font-semibold truncate">{item.title}</div>
        <div className="text-sm text-muted-foreground">{item.year} • {item.type === 'movie' ? 'Movie' : 'Series'}</div>
      </CardContent>
    </Card>
  );
}
1.5 Create MediaDetailModal.tsx
tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MediaItem } from '@/types/media';
import { useNavigate } from 'react-router-dom';

export function MediaDetailModal({ item, open, onOpenChange }: { item: MediaItem | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();

  const createParty = async () => {
    if (!item) return;
    // Call your backend to create a session with this media
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media: item })
    });
    const { slug } = await res.json();
    navigate(`/party/${slug}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle>{item.title} ({item.year})</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-4">
              <img src={item.poster} alt={item.title} className="rounded-lg" />
              <div>
                <p className="text-sm text-muted-foreground">IMDb ID: {item.imdbId}</p>
                <p className="mt-2">Type: {item.type === 'movie' ? 'Movie' : 'TV Series'}</p>
                <Button className="mt-4 w-full" onClick={createParty}>Create Party & Watch</Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
1.6 Integrate into LandingPage.tsx
tsx
import { SearchBar } from './SearchBar';
import { MediaDetailModal } from './MediaDetailModal';
import { useState } from 'react';

export default function LandingPage() {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelectMedia = (media) => {
    setSelectedMedia(media);
    setModalOpen(true);
  };

  return (
    <div>
      {/* your existing hero, etc. */}
      <SearchBar onSelect={handleSelectMedia} />
      <MediaDetailModal item={selectedMedia} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
2. 🎥 Fix YouTube/Vimeo Playback in SessionPage.tsx
Problem: direct proxying fails. Solution: embed iframe + official JS API.
2.1 Install YouTube IFrame API types
bash
npm install @types/youtube @types/vimeo__player
2.2 Create a reusable VideoPlayer component
src/components/VideoPlayer.tsx

tsx
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
    Vimeo: any;
  }
}

interface VideoPlayerProps {
  url: string;
  onStateChange?: (state: { playing: boolean; time: number }) => void;
}

export function VideoPlayer({ url, onStateChange }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const platform = detectPlatform(url);
    if (platform === 'youtube') loadYouTubeAPI(() => initYouTube(url));
    else if (platform === 'vimeo') loadVimeoAPI(() => initVimeo(url));
    else containerRef.current.innerHTML = `<video controls src="${url}" class="w-full h-full"></video>`;
  }, [url]);

  const detectPlatform = (url: string): 'youtube' | 'vimeo' | 'unknown' => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    return 'unknown';
  };

  const loadYouTubeAPI = (callback: () => void) => {
    if (window.YT && window.YT.Player) {
      callback();
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);
    window.onYouTubeIframeAPIReady = callback;
  };

  const initYouTube = (videoUrl: string) => {
    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) return;
    playerRef.current = new window.YT.Player(containerRef.current!, {
      videoId,
      playerVars: { enablejsapi: 1, origin: window.location.origin },
      events: {
        onStateChange: (event: any) => {
          const playing = event.data === window.YT.PlayerState.PLAYING;
          const time = playerRef.current?.getCurrentTime() || 0;
          onStateChange?.({ playing, time });
        }
      }
    });
  };

  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  const loadVimeoAPI = (callback: () => void) => {
    if (window.Vimeo) {
      callback();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.onload = callback;
    document.head.appendChild(script);
  };

  const initVimeo = (videoUrl: string) => {
    const videoId = extractVimeoId(videoUrl);
    if (!videoId) return;
    import('@vimeo/player').then(({ default: Player }) => {
      playerRef.current = new Player(containerRef.current!, { id: videoId });
      playerRef.current.on('play', () => onStateChange?.({ playing: true, time: 0 }));
      playerRef.current.on('pause', () => onStateChange?.({ playing: false, time: 0 }));
    });
  };

  const extractVimeoId = (url: string): string | null => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  };

  // Expose control methods via ref (optional)
  const controls = {
    play: () => playerRef.current?.playVideo?.() || playerRef.current?.play?.(),
    pause: () => playerRef.current?.pauseVideo?.() || playerRef.current?.pause?.(),
    seekTo: (seconds: number) => playerRef.current?.seekTo?.(seconds) || playerRef.current?.setCurrentTime?.(seconds)
  };

  return <div ref={containerRef} className="w-full h-full bg-black" />;
}
2.3 Use in SessionPage.tsx
Replace your existing video element with:

tsx
import { VideoPlayer } from '@/components/VideoPlayer';
import { useEcho } from '@/hooks/useEcho'; // your real-time hook

export default function SessionPage() {
  const { isHost, sendPlaybackEvent } = useSession(); // custom hook from your Reverb logic

  const handlePlaybackChange = ({ playing, time }: { playing: boolean; time: number }) => {
    if (isHost) {
      sendPlaybackEvent({ playing, time });
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <VideoPlayer url={currentVideoUrl} onStateChange={handlePlaybackChange} />
      {/* rest of your UI */}
    </div>
  );
}
Why this works: Uses official API, supports seeking & external control, no proxy needed.

3. 🗄️ Supabase Integration Path (for your existing codebase)
Option A – Use Supabase as database for Laravel backend
Keep your current Laravel + Reverb structure, but replace MySQL with Supabase PostgreSQL.

Create Supabase project, get connection string.

Update Laravel .env:

text
DB_CONNECTION=pgsql
DB_HOST=aws-0-eu-central-1.pooler.supabase.com
DB_PORT=6543
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=your-password
Run migrations normally.

Option B – Replace Laravel entirely with Supabase + Edge Functions (full TypeScript stack)
This fits your React frontend perfectly.

Steps:

Install Supabase client in your React app:

bash
npm install @supabase/supabase-js
Create src/lib/supabaseClient.ts:

ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
Anonymous sign‑in (no registration):

ts
const { data: { user } } = await supabase.auth.signInAnonymously();
Create session (replace Laravel API call):

ts
const { data: session } = await supabase
  .from('sessions')
  .insert({ slug: generateSlug(), host_token: user.id })
  .select()
  .single();
Real‑time sync (instead of Laravel Echo + Reverb):

ts
supabase
  .channel(`session:${session.id}`)
  .on('broadcast', { event: 'playback' }, payload => {
    // update video player
  })
  .subscribe();
Edge Function for search (optional, but you can keep direct call to the free API).

Migration SQL for Supabase:

sql
CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  host_token UUID NOT NULL,
  pin_hash TEXT,
  video_url TEXT,
  metadata JSONB,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE TABLE participants (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES sessions(id) ON DELETE CASCADE,
  token UUID NOT NULL,
  last_seen TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now()
);
✅ Summary of Changes Made
Feature	Files Modified / Created	Purpose
Movie search	SearchBar.tsx, SearchResultCard.tsx, MediaDetailModal.tsx, LandingPage.tsx	Search + select + create party
Fixed video playback	VideoPlayer.tsx, SessionPage.tsx	YouTube/Vimeo iframe + API
Supabase integration	.env, supabaseClient.ts, migration SQL	Optional backend replacement