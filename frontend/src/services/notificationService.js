import apiClient from "../api/client";
import { extractList } from "../utils/apiData";


export async function fetchNotifications(
  params = {},
) {
  const response = await apiClient.get(
    "/notifications/",
    {
      params,
    },
  );

  return extractList(response.data);
}


export async function fetchUnreadCount() {
  const response = await apiClient.get(
    "/notifications/unread-count/",
  );

  return Number(
    response.data.unread_count ?? 0,
  );
}


export async function markNotificationRead(
  notificationId,
) {
  const response = await apiClient.patch(
    `/notifications/${notificationId}/read/`,
    {},
  );

  return {
    message: response.data.message,
    notification:
      response.data.notification
      ?? response.data,
  };
}


export async function markAllNotificationsRead() {
  const response = await apiClient.patch(
    "/notifications/mark-all-read/",
    {},
  );

  return {
    message: response.data.message,
    updatedCount: Number(
      response.data.updated_count ?? 0,
    ),
  };
}


export async function deleteNotification(
  notificationId,
) {
  await apiClient.delete(
    `/notifications/${notificationId}/`,
  );

  return notificationId;
}


export async function deleteNotifications(
  notificationIds,
) {
  await Promise.all(
    notificationIds.map(
      (notificationId) =>
        deleteNotification(
          notificationId,
        ),
    ),
  );
}