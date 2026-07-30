import apiClient from "../api/client";
import { extractList } from "../utils/apiData";


export async function fetchRecentlyViewed(
  params = {},
) {
  const response = await apiClient.get(
    "/recently-viewed/",
    {
      params,
    },
  );

  return extractList(response.data);
}


export async function fetchRecentlyViewedCount() {
  const response = await apiClient.get(
    "/recently-viewed/count/",
  );

  return Number(
    response.data.recently_viewed_count
    ?? 0,
  );
}


export async function trackRecentlyViewedProduct(
  productSlug,
) {
  const response = await apiClient.post(
    `/recently-viewed/track/${
      encodeURIComponent(productSlug)
    }/`,
    {},
  );

  return {
    message: response.data.message,
    recentlyViewed:
      response.data.recently_viewed
      ?? response.data,
  };
}


export async function removeRecentlyViewedEntry(
  entryId,
) {
  const response = await apiClient.delete(
    `/recently-viewed/${entryId}/`,
  );

  return {
    message: response.data.message,
  };
}


export async function clearRecentlyViewedHistory() {
  const response = await apiClient.delete(
    "/recently-viewed/clear/",
  );

  return {
    message: response.data.message,
    deletedItems: Number(
      response.data.deleted_items ?? 0,
    ),
  };
}