import apiClient from "../api/client";
import {
  extractList,
} from "../utils/apiData";


function normalizeSlug(value) {
  return String(value ?? "").trim();
}


export async function fetchAdminProducts(
  params = {},
) {
  const response = await apiClient.get(
    "/catalog/products/",
    {
      params,
    },
  );

  return extractList(response.data);
}


export async function fetchAdminProduct(
  productSlug,
) {
  const slug =
    normalizeSlug(productSlug);

  const response = await apiClient.get(
    `/catalog/products/${
      encodeURIComponent(slug)
    }/`,
  );

  return response.data;
}


export async function createAdminProduct(
  payload,
) {
  const response = await apiClient.post(
    "/catalog/products/",
    payload,
  );

  return response.data;
}


export async function updateAdminProduct(
  productSlug,
  payload,
) {
  const slug =
    normalizeSlug(productSlug);

  const response = await apiClient.patch(
    `/catalog/products/${
      encodeURIComponent(slug)
    }/`,
    payload,
  );

  return response.data;
}


export async function deleteAdminProduct(
  productSlug,
) {
  const slug =
    normalizeSlug(productSlug);

  await apiClient.delete(
    `/catalog/products/${
      encodeURIComponent(slug)
    }/`,
  );
}


export async function fetchAdminCategories(
  params = {},
) {
  const response = await apiClient.get(
    "/catalog/categories/",
    {
      params,
    },
  );

  return extractList(response.data);
}


export async function fetchAdminCategory(
  categorySlug,
) {
  const slug =
    normalizeSlug(categorySlug);

  const response = await apiClient.get(
    `/catalog/categories/${
      encodeURIComponent(slug)
    }/`,
  );

  return response.data;
}


export async function createAdminCategory(
  formData,
) {
  const response = await apiClient.post(
    "/catalog/categories/",
    formData,
  );

  return response.data;
}


export async function updateAdminCategory(
  categorySlug,
  formData,
) {
  const slug =
    normalizeSlug(categorySlug);

  const response = await apiClient.patch(
    `/catalog/categories/${
      encodeURIComponent(slug)
    }/`,
    formData,
  );

  return response.data;
}


export async function deleteAdminCategory(
  categorySlug,
) {
  const slug =
    normalizeSlug(categorySlug);

  await apiClient.delete(
    `/catalog/categories/${
      encodeURIComponent(slug)
    }/`,
  );
}


export async function uploadAdminProductImage({
  productSlug,
  image,
  altText = "",
  isPrimary = false,
}) {
  const slug = normalizeSlug(productSlug);
  const formData = new FormData();

  formData.append(
    "image",
    image,
  );

  formData.append(
    "alt_text",
    altText,
  );

  formData.append(
    "is_primary",
    isPrimary
      ? "true"
      : "false",
  );

  const response = await apiClient.post(
    `/catalog/products/${
      encodeURIComponent(slug)
    }/images/`,
    formData,
  );

  return response.data;
}


export async function setAdminProductImagePrimary({
  productSlug,
  imageId,
}) {
  const slug = normalizeSlug(productSlug);

  const response = await apiClient.patch(
    `/catalog/products/${
      encodeURIComponent(slug)
    }/images/${imageId}/primary/`,
    {
      is_primary: true,
    },
  );

  return response.data;
}


export async function deleteAdminProductImage({
  productSlug,
  imageId,
}) {
  const slug = normalizeSlug(productSlug);

  await apiClient.delete(
    `/catalog/products/${
      encodeURIComponent(slug)
    }/images/${imageId}/`,
  );
}
