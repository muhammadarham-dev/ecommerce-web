import apiClient from "../api/client";
import { extractList } from "../utils/apiData";


function normalizeIdentifier(value) {
  return String(value ?? "").trim();
}


export async function fetchAdminOrderDashboard() {
  const response = await apiClient.get(
    "/orders/management/dashboard/",
  );

  return response.data;
}


export async function fetchAdminOrders(
  params = {},
) {
  const response = await apiClient.get(
    "/orders/management/orders/",
    {
      params,
    },
  );

  return extractList(response.data);
}


export async function fetchAdminOrder(
  orderNumber,
) {
  const normalizedOrderNumber =
    normalizeIdentifier(orderNumber);

  const response = await apiClient.get(
    `/orders/management/orders/${
      encodeURIComponent(
        normalizedOrderNumber,
      )
    }/`,
  );

  return (
    response.data.order
    ?? response.data
  );
}


export async function updateAdminOrderStatus(
  orderNumber,
  payload,
) {
  const normalizedOrderNumber =
    normalizeIdentifier(orderNumber);

  const response = await apiClient.patch(
    `/orders/management/orders/${
      encodeURIComponent(
        normalizedOrderNumber,
      )
    }/status/`,
    payload,
  );

  return {
    message: response.data.message,
    order:
      response.data.order
      ?? response.data,
  };
}


export async function fetchAdminPayments(
  params = {},
) {
  const response = await apiClient.get(
    "/payments/management/payments/",
    {
      params,
    },
  );

  return extractList(response.data);
}


export async function fetchAdminPayment(
  paymentNumber,
) {
  const normalizedPaymentNumber =
    normalizeIdentifier(paymentNumber);

  const response = await apiClient.get(
    `/payments/management/payments/${
      encodeURIComponent(
        normalizedPaymentNumber,
      )
    }/`,
  );

  return response.data;
}


export async function fetchOrderPayment(
  orderNumber,
) {
  const normalizedOrderNumber =
    normalizeIdentifier(orderNumber);

  const payments = await fetchAdminPayments({
    order_number: normalizedOrderNumber,
  });

  return payments[0] ?? null;
}


export async function verifyAdminPayment(
  paymentNumber,
) {
  const normalizedPaymentNumber =
    normalizeIdentifier(paymentNumber);

  const response = await apiClient.patch(
    `/payments/management/payments/${
      encodeURIComponent(
        normalizedPaymentNumber,
      )
    }/verify/`,
    {},
  );

  return {
    message: response.data.message,
    payment:
      response.data.payment
      ?? response.data,
  };
}


export async function rejectAdminPayment(
  paymentNumber,
  rejectionReason,
) {
  const normalizedPaymentNumber =
    normalizeIdentifier(paymentNumber);

  const response = await apiClient.patch(
    `/payments/management/payments/${
      encodeURIComponent(
        normalizedPaymentNumber,
      )
    }/reject/`,
    {
      rejection_reason: String(
        rejectionReason ?? "",
      ).trim(),
    },
  );

  return {
    message: response.data.message,
    payment:
      response.data.payment
      ?? response.data,
  };
}


export async function refundAdminPayment(
  paymentNumber,
) {
  const normalizedPaymentNumber =
    normalizeIdentifier(paymentNumber);

  const response = await apiClient.patch(
    `/payments/management/payments/${
      encodeURIComponent(
        normalizedPaymentNumber,
      )
    }/refund/`,
    {},
  );

  return {
    message: response.data.message,
    payment:
      response.data.payment
      ?? response.data,
  };
}