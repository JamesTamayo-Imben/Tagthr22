export interface MediaItem {
  title: string;
  year: string;
  type: 'movie' | 'series';
  imdbId: string;
  poster: string;
  synopsis?: string;
  rating?: string;
  genre?: string;
  cast?: string;
}

export interface SearchResult {
  '#TITLE': string;
  '#YEAR': string;
  '#IMDB_ID': string;
  '#IMG_POSTER': string;
  '#ACTORS'?: string;
  '#RANK'?: string;
}

export interface SearchResponse {
  description: SearchResult[];
}
