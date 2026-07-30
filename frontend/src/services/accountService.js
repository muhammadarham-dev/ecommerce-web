import apiClient from "../api/client";


export async function fetchProfile() {
  const response = await apiClient.get(
    "/auth/me/",
  );

  return response.data;
}


export async function updateProfile(
  profileData,
) {
  const response = await apiClient.patch(
    "/auth/me/",
    profileData,
  );

  return response.data;
}