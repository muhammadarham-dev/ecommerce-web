import apiClient from "../api/client";


export async function fetchStoreSettings() {
  const response = await apiClient.get(
    "/store-settings/",
  );

  return response.data;
}