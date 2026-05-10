/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper to get current participant token
export const getParticipantToken = (): string | null => {
  return localStorage.getItem('tagthr_participant_token');
};

// Helper to set participant token
export const setParticipantToken = (token: string) => {
  localStorage.setItem('tagthr_participant_token', token);
};

// Database types
export interface Session {
  id: number;
  slug: string;
  host_token: string;
  pin_hash?: string;
  video_url?: string;
  metadata?: {
    title?: string;
    poster?: string;
    year?: string;
    rating?: string;
    imdbId?: string;
    type?: 'movie' | 'series';
    tmdbId?: number;
  };
  expires_at: string;
  created_at: string;
}

export interface ParticipantSession {
  id: number;
  participant_token: string;
  session_id: number;
  role: 'host' | 'member';
  joined_at: string;
  last_visited_at: string;
}

export interface Message {
  id: number;
  session_id: number;
  participant_token: string;
  body: string;
  created_at: string;
}

export interface Report {
  id: number;
  message_id: number;
  reported_by: string;
  created_at: string;
}

// ============================================
// DATABASE HELPER FUNCTIONS
// ============================================

// SESSION OPERATIONS
export const sessionOperations = {
  // Create a new session
  async createSession(
    slug: string,
    hostToken: string,
    videoUrl?: string,
    pinHash?: string,
    metadata?: Session['metadata']
  ) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        slug,
        host_token: hostToken,
        video_url: videoUrl || null,
        pin_hash: pinHash || null,
        metadata: metadata || {},
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      throw error;
    }

    return data as Session;
  },

  // Get session by slug
  async getSessionBySlug(slug: string) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching session:', error);
    }

    return data as Session | null;
  },

  // Update session (video URL, metadata, etc.)
  async updateSession(sessionId: number, updates: Partial<Session>) {
    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating session:', error);
      throw error;
    }

    return data as Session;
  },

  // Get active participants count
  async getParticipantsCount(sessionId: number) {
    const { count, error } = await supabase
      .from('participant_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error getting participants count:', error);
      return 0;
    }

    return count || 0;
  },
};

// PARTICIPANT OPERATIONS
export const participantOperations = {
  // Join a session
  async joinSession(
    sessionId: number,
    participantToken: string,
    role: 'host' | 'member' = 'member'
  ) {
    // First, create or update participant record
    await supabase
      .from('participants')
      .upsert({ token: participantToken, last_seen: new Date().toISOString() }, 
        { onConflict: 'token' });

    // Then add to participant_sessions
    const { data, error } = await supabase
      .from('participant_sessions')
      .upsert(
        {
          participant_token: participantToken,
          session_id: sessionId,
          role,
        },
        { onConflict: 'participant_token,session_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error joining session:', error);
      throw error;
    }

    return data as ParticipantSession;
  },

  // Update last visited time
  async updateLastVisited(participantToken: string, sessionId: number) {
    const { error } = await supabase
      .from('participant_sessions')
      .update({ last_visited_at: new Date().toISOString() })
      .eq('participant_token', participantToken)
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error updating last visited:', error);
    }
  },

  // Get session participants
  async getSessionParticipants(sessionId: number) {
    const { data, error } = await supabase
      .from('participant_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching participants:', error);
      return [];
    }

    return (data || []) as ParticipantSession[];
  },

  // Remove participant from session
  async leaveSession(participantToken: string, sessionId: number) {
    const { error } = await supabase
      .from('participant_sessions')
      .delete()
      .eq('participant_token', participantToken)
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error leaving session:', error);
    }
  },
};

// MESSAGE OPERATIONS
export const messageOperations = {
  // Save a message
  async sendMessage(
    sessionId: number,
    participantToken: string,
    body: string
  ) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        participant_token: participantToken,
        body,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    return data as Message;
  },

  // Get messages for a session
  async getMessages(sessionId: number, limit: number = 100) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return (data || []) as Message[];
  },

  // Delete a message (for moderation)
  async deleteMessage(messageId: number) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },
};

// REPORT OPERATIONS
export const reportOperations = {
  // Report a message
  async reportMessage(
    messageId: number,
    reportedBy: string,
    reason?: string
  ) {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        message_id: messageId,
        reported_by: reportedBy,
        reason: reason || 'Inappropriate content',
      })
      .select()
      .single();

    if (error) {
      console.error('Error reporting message:', error);
      throw error;
    }

    return data as Report;
  },

  // Get reports for a session (for host moderation)
  async getSessionReports(sessionId: number) {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        id,
        message_id,
        reported_by,
        created_at,
        message:messages!inner(body, participant_token)
      `)
      .eq('messages.session_id', sessionId);

    if (error) {
      console.error('Error fetching reports:', error);
      return [];
    }

    return data || [];
  },
};

// REALTIME OPERATIONS
export const realtimeOperations = {
  // Subscribe to message updates
  subscribeToMessages(sessionId: number, callback: (message: Message) => void) {
    const subscription = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    return subscription;
  },

  // Subscribe to participant updates
  subscribeToParticipants(
    sessionId: number,
    callback: (participant: ParticipantSession, event: 'INSERT' | 'DELETE') => void
  ) {
    const subscription = supabase
      .channel(`participants:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participant_sessions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const event = payload.eventType as 'INSERT' | 'DELETE' | 'UPDATE';
          if (event === 'INSERT' || event === 'DELETE') {
            callback(payload.new as ParticipantSession, event as 'INSERT' | 'DELETE');
          }
        }
      )
      .subscribe();

    return subscription;
  },

  // Subscribe to session updates
  subscribeToSession(sessionId: number, callback: (session: Session) => void) {
    const subscription = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          callback(payload.new as Session);
        }
      )
      .subscribe();

    return subscription;
  },

  // Broadcast playback state
  broadcastPlaybackState(sessionId: string, state: {
    playing: boolean;
    currentTime: number;
    duration: number;
  }) {
    supabase.channel(`playback:${sessionId}`).send({
      type: 'broadcast',
      event: 'playback_change',
      payload: state,
    });
  },

  // Subscribe to playback state
  subscribeToPlayback(
    sessionId: string,
    callback: (state: { playing: boolean; currentTime: number; duration: number }) => void
  ) {
    const subscription = supabase
      .channel(`playback:${sessionId}`)
      .on('broadcast', { event: 'playback_change' }, (payload) => {
        callback(payload.payload);
      })
      .subscribe();

    return subscription;
  },
};

