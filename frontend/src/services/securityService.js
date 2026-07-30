import apiClient from "../api/client";


export async function fetchSecurityStatus() {
  const response = await apiClient.get(
    "/account-security/status/",
  );

  return response.data;
}


export async function sendVerificationEmail() {
  const response = await apiClient.post(
    "/account-security/email/send/",
    {},
  );

  return response.data;
}


export async function confirmEmailVerification(
  token,
) {
  const response = await apiClient.post(
    "/account-security/email/confirm/",
    {
      token,
    },
  );

  return response.data;
}


export async function changePassword({
  currentPassword,
  newPassword,
  confirmPassword,
}) {
  const response = await apiClient.post(
    "/account-security/password/change/",
    {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    },
  );

  return response.data;
}


export async function requestPasswordReset(
  email,
) {
  const response = await apiClient.post(
    "/account-security/password/forgot/",
    {
      email,
    },
  );

  return response.data;
}


export async function resetPassword({
  uid,
  token,
  newPassword,
  confirmPassword,
}) {
  const response = await apiClient.post(
    "/account-security/password/reset/",
    {
      uid,
      token,
      new_password: newPassword,
      confirm_password: confirmPassword,
    },
  );

  return response.data;
}


export async function logoutAllDevices() {
  const response = await apiClient.post(
    "/account-security/logout-all/",
    {},
  );

  return response.data;
}