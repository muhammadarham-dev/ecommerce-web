import apiClient from "../api/client";
import { extractList } from "../utils/apiData";


function normalizeCouponCode(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}


function normalizeNullableNumber(value) {
  if (
    value === ""
    || value === null
    || value === undefined
  ) {
    return null;
  }

  return Number(value);
}


function normalizeDateTime(value) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
}


export function buildCouponPayload(values = {}) {
  return {
    code: normalizeCouponCode(values.code),
    name: String(values.name ?? "").trim(),
    description: String(
      values.description ?? "",
    ).trim(),
    discount_type: String(
      values.discountType ?? "",
    ).trim(),
    value: Number(values.value),
    minimum_order_amount: Number(
      values.minimumOrderAmount ?? 0,
    ),
    maximum_discount_amount:
      normalizeNullableNumber(
        values.maximumDiscountAmount,
      ),
    total_usage_limit:
      normalizeNullableNumber(
        values.totalUsageLimit,
      ),
    per_customer_limit: Number(
      values.perCustomerLimit ?? 1,
    ),
    starts_at: normalizeDateTime(
      values.startsAt,
    ),
    expires_at: normalizeDateTime(
      values.expiresAt,
    ),
    is_active: Boolean(values.isActive),
  };
}


export async function fetchAdminCoupons(
  params = {},
) {
  const response = await apiClient.get(
    "/coupons/management/coupons/",
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


export async function fetchAdminCoupon(
  couponCode,
) {
  const normalizedCode =
    normalizeCouponCode(couponCode);

  const response = await apiClient.get(
    `/coupons/management/coupons/${
      encodeURIComponent(normalizedCode)
    }/`,
  );

  return (
    response.data.coupon
    ?? response.data
  );
}


export async function createAdminCoupon(
  values,
) {
  const response = await apiClient.post(
    "/coupons/management/coupons/",
    buildCouponPayload(values),
  );

  return (
    response.data.coupon
    ?? response.data
  );
}


export async function updateAdminCoupon(
  couponCode,
  values,
) {
  const normalizedCode =
    normalizeCouponCode(couponCode);

  const response = await apiClient.patch(
    `/coupons/management/coupons/${
      encodeURIComponent(normalizedCode)
    }/`,
    buildCouponPayload(values),
  );

  return (
    response.data.coupon
    ?? response.data
  );
}


export async function updateAdminCouponStatus(
  couponCode,
  isActive,
) {
  const normalizedCode =
    normalizeCouponCode(couponCode);

  const response = await apiClient.patch(
    `/coupons/management/coupons/${
      encodeURIComponent(normalizedCode)
    }/`,
    {
      is_active: Boolean(isActive),
    },
  );

  return (
    response.data.coupon
    ?? response.data
  );
}


export async function deleteAdminCoupon(
  couponCode,
) {
  const normalizedCode =
    normalizeCouponCode(couponCode);

  await apiClient.delete(
    `/coupons/management/coupons/${
      encodeURIComponent(normalizedCode)
    }/`,
  );
}
