import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import useAuth from "../hooks/useAuth";

import {
  addCartItem,
  clearCartItems,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from "../services/cartService";

import {
  getApiErrorMessage,
} from "../utils/apiData";


export const CartContext =
  createContext(null);


const emptyCart = Object.freeze({
  items: [],
  total_items: 0,
  subtotal: 0,
});


export function CartProvider({
  children,
}) {
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuth();

  const [
    cart,
    setCart,
  ] = useState(emptyCart);

  const [
    isCartLoading,
    setIsCartLoading,
  ] = useState(false);

  const [
    cartError,
    setCartError,
  ] = useState("");

  const refreshCart =
    useCallback(async () => {
      if (!isAuthenticated) {
        setCart(emptyCart);
        setCartError("");

        return emptyCart;
      }

      setIsCartLoading(true);
      setCartError("");

      try {
        const cartData =
          await fetchCart();

        setCart(cartData);

        return cartData;
      } catch (error) {
        setCartError(
          getApiErrorMessage(
            error,
            "Unable to load the shopping cart.",
          ),
        );

        throw error;
      } finally {
        setIsCartLoading(false);
      }
    }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (isAuthenticated) {
      refreshCart().catch(
        () => {},
      );
    } else {
      setCart(emptyCart);
      setCartError("");
    }
  }, [
    isAuthenticated,
    isAuthLoading,
    refreshCart,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    let refreshInProgress = false;
    let refreshQueued = false;

    const synchronizeCart = async () => {
      if (refreshInProgress) {
        refreshQueued = true;
        return;
      }

      refreshInProgress = true;

      try {
        await refreshCart();
      } catch {
        // Keep the current UI state if the background sync fails.
        // A later cart event or normal page navigation can retry it.
      } finally {
        refreshInProgress = false;

        if (refreshQueued) {
          refreshQueued = false;
          void synchronizeCart();
        }
      }
    };

    const handleEngagePilotCartChanged = (event) => {
      const resource = event?.detail?.resource;

      if (resource && resource !== "cart") {
        return;
      }

      void synchronizeCart();
    };

    window.addEventListener(
      "engagepilot:cart-changed",
      handleEngagePilotCartChanged,
    );

    return () => {
      window.removeEventListener(
        "engagepilot:cart-changed",
        handleEngagePilotCartChanged,
      );
    };
  }, [
    isAuthenticated,
    refreshCart,
  ]);

  const addItem =
    useCallback(
      async ({
        productId,
        quantity = 1,
        variantId = null,
      }) => {
        await addCartItem({
          productId,
          quantity,
          variantId,
        });

        return refreshCart();
      },
      [refreshCart],
    );

  const updateItem =
    useCallback(
      async ({
        itemId,
        quantity,
      }) => {
        await updateCartItem({
          itemId,
          quantity,
        });

        return refreshCart();
      },
      [refreshCart],
    );

  const removeItem =
    useCallback(
      async (itemId) => {
        await removeCartItem(
          itemId,
        );

        return refreshCart();
      },
      [refreshCart],
    );

  const clearCart =
    useCallback(async () => {
      await clearCartItems();

      return refreshCart();
    }, [refreshCart]);

  const contextValue = useMemo(
    () => ({
      cart,
      cartItems: cart.items,
      items: cart.items,
      cartCount: cart.total_items,
      totalItems: cart.total_items,
      cartSubtotal: cart.subtotal,
      subtotal: cart.subtotal,
      isCartLoading,
      isLoading: isCartLoading,
      cartError,
      error: cartError,
      refreshCart,
      loadCart: refreshCart,
      addItem,
      addToCart: addItem,
      updateItem,
      updateCartItem: updateItem,
      removeItem,
      removeCartItem: removeItem,
      clearCart,
      clearCartItems: clearCart,
    }),
    [
      cart,
      isCartLoading,
      cartError,
      refreshCart,
      addItem,
      updateItem,
      removeItem,
      clearCart,
    ],
  );

  return (
    <CartContext.Provider
      value={contextValue}
    >
      {children}
    </CartContext.Provider>
  );
}
