export const shipmentStatusOptions = [
  {
    value: "",
    label: "All Shipments",
  },
  {
    value: "READY",
    label: "Ready for Shipment",
  },
  {
    value: "PICKED_UP",
    label: "Picked Up",
  },
  {
    value: "IN_TRANSIT",
    label: "In Transit",
  },
  {
    value: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
  },
  {
    value: "DELIVERED",
    label: "Delivered",
  },
  {
    value: "DELIVERY_FAILED",
    label: "Delivery Failed",
  },
  {
    value: "RETURNED",
    label: "Returned",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
];


export const shipmentProgressSteps = [
  "READY",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];


export function formatShipmentValue(value) {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}


export function getShipmentStatusClass(
  status,
) {
  return String(status || "")
    .toLowerCase()
    .replaceAll("_", "-");
}


export function formatShipmentDate(value) {
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


export function formatShipmentDay(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}


export function isShipmentTerminal(status) {
  return [
    "DELIVERY_FAILED",
    "RETURNED",
    "CANCELLED",
  ].includes(status);
}