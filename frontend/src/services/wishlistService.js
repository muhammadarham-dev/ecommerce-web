import apiClient from "../api/client";


export function normalizeWishlist(
  responseData,
) {
  const wishlistData =
    responseData?.wishlist
    ?? responseData?.data
    ?? responseData
    ?? {};

  const items =
    Array.isArray(wishlistData)
      ? wishlistData
      : Array.isArray(
        wishlistData.results,
      )
        ? wishlistData.results
        : Array.isArray(
          wishlistData.items,
        )
          ? wishlistData.items
          : [];

  return {
    ...(
      Array.isArray(wishlistData)
        ? {}
        : wishlistData
    ),
    items,
    total_items: Number(
      wishlistData.count
      ?? wishlistData.total_items
      ?? wishlistData.item_count
      ?? items.length
      ?? 0,
    ),
  };
}


export async function fetchWishlist(
  params = {},
) {
  const response = await apiClient.get(
    "/wishlist/",
    {
      params,
    },
  );

  return normalizeWishlist(
    response.data,
  );
}


export async function addWishlistItem(
  productId,
) {
  const response = await apiClient.post(
    "/wishlist/",
    {
      product_id: productId,
    },
  );

  return response.data;
}


export async function deleteWishlistItem(
  itemId,
) {
  const response = await apiClient.delete(
    `/wishlist/${itemId}/`,
  );

  return response.data;
}


export async function clearWishlistItems() {
  const response = await apiClient.delete(
    "/wishlist/clear/",
  );

  return response.data;
}


export async function fetchWishlistCount() {
  const response = await apiClient.get(
    "/wishlist/count/",
  );

  return Number(
    response.data?.wishlist_count
    ?? 0,
  );
}


export async function moveWishlistItemToCart({
  itemId,
  quantity = 1,
}) {
  const response = await apiClient.post(
    `/wishlist/${itemId}/move-to-cart/`,
    {
      quantity,
    },
  );

  return response.data;
}
