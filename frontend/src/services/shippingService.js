import apiClient from "../api/client";

import {
  extractList,
} from "../utils/apiData";


export async function fetchShippingMethods() {
  const response = await apiClient.get(
    "/shipping-rates/methods/",
  );

  return extractList(response.data);
}


export async function fetchShippingQuote({
  addressId,
  shippingMethodCode = "",
}) {
  const normalizedAddressId =
    Number(addressId);

  const normalizedMethodCode =
    String(
      shippingMethodCode ?? "",
    )
      .trim()
      .toUpperCase();

  if (
    !Number.isInteger(
      normalizedAddressId,
    )
    || normalizedAddressId <= 0
  ) {
    throw new Error(
      "A valid delivery address is required.",
    );
  }

  const response = await apiClient.post(
    "/shipping-rates/quote/",
    {
      address_id:
        normalizedAddressId,

      shipping_method_code:
        normalizedMethodCode,
    },
  );

  return response.data;
}
