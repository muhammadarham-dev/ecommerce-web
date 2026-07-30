import apiClient from "../api/client";

export function normalizeCart(responseData) {
  const cartData =
    responseData?.cart
    || responseData?.data
    || responseData
    || {};

  const items = Array.isArray(cartData.items)
    ? cartData.items
    : [];

  const totalItems =
    cartData.total_items
    ?? cartData.item_count
    ?? items.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0,
    );

  const subtotal =
    cartData.subtotal
    ?? cartData.total_price
    ?? cartData.total
    ?? items.reduce(
      (total, item) => {
        const lineTotal =
          item.line_total
          ?? item.total_price
          ?? (
            Number(item.unit_price || 0)
            * Number(item.quantity || 0)
          );

        return total + Number(lineTotal || 0);
      },
      0,
    );

  return {
    ...cartData,
    items,
    total_items: Number(totalItems || 0),
    subtotal: Number(subtotal || 0),
  };
}

export async function fetchCart() {
  const response = await apiClient.get(
    "/cart/",
  );

  return normalizeCart(response.data);
}

export async function addCartItem({
  productId,
  quantity = 1,
  variantId = null,
}) {
  const requestData = {
    product_id: productId,
    quantity,
  };

  if (variantId) {
    requestData.variant_id = variantId;
  }

  const response = await apiClient.post(
    "/cart/items/",
    requestData,
  );

  return response.data;
}

export async function updateCartItem({
  itemId,
  quantity,
}) {
  const response = await apiClient.patch(
    `/cart/items/${itemId}/`,
    {
      quantity,
    },
  );

  return response.data;
}

export async function removeCartItem(itemId) {
  const response = await apiClient.delete(
    `/cart/items/${itemId}/`,
  );

  return response.data;
}

export async function clearCartItems() {
  try {
    const response = await apiClient.delete(
      "/cart/clear/",
    );

    return response.data;
  } catch (error) {
    if (error.response?.status !== 405) {
      throw error;
    }

    const response = await apiClient.post(
      "/cart/clear/",
      {},
    );

    return response.data;
  }
}