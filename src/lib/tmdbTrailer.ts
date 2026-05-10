import { tmdbGet } from './tmdbApi';
import type { MediaItem } from '../types/media';

interface TmdbVideoRow {
  key: string;
  site: string;
  type: string;
  official?: boolean;
}

/**
 * Returns a YouTube watch URL playable by {@link VideoPlayer}, or null if none.
 */
export async function resolvePlaybackUrl(media: MediaItem): Promise<string | null> {
  if (media.tmdbId == null) return null;
  const kind = media.type === 'movie' ? 'movie' : 'tv';
  const path = kind === 'movie' ? `/movie/${media.tmdbId}/videos` : `/tv/${media.tmdbId}/videos`;
  const res = await tmdbGet(path, {});
  if (!res.ok) return null;
  const data = (await res.json()) as { results?: TmdbVideoRow[] };
  const youtube = (data.results || []).filter((v) => v.site === 'YouTube' && v.key);
  const pick =
    youtube.find((v) => v.type === 'Trailer' && v.official) ||
    youtube.find((v) => v.type === 'Trailer') ||
    youtube.find((v) => v.type === 'Teaser') ||
    youtube[0];
  if (!pick) return null;
  return `https://www.youtube.com/watch?v=${pick.key}`;
}
