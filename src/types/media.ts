export interface MediaItem {
  /** Stable key for lists (TMDB-based until IMDb id is known). */
  id: string;
  title: string;
  year: string;
  type: 'movie' | 'series';
  imdbId: string;
  poster: string;
  synopsis?: string;
  rating?: string;
  genre?: string;
  cast?: string;
  tmdbId?: number;
  /** Resolved YouTube (or other) URL for the built-in player; set when creating / joining a party. */
  playbackUrl?: string;
}
