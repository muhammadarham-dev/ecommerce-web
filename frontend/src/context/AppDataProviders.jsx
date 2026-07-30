import {
  useMemo,
} from "react";

import useAuth from "../hooks/useAuth";

import {
  CartContext,
  CartProvider,
} from "./CartContext";

import {
  EmailNotificationProvider,
} from "./EmailNotificationContext";

import {
  NotificationContext,
  NotificationProvider,
} from "./NotificationContext";

import {
  RecentlyViewedContext,
  RecentlyViewedProvider,
} from "./RecentlyViewedContext";

import {
  WishlistContext,
  WishlistProvider,
} from "./WishlistContext";


const EMPTY_CART =
  Object.freeze({
    items: [],
    item_count: 0,
    total_items: 0,
    subtotal: "0.00",
    total: "0.00",
  });


const emptyAsyncArray =
  async () => [];

const emptyAsyncObject =
  async () => null;

const emptyAsyncNumber =
  async () => 0;

const emptyAsyncFalse =
  async () => false;

const alwaysFalse =
  () => false;


const EMPTY_CART_CONTEXT =
  Object.freeze({
    cart: EMPTY_CART,
    cartItems: [],
    items: [],
    cartCount: 0,
    totalItems: 0,
    cartSubtotal: 0,
    subtotal: 0,
    isCartLoading: false,
    isLoading: false,
    cartError: "",
    error: "",
    refreshCart:
      emptyAsyncObject,
    loadCart:
      emptyAsyncObject,
    addItem:
      emptyAsyncObject,
    addToCart:
      emptyAsyncObject,
    updateItem:
      emptyAsyncObject,
    updateCartItem:
      emptyAsyncObject,
    removeItem:
      emptyAsyncObject,
    removeCartItem:
      emptyAsyncObject,
    clearCart:
      emptyAsyncObject,
    clearCartItems:
      emptyAsyncObject,
  });


const EMPTY_WISHLIST_CONTEXT =
  Object.freeze({
    wishlist: {
      items: [],
      total_items: 0,
    },
    wishlistItems: [],
    items: [],
    wishlistCount: 0,
    totalItems: 0,
    isWishlistLoading: false,
    isLoading: false,
    wishlistError: "",
    error: "",
    processingProductId: null,
    refreshWishlist:
      emptyAsyncArray,
    loadWishlist:
      emptyAsyncArray,
    getWishlistItem:
      emptyAsyncObject,
    isInWishlist:
      alwaysFalse,
    isProductInWishlist:
      alwaysFalse,
    addItem:
      emptyAsyncFalse,
    addWishlistItem:
      emptyAsyncFalse,
    removeItem:
      emptyAsyncFalse,
    removeWishlistItem:
      emptyAsyncFalse,
    toggleWishlistItem:
      emptyAsyncFalse,
    toggleWishlist:
      emptyAsyncFalse,
    toggleProduct:
      emptyAsyncFalse,
    toggleItem:
      emptyAsyncFalse,
    clearWishlist:
      emptyAsyncFalse,
    moveItemToCart:
      emptyAsyncFalse,
  });


const EMPTY_RECENTLY_VIEWED_CONTEXT =
  Object.freeze({
    recentlyViewed: [],
    recentlyViewedItems: [],
    recentItems: [],
    items: [],
    recentlyViewedCount: 0,
    count: 0,
    isRecentlyViewedLoading: false,
    isLoading: false,
    recentlyViewedError: "",
    error: "",
    refreshRecentlyViewed:
      emptyAsyncArray,
    loadRecentlyViewed:
      emptyAsyncArray,
    fetchRecentlyViewed:
      emptyAsyncArray,
    fetchRecentlyViewedCount:
      emptyAsyncNumber,
    trackProductView:
      emptyAsyncObject,
    removeRecentlyViewed:
      emptyAsyncFalse,
    removeRecentlyViewedItem:
      emptyAsyncFalse,
    clearRecentlyViewed:
      emptyAsyncFalse,
    clearRecentlyViewedHistory:
      emptyAsyncFalse,
  });


const EMPTY_NOTIFICATION_CONTEXT =
  Object.freeze({
    notifications: [],
    notificationItems: [],
    unreadCount: 0,
    isNotificationLoading: false,
    isLoading: false,
    notificationError: "",
    error: "",
    refreshNotifications:
      emptyAsyncArray,
    loadNotifications:
      emptyAsyncArray,
    refreshUnreadCount:
      emptyAsyncNumber,
    loadUnreadCount:
      emptyAsyncNumber,
    markNotificationAsRead:
      emptyAsyncFalse,
    markAsRead:
      emptyAsyncFalse,
    markAllNotificationsAsRead:
      emptyAsyncFalse,
    markAllAsRead:
      emptyAsyncFalse,
    deleteNotification:
      emptyAsyncFalse,
  });


function EmptyDataProviders({
  children,
}) {
  return (
    <NotificationContext.Provider
      value={EMPTY_NOTIFICATION_CONTEXT}
    >
      <CartContext.Provider
        value={EMPTY_CART_CONTEXT}
      >
        <WishlistContext.Provider
          value={EMPTY_WISHLIST_CONTEXT}
        >
          <RecentlyViewedContext.Provider
            value={
              EMPTY_RECENTLY_VIEWED_CONTEXT
            }
          >
            {children}
          </RecentlyViewedContext.Provider>
        </WishlistContext.Provider>
      </CartContext.Provider>
    </NotificationContext.Provider>
  );
}


function CustomerDataProviders({
  children,
}) {
  return (
    <NotificationProvider>
      <EmailNotificationProvider>
        <CartProvider>
          <WishlistProvider>
            <RecentlyViewedProvider>
              {children}
            </RecentlyViewedProvider>
          </WishlistProvider>
        </CartProvider>
      </EmailNotificationProvider>
    </NotificationProvider>
  );
}


function AppDataProviders({
  children,
}) {
  const {
    user,
    isAuthenticated,
    isLoading,
  } = useAuth();

  const isCustomer = useMemo(
    () => {
      if (
        isLoading
        || !isAuthenticated
        || !user
      ) {
        return false;
      }

      return (
        String(
          user.role ?? "",
        )
          .trim()
          .toUpperCase()
        === "CUSTOMER"
      );
    },
    [
      isAuthenticated,
      isLoading,
      user,
    ],
  );

  if (!isCustomer) {
    return (
      <EmptyDataProviders>
        {children}
      </EmptyDataProviders>
    );
  }

  return (
    <CustomerDataProviders>
      {children}
    </CustomerDataProviders>
  );
}


export default AppDataProviders;
