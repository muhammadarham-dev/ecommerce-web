import apiClient from "../api/client";
import { extractList } from "../utils/apiData";


function normalizeIdentifier(value) {
  return String(value ?? "").trim();
}


export async function fetchAdminVariants(params = {}) {
  const response = await apiClient.get(
    "/variants/management/variants/",
    {
      params,
    },
  );

  return extractList(response.data);
}


export async function fetchAdminVariant(variantSku) {
  const sku = normalizeIdentifier(
    variantSku,
  );

  const response = await apiClient.get(
    `/variants/management/variants/${
      encodeURIComponent(sku)
    }/`,
  );

  return response.data;
}


export async function createAdminVariant(payload) {
  const response = await apiClient.post(
    "/variants/management/variants/",
    payload,
  );

  const sku =
    response.data?.sku
    ?? payload.sku;

  return fetchAdminVariant(sku);
}


export async function updateAdminVariant(
  variantSku,
  payload,
) {
  const currentSku =
    normalizeIdentifier(
      variantSku,
    );

  const response = await apiClient.patch(
    `/variants/management/variants/${
      encodeURIComponent(currentSku)
    }/`,
    payload,
  );

  const updatedSku =
    response.data?.sku
    ?? payload.sku
    ?? currentSku;

  return fetchAdminVariant(
    updatedSku,
  );
}


export async function deleteAdminVariant(
  variantSku,
) {
  const sku = normalizeIdentifier(
    variantSku,
  );

  await apiClient.delete(
    `/variants/management/variants/${
      encodeURIComponent(sku)
    }/`,
  );
}


export async function fetchAdminAttributes(
  params = {},
) {
  const response = await apiClient.get(
    "/variants/management/attributes/",
    {
      params,
    },
  );

  return extractList(response.data);
}


export async function fetchAdminAttribute(
  attributeSlug,
) {
  const slug = normalizeIdentifier(
    attributeSlug,
  );

  const response = await apiClient.get(
    `/variants/management/attributes/${
      encodeURIComponent(slug)
    }/`,
  );

  return response.data;
}


export async function createAdminAttribute(
  payload,
) {
  const response = await apiClient.post(
    "/variants/management/attributes/",
    payload,
  );

  return response.data;
}


export async function updateAdminAttribute(
  attributeSlug,
  payload,
) {
  const slug = normalizeIdentifier(
    attributeSlug,
  );

  const response = await apiClient.patch(
    `/variants/management/attributes/${
      encodeURIComponent(slug)
    }/`,
    payload,
  );

  return response.data;
}


export async function deleteAdminAttribute(
  attributeSlug,
) {
  const slug = normalizeIdentifier(
    attributeSlug,
  );

  await apiClient.delete(
    `/variants/management/attributes/${
      encodeURIComponent(slug)
    }/`,
  );
}


export async function fetchAdminAttributeValues(
  params = {},
) {
  const response = await apiClient.get(
    "/variants/management/values/",
    {
      params,
    },
  );

  return extractList(response.data);
}


export async function createAdminAttributeValue(
  payload,
) {
  const response = await apiClient.post(
    "/variants/management/values/",
    payload,
  );

  return response.data;
}


export async function updateAdminAttributeValue(
  valueId,
  payload,
) {
  const response = await apiClient.patch(
    `/variants/management/values/${valueId}/`,
    payload,
  );

  return response.data;
}


export async function deleteAdminAttributeValue(
  valueId,
) {
  await apiClient.delete(
    `/variants/management/values/${valueId}/`,
  );
}