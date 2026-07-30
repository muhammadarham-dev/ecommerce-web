import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import useAuth from "../hooks/useAuth";

import {
  clearRecentlyViewedHistory,
  fetchRecentlyViewed,
  fetchRecentlyViewedCount,
  removeRecentlyViewedEntry,
  trackRecentlyViewedProduct,
} from "../services/recentlyViewedService";


export const RecentlyViewedContext =
  createContext(null);
const TRACK_COOLDOWN_MS = 3000;


export function RecentlyViewedProvider({
  children,
}) {
  const authContext = useAuth();

  const isAuthenticated = Boolean(
    authContext.isAuthenticated
    ?? authContext.user
    ?? authContext.currentUser,
  );

  const [
    recentlyViewedItems,
    setRecentlyViewedItems,
  ] = useState([]);

  const [
    recentlyViewedCount,
    setRecentlyViewedCount,
  ] = useState(0);

  const [
    isRecentlyViewedLoading,
    setIsRecentlyViewedLoading,
  ] = useState(false);

  const [
    recentlyViewedError,
    setRecentlyViewedError,
  ] = useState("");

  const refreshRecentlyViewed =
    useCallback(async () => {
      if (!isAuthenticated) {
        setRecentlyViewedItems([]);
        setRecentlyViewedCount(0);
        setRecentlyViewedError("");

        return [];
      }

      setIsRecentlyViewedLoading(true);
      setRecentlyViewedError("");

      try {
        const [
          items,
          count,
        ] = await Promise.all([
          fetchRecentlyViewed({
            ordering: "-viewed_at",
          }),
          fetchRecentlyViewedCount(),
        ]);

        setRecentlyViewedItems(items);
        setRecentlyViewedCount(count);

        return items;
      } catch (error) {
        setRecentlyViewedError(
          "Unable to load recently viewed products.",
        );

        throw error;
      } finally {
        setIsRecentlyViewedLoading(false);
      }
    }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setRecentlyViewedItems([]);
      setRecentlyViewedCount(0);
      setRecentlyViewedError("");

      return;
    }

    refreshRecentlyViewed().catch(() => {
      // The page may still continue normally when
      // recently viewed history is unavailable.
    });
  }, [
    isAuthenticated,
    refreshRecentlyViewed,
  ]);

  const trackProductView =
    useCallback(
      async (productSlug) => {
        if (
          !isAuthenticated
          || !productSlug
        ) {
          return null;
        }

        const storageKey =
          `recently-viewed-track:${productSlug}`;

        const currentTime = Date.now();

        const previousTrackTime = Number(
          window.sessionStorage.getItem(
            storageKey,
          ) ?? 0,
        );

        if (
          currentTime - previousTrackTime
          < TRACK_COOLDOWN_MS
        ) {
          return null;
        }

        window.sessionStorage.setItem(
          storageKey,
          String(currentTime),
        );

        try {
          const result =
            await trackRecentlyViewedProduct(
              productSlug,
            );

          const trackedItem =
            result.recentlyViewed;

          setRecentlyViewedItems(
            (currentItems) => [
              trackedItem,
              ...currentItems.filter(
                (item) =>
                  item.id !== trackedItem.id
                  && item.product?.id
                    !== trackedItem.product?.id,
              ),
            ],
          );

          const latestCount =
            await fetchRecentlyViewedCount();

          setRecentlyViewedCount(
            latestCount,
          );

          return result;
        } catch (error) {
          window.sessionStorage.removeItem(
            storageKey,
          );

          throw error;
        }
      },
      [isAuthenticated],
    );

  const removeRecentlyViewed =
    useCallback(
      async (entryId) => {
        const result =
          await removeRecentlyViewedEntry(
            entryId,
          );

        setRecentlyViewedItems(
          (currentItems) =>
            currentItems.filter(
              (item) =>
                item.id !== entryId,
            ),
        );

        setRecentlyViewedCount(
          (currentCount) =>
            Math.max(
              currentCount - 1,
              0,
            ),
        );

        return result;
      },
      [],
    );

  const clearHistory =
    useCallback(async () => {
      const result =
        await clearRecentlyViewedHistory();

      setRecentlyViewedItems([]);
      setRecentlyViewedCount(0);

      return result;
    }, []);

  const contextValue = useMemo(
    () => ({
      recentlyViewedItems,
      recentlyViewedCount,
      isRecentlyViewedLoading,
      recentlyViewedError,
      refreshRecentlyViewed,
      trackProductView,
      removeRecentlyViewed,
      clearHistory,
    }),
    [
      recentlyViewedItems,
      recentlyViewedCount,
      isRecentlyViewedLoading,
      recentlyViewedError,
      refreshRecentlyViewed,
      trackProductView,
      removeRecentlyViewed,
      clearHistory,
    ],
  );

  return (
    <RecentlyViewedContext.Provider
      value={contextValue}
    >
      {children}
    </RecentlyViewedContext.Provider>
  );
}


export default RecentlyViewedContext;