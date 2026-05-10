import { useCallback, useMemo, useRef, useState } from 'react';
import type { MediaItem } from '../types/media';
import {
  searchMoviesAndSeriesTmdbPage,
  MediaSearchConfigError,
} from '../lib/searchMedia';

const PAGE_SIZE = 8;

export function usePagedMediaSearch() {
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [accumulated, setAccumulated] = useState<MediaItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [tmdbPage, setTmdbPage] = useState(0);
  const [tmdbTotalPages, setTmdbTotalPages] = useState(1);

  const activeQueryRef = useRef('');
  const accumulatedRef = useRef<MediaItem[]>([]);
  const tmdbPageRef = useRef(0);
  const tmdbTotalPagesRef = useRef(1);

  const displayedItems = useMemo(
    () => accumulated.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [accumulated, currentPage]
  );

  const maxPageFromBuffer = Math.max(1, Math.ceil(accumulated.length / PAGE_SIZE));
  const canGoNext =
    currentPage < maxPageFromBuffer ||
    (currentPage === maxPageFromBuffer && tmdbPage < tmdbTotalPages);
  const canGoPrev = currentPage > 1;

  const runNewSearch = useCallback(async (query: string) => {
    const q = query.trim();
    activeQueryRef.current = q;
    if (!q) {
      accumulatedRef.current = [];
      tmdbPageRef.current = 0;
      tmdbTotalPagesRef.current = 1;
      setAccumulated([]);
      setTmdbPage(0);
      setTmdbTotalPages(1);
      setCurrentPage(1);
      setSearchError(null);
      return;
    }

    setLoading(true);
    setSearchError(null);
    try {
      const r = await searchMoviesAndSeriesTmdbPage(q, 1);
      accumulatedRef.current = r.items;
      tmdbPageRef.current = 1;
      tmdbTotalPagesRef.current = r.tmdbTotalPages;
      setAccumulated(r.items);
      setTmdbPage(1);
      setTmdbTotalPages(r.tmdbTotalPages);
      setCurrentPage(1);
    } catch (error) {
      console.error('Search error:', error);
      accumulatedRef.current = [];
      tmdbPageRef.current = 0;
      tmdbTotalPagesRef.current = 1;
      setAccumulated([]);
      setTmdbPage(0);
      setTmdbTotalPages(1);
      setCurrentPage(1);
      if (error instanceof MediaSearchConfigError) {
        setSearchError(error.message);
      } else {
        setSearchError(error instanceof Error ? error.message : 'Search failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const goToPage = useCallback(async (page: number) => {
    if (page < 1) return;
    const q = activeQueryRef.current;
    if (!q.trim()) return;

    setLoading(true);
    setSearchError(null);
    try {
      let items = [...accumulatedRef.current];
      let tp = tmdbPageRef.current;
      let ttp = tmdbTotalPagesRef.current;
      const endNeeded = page * PAGE_SIZE;
      while (items.length < endNeeded && tp < ttp) {
        const r = await searchMoviesAndSeriesTmdbPage(q, tp + 1);
        items = [...items, ...r.items];
        tp += 1;
        ttp = r.tmdbTotalPages;
      }
      accumulatedRef.current = items;
      tmdbPageRef.current = tp;
      tmdbTotalPagesRef.current = ttp;
      setAccumulated(items);
      setTmdbPage(tp);
      setTmdbTotalPages(ttp);
      setCurrentPage(page);
    } catch (error) {
      console.error('Pagination fetch error:', error);
      if (error instanceof MediaSearchConfigError) {
        setSearchError(error.message);
      } else {
        setSearchError(error instanceof Error ? error.message : 'Could not load more results.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const goNext = useCallback(() => {
    if (!canGoNext) return;
    void goToPage(currentPage + 1);
  }, [canGoNext, currentPage, goToPage]);

  const goPrev = useCallback(() => {
    if (!canGoPrev) return;
    void goToPage(currentPage - 1);
  }, [canGoPrev, currentPage, goToPage]);

  return {
    displayedItems,
    accumulatedCount: accumulated.length,
    currentPage,
    maxPageFromBuffer,
    canGoNext,
    canGoPrev,
    loading,
    searchError,
    setSearchError,
    runNewSearch,
    goNext,
    goPrev,
  };
}
