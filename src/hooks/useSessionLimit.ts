import { useState, useCallback } from 'react';
import { supabase, getParticipantToken } from '../lib/supabaseClient';

export const useSessionLimit = () => {
  const [isChecking, setIsChecking] = useState(false);

  const checkCanCreateSession = useCallback(async (): Promise<{
    canCreate: boolean;
    activeCount: number;
    error?: string;
  }> => {
    setIsChecking(true);

    try {
      const token = getParticipantToken();
      if (!token) {
        return { canCreate: false, activeCount: 0, error: 'Not authenticated' };
      }

      // Query for active sessions where user is host
      const { data: participantSessions, error: queryError } = await supabase
        .from('participant_sessions')
        .select(`
          session:sessions!inner(
            id,
            expires_at
          )
        `)
        .eq('participant_token', token)
        .eq('role', 'host')
        .gt('sessions.expires_at', new Date().toISOString());

      if (queryError) {
        console.error('Error checking session limit:', queryError);
        return { canCreate: true, activeCount: 0, error: 'Error checking limit' };
      }

      const activeCount = participantSessions?.length || 0;
      const canCreate = activeCount < 3;

      return { canCreate, activeCount };
    } catch (err) {
      console.error('Session limit check error:', err);
      return { canCreate: true, activeCount: 0, error: 'Unknown error' };
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    checkCanCreateSession,
    isChecking
  };
};
