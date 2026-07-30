import apiClient from "../api/client";
import { extractList } from "../utils/apiData";


function normalizeIdentifier(value) {
  return String(value ?? "").trim();
}


export async function fetchInventorySummary() {
  const response = await apiClient.get(
    "/inventory/summary/",
  );

  return response.data;
}


export async function adjustInventory(payload) {
  const response = await apiClient.post(
    "/inventory/adjust/",
    payload,
  );

  return response.data;
}


export async function fetchStockMovements(
  params = {},
) {
  const response = await apiClient.get(
    "/inventory/movements/",
    {
      params,
    },
  );

  return extractList(response.data);
}


export async function fetchStockMovement(
  movementId,
) {
  const response = await apiClient.get(
    `/inventory/movements/${movementId}/`,
  );

  return response.data;
}


export async function fetchProductStockHistory(
  productSlug,
  params = {},
) {
  const slug = normalizeIdentifier(
    productSlug,
  );

  const response = await apiClient.get(
    `/inventory/products/${
      encodeURIComponent(slug)
    }/history/`,
    {
      params,
    },
  );

  return extractList(response.data);
}


export async function fetchVariantStockHistory(
  variantSku,
  params = {},
) {
  const sku = normalizeIdentifier(
    variantSku,
  );

  const response = await apiClient.get(
    `/inventory/variants/${
      encodeURIComponent(sku)
    }/history/`,
    {
      params,
    },
  );

  return extractList(response.data);
}