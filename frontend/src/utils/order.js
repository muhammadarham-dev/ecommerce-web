export function formatOrderStatus(value) {
  if (!value) {
    return "Unknown";
  }

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}


export function formatPaymentMethod(value) {
  if (value === "CASH_ON_DELIVERY") {
    return "Cash on Delivery";
  }

  if (value === "BANK_TRANSFER") {
    return "Bank Transfer";
  }

  return formatOrderStatus(value);
}


export function formatOrderDate(value) {
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


export function getOrderStatusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replaceAll("_", "-");
}