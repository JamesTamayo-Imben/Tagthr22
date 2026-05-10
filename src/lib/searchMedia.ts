import type { MediaItem } from '../types/media';
import { tmdbGet, isMediaSearchConfigured } from './tmdbApi';

export { isMediaSearchConfigured };

export class MediaSearchConfigError extends Error {
  override name = 'MediaSearchConfigError';
}

interface TmdbMultiRow {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  overview?: string;
  vote_average?: number;
}

async function fetchImdbForTmdb(mediaType: 'movie' | 'tv', tmdbId: number): Promise<string> {
  const sub = mediaType === 'movie' ? `movie/${tmdbId}/external_ids` : `tv/${tmdbId}/external_ids`;
  const res = await tmdbGet(`/${sub}`, {});
  if (!res.ok) return '';
  const data = (await res.json()) as { imdb_id?: string };
  const id = data.imdb_id;
  return id && id.startsWith('tt') ? id : '';
}

export interface TmdbSearchPageResult {
  items: MediaItem[];
  tmdbPage: number;
  tmdbTotalPages: number;
  totalResults: number;
}

/**
 * One TMDB `search/multi` page (up to ~20 rows; filtered to movies + TV only).
 */
export async function searchMoviesAndSeriesTmdbPage(
  query: string,
  tmdbPage: number
): Promise<TmdbSearchPageResult> {
  if (!isMediaSearchConfigured()) {
    throw new MediaSearchConfigError(
      'Add VITE_TMDB_READ_ACCESS_TOKEN or VITE_TMDB_API_KEY to your .env (free at themoviedb.org/settings/api).'
    );
  }

  const q = query.trim();
  if (!q) {
    return { items: [], tmdbPage: 1, tmdbTotalPages: 1, totalResults: 0 };
  }

  const res = await tmdbGet('/search/multi', {
    query: q,
    include_adult: 'false',
    page: String(Math.max(1, tmdbPage)),
  });

  if (!res.ok) {
    throw new Error(`TMDB search failed (${res.status})`);
  }

  const json = (await res.json()) as {
    results?: TmdbMultiRow[];
    total_pages?: number;
    total_results?: number;
    page?: number;
  };

  const rows = (json.results || []).filter(
    (r): r is TmdbMultiRow & { media_type: 'movie' | 'tv' } =>
      r.media_type === 'movie' || r.media_type === 'tv'
  );

  const tmdbTotalPages = Math.max(1, json.total_pages ?? 1);
  const totalResults = json.total_results ?? rows.length;

  const base: MediaItem[] = rows.map((r) => {
    const isMovie = r.media_type === 'movie';
    const title = (isMovie ? r.title : r.name)?.trim() || 'Unknown title';
    const date = isMovie ? r.release_date : r.first_air_date;
    const year = date && date.length >= 4 ? date.slice(0, 4) : 'N/A';
    const poster = r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : '';
    const rating =
      r.vote_average != null && r.vote_average > 0 ? r.vote_average.toFixed(1) : 'N/A';

    return {
      id: `tmdb-${r.media_type}-${r.id}`,
      title,
      year,
      type: isMovie ? 'movie' : 'series',
      imdbId: '',
      poster,
      rating,
      synopsis: r.overview?.trim() || undefined,
      tmdbId: r.id,
    };
  });

  const withImdb = await Promise.all(
    base.map(async (item) => {
      if (item.tmdbId == null) return item;
      const mt = item.type === 'movie' ? 'movie' : 'tv';
      try {
        const imdbId = await fetchImdbForTmdb(mt, item.tmdbId);
        return imdbId ? { ...item, imdbId } : item;
      } catch {
        return item;
      }
    })
  );

  return {
    items: withImdb,
    tmdbPage: json.page ?? tmdbPage,
    tmdbTotalPages,
    totalResults,
  };
}
