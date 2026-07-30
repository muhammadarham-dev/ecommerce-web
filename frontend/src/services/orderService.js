import apiClient from "../api/client";
import { extractList } from "../utils/apiData";

export async function placeOrder({
  addressId,
  paymentMethod,
  shippingMethodCode = "",
  notes = "",
  couponCode = "",
}) {
  const response = await apiClient.post(
    "/orders/checkout/",
    {
      address_id: addressId,
      payment_method: paymentMethod,
      shipping_method_code:
        shippingMethodCode,
      notes,
      coupon_code: couponCode,
    },
  );

  return {
    message: response.data.message,
    order:
      response.data.order
      ?? response.data,
  };
}

export async function fetchOrders(
  params = {},
) {
  const response = await apiClient.get(
    "/orders/",
    {
      params,
    },
  );

  return extractList(response.data);
}

export async function fetchOrder(
  orderNumber,
) {
  const response = await apiClient.get(
    `/orders/${orderNumber}/`,
  );

  return (
    response.data.order
    ?? response.data
  );
}

export async function cancelOrder(
  orderNumber,
) {
  const response = await apiClient.post(
    `/orders/${orderNumber}/cancel/`,
    {},
  );

  return response.data;
}