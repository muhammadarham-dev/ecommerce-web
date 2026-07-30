import apiClient from "../api/client";
import { extractList } from "../utils/apiData";

export async function fetchAddresses() {
  const response = await apiClient.get(
    "/orders/addresses/",
  );

  return extractList(response.data);
}

export async function createAddress(addressData) {
  const response = await apiClient.post(
    "/orders/addresses/",
    addressData,
  );

  return response.data;
}

export async function updateAddress(
  addressId,
  addressData,
) {
  const response = await apiClient.patch(
    `/orders/addresses/${addressId}/`,
    addressData,
  );

  return response.data;
}

export async function deleteAddress(addressId) {
  await apiClient.delete(
    `/orders/addresses/${addressId}/`,
  );
}