import axios from "axios";

import {
  clearAuthentication,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpired,
  updateAccessToken,
  updateRefreshToken,
  updateStoredUser,
} from "../utils/tokenStorage";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;


const apiClient = axios.create({
  baseURL: API_BASE_URL,
});


let refreshRequest = null;


function removeContentTypeHeader(
  headers,
) {
  if (!headers) {
    return;
  }

  if (
    typeof headers.delete
    === "function"
  ) {
    headers.delete("Content-Type");
    headers.delete("content-type");
    return;
  }

  delete headers["Content-Type"];
  delete headers["content-type"];
}


function getSharedRefreshRequest() {
  if (!refreshRequest) {
    refreshRequest =
      refreshAccessToken()
        .finally(() => {
          refreshRequest = null;
        });
  }

  return refreshRequest;
}


async function refreshAccessToken() {
  const refreshToken =
    getRefreshToken();

  if (!refreshToken) {
    throw new Error(
      "Refresh token is unavailable.",
    );
  }

  const response = await axios.post(
    `${API_BASE_URL}/account-security/token/refresh/`,
    {
      refresh: refreshToken,
    },
    {
      headers: {
        "Content-Type":
          "application/json",
      },
    },
  );

  const {
    access,
    refresh,
    user,
  } = response.data;

  if (!access) {
    throw new Error(
      "The refresh response did not include an access token.",
    );
  }

  updateAccessToken(access);

  if (refresh) {
    updateRefreshToken(refresh);
  }

  if (user) {
    updateStoredUser(user);
  }

  return access;
}


apiClient.interceptors.request.use(
  async (config) => {
    let accessToken =
      getAccessToken();

    if (
      accessToken
      && isAccessTokenExpired(accessToken)
      && getRefreshToken()
    ) {
      try {
        accessToken =
          await getSharedRefreshRequest();
      } catch {
        clearAuthentication();
        accessToken = null;
      }
    }

    config.headers =
      config.headers ?? {};

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    } else {
      delete config.headers.Authorization;
    }

    /*
     * Never set multipart/form-data manually.
     * The browser must add its boundary.
     */
    if (
      typeof FormData !== "undefined"
      && config.data
        instanceof FormData
    ) {
      removeContentTypeHeader(
        config.headers,
      );
    }

    return config;
  },
  (error) =>
    Promise.reject(error),
);


apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest =
      error.config;

    const isUnauthorized =
      error.response?.status === 401;

    const isRefreshRequest =
      originalRequest?.url?.includes(
        "/account-security/token/refresh/",
      );

    if (
      !isUnauthorized
      || originalRequest?._retry
      || isRefreshRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccessToken =
        await getSharedRefreshRequest();

      originalRequest.headers =
        originalRequest.headers
        ?? {};

      originalRequest
        .headers
        .Authorization =
        `Bearer ${newAccessToken}`;

      return apiClient(
        originalRequest,
      );
    } catch (refreshError) {
      clearAuthentication();

      if (
        window.location.pathname
        !== "/login"
      ) {
        window.location.replace(
          "/login",
        );
      }

      return Promise.reject(
        refreshError,
      );
    }
  },
);


export default apiClient;
