import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase, Session, getParticipantToken, sessionOperations, participantOperations } from '../../lib/supabaseClient';
import { Clock, Crown, Users, Play, Lock, MoreVertical, Power, RotateCw } from 'lucide-react';
import Navigation from './Navigation';

interface RecentSession extends Session {
  role: 'host' | 'member';
  last_visited_at: string;
}

export default function RecentParties() {
  const [sessions, setSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchRecentSessions();
  }, []);

  const fetchRecentSessions = async () => {
    const token = getParticipantToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('participant_sessions')
        .select(`
          role,
          last_visited_at,
          session:sessions(*)
        `)
        .eq('participant_token', token)
        .order('last_visited_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching recent sessions:', error);
      } else if (data) {
        const formattedSessions = data
          .filter(item => item.session)
          .map(item => {
            const session = item.session as any;
            return {
              id: session.id,
              slug: session.slug,
              host_token: session.host_token,
              pin_hash: session.pin_hash,
              video_url: session.video_url,
              metadata: session.metadata,
              expires_at: session.expires_at,
              created_at: session.created_at,
              role: item.role,
              last_visited_at: item.last_visited_at
            } as RecentSession;
          });
        setSessions(formattedSessions);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const handleEndSession = async (sessionId: number) => {
    try {
      await sessionOperations.updateSession(sessionId, { is_active: false });
      // Refresh the list
      await fetchRecentSessions();
      setOpenMenuId(null);
      alert('Session ended successfully');
    } catch (err) {
      console.error('Error ending session:', err);
      alert('Failed to end session');
    }
  };

  const handleTransferHost = async (session: RecentSession) => {
    if (session.role === 'host') {
      try {
        // Get all participants in this session
        const participants = await participantOperations.getSessionParticipants(session.id);
        if (participants && participants.length > 1) {
          // Find first non-host participant
          const token = getParticipantToken();
          const newHost = participants.find(p => p.participant_token !== token);
          if (newHost) {
            // Transfer host to the new participant
            await sessionOperations.updateSession(session.id, { 
              host_token: newHost.participant_token 
            });
            await fetchRecentSessions();
            setOpenMenuId(null);
            alert('Host transferred successfully');
          } else {
            alert('No other participants to transfer host to');
          }
        } else {
          alert('No other participants in this session');
        }
      } catch (err) {
        console.error('Error transferring host:', err);
        alert('Failed to transfer host');
      }
    }
  };

  const handleResetSession = async (sessionId: number) => {
    try {
      // Reset session by clearing video and metadata
      await sessionOperations.updateSession(sessionId, { 
        video_url: null,
        metadata: null
      });
      // Refresh the list
      await fetchRecentSessions();
      setOpenMenuId(null);
      alert('Session reset successfully');
    } catch (err) {
      console.error('Error resetting session:', err);
      alert('Failed to reset session');
    }
  };

  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {location.pathname !== '/' && <Navigation/>}

    <main className={`${!isHome ? 'px-4 lg:px-8 pb-12 lg:pb-20' : ''} relative max-w-7xl mx-auto mt-4 pt-24`}>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="w-6 h-6 text-[#06B6D4]" />
          <h2 className="text-2xl font-bold">Recent Parties</h2>
        </div>
        <p className="text-[#9CA3AF]">Join your previous watch parties</p>
      </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6 animate-pulse">
                <div className="h-6 bg-[#2A2A2A] rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-[#2A2A2A] rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-[#2A2A2A] rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4 opacity-50" />
            <p className="text-[#9CA3AF] text-lg mb-6">No recent parties yet</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-[#06B6D4] hover:bg-[#0891B2] rounded-lg font-medium transition-colors"
            >
              Create Your First Party
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => !isExpired(session.expires_at) && navigate(`/party/${session.slug}`)}
                className={`group bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6 transition-all ${
                  !isExpired(session.expires_at)
                    ? 'cursor-pointer hover:border-[#06B6D4] hover:bg-[#1A1A1A]/80 hover:shadow-xl hover:shadow-[#06B6D4]/10'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-white truncate group-hover:text-[#06B6D4] transition-colors">
                      {session.metadata?.title || `Party ${session.slug}`}
                    </h3>
                    <div className="text-sm text-[#9CA3AF] mt-1 flex items-center gap-2">
                      {session.pin_hash && (
                        <Lock className="w-3 h-3" />
                      )}
                      <span>Room: <code className="bg-[#0A0A0A] px-2 py-1 rounded text-xs">{session.slug}</code></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {session.role === 'host' && (
                      <Crown className="w-5 h-5 text-[#F59E0B]" />
                    )}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === session.id ? null : session.id);
                        }}
                        className="p-1 hover:bg-[#2A2A2A] rounded transition-colors"
                        title="More options"
                      >
                        <MoreVertical className="w-5 h-5 text-[#9CA3AF] hover:text-white" />
                      </button>
                      
                      {openMenuId === session.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-lg z-50">
                          {session.role === 'host' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTransferHost(session);
                                }}
                                className="w-full px-4 py-2 text-left text-[#8B5CF6] hover:bg-[#2A2A2A] flex items-center gap-2 transition-colors"
                              >
                                <Crown className="w-4 h-4" />
                                Transfer Host
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResetSession(session.id);
                                }}
                                className="w-full px-4 py-2 text-left text-[#F59E0B] hover:bg-[#2A2A2A] flex items-center gap-2 transition-colors"
                              >
                                <RotateCw className="w-4 h-4" />
                                Reset Session
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEndSession(session.id);
                            }}
                            className={`w-full px-4 py-2 text-left text-[#EF4444] hover:bg-[#2A2A2A] flex items-center gap-2 transition-colors ${session.role === 'host' ? 'rounded-b-lg' : 'rounded-lg'}`}
                          >
                            <Power className="w-4 h-4" />
                            End Session
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {session.metadata?.year && (
                  <p className="text-sm text-[#9CA3AF] mb-4">Year: {session.metadata.year}</p>
                )}

                <div className="flex items-center justify-between text-sm text-[#9CA3AF] mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{session.role === 'host' ? 'You hosted' : 'You joined'}</span>
                  </div>
                  <span>{formatDate(session.last_visited_at)}</span>
                </div>

                {isExpired(session.expires_at) ? (
                  <div className="px-4 py-2 bg-[#EF4444]/20 text-[#EF4444] text-sm rounded-lg text-center font-medium">
                    Expired
                  </div>
                ) : (
                  <button
                    className="w-full px-4 py-2 bg-[#06B6D4] hover:bg-[#0891B2] rounded-lg font-medium transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/party/${session.slug}`);
                    }}
                  >
                    <Play className="w-4 h-4" />
                    Continue Watching
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
    </main>
    </div>


  );
}
