import apiClient from "../api/client";
import { extractList } from "../utils/apiData";


function normalizeIdentifier(value) {
  return String(value ?? "").trim();
}


function appendAttachments(
  formData,
  attachments,
) {
  attachments.forEach((file) => {
    formData.append(
      "attachments",
      file,
    );
  });
}


export async function fetchAdminTicketDashboard() {
  const response = await apiClient.get(
    "/tickets/management/dashboard/",
  );

  return response.data;
}


export async function fetchAdminTickets(
  params = {},
) {
  const response = await apiClient.get(
    "/tickets/management/tickets/",
    {
      params,
    },
  );

  const items = extractList(response.data);

  return {
    items,
    count:
      typeof response.data?.count === "number"
        ? response.data.count
        : items.length,
  };
}


export async function fetchAdminTicket(
  ticketNumber,
) {
  const normalizedTicketNumber =
    normalizeIdentifier(ticketNumber);

  const response = await apiClient.get(
    `/tickets/management/tickets/${
      encodeURIComponent(
        normalizedTicketNumber,
      )
    }/`,
  );

  return (
    response.data.ticket
    ?? response.data
  );
}


export async function claimAdminTicket(
  ticketNumber,
) {
  const normalizedTicketNumber =
    normalizeIdentifier(ticketNumber);

  const response = await apiClient.post(
    `/tickets/management/tickets/${
      encodeURIComponent(
        normalizedTicketNumber,
      )
    }/claim/`,
    {},
  );

  return {
    message: response.data.message,
    ticket:
      response.data.ticket
      ?? response.data,
  };
}


export async function updateAdminTicketStatus(
  ticketNumber,
  status,
) {
  const normalizedTicketNumber =
    normalizeIdentifier(ticketNumber);

  const response = await apiClient.patch(
    `/tickets/management/tickets/${
      encodeURIComponent(
        normalizedTicketNumber,
      )
    }/status/`,
    {
      status,
    },
  );

  return {
    message: response.data.message,
    ticket:
      response.data.ticket
      ?? response.data,
  };
}


export async function replyToAdminTicket({
  ticketNumber,
  body,
  attachments = [],
  isInternalNote = false,
}) {
  const normalizedTicketNumber =
    normalizeIdentifier(ticketNumber);

  const formData = new FormData();

  formData.append(
    "body",
    String(body ?? "").trim(),
  );

  formData.append(
    "is_internal_note",
    isInternalNote ? "true" : "false",
  );

  appendAttachments(
    formData,
    attachments,
  );

  const response = await apiClient.post(
    `/tickets/management/tickets/${
      encodeURIComponent(
        normalizedTicketNumber,
      )
    }/reply/`,
    formData,
  );

  return {
    message: response.data.message,
    ticket:
      response.data.ticket
      ?? response.data,
  };
}