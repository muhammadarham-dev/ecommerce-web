import apiClient from "../api/client";
import { extractList } from "../utils/apiData";


function normalizeId(value, label) {
  const normalizedValue = Number(value);

  if (
    !Number.isInteger(normalizedValue)
    || normalizedValue <= 0
  ) {
    throw new Error(
      `A valid ${label} ID is required.`,
    );
  }

  return normalizedValue;
}


function normalizeCode(value, label) {
  const normalizedValue = String(
    value ?? "",
  )
    .trim()
    .toUpperCase();

  if (!normalizedValue) {
    throw new Error(
      `A valid ${label} code is required.`,
    );
  }

  return normalizedValue;
}


function normalizeNullableMoney(value) {
  if (
    value === ""
    || value === null
    || value === undefined
  ) {
    return null;
  }

  return String(value);
}


export async function fetchShippingZones(
  params = {},
) {
  const response = await apiClient.get(
    "/shipping-rates/management/zones/",
    {
      params,
    },
  );

  const items = extractList(response.data);

  return {
    items,
    count:
      typeof response.data?.count === "number"
        ? response.data.count
        : items.length,
  };
}


export async function fetchShippingZone(
  zoneCode,
) {
  const normalizedCode =
    normalizeCode(zoneCode, "shipping zone");

  const response = await apiClient.get(
    `/shipping-rates/management/zones/${
      encodeURIComponent(normalizedCode)
    }/`,
  );

  return response.data;
}


export async function createShippingZone(
  values,
) {
  const response = await apiClient.post(
    "/shipping-rates/management/zones/",
    {
      name: String(values.name ?? "").trim(),
      code: String(values.code ?? "")
        .trim()
        .toUpperCase(),
      country: String(
        values.country ?? "Pakistan",
      ).trim(),
      province: String(
        values.province ?? "",
      ).trim(),
      city: String(
        values.city ?? "",
      ).trim(),
      priority: Number(
        values.priority ?? 0,
      ),
      is_active:
        values.isActive !== false,
    },
  );

  return response.data;
}


export async function updateShippingZone(
  zoneCode,
  values,
) {
  const normalizedCode =
    normalizeCode(zoneCode, "shipping zone");

  const response = await apiClient.patch(
    `/shipping-rates/management/zones/${
      encodeURIComponent(normalizedCode)
    }/`,
    {
      name: String(values.name ?? "").trim(),
      code: String(values.code ?? "")
        .trim()
        .toUpperCase(),
      country: String(
        values.country ?? "Pakistan",
      ).trim(),
      province: String(
        values.province ?? "",
      ).trim(),
      city: String(
        values.city ?? "",
      ).trim(),
      priority: Number(
        values.priority ?? 0,
      ),
      is_active:
        values.isActive !== false,
    },
  );

  return response.data;
}


export async function deleteShippingZone(
  zoneCode,
) {
  const normalizedCode =
    normalizeCode(zoneCode, "shipping zone");

  await apiClient.delete(
    `/shipping-rates/management/zones/${
      encodeURIComponent(normalizedCode)
    }/`,
  );
}


export async function fetchShippingMethods(
  params = {},
) {
  const response = await apiClient.get(
    "/shipping-rates/management/methods/",
    {
      params,
    },
  );

  const items = extractList(response.data);

  return {
    items,
    count:
      typeof response.data?.count === "number"
        ? response.data.count
        : items.length,
  };
}


export async function fetchShippingMethod(
  methodCode,
) {
  const normalizedCode =
    normalizeCode(methodCode, "shipping method");

  const response = await apiClient.get(
    `/shipping-rates/management/methods/${
      encodeURIComponent(normalizedCode)
    }/`,
  );

  return response.data;
}


export async function createShippingMethod(
  values,
) {
  const response = await apiClient.post(
    "/shipping-rates/management/methods/",
    {
      name: String(values.name ?? "").trim(),
      code: String(values.code ?? "")
        .trim()
        .toUpperCase(),
      description: String(
        values.description ?? "",
      ).trim(),
      is_default:
        Boolean(values.isDefault),
      is_active:
        values.isActive !== false,
      display_order: Number(
        values.displayOrder ?? 0,
      ),
    },
  );

  return response.data;
}


export async function updateShippingMethod(
  methodCode,
  values,
) {
  const normalizedCode =
    normalizeCode(
      methodCode,
      "shipping method",
    );

  const response = await apiClient.patch(
    `/shipping-rates/management/methods/${
      encodeURIComponent(normalizedCode)
    }/`,
    {
      name: String(values.name ?? "").trim(),
      code: String(values.code ?? "")
        .trim()
        .toUpperCase(),
      description: String(
        values.description ?? "",
      ).trim(),
      is_default:
        Boolean(values.isDefault),
      is_active:
        values.isActive !== false,
      display_order: Number(
        values.displayOrder ?? 0,
      ),
    },
  );

  return response.data;
}


export async function deleteShippingMethod(
  methodCode,
) {
  const normalizedCode =
    normalizeCode(
      methodCode,
      "shipping method",
    );

  await apiClient.delete(
    `/shipping-rates/management/methods/${
      encodeURIComponent(normalizedCode)
    }/`,
  );
}


export async function fetchAdminShippingRates(
  params = {},
) {
  const response = await apiClient.get(
    "/shipping-rates/management/rates/",
    {
      params,
    },
  );

  const items = extractList(response.data);

  return {
    items,
    count:
      typeof response.data?.count === "number"
        ? response.data.count
        : items.length,
  };
}


export async function fetchAdminShippingRate(
  shippingRateId,
) {
  const normalizedId = normalizeId(
    shippingRateId,
    "shipping rate",
  );

  const response = await apiClient.get(
    `/shipping-rates/management/rates/${
      normalizedId
    }/`,
  );

  return response.data;
}


export async function createAdminShippingRate(
  values,
) {
  const response = await apiClient.post(
    "/shipping-rates/management/rates/",
    {
      zone: normalizeId(
        values.zoneId,
        "shipping zone",
      ),
      method: normalizeId(
        values.methodId,
        "shipping method",
      ),
      charge: String(
        values.charge ?? "0.00",
      ),
      free_shipping_threshold:
        normalizeNullableMoney(
          values.freeShippingThreshold,
        ),
      estimated_min_days: Number(
        values.estimatedMinDays ?? 3,
      ),
      estimated_max_days: Number(
        values.estimatedMaxDays ?? 5,
      ),
      cod_available:
        values.codAvailable !== false,
      is_active:
        values.isActive !== false,
    },
  );

  return response.data;
}


export async function updateAdminShippingRate(
  shippingRateId,
  values,
) {
  const normalizedId = normalizeId(
    shippingRateId,
    "shipping rate",
  );

  const response = await apiClient.patch(
    `/shipping-rates/management/rates/${
      normalizedId
    }/`,
    {
      zone: normalizeId(
        values.zoneId,
        "shipping zone",
      ),
      method: normalizeId(
        values.methodId,
        "shipping method",
      ),
      charge: String(
        values.charge ?? "0.00",
      ),
      free_shipping_threshold:
        normalizeNullableMoney(
          values.freeShippingThreshold,
        ),
      estimated_min_days: Number(
        values.estimatedMinDays ?? 3,
      ),
      estimated_max_days: Number(
        values.estimatedMaxDays ?? 5,
      ),
      cod_available:
        values.codAvailable !== false,
      is_active:
        values.isActive !== false,
    },
  );

  return response.data;
}


export async function updateShippingRateStatus(
  shippingRateId,
  isActive,
) {
  const normalizedId = normalizeId(
    shippingRateId,
    "shipping rate",
  );

  const response = await apiClient.patch(
    `/shipping-rates/management/rates/${
      normalizedId
    }/`,
    {
      is_active: Boolean(isActive),
    },
  );

  return response.data;
}


export async function deleteAdminShippingRate(
  shippingRateId,
) {
  const normalizedId = normalizeId(
    shippingRateId,
    "shipping rate",
  );

  await apiClient.delete(
    `/shipping-rates/management/rates/${
      normalizedId
    }/`,
  );
}
