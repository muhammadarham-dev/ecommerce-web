import apiClient from "../api/client";
import { extractList } from "../utils/apiData";


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


export async function fetchTickets() {
  const response = await apiClient.get(
    "/tickets/",
  );

  return extractList(response.data);
}


export async function fetchTicket(
  ticketNumber,
) {
  const response = await apiClient.get(
    `/tickets/${ticketNumber}/`,
  );

  return (
    response.data.ticket
    ?? response.data
  );
}


export async function createTicket({
  category,
  priority,
  subject,
  orderId = "",
  productId = "",
  message,
  attachments = [],
}) {
  const formData = new FormData();

  formData.append("category", category);
  formData.append("priority", priority);
  formData.append("subject", subject);
  formData.append("message", message);

  if (orderId) {
    formData.append("order_id", orderId);
  }

  if (productId) {
    formData.append(
      "product_id",
      productId,
    );
  }

  appendAttachments(
    formData,
    attachments,
  );

  const response = await apiClient.post(
    "/tickets/",
    formData,
  );

  return {
    message: response.data.message,
    ticket:
      response.data.ticket
      ?? response.data,
  };
}


export async function replyToTicket({
  ticketNumber,
  body,
  attachments = [],
}) {
  const formData = new FormData();

  formData.append("body", body);

  appendAttachments(
    formData,
    attachments,
  );

  const response = await apiClient.post(
    `/tickets/${ticketNumber}/reply/`,
    formData,
  );

  return {
    message: response.data.message,
    ticket:
      response.data.ticket
      ?? response.data,
  };
}


export async function closeTicket(
  ticketNumber,
) {
  const response = await apiClient.post(
    `/tickets/${ticketNumber}/close/`,
    {},
  );

  return {
    message: response.data.message,
    ticket:
      response.data.ticket
      ?? response.data,
  };
}