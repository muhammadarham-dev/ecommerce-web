import publicApiClient from "../api/publicClient";
import {
  extractList,
} from "../utils/apiData";


export async function fetchProductCatalog(
  params = {},
) {
  const response = await publicApiClient.get(
    "/catalog/products/",
    {
      params,
    },
  );

  const items = extractList(
    response.data,
  );

  return {
    items,
    count:
      typeof response.data?.count
      === "number"
        ? response.data.count
        : items.length,
    next:
      response.data?.next
      ?? null,
    previous:
      response.data?.previous
      ?? null,
  };
}


export async function fetchProducts(
  params = {},
) {
  const result =
    await fetchProductCatalog(params);

  return result.items;
}


export async function fetchCategories(
  params = {},
) {
  const response = await publicApiClient.get(
    "/catalog/categories/",
    {
      params,
    },
  );

  return extractList(response.data);
}


export async function fetchCategoryBySlug(
  categorySlug,
) {
  const normalizedSlug = String(
    categorySlug ?? "",
  ).trim();

  if (!normalizedSlug) {
    throw new Error(
      "A category slug is required.",
    );
  }

  const response = await publicApiClient.get(
    `/catalog/categories/${
      encodeURIComponent(
        normalizedSlug,
      )
    }/`,
  );

  return response.data;
}


export async function fetchProductBySlug(
  productSlug,
) {
  const normalizedSlug = String(
    productSlug ?? "",
  ).trim();

  if (!normalizedSlug) {
    throw new Error(
      "A product slug is required.",
    );
  }

  const response = await publicApiClient.get(
    `/catalog/products/${
      encodeURIComponent(
        normalizedSlug,
      )
    }/`,
  );

  return response.data;
}


export async function fetchProductVariants(
  productSlug,
) {
  const normalizedSlug = String(
    productSlug ?? "",
  ).trim();

  if (!normalizedSlug) {
    return [];
  }

  const response = await publicApiClient.get(
    `/variants/products/${
      encodeURIComponent(
        normalizedSlug,
      )
    }/`,
  );

  return extractList(response.data);
}


/*
 * Compatibility alias used by existing pages.
 * The backend product lookup field is slug.
 */
export async function fetchProductById(
  productIdentifier,
) {
  return fetchProductBySlug(
    productIdentifier,
  );
}
