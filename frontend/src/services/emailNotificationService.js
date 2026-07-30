import apiClient from "../api/client";


export async function fetchEmailPreferences() {
  const response = await apiClient.get(
    "/email-notifications/preferences/",
  );

  return (
    response.data.preferences
    ?? response.data
  );
}


export async function updateEmailPreferences(
  preferenceData,
) {
  const response = await apiClient.patch(
    "/email-notifications/preferences/",
    preferenceData,
  );

  return {
    message: response.data.message,
    preferences:
      response.data.preferences
      ?? response.data,
  };
}


export async function enableAllEmailPreferences() {
  const response = await apiClient.post(
    "/email-notifications/preferences/enable-all/",
    {},
  );

  return {
    message: response.data.message,
    preferences:
      response.data.preferences
      ?? response.data,
  };
}


export async function disableAllEmailPreferences() {
  const response = await apiClient.post(
    "/email-notifications/preferences/disable-all/",
    {},
  );

  return {
    message: response.data.message,
    preferences:
      response.data.preferences
      ?? response.data,
  };
}