import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Crown,
  Copy,
  Lock,
  Wifi,
  LogOut,
  Film,
  UserX,
  Send,
  Flag,
  AlertCircle,
  Star,
  Video,
  Search,
  MoreVertical,
  Power,
  RotateCw
} from 'lucide-react';
import Navigation from './Navigation';
import SearchBar from './SearchBar';
import SearchResultCard from './SearchResultCard';
import MediaDetailModal from './MediaDetailModal';
import VideoPlayer, { VideoPlayerHandle } from './VideoPlayer';
import { MediaItem, SearchResponse } from '../../types/media';
import {
  getParticipantToken,
  sessionOperations,
  participantOperations,
  messageOperations,
  realtimeOperations,
  Session,
} from '../../lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isOnline: boolean;
  lastSeen: Date;
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
}

interface MediaInfo {
  title: string;
  year: string;
  poster: string;
  rating?: string;
  type: 'movie' | 'series';
  imdbId?: string;
}

export default function SessionPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const pin = searchParams.get('pin');
  const mediaFromState = location.state?.media;
  const playerRef = useRef<VideoPlayerHandle>(null);
  const videoRef = playerRef; // Alias for compatibility

  const [isHost, setIsHost] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [heartbeatStatus, setHeartbeatStatus] = useState<'green' | 'yellow' | 'red'>('green');
  const [chatMessage, setChatMessage] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const [showChangeMedia, setShowChangeMedia] = useState(false);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(mediaFromState || null);
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Supabase state
  const [session, setSession] = useState<Session | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [participantToken, setParticipantToken] = useState<string | null>(null);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const messagesSubscriptionRef = useRef<RealtimeChannel | null>(null);
  const participantsSubscriptionRef = useRef<RealtimeChannel | null>(null);
  const playbackSubscriptionRef = useRef<RealtimeChannel | null>(null);
  const firstPlaybackSyncRef = useRef<boolean>(false); // Track if first sync has occurred
  const lastPlaybackStateRef = useRef<{playing: boolean; currentTime: number; duration: number} | null>(null); // Store last playback state
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef<number>(0); // Track current playback time locally

  // Auto-play video when participant joins from recent parties and sync to host position
  useEffect(() => {
    if (videoUrl && !isHost && playerRef.current) {
      // Reset first sync flag when video URL changes
      firstPlaybackSyncRef.current = false;
      
      // Small delay to ensure player is fully loaded
      const timer = setTimeout(() => {
        // If we have a last known playback state, sync to it
        if (lastPlaybackStateRef.current) {
          console.log('🔄 Syncing participant to last known state:', lastPlaybackStateRef.current.currentTime);
          playerRef.current?.seekTo(lastPlaybackStateRef.current.currentTime);
          currentTimeRef.current = lastPlaybackStateRef.current.currentTime;
          
          if (lastPlaybackStateRef.current.playing) {
            playerRef.current?.play().catch((err: any) => {
              console.warn('Auto-play blocked:', err);
            });
          }
        } else {
          // No previous state, just try to auto-play
          playerRef.current?.play().catch((err: any) => {
            console.log('Auto-play request (may be blocked by browser policy):', err);
          });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [videoUrl, isHost]);

  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      setHeartbeatStatus((prev) => (prev === 'green' ? 'yellow' : 'green'));
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, []);

  // Full Supabase integration: fetch session, determine host, join participant, load data, setup realtime subscriptions
  useEffect(() => {
    const initDb = async () => {
      try {
        const token = getParticipantToken();
        if (!token || !slug) return;

        setParticipantToken(token);

        // Fetch session by slug
        const sessionData = await sessionOperations.getSessionBySlug(slug);
        if (!sessionData) {
          console.error('Session not found');
          return;
        }

        setSession(sessionData);
        setSessionId(sessionData.id);

        // Set video URL and media info from database or state
        if (sessionData.video_url) {
          setVideoUrl(sessionData.video_url);
        }
        if (sessionData.metadata && sessionData.metadata.title) {
          setMediaInfo({
            title: sessionData.metadata.title,
            year: sessionData.metadata.year || '',
            poster: sessionData.metadata.poster || '',
            rating: sessionData.metadata.rating,
            type: 'movie', // Default type since metadata doesn't store this
            imdbId: sessionData.metadata.imdbId,
          });
        } else if (mediaFromState) {
          // Fallback to state if not in DB yet
          setMediaInfo(mediaFromState);
          if (mediaFromState.poster) {
            setVideoUrl(mediaFromState.poster);
          }
        }

        // Determine if current user is host
        const isUserHost = sessionData.host_token === token;
        setIsHost(isUserHost);

        // Join as participant
        await participantOperations.joinSession(sessionData.id, token);

        // Load existing messages from DB
        const existingMessages = await messageOperations.getMessages(sessionData.id);
        if (existingMessages && existingMessages.length > 0) {
          setChatMessages(
            existingMessages.map((msg: any) => ({
              id: msg.id.toString(),
              user: msg.participant_token.slice(0, 4).toUpperCase(),
              message: msg.body,
              timestamp: new Date(msg.created_at),
            }))
          );
        }

        // Load participants from DB
        const dbParticipants = await participantOperations.getSessionParticipants(sessionData.id);
        if (dbParticipants && dbParticipants.length > 0) {
          setParticipants(
            dbParticipants.map((p: any) => ({
              id: p.participant_token,
              name: `Anonymous#${p.participant_token.slice(0, 4).toUpperCase()}`,
              isHost: p.participant_token === sessionData.host_token,
              isOnline: true,
              lastSeen: new Date(p.last_visited),
            }))
          );
        }

        // Setup realtime subscription for messages
        const messagesChannel = realtimeOperations.subscribeToMessages(
          sessionData.id,
          (newMessage: any) => {
            setChatMessages((prev) => [
              ...prev,
              {
                id: newMessage.id.toString(),
                user: newMessage.participant_token.slice(0, 4).toUpperCase(),
                message: newMessage.body,
                timestamp: new Date(newMessage.created_at),
              },
            ]);
          }
        );
        messagesSubscriptionRef.current = messagesChannel;

        // Setup realtime subscription for participants
        const participantsChannel = realtimeOperations.subscribeToParticipants(
          sessionData.id,
          (participant: any, event: 'INSERT' | 'DELETE') => {
            // Reload participants list when someone joins or leaves
            participantOperations.getSessionParticipants(sessionData.id).then((dbParticipants) => {
              if (dbParticipants && dbParticipants.length > 0) {
                setParticipants(
                  dbParticipants.map((p: any) => ({
                    id: p.participant_token,
                    name: `Anonymous#${p.participant_token.slice(0, 4).toUpperCase()}`,
                    isHost: p.participant_token === sessionData.host_token,
                    isOnline: true,
                    lastSeen: new Date(p.last_visited_at),
                  }))
                );
              }
            });
          }
        );
        participantsSubscriptionRef.current = participantsChannel;

        // Setup playback sync subscription (non-hosts listen for playback state from host)
        if (!isUserHost) {
          const playbackChannel = realtimeOperations.subscribeToPlayback(
            sessionData.id.toString(),
            (playbackState: any) => {
              // Store the last playback state for late joiners
              lastPlaybackStateRef.current = playbackState;
              
              // Update video player position and play state
              if (videoRef.current) {
                if (playbackState.playing) {
                  // Ensure auto-play when host is playing
                  console.log('🎬 Host is playing, auto-playing participant video');
                  videoRef.current.play().catch((err: any) => {
                    console.warn('Auto-play blocked:', err);
                  });
                } else {
                  videoRef.current.pause();
                }
                
                // For first sync or significant time differences, sync to host position
                const timeDiff = Math.abs(currentTimeRef.current - playbackState.currentTime);
                if (!firstPlaybackSyncRef.current || timeDiff > 0.5) {
                  videoRef.current.seekTo(playbackState.currentTime);
                  currentTimeRef.current = playbackState.currentTime;
                  console.log('✅ Participant synced to:', playbackState.currentTime);
                  firstPlaybackSyncRef.current = true; // Mark first sync as done
                }
              }
            }
          );
          playbackSubscriptionRef.current = playbackChannel;
        }
      } catch (err) {
        console.error('Supabase init error:', err);
      }
    };

    initDb();

    // Cleanup subscriptions on unmount
    return () => {
      if (messagesSubscriptionRef.current) {
        messagesSubscriptionRef.current.unsubscribe();
      }
      if (participantsSubscriptionRef.current) {
        participantsSubscriptionRef.current.unsubscribe();
      }
      if (playbackSubscriptionRef.current) {
        playbackSubscriptionRef.current.unsubscribe();
      }
    };
  }, [slug]);

  const copyInviteLink = () => {
    const link = pin ? `${window.location.origin}/party/${slug}?pin=${pin}` : `${window.location.origin}/party/${slug}`;
    navigator.clipboard.writeText(link);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const sendMessage = async () => {
    if (!chatMessage.trim() || !sessionId || !participantToken) return;

    try {
      // Persist message to Supabase
      await messageOperations.sendMessage(sessionId, participantToken, chatMessage);
      // Message will appear via realtime subscription
    } catch (err) {
      console.error('Error sending message:', err);
      // Fallback: add message locally so it doesn't disappear
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          user: `Anonymous#${participantToken.slice(0, 4).toUpperCase()}`,
          message: chatMessage,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatMessage('');
    }
  };

  const kickParticipant = async (id: string) => {
    try {
      // Remove participant from database
      if (sessionId) {
        await participantOperations.leaveSession(id, sessionId);
      }
      // Update UI
      setParticipants(participants.filter((p) => p.id !== id));
      setChatMessages([
        ...chatMessages,
        {
          id: Date.now().toString(),
          user: 'System',
          message: `User has been removed from the room`,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error('Error kicking participant:', err);
    }
  };

  const updateVideoUrl = async () => {
    if (!newVideoUrl.trim()) return;

    try {
      // Update local state
      setVideoUrl(newVideoUrl);
      setNewVideoUrl('');
      setMediaInfo(null);

      // ✅ CRITICAL: Save to Supabase database
      if (sessionId && isHost) {
        await sessionOperations.updateSession(sessionId, {
          video_url: newVideoUrl,
          metadata: {}, // Keep existing metadata
        });
        console.log('✅ Video URL saved to Supabase:', newVideoUrl);
      }
    } catch (err) {
      console.error('❌ Error updating video URL:', err);
      // Show error to user
      alert('Failed to update video URL. Please try again.');
    }
  };

  const leaveSession = async () => {
    try {
      // Leave session in database
      if (participantToken && sessionId) {
        await participantOperations.leaveSession(participantToken, sessionId);
      }
    } catch (err) {
      console.error('Error leaving session:', err);
    } finally {
      navigate('/');
    }
  };

  const endSession = async () => {
    try {
      // End the session and close for all participants
      if (sessionId && participantToken) {
        // Leave the session yourself first
        await participantOperations.leaveSession(participantToken, sessionId);
      }
      setShowMenuDropdown(false);
      navigate('/');
    } catch (err) {
      console.error('Error ending session:', err);
    }
  };

  const transferHost = async () => {
    if (participants.length > 1 && sessionId && isHost) {
      const nonHostParticipants = participants.filter(p => !p.isHost);
      if (nonHostParticipants.length > 0) {
        try {
          const newHostToken = nonHostParticipants[0].id;
          // Update session with new host token
          await sessionOperations.updateSession(sessionId, { host_token: newHostToken });
          // Update local state
          setParticipants(prev => prev.map(p => ({
            ...p,
            isHost: p.id === newHostToken
          })));
          setIsHost(false);
          setShowMenuDropdown(false);
          alert('Host transferred successfully!');
        } catch (err) {
          console.error('Error transferring host:', err);
          alert('Failed to transfer host');
        }
      }
    }
  };

  const resetSession = async () => {
    if (sessionId && isHost) {
      try {
        // Clear video URL and metadata
        await sessionOperations.updateSession(sessionId, { 
          video_url: null,
          metadata: null
        });
        // Update local state
        setVideoUrl('');
        setNewVideoUrl('');
        setMediaInfo(null);
        setSearchResults([]);
        setChatMessages([]);
        setShowMenuDropdown(false);
        alert('Session reset successfully!');
      } catch (err) {
        console.error('Error resetting session:', err);
        alert('Failed to reset session');
      }
    }
  };

  // Broadcast seek position to all participants (debounced)
  const broadcastPlaybackSeek = useCallback(async (seekTime: number) => {
    if (!isHost || !sessionId) return;
    try {
      await realtimeOperations.broadcastPlaybackState(sessionId.toString(), {
        playing: true,
        currentTime: seekTime,
        duration: 0,
      });
      console.log('✅ Broadcasted seek position:', seekTime);
    } catch (err) {
      console.error('Error broadcasting seek:', err);
    }
  }, [isHost, sessionId]);

  // Create debounced version of broadcastPlaybackSeek
  const debouncedSeekRef = useRef<(time: number) => void | null>(null);
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    debouncedSeekRef.current = (time: number) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => broadcastPlaybackSeek(time), 300);
    };
    return () => clearTimeout(timeoutId);
  }, [broadcastPlaybackSeek]);

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

  const debouncedSearch = useCallback(
    (func: (q: string) => Promise<void>, delay: number) => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(query), delay);
      };
    },
    []
  )(searchMedia, 500);

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
    setMediaInfo({
      title: media.title,
      year: media.year,
      poster: media.poster,
      rating: media.rating,
      type: media.type,
      imdbId: media.imdbId,
    });
    setShowChangeMedia(false);
    setSearchResults([]);
    setSelectedMedia(null);
    setVideoUrl('');

    // Persist media metadata to database
    if (sessionId && isHost) {
      sessionOperations.updateSession(sessionId, {
        metadata: {
          title: media.title,
          year: media.year,
          poster: media.poster,
          rating: media.rating,
          imdbId: media.imdbId,
        },
        video_url: media.poster, // Use poster as video URL for display
      }).catch((err) => console.error('Error updating session metadata:', err));
    }
  };

  const handlePlaybackChange = async (state: { playing: boolean; time: number }) => {
    if (isHost && sessionId && videoRef.current) {
      try {
        // Track current time locally
        currentTimeRef.current = state.time;
        
        // Broadcast playback state to all participants
        await realtimeOperations.broadcastPlaybackState(sessionId.toString(), {
          playing: state.playing,
          currentTime: state.time,
          duration: 0, // Duration would need to be tracked separately; using 0 for now
        });
      } catch (err) {
        console.error('Error broadcasting playback state:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <div className="bg-[#1A1A1A] border-b border-[#2A2A2A] px-4 lg:px-8 pt-24 pb-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-[#9CA3AF]">Room:</span>
              <code className="px-3 py-1 bg-[#0A0A0A] rounded-lg">{slug}</code>
              <button
                onClick={copyInviteLink}
                className="px-3 py-1 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {showCopied ? 'Copied' : 'Copy Link'}
              </button>
            </div>
            {pin && (
              <div className="flex items-center gap-2 text-[#F59E0B]">
                <Lock className="w-4 h-4" />
                <span>PIN: {pin}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${heartbeatStatus === 'green' ? 'bg-[#10B981]' : heartbeatStatus === 'yellow' ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'} animate-pulse`}></div>
              <Wifi className="w-4 h-4 text-[#9CA3AF]" />
              <span className="text-sm text-[#9CA3AF]">Connected</span>
            </div>
            
            {isHost && (
              <div className="relative" ref={menuDropdownRef}>
                <button
                  onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                  className="px-3 py-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
                  title="More options"
                >
                  <MoreVertical className="w-5 h-5 text-[#9CA3AF]" />
                </button>
                
                {showMenuDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-lg z-50">
                    <button
                      onClick={endSession}
                      className="w-full px-4 py-2 text-left text-[#EF4444] hover:bg-[#2A2A2A] flex items-center gap-2 rounded-t-lg transition-colors"
                    >
                      <Power className="w-4 h-4" />
                      End Session
                    </button>
                    <button
                      onClick={transferHost}
                      className="w-full px-4 py-2 text-left text-[#8B5CF6] hover:bg-[#2A2A2A] flex items-center gap-2 transition-colors"
                    >
                      <Crown className="w-4 h-4" />
                      Transfer Host
                    </button>
                    <button
                      onClick={resetSession}
                      className="w-full px-4 py-2 text-left text-[#F59E0B] hover:bg-[#2A2A2A] flex items-center gap-2 rounded-b-lg transition-colors"
                    >
                      <RotateCw className="w-4 h-4" />
                      Reset Session
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={leaveSession}
              className="px-4 py-2 border border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444] hover:text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Leave
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] gap-6">
          <div className="space-y-6">
            <div className="aspect-video bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] flex items-center justify-center relative overflow-hidden">
              {videoUrl ? (
                <VideoPlayer
                  ref={playerRef}
                  url={videoUrl}
                  onStateChange={handlePlaybackChange}
                  onSeek={debouncedSeekRef.current ? (time) => debouncedSeekRef.current!(time) : undefined}
                  isHost={isHost}
                />
              ) : (
                <div className="text-center space-y-4">
                  <Video className="w-16 h-16 text-[#9CA3AF] mx-auto" />
                  <p className="text-[#9CA3AF]">No video loaded yet</p>
                  {!isHost && (
                    <div className="flex items-center justify-center gap-2 text-sm text-[#9CA3AF]">
                      <AlertCircle className="w-4 h-4" />
                      <span>Host is controlling playback</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {mediaInfo && (
              <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-4 flex items-center gap-4">
                <div className="w-16 h-24 rounded-lg overflow-hidden bg-[#0A0A0A] flex-shrink-0">
                  {mediaInfo.poster && mediaInfo.poster !== 'N/A' ? (
                    <img
                      src={mediaInfo.poster}
                      alt={mediaInfo.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Film className="w-full h-full p-2 text-[#9CA3AF]" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{mediaInfo.title}</h3>
                  <p className="text-sm text-[#9CA3AF]">{mediaInfo.year}</p>
                  {mediaInfo.rating && mediaInfo.rating !== 'N/A' && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                      <span className="text-sm">{mediaInfo.rating}</span>
                    </div>
                  )}
                  {mediaInfo.imdbId && (
                    <p className="text-xs text-[#9CA3AF] mt-1">IMDb: {mediaInfo.imdbId}</p>
                  )}
                </div>
              </div>
            )}

            {isHost && (
              <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#F59E0B]" />
                  <h3 className="font-semibold">Host Controls</h3>
                </div>

                <button
                  onClick={() => setShowChangeMedia(true)}
                  className="w-full px-4 py-3 bg-[#06B6D4] hover:bg-[#0891B2] rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search & Change Media
                </button>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Or paste YouTube/Vimeo URL"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="flex-1 px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg focus:outline-none focus:border-[#8B5CF6] transition-colors"
                  />
                  <button
                    onClick={updateVideoUrl}
                    className="px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg font-medium transition-colors"
                  >
                    Update
                  </button>
                </div>

                <button className="w-full px-6 py-3 bg-[#EF4444] hover:bg-[#DC2626] rounded-lg font-medium transition-colors">
                  End Session
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <h3 className="font-semibold">Participants</h3>
                <span className="text-sm text-[#9CA3AF]">{participants.length} / 30</span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center">
                        <span className="text-sm font-bold">{participant.name[0]}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{participant.name}</span>
                          {participant.isHost && <Crown className="w-4 h-4 text-[#F59E0B]" />}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${participant.isOnline ? 'bg-[#10B981]' : 'bg-[#9CA3AF]'}`}></div>
                          <span className="text-xs text-[#9CA3AF]">
                            {participant.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isHost && !participant.isHost && (
                      <button
                        onClick={() => kickParticipant(participant.id)}
                        className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-[#EF4444] hover:bg-[#DC2626] rounded text-xs transition-all flex items-center gap-1"
                      >
                        <UserX className="w-3 h-3" />
                        Kick
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6">
              <h3 className="font-semibold mb-4">Chat</h3>
              <div className="space-y-3 h-64 overflow-y-auto mb-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#8B5CF6]">{msg.user}</span>
                      {msg.user !== 'System' && (
                        <button className="text-xs text-[#9CA3AF] hover:text-[#EF4444] flex items-center gap-1">
                          <Flag className="w-3 h-3" />
                          Report
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-[#E5E7EB]">{msg.message}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs text-[#F59E0B]">Slow mode: 10 msg / 30s</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg focus:outline-none focus:border-[#06B6D4] transition-colors"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-[#06B6D4] hover:bg-[#0891B2] rounded-lg transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showChangeMedia && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] max-w-6xl w-full my-8">
            <div className="sticky top-0 bg-[#1A1A1A] border-b border-[#2A2A2A] p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold">Change Media</h2>
              <button
                onClick={() => {
                  setShowChangeMedia(false);
                  setSearchResults([]);
                }}
                className="text-[#9CA3AF] hover:text-white transition-colors"
              >
                <span className="text-3xl">×</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <SearchBar onSearch={handleSearch} loading={loading} />

              {searchResults.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {searchResults.map((result) => (
                    <SearchResultCard
                      key={result.imdbId}
                      result={result}
                      onPreview={setSelectedMedia}
                      onSelect={handleMediaSelect}
                    />
                  ))}
                </div>
              )}

              {!loading && searchResults.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-[#9CA3AF]">Search for movies and TV series</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <MediaDetailModal
        media={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        onCreateParty={handleMediaSelect}
      />
    </div>
  );
}
