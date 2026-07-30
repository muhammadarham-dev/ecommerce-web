export const ticketCategoryOptions = [
  {
    value: "ORDER_ISSUE",
    label: "Order Issue",
  },
  {
    value: "PAYMENT_ISSUE",
    label: "Payment Issue",
  },
  {
    value: "DELIVERY_ISSUE",
    label: "Delivery Issue",
  },
  {
    value: "RETURN_REFUND",
    label: "Return or Refund",
  },
  {
    value: "DAMAGED_PRODUCT",
    label: "Damaged Product",
  },
  {
    value: "PRODUCT_INFORMATION",
    label: "Product Information",
  },
  {
    value: "ACCOUNT_ISSUE",
    label: "Account Issue",
  },
  {
    value: "GENERAL_COMPLAINT",
    label: "General Complaint",
  },
];


export const ticketPriorityOptions = [
  {
    value: "LOW",
    label: "Low",
  },
  {
    value: "MEDIUM",
    label: "Medium",
  },
  {
    value: "HIGH",
    label: "High",
  },
  {
    value: "URGENT",
    label: "Urgent",
  },
];


export const ticketStatusOptions = [
  {
    value: "",
    label: "All Statuses",
  },
  {
    value: "OPEN",
    label: "Open",
  },
  {
    value: "ASSIGNED",
    label: "Assigned",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
  },
  {
    value: "WAITING_FOR_CUSTOMER",
    label: "Waiting for Customer",
  },
  {
    value: "RESOLVED",
    label: "Resolved",
  },
  {
    value: "CLOSED",
    label: "Closed",
  },
];


const allowedExtensions = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "pdf",
];

const maximumFileSize =
  5 * 1024 * 1024;


export function formatTicketValue(value) {
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


export function formatTicketDate(value) {
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


export function getTicketStatusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replaceAll("_", "-");
}


export function getTicketPriorityClass(
  priority,
) {
  return String(priority || "")
    .toLowerCase();
}


export function validateTicketFiles(files) {
  const selectedFiles =
    Array.from(files || []);

  if (selectedFiles.length > 5) {
    return {
      valid: false,
      message: (
        "A maximum of 5 attachments "
        + "can be uploaded."
      ),
    };
  }

  for (const file of selectedFiles) {
    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase();

    if (
      !extension
      || !allowedExtensions.includes(
        extension,
      )
    ) {
      return {
        valid: false,
        message: (
          `${file.name} has an unsupported `
          + "file format."
        ),
      };
    }

    if (file.size > maximumFileSize) {
      return {
        valid: false,
        message: (
          `${file.name} exceeds the `
          + "5 MB file size limit."
        ),
      };
    }
  }

  return {
    valid: true,
    message: "",
  };
}