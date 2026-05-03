import { useEffect, useState } from 'react';
import { supabase, setParticipantToken, getParticipantToken } from '../lib/supabaseClient';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      // Check if we already have a token
      const existingToken = getParticipantToken();

      // Check current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session && !existingToken) {
        // Sign in anonymously
        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
          console.error('Error signing in anonymously:', error);
          setIsLoading(false);
          return;
        }

        if (data.user) {
          setParticipantToken(data.user.id);
          setUserId(data.user.id);
          setIsAuthenticated(true);
        }
      } else {
        // Use existing session
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setParticipantToken(user.id);
          setUserId(user.id);
          setIsAuthenticated(true);
        } else if (existingToken) {
          // Token exists but no session, use the token
          setUserId(existingToken);
          setIsAuthenticated(true);
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAuthenticated,
    isLoading,
    userId
  };
};
