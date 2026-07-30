import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import useAuth from "../hooks/useAuth";

import {
  deleteNotification,
  deleteNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";


export const NotificationContext =
  createContext(null);


export function NotificationProvider({
  children,
}) {
  const {
    isAuthenticated,
  } = useAuth();

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    isNotificationLoading,
    setIsNotificationLoading,
  ] = useState(false);

  const refreshUnreadCount =
    useCallback(async () => {
      if (!isAuthenticated) {
        setUnreadCount(0);
        return 0;
      }

      setIsNotificationLoading(true);

      try {
        const count =
          await fetchUnreadCount();

        setUnreadCount(count);

        return count;
      } catch {
        return 0;
      } finally {
        setIsNotificationLoading(false);
      }
    }, [isAuthenticated]);

  useEffect(() => {
    refreshUnreadCount();

    if (!isAuthenticated) {
      return undefined;
    }

    const intervalId =
      window.setInterval(
        refreshUnreadCount,
        60000,
      );

    const handleWindowFocus = () => {
      refreshUnreadCount();
    };

    window.addEventListener(
      "focus",
      handleWindowFocus,
    );

    return () => {
      window.clearInterval(intervalId);

      window.removeEventListener(
        "focus",
        handleWindowFocus,
      );
    };
  }, [
    isAuthenticated,
    refreshUnreadCount,
  ]);

  const markAsRead =
    useCallback(
      async (notificationId) => {
        const result =
          await markNotificationRead(
            notificationId,
          );

        await refreshUnreadCount();

        return result;
      },
      [refreshUnreadCount],
    );

  const markAllAsRead =
    useCallback(async () => {
      const result =
        await markAllNotificationsRead();

      setUnreadCount(0);

      return result;
    }, []);

  const removeNotification =
    useCallback(
      async (notificationId) => {
        await deleteNotification(
          notificationId,
        );

        await refreshUnreadCount();
      },
      [refreshUnreadCount],
    );

  const clearNotifications =
    useCallback(
      async (notificationIds) => {
        await deleteNotifications(
          notificationIds,
        );

        await refreshUnreadCount();
      },
      [refreshUnreadCount],
    );

  const contextValue = useMemo(
    () => ({
      unreadCount,
      isNotificationLoading,
      refreshUnreadCount,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearNotifications,
    }),
    [
      unreadCount,
      isNotificationLoading,
      refreshUnreadCount,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearNotifications,
    ],
  );

  return (
    <NotificationContext.Provider
      value={contextValue}
    >
      {children}
    </NotificationContext.Provider>
  );
}


export default NotificationContext;