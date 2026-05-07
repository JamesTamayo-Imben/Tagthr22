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

  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'Anonymous#1234', isHost: true, isOnline: true, lastSeen: new Date() },
    { id: '2', name: 'Anonymous#5678', isHost: false, isOnline: true, lastSeen: new Date() },
    { id: '3', name: 'Anonymous#9012', isHost: false, isOnline: true, lastSeen: new Date() },
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'Anonymous#1234', message: 'Hey everyone!', timestamp: new Date() },
    { id: '2', user: 'Anonymous#5678', message: 'Ready to watch!', timestamp: new Date() },
  ]);

  // Supabase state
  const [session, setSession] = useState<Session | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [participantToken, setParticipantToken] = useState<string | null>(null);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const messagesSubscriptionRef = useRef<RealtimeChannel | null>(null);
  const participantsSubscriptionRef = useRef<RealtimeChannel | null>(null);
  const playbackSubscriptionRef = useRef<RealtimeChannel | null>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);

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
              message: msg.content,
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
                message: newMessage.content,
                timestamp: new Date(newMessage.created_at),
              },
            ]);
          }
        );
        messagesSubscriptionRef.current = messagesChannel;

        // Setup realtime subscription for participants
        const participantsChannel = realtimeOperations.subscribeToParticipants(
          sessionData.id,
          (participants: any[]) => {
            setParticipants(
              participants.map((p: any) => ({
                id: p.participant_token,
                name: `Anonymous#${p.participant_token.slice(0, 4).toUpperCase()}`,
                isHost: p.participant_token === sessionData.host_token,
                isOnline: true,
                lastSeen: new Date(p.last_visited),
              }))
            );
          }
        );
        participantsSubscriptionRef.current = participantsChannel;

        // Setup playback sync subscription (non-hosts listen for playback state from host)
        if (!isUserHost) {
          const playbackChannel = realtimeOperations.subscribeToPlayback(
            sessionData.id,
            (playbackState: any) => {
              // Update video player position and play state
              if (videoRef.current) {
                if (playbackState.is_playing) {
                  videoRef.current.play();
                } else {
                  videoRef.current.pause();
                }
                if (Math.abs(videoRef.current.currentTime - playbackState.current_time) > 1) {
                  videoRef.current.seekTo(playbackState.current_time);
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
      await participantOperations.leaveSession(id);
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

  const updateVideoUrl = () => {
    if (newVideoUrl.trim()) {
      setVideoUrl(newVideoUrl);
      setNewVideoUrl('');
      setMediaInfo(null);
    }
  };

  const leaveSession = async () => {
    try {
      // Leave session in database
      if (participantToken) {
        await participantOperations.leaveSession(participantToken);
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
      if (sessionId) {
        await sessionOperations.updateSession(sessionId, { is_active: false });
      }
      setShowMenuDropdown(false);
      navigate('/');
    } catch (err) {
      console.error('Error ending session:', err);
    }
  };

  const transferHost = () => {
    if (participants.length > 1) {
      const nonHostParticipants = participants.filter(p => !p.isHost);
      if (nonHostParticipants.length > 0) {
        // In a real implementation, you'd open a dialog to select who to transfer to
        const newHost = nonHostParticipants[0];
        setParticipants(prev => prev.map(p => ({
          ...p,
          isHost: p.id === newHost.id
        })));
        setIsHost(false);
        setShowMenuDropdown(false);
        // TODO: Persist this to database
      }
    }
  };

  const resetSession = () => {
    // Clear all participants except host and reset video
    setParticipants(prev => prev.filter(p => p.isHost));
    setVideoUrl('');
    setNewVideoUrl('');
    setMediaInfo(null);
    setSearchResults([]);
    setChatMessages([]);
    setShowMenuDropdown(false);
    // TODO: Persist these changes to database
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
  };

  const handlePlaybackChange = async (state: { playing: boolean; time: number }) => {
    if (isHost && sessionId && videoRef.current) {
      try {
        // Get current video duration
        const duration = await videoRef.current.getCurrentTime(); // This gets current time, we'll use a default duration
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

      <div className="bg-[#1A1A1A] border-b border-[#2A2A2A] px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
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

          <div className="flex items-center gap-4">
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
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          <div className="space-y-6">
            <div className="aspect-video bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] flex items-center justify-center relative overflow-hidden">
              {videoUrl ? (
                <VideoPlayer
                  ref={playerRef}
                  url={videoUrl}
                  onStateChange={handlePlaybackChange}
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

                <div className="flex gap-2">
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
              <div className="flex items-center justify-between mb-4">
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
                <div className="flex gap-2">
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
