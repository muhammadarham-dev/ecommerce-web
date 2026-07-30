import apiClient from "../api/client";

import {
  extractList,
} from "../utils/apiData";


export async function fetchBanners(
  position = "",
) {
  const normalizedPosition = String(
    position ?? "",
  )
    .trim()
    .toUpperCase();

  const response = await apiClient.get(
    "/banners/",
    {
      params: normalizedPosition
        ? {
          position: normalizedPosition,
        }
        : {},
    },
  );

  return extractList(
    response.data,
  ).filter(
    (banner) =>
      banner.is_currently_visible
      !== false,
  );
}


export async function fetchHeroBanners() {
  return fetchBanners("HERO");
}


export async function fetchPromotionalBanners() {
  return fetchBanners(
    "PROMOTIONAL",
  );
}


export async function fetchCategoryBanners() {
  return fetchBanners("CATEGORY");
}


export async function fetchSidebarBanners() {
  return fetchBanners("SIDEBAR");
}