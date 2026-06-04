import { useState, useEffect, useCallback, useRef } from "react";
import * as db from "../DataBase";
import { CaseDataScreen } from "../Types/appTypes";
import { mapCaseDbToScreen } from "../utils/caseMapper";

/**
 * Custom hook to retrieve a list of cases from the database.
 * Handles loading, error states, and exposes a refresh callback.
 */
export const useCases = (initialLimit = 20) => {
  const [cases, setCases] = useState<CaseDataScreen[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dbCases = await db.getCases(null, initialLimit);
      setCases(dbCases.map(mapCaseDbToScreen));
    } catch (err: any) {
      console.error("useCases: failed to fetch cases:", err);
      setError(err?.message || "Failed to load cases.");
    } finally {
      setIsLoading(false);
    }
  }, [initialLimit]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  return {
    cases,
    isLoading,
    error,
    refreshCases: fetchCases,
  };
};

/**
 * Custom hook to perform a debounced search on cases from the database.
 * Encapsulates the 500ms typing timer, loading, and error states.
 */
export const useSearchCases = (initialLimit = 20) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<CaseDataScreen[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const executeSearch = useCallback(async (query: string, offset: number) => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setHasMore(false);
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    setError(null);
    try {
      const dbResults = await db.searchCases(query.trim(), null, initialLimit, offset);
      const mapped = dbResults.map(mapCaseDbToScreen);
      if (offset === 0) {
        setResults(mapped);
      } else {
        setResults((prev) => [...prev, ...mapped]);
      }
      setHasMore(mapped.length === initialLimit);
    } catch (err: any) {
      console.error("useSearchCases: search failed:", err);
      setError(err?.message || "Search failed.");
      if (offset === 0) setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [initialLimit]);

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      executeSearch(searchQuery, 0);
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, executeSearch]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      executeSearch(searchQuery, results.length);
    }
  }, [isLoading, hasMore, searchQuery, results.length, executeSearch]);

  return {
    searchQuery,
    setSearchQuery,
    results,
    setResults,
    isLoading,
    error,
    hasSearched,
    hasMore,
    refreshSearch: () => executeSearch(searchQuery, 0),
    loadMore,
  };
};
