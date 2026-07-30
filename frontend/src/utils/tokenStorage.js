const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "authenticated_user";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function isAccessTokenExpired(
  accessToken,
  clockSkewSeconds = 20,
) {
  if (!accessToken) {
    return true;
  }

  try {
    const tokenParts = accessToken.split(".");

    if (tokenParts.length !== 3) {
      return true;
    }

    const normalizedPayload = tokenParts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      "=",
    );

    const payload = JSON.parse(
      window.atob(paddedPayload),
    );

    const expiresAt = Number(payload.exp);

    if (!Number.isFinite(expiresAt)) {
      return true;
    }

    const currentTime = Date.now() / 1000;

    return expiresAt <= (
      currentTime + clockSkewSeconds
    );
  } catch {
    return true;
  }
}

export function getStoredUser() {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function saveAuthentication({
  access,
  refresh,
  user,
}) {
  if (access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
  }

  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }

  if (user) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(user),
    );
  }
}

export function updateAccessToken(accessToken) {
  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken,
  );
}

export function updateRefreshToken(refreshToken) {
  localStorage.setItem(
    REFRESH_TOKEN_KEY,
    refreshToken,
  );
}

export function updateStoredUser(user) {
  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user),
  );
}

export function clearAuthentication() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}