import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import useAuth from "../hooks/useAuth";

import {
  addWishlistItem,
  clearWishlistItems,
  deleteWishlistItem,
  fetchWishlist,
  moveWishlistItemToCart,
} from "../services/wishlistService";

import {
  getApiErrorMessage,
} from "../utils/apiData";


export const WishlistContext =
  createContext(null);


const emptyWishlist =
  Object.freeze({
    items: [],
    total_items: 0,
  });


export function WishlistProvider({
  children,
}) {
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuth();

  const [
    wishlist,
    setWishlist,
  ] = useState(emptyWishlist);

  const [
    isWishlistLoading,
    setIsWishlistLoading,
  ] = useState(false);

  const [
    wishlistError,
    setWishlistError,
  ] = useState("");

  const [
    processingProductId,
    setProcessingProductId,
  ] = useState(null);

  const refreshWishlist =
    useCallback(async () => {
      if (!isAuthenticated) {
        setWishlist(emptyWishlist);
        setWishlistError("");

        return emptyWishlist;
      }

      setIsWishlistLoading(true);
      setWishlistError("");

      try {
        const wishlistData =
          await fetchWishlist({
            ordering: "-created_at",
          });

        setWishlist(wishlistData);

        return wishlistData;
      } catch (error) {
        setWishlistError(
          getApiErrorMessage(
            error,
            "Unable to load your wishlist.",
          ),
        );

        throw error;
      } finally {
        setIsWishlistLoading(false);
      }
    }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (isAuthenticated) {
      refreshWishlist().catch(
        () => {},
      );
    } else {
      setWishlist(emptyWishlist);
      setWishlistError("");
    }
  }, [
    isAuthenticated,
    isAuthLoading,
    refreshWishlist,
  ]);

  const getWishlistItem =
    useCallback(
      (productId) =>
        wishlist.items.find(
          (item) => {
            const product =
              item.product ?? item;

            const itemProductId =
              product.id
              ?? item.product_id
              ?? item.product;

            return (
              String(itemProductId)
              === String(productId)
            );
          },
        ),
      [wishlist.items],
    );

  const isInWishlist =
    useCallback(
      (productId) =>
        Boolean(
          getWishlistItem(productId),
        ),
      [getWishlistItem],
    );

  const addItem =
    useCallback(
      async (productId) => {
        setProcessingProductId(
          productId,
        );
        setWishlistError("");

        try {
          await addWishlistItem(
            productId,
          );

          return await refreshWishlist();
        } catch (error) {
          setWishlistError(
            getApiErrorMessage(
              error,
              "Unable to add the product to wishlist.",
            ),
          );

          throw error;
        } finally {
          setProcessingProductId(null);
        }
      },
      [refreshWishlist],
    );

  const removeItem =
    useCallback(
      async (productId) => {
        const wishlistItem =
          getWishlistItem(productId);

        if (!wishlistItem) {
          return wishlist;
        }

        setProcessingProductId(
          productId,
        );
        setWishlistError("");

        try {
          await deleteWishlistItem(
            wishlistItem.id,
          );

          return await refreshWishlist();
        } catch (error) {
          setWishlistError(
            getApiErrorMessage(
              error,
              "Unable to remove the wishlist item.",
            ),
          );

          throw error;
        } finally {
          setProcessingProductId(null);
        }
      },
      [
        getWishlistItem,
        refreshWishlist,
        wishlist,
      ],
    );

  const toggleItem =
    useCallback(
      async (productId) => {
        if (
          isInWishlist(productId)
        ) {
          return removeItem(
            productId,
          );
        }

        return addItem(productId);
      },
      [
        addItem,
        isInWishlist,
        removeItem,
      ],
    );

  const clearWishlist =
    useCallback(async () => {
      await clearWishlistItems();

      return refreshWishlist();
    }, [refreshWishlist]);

  const moveItemToCart =
    useCallback(
      async ({
        itemId,
        quantity = 1,
      }) => {
        const result =
          await moveWishlistItemToCart({
            itemId,
            quantity,
          });

        await refreshWishlist();

        return result;
      },
      [refreshWishlist],
    );

  const contextValue = useMemo(
    () => ({
      wishlist,
      wishlistItems:
        wishlist.items,
      items:
        wishlist.items,
      wishlistCount:
        wishlist.total_items,
      totalItems:
        wishlist.total_items,
      isWishlistLoading,
      isLoading:
        isWishlistLoading,
      wishlistError,
      error:
        wishlistError,
      processingProductId,
      refreshWishlist,
      loadWishlist:
        refreshWishlist,
      getWishlistItem,
      isInWishlist,
      isProductInWishlist:
        isInWishlist,
      addItem,
      addWishlistItem:
        addItem,
      removeItem,
      removeWishlistItem:
        removeItem,
      toggleItem,
      toggleWishlistItem:
        toggleItem,
      toggleWishlist:
        toggleItem,
      toggleProduct:
        toggleItem,
      clearWishlist,
      moveItemToCart,
    }),
    [
      wishlist,
      isWishlistLoading,
      wishlistError,
      processingProductId,
      refreshWishlist,
      getWishlistItem,
      isInWishlist,
      addItem,
      removeItem,
      toggleItem,
      clearWishlist,
      moveItemToCart,
    ],
  );

  return (
    <WishlistContext.Provider
      value={contextValue}
    >
      {children}
    </WishlistContext.Provider>
  );
}
