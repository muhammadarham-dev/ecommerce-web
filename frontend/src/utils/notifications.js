export const notificationTypeOptions = [
  {
    value: "",
    label: "All Notifications",
  },
  {
    value: "ORDER_STATUS",
    label: "Order Status",
  },
  {
    value: "PAYMENT_STATUS",
    label: "Payment Status",
  },
  {
    value: "TICKET_REPLY",
    label: "Ticket Reply",
  },
  {
    value: "TICKET_STATUS",
    label: "Ticket Status",
  },
  {
    value: "TICKET_ASSIGNED",
    label: "Ticket Assigned",
  },
  {
    value: "RETURN_STATUS",
    label: "Return Status",
  },
  {
    value: "SHIPMENT_STATUS",
    label: "Shipment Status",
  },
  {
    value: "SYSTEM",
    label: "System",
  },
];


export function formatNotificationType(value) {
  if (!value) {
    return "Notification";
  }

  return String(value)
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}


export function formatNotificationDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}


export function getNotificationTarget(
  notification,
) {
  if (notification.order_number) {
    return (
      `/orders/${notification.order_number}`
    );
  }

  if (notification.ticket_number) {
    return (
      `/tickets/${notification.ticket_number}`
    );
  }

  if (
    notification.notification_type
    === "RETURN_STATUS"
  ) {
    return "/returns";
  }

  return "";
}


export function getNotificationTypeClass(
  notificationType,
) {
  return String(notificationType || "SYSTEM")
    .toLowerCase()
    .replaceAll("_", "-");
}