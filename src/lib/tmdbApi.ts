const TMDB_BASE = 'https://api.themoviedb.org/3';

function getApiKey(): string | undefined {
  const k = import.meta.env.VITE_TMDB_API_KEY;
  return typeof k === 'string' && k.trim() ? k.trim() : undefined;
}

function getBearer(): string | undefined {
  const t = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN;
  return typeof t === 'string' && t.trim() ? t.trim() : undefined;
}

export function isMediaSearchConfigured(): boolean {
  return !!(getBearer() || getApiKey());
}

/** GET TMDB v3 path like `/search/multi` with query params. */
export async function tmdbGet(path: string, params: Record<string, string>): Promise<Response> {
  const bearer = getBearer();
  const apiKey = getApiKey();
  const search = new URLSearchParams(params);
  if (apiKey && !bearer) {
    search.set('api_key', apiKey);
  }
  const url = `${TMDB_BASE}${path}?${search.toString()}`;
  const headers: HeadersInit = bearer ? { Authorization: `Bearer ${bearer}` } : {};
  return fetch(url, { headers });
}
