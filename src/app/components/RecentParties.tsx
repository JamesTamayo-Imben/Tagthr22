import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Session, getParticipantToken } from '../../lib/supabaseClient';
import { Clock, Crown, Users } from 'lucide-react';

interface RecentSession extends Session {
  role: 'host' | 'member';
  last_visited_at: string;
}

export default function RecentParties() {
  const [sessions, setSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
        .limit(10);

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

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          Recent Parties
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-4 animate-pulse">
              <div className="h-4 bg-[#2A2A2A] rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-[#2A2A2A] rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return null;
  }

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

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Clock className="w-6 h-6 text-[#8B5CF6]" />
        Recent Parties
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => !isExpired(session.expires_at) && navigate(`/party/${session.slug}`)}
            className={`bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-5 transition-all ${
              !isExpired(session.expires_at)
                ? 'cursor-pointer hover:border-[#8B5CF6] hover:shadow-lg'
                : 'opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="font-semibold text-white truncate">
                  {session.metadata?.title || `Party ${session.slug}`}
                </div>
                <div className="text-sm text-[#9CA3AF] mt-1">
                  {session.metadata?.year && `${session.metadata.year} • `}
                  Room: {session.slug}
                </div>
              </div>
              {session.role === 'host' && (
                <Crown className="w-5 h-5 text-[#F59E0B] flex-shrink-0 ml-2" />
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{session.role === 'host' ? 'You hosted' : 'You joined'}</span>
              </div>
              <span>{formatDate(session.last_visited_at)}</span>
            </div>

            {isExpired(session.expires_at) && (
              <div className="mt-2 px-2 py-1 bg-[#EF4444]/20 text-[#EF4444] text-xs rounded text-center">
                Expired
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
