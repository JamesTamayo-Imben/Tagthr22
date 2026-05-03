We’ll now update and fix the Tagthr system based on your three requests:

Fix YouTube link crash – the video player must handle YouTube URLs gracefully.

Add Recent Parties (Archive) – users can see past sessions they joined/created, even after leaving.

Enforce max 3 active parties per user – each participant token can have at most 3 active (non‑expired) sessions they host. Joining has no limit.

Integrate Supabase – replace any local/in‑memory storage with Supabase for persistence across all functions.

All changes will be implemented in the existing React + TypeScript + Tailwind + shadcn/ui codebase from Figma Make.

🧱 Updated Architecture (Supabase as Backend)
We’ll remove the dependency on Laravel and use Supabase for:

Anonymous authentication (via supabase.auth.signInAnonymously())

Database (sessions, participants, messages, reports)

Real‑time sync (using Supabase Realtime broadcasts instead of Laravel Echo)

Row Level Security (RLS) to enforce limits and privacy

The frontend will directly call Supabase and also use its real‑time features. No custom API server needed.

1. 🛠️ Fix YouTube Link Crash in VideoPlayer.tsx
The crash typically occurs because:

The YouTube iframe API loads asynchronously and isn’t ready.

Invalid video ID extraction.

Missing error handling.

Updated VideoPlayer.tsx (robust version)
tsx
// src/components/VideoPlayer.tsx
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoPlayerProps {
  url: string;
  onStateChange?: (state: { playing: boolean; time: number }) => void;
}

export function VideoPlayer({ url, onStateChange }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    setError(null);
    const platform = detectPlatform(url);
    if (platform === 'youtube') {
      loadYouTubeAPI(() => initYouTube(url));
    } else if (platform === 'vimeo') {
      loadVimeoAPI(() => initVimeo(url));
    } else {
      // Fallback to native video tag
      setError('Unsupported video platform. Please use YouTube or Vimeo.');
    }
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

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/,
      /youtube\.com\/embed\/([^?#]+)/,
      /youtube\.com\/v\/([^?#]+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const initYouTube = (videoUrl: string) => {
    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) {
      setError('Invalid YouTube URL');
      return;
    }
    if (!containerRef.current) return;
    // Clear container
    containerRef.current.innerHTML = '';
    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: { enablejsapi: 1, origin: window.location.origin },
      events: {
        onReady: () => console.log('YouTube player ready'),
        onError: (err: any) => {
          console.error(err);
          setError('YouTube player error. Please check the video URL.');
        },
        onStateChange: (event: any) => {
          const playing = event.data === window.YT.PlayerState.PLAYING;
          const time = playerRef.current?.getCurrentTime() || 0;
          onStateChange?.({ playing, time });
        }
      }
    });
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

  const extractVimeoId = (url: string): string | null => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  };

  const initVimeo = async (videoUrl: string) => {
    const videoId = extractVimeoId(videoUrl);
    if (!videoId) {
      setError('Invalid Vimeo URL');
      return;
    }
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    const Player = (await import('@vimeo/player')).default;
    playerRef.current = new Player(containerRef.current, { id: videoId });
    playerRef.current.on('play', () => onStateChange?.({ playing: true, time: 0 }));
    playerRef.current.on('pause', () => onStateChange?.({ playing: false, time: 0 }));
    playerRef.current.on('timeupdate', (data: any) => {
      onStateChange?.({ playing: false, time: data.seconds });
    });
  };

  // Expose controls (used by host)
  useEffect(() => {
    if (!playerRef.current) return;
    window.__tagthrPlayer = {
      play: () => {
        if (playerRef.current.playVideo) playerRef.current.playVideo();
        else if (playerRef.current.play) playerRef.current.play();
      },
      pause: () => {
        if (playerRef.current.pauseVideo) playerRef.current.pauseVideo();
        else if (playerRef.current.pause) playerRef.current.pause();
      },
      seekTo: (seconds: number) => {
        if (playerRef.current.seekTo) playerRef.current.seekTo(seconds);
        else if (playerRef.current.setCurrentTime) playerRef.current.setCurrentTime(seconds);
      }
    };
  }, [playerRef.current]);

  if (error) {
    return <div className="w-full h-full bg-black flex items-center justify-center text-white">{error}</div>;
  }

  return <div ref={containerRef} className="w-full h-full bg-black" />;
}
Key fixes:

Multiple YouTube URL pattern matching.

Error states and user feedback.

Safe API loading with callbacks.

Fallback for unsupported platforms.

2. 📁 Add Recent Parties (Archive) Feature
Concept
Store for each participant token the list of sessions they have created or joined. Display the last N sessions (e.g., 10) on the landing page or a separate “Recent Parties” section. Even if a session expires, it remains in the archive for reference.

Supabase Schema Additions
We need a participant_sessions join table to track which participants have been in which sessions (including hosts).

sql
-- Table to track participant session history
CREATE TABLE participant_sessions (
  id BIGSERIAL PRIMARY KEY,
  participant_token UUID NOT NULL REFERENCES participants(token) ON DELETE CASCADE,
  session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('host', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_visited_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_token, session_id)
);
When a user creates a session (host), we insert a record with role 'host'. When they join, role 'member'. On each visit, update last_visited_at.

Query for Recent Parties
sql
SELECT s.*, ps.role, ps.last_visited_at
FROM participant_sessions ps
JOIN sessions s ON ps.session_id = s.id
WHERE ps.participant_token = 'current-token'
ORDER BY ps.last_visited_at DESC
LIMIT 10;
Frontend: Display Recent Parties
Create a new component RecentParties.tsx:

tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RecentSession {
  id: number;
  slug: string;
  role: 'host' | 'member';
  last_visited_at: string;
  metadata?: any;
}

export function RecentParties({ token }: { token: string }) {
  const [sessions, setSessions] = useState<RecentSession[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecent = async () => {
      const { data, error } = await supabase
        .from('participant_sessions')
        .select('session:sessions(*), role, last_visited_at')
        .eq('participant_token', token)
        .order('last_visited_at', { ascending: false })
        .limit(10);
      if (error) console.error(error);
      else setSessions(data.map(item => ({ ...item.session, role: item.role, last_visited_at: item.last_visited_at })));
    };
    fetchRecent();
  }, [token]);

  if (sessions.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Recent Parties</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <Card key={session.id} className="cursor-pointer hover:shadow-lg" onClick={() => navigate(`/party/${session.slug}`)}>
            <CardContent className="p-4">
              <div className="font-semibold">{session.metadata?.title || session.slug}</div>
              <div className="text-sm text-muted-foreground">
                {session.role === 'host' ? 'You hosted' : 'You joined'} • {new Date(session.last_visited_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
Integrate into LandingPage.tsx after the search section, passing the participant token from cookie/localStorage.

3. 🚫 Enforce Max 3 Active Parties Per User (Creation Limit)
Definition
Active session: a session that has not expired (expires_at > now()) AND the user is the host.

Each participant token can be host of at most 3 active sessions at any time.

Supabase RLS + Application Logic
We'll enforce this both via a database function (to be safe) and in the app.

Database Function
sql
CREATE OR REPLACE FUNCTION can_create_session(p_token UUID)
RETURNS BOOLEAN AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO active_count
  FROM sessions s
  JOIN participant_sessions ps ON s.id = ps.session_id
  WHERE ps.participant_token = p_token
    AND ps.role = 'host'
    AND s.expires_at > now();
  RETURN active_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
Then in your insert policy for sessions, add a check:

sql
CREATE POLICY "Users can create up to 3 active sessions"
ON sessions FOR INSERT
WITH CHECK (
  can_create_session(auth.uid()::uuid) -- auth.uid() is from Supabase Auth (anonymous user)
);
But since we are using anonymous sign‑in, we can set the participant token as the auth.uid().

Application‑side check before calling Supabase insert
In createParty function (inside MediaDetailModal.tsx or a hook):

tsx
const checkActiveSessions = async (token: string): Promise<boolean> => {
  const { count, error } = await supabase
    .from('participant_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('participant_token', token)
    .eq('role', 'host')
    .gt('session.expires_at', new Date().toISOString());
  if (error) return false;
  return (count || 0) < 3;
};

const createParty = async (media: MediaItem) => {
  const token = getParticipantToken(); // from cookie/localStorage
  const canCreate = await checkActiveSessions(token);
  if (!canCreate) {
    alert('You already have 3 active parties. Please wait for one to expire or end a session.');
    return;
  }
  // Proceed to insert session
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      slug: generateSlug(),
      host_token: token,
      metadata: { title: media.title, poster: media.poster },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single();
  // Also insert into participant_sessions with role 'host'
  await supabase.from('participant_sessions').insert({
    participant_token: token,
    session_id: data.id,
    role: 'host'
  });
  navigate(`/party/${data.slug}`);
};
For joining (no limits)
We don't check anything; just allow joining any non‑expired session.

4. 🔌 Full Supabase Integration Setup
4.1 Install Supabase client
bash
pnpm add @supabase/supabase-js
4.2 Create Supabase client file
src/lib/supabaseClient.ts

ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
Add these to your .env file (create one if not exists).

4.3 Anonymous Authentication on app start
In App.tsx or a useEffect at root:

tsx
import { supabase } from '@/lib/supabaseClient';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInAnonymously();
      }
      // After sign-in, we can get the user's ID as the participant token
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        localStorage.setItem('tagthr_participant_token', user.id);
      }
    };
    initAuth();
  }, []);
  // ... rest of App
}
Now the user.id becomes the participant token, used for all RLS and queries.

4.4 Database Schema Summary (run in Supabase SQL editor)
sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table
CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  host_token UUID NOT NULL,
  pin_hash TEXT,
  video_url TEXT,
  metadata JSONB,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Participants (optional, but we can use auth.users instead; we'll keep a separate table for additional info)
CREATE TABLE participants (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Participant sessions history
CREATE TABLE participant_sessions (
  id BIGSERIAL PRIMARY KEY,
  participant_token UUID NOT NULL REFERENCES participants(token) ON DELETE CASCADE,
  session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('host', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_visited_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_token, session_id)
);

-- Messages table
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  participant_token UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reports table
CREATE TABLE reports (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
4.5 Real‑time Sync Using Supabase Realtime
Replace Laravel Echo with Supabase Realtime broadcasts.

In SessionPage.tsx:

tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

useEffect(() => {
  const channel = supabase.channel(`session:${slug}`);
  channel
    .on('broadcast', { event: 'playback' }, (payload) => {
      const { playing, time } = payload.payload;
      if (!isHost) {
        const player = (window as any).__tagthrPlayer;
        if (player) {
          if (playing) player.play();
          else player.pause();
          player.seekTo(time);
        }
      }
    })
    .on('broadcast', { event: 'chat' }, (payload) => {
      setMessages(prev => [...prev, payload.payload]);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [slug, isHost]);

// For host sending events
const sendPlayback = (playing: boolean, time: number) => {
  if (isHost) {
    supabase.channel(`session:${slug}`).send({
      type: 'broadcast',
      event: 'playback',
      payload: { playing, time }
    });
  }
};
✅ Summary of Changes to Implement
Feature	Files to modify/create	Key changes
Fix YouTube crash	VideoPlayer.tsx	Robust ID extraction, error handling, safe API loading
Recent Parties	RecentParties.tsx, LandingPage.tsx, Supabase schema (participant_sessions)	Display last 10 visited sessions
Max 3 active parties	createParty function, Supabase RLS, checkActiveSessions	Prevent creation if limit exceeded
Supabase integration	supabaseClient.ts, App.tsx, all data fetching	Replace all local storage with Supabase; use anonymous auth