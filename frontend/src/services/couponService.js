import apiClient from "../api/client";

import {
  extractList,
} from "../utils/apiData";


export async function fetchAvailableCoupons(
  params = {},
) {
  const response = await apiClient.get(
    "/coupons/available/",
    {
      params,
    },
  );

  return extractList(response.data);
}


export async function fetchCouponDetail(
  couponCode,
) {
  const normalizedCode = String(
    couponCode ?? "",
  )
    .trim()
    .toUpperCase();

  const response = await apiClient.get(
    `/coupons/available/${
      encodeURIComponent(normalizedCode)
    }/`,
  );

  return response.data;
}


export async function validateCoupon(
  couponCode,
) {
  const normalizedCode = String(
    couponCode ?? "",
  )
    .trim()
    .toUpperCase();

  const response = await apiClient.post(
    "/coupons/validate/",
    {
      coupon_code: normalizedCode,
    },
  );

  return response.data;
}