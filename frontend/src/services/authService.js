import apiClient from "../api/client";

import {
  getRefreshToken,
} from "../utils/tokenStorage";


export async function registerUser(userData) {
  const response = await apiClient.post(
    "/auth/register/",
    userData,
  );

  return response.data;
}


export async function loginUser(credentials) {
  const response = await apiClient.post(
    "/account-security/login/",
    credentials,
  );

  return response.data;
}


export async function fetchCurrentUser() {
  const response = await apiClient.get(
    "/auth/me/",
  );

  return response.data.user ?? response.data;
}


export async function logoutUser() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return;
  }

  await apiClient.post(
    "/account-security/logout/",
    {
      refresh: refreshToken,
    },
  );
}


export async function logoutAllDevices() {
  const response = await apiClient.post(
    "/account-security/logout-all/",
    {},
  );

  return response.data;
}