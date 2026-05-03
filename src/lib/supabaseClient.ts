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
