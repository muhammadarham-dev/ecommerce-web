import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiCreditCard,
  FiExternalLink,
  FiMessageCircle,
  FiPackage,
  FiRotateCcw,
  FiSearch,
  FiShoppingBag,
  FiTrash2,
  FiTruck,
} from "react-icons/fi";

import {
  useNavigate,
} from "react-router-dom";

import useNotifications from
  "../hooks/useNotifications";

import {
  fetchNotifications,
} from "../services/notificationService";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  formatNotificationDate,
  formatNotificationType,
  getNotificationTarget,
  getNotificationTypeClass,
  notificationTypeOptions,
} from "../utils/notifications";


function NotificationIcon({
  notificationType,
}) {
  if (
    notificationType === "ORDER_STATUS"
  ) {
    return <FiShoppingBag />;
  }

  if (
    notificationType === "PAYMENT_STATUS"
  ) {
    return <FiCreditCard />;
  }

  if (
    notificationType === "TICKET_REPLY"
    || notificationType === "TICKET_STATUS"
    || notificationType === "TICKET_ASSIGNED"
  ) {
    return <FiMessageCircle />;
  }

  if (
    notificationType === "RETURN_STATUS"
  ) {
    return <FiRotateCcw />;
  }

  if (
    notificationType === "SHIPMENT_STATUS"
  ) {
    return <FiTruck />;
  }

  return <FiBell />;
}


function NotificationsPage() {
  const navigate = useNavigate();

  const {
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
  } = useNotifications();

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    readFilter,
    setReadFilter,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    processingId,
    setProcessingId,
  ] = useState(null);

  const [
    isMarkingAll,
    setIsMarkingAll,
  ] = useState(false);

  const [
    isClearing,
    setIsClearing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadNotifications() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const notificationData =
          await fetchNotifications({
            ordering: "-created_at",
          });

        if (isActive) {
          setNotifications(
            notificationData,
          );
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load notifications.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredNotifications =
    useMemo(
      () => {
        const normalizedSearch =
          searchTerm
            .trim()
            .toLowerCase();

        return notifications.filter(
          (notification) => {
            const matchesType =
              !typeFilter
              || (
                notification
                  .notification_type
                === typeFilter
              );

            const matchesReadStatus =
              !readFilter
              || (
                readFilter === "UNREAD"
                  ? !notification.is_read
                  : notification.is_read
              );

            const searchableContent = [
              notification.title,
              notification.message,
              notification.order_number,
              notification.ticket_number,
              notification
                .notification_type,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            const matchesSearch =
              !normalizedSearch
              || searchableContent.includes(
                normalizedSearch,
              );

            return (
              matchesType
              && matchesReadStatus
              && matchesSearch
            );
          },
        );
      },
      [
        notifications,
        searchTerm,
        readFilter,
        typeFilter,
      ],
    );

  const unreadNotifications =
    notifications.filter(
      (notification) =>
        !notification.is_read,
    );

  const handleMarkRead = async (
    notification,
  ) => {
    if (notification.is_read) {
      return notification;
    }

    setProcessingId(notification.id);
    setErrorMessage("");

    try {
      const result = await markAsRead(
        notification.id,
      );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (currentNotification) =>
              currentNotification.id
              === notification.id
                ? result.notification
                : currentNotification,
          ),
      );

      return result.notification;
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to mark notification as read.",
        ),
      );

      return null;
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenNotification =
    async (notification) => {
      await handleMarkRead(notification);

      const target =
        getNotificationTarget(
          notification,
        );

      if (target) {
        navigate(target);
      }
    };

  const handleMarkAllRead = async () => {
    if (
      unreadNotifications.length === 0
    ) {
      return;
    }

    setIsMarkingAll(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result =
        await markAllAsRead();

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (notification) => ({
              ...notification,
              is_read: true,
              read_at:
                notification.read_at
                ?? new Date().toISOString(),
            }),
          ),
      );

      setSuccessMessage(
        result.message
        ?? (
          "All notifications marked "
          + "as read."
        ),
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to mark all notifications as read.",
        ),
      );
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleDelete = async (
    notificationId,
  ) => {
    const confirmed = window.confirm(
      "Delete this notification?",
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(notificationId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await removeNotification(
        notificationId,
      );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.filter(
            (notification) =>
              notification.id
              !== notificationId,
          ),
      );

      setSuccessMessage(
        "Notification deleted successfully.",
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to delete notification.",
        ),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleClearVisible = async () => {
    const notificationIds =
      filteredNotifications.map(
        (notification) =>
          notification.id,
      );

    if (notificationIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Delete all currently visible notifications?",
    );

    if (!confirmed) {
      return;
    }

    setIsClearing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await clearNotifications(
        notificationIds,
      );

      const deletedIds = new Set(
        notificationIds,
      );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.filter(
            (notification) =>
              !deletedIds.has(
                notification.id,
              ),
          ),
      );

      setSuccessMessage(
        "Visible notifications deleted successfully.",
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to clear notifications.",
        ),
      );
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <section className="notifications-page">
      <div className="notifications-header">
        <div className="container">
          <span className="section-label">
            Activity center
          </span>

          <h1>Notifications</h1>

          <p>
            Track order, payment, shipment and
            customer-support updates.
          </p>
        </div>
      </div>

      <div className="container notifications-content">
        <div className="notifications-summary">
          <div>
            <FiBell />

            <span>
              <small>Total Notifications</small>

              <strong>
                {notifications.length}
              </strong>
            </span>
          </div>

          <div>
            <FiMessageCircle />

            <span>
              <small>Unread</small>

              <strong>
                {unreadNotifications.length}
              </strong>
            </span>
          </div>

          <div>
            <FiCheckCircle />

            <span>
              <small>Read</small>

              <strong>
                {
                  notifications.length
                  - unreadNotifications.length
                }
              </strong>
            </span>
          </div>
        </div>

        <div className="notifications-toolbar">
          <div className="notifications-search">
            <FiSearch />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value,
                )
              }
              placeholder="Search notifications"
            />
          </div>

          <select
            value={readFilter}
            onChange={(event) =>
              setReadFilter(
                event.target.value,
              )
            }
          >
            <option value="">
              All Activity
            </option>

            <option value="UNREAD">
              Unread Only
            </option>

            <option value="READ">
              Read Only
            </option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value,
              )
            }
          >
            {notificationTypeOptions.map(
              (option) => (
                <option
                  key={
                    option.value
                    || "all"
                  }
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="notification-bulk-actions">
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={
              isMarkingAll
              || unreadNotifications.length
                === 0
            }
          >
            <FiCheck />

            {isMarkingAll
              ? "Updating..."
              : "Mark All as Read"}
          </button>

          <button
            type="button"
            className="danger"
            onClick={handleClearVisible}
            disabled={
              isClearing
              || filteredNotifications.length
                === 0
            }
          >
            <FiTrash2 />

            {isClearing
              ? "Clearing..."
              : "Clear Visible"}
          </button>
        </div>

        {successMessage && (
          <div className="store-message success">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="store-message error">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="notifications-empty">
            <div className="loading-spinner" />

            <p>
              Loading notifications...
            </p>
          </div>
        ) : filteredNotifications.length
          === 0 ? (
            <div className="notifications-empty">
              <FiBell />

              <h2>No Notifications Found</h2>

              <p>
                There are no notifications
                matching the selected filters.
              </p>
            </div>
          ) : (
            <div className="notifications-list">
              {filteredNotifications.map(
                (notification) => {
                  const target =
                    getNotificationTarget(
                      notification,
                    );

                  const isProcessing =
                    processingId
                    === notification.id;

                  return (
                    <article
                      key={notification.id}
                      className={
                        notification.is_read
                          ? "notification-card"
                          : (
                            "notification-card "
                            + "unread"
                          )
                      }
                    >
                      <div
                        className={
                          "notification-type-icon "
                          + getNotificationTypeClass(
                            notification
                              .notification_type,
                          )
                        }
                      >
                        <NotificationIcon
                          notificationType={
                            notification
                              .notification_type
                          }
                        />
                      </div>

                      <div className="notification-information">
                        <div className="notification-title-row">
                          <div>
                            <span>
                              {formatNotificationType(
                                notification
                                  .notification_type,
                              )}
                            </span>

                            <h2>
                              {notification.title}
                            </h2>
                          </div>

                          {!notification.is_read && (
                            <span className="notification-unread-dot">
                              New
                            </span>
                          )}
                        </div>

                        <p>
                          {notification.message}
                        </p>

                        <div className="notification-meta">
                          <span>
                            {formatNotificationDate(
                              notification
                                .created_at,
                            )}
                          </span>

                          {notification
                            .order_number && (
                            <span>
                              Order:
                              {" "}
                              {
                                notification
                                  .order_number
                              }
                            </span>
                          )}

                          {notification
                            .ticket_number && (
                            <span>
                              Ticket:
                              {" "}
                              {
                                notification
                                  .ticket_number
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="notification-actions">
                        {target && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenNotification(
                                notification,
                              )
                            }
                            disabled={isProcessing}
                          >
                            <FiExternalLink />
                            Open
                          </button>
                        )}

                        {!notification.is_read && (
                          <button
                            type="button"
                            className="secondary"
                            onClick={() =>
                              handleMarkRead(
                                notification,
                              )
                            }
                            disabled={isProcessing}
                          >
                            <FiCheck />
                            Mark Read
                          </button>
                        )}

                        <button
                          type="button"
                          className="delete"
                          onClick={() =>
                            handleDelete(
                              notification.id,
                            )
                          }
                          disabled={isProcessing}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
      </div>
    </section>
  );
}


export default NotificationsPage;