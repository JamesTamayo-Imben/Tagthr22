/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** TMDB API v3 key (query param). Prefer VITE_TMDB_READ_ACCESS_TOKEN when possible. */
  readonly VITE_TMDB_API_KEY?: string;
  /** TMDB read access token (Bearer). See https://www.themoviedb.org/settings/api */
  readonly VITE_TMDB_READ_ACCESS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
