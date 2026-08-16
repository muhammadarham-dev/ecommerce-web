export function extractList(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.results)) {
    return responseData.results;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData?.products)) {
    return responseData.products;
  }

  if (Array.isArray(responseData?.categories)) {
    return responseData.categories;
  }

  return [];
}

export function getApiErrorMessage(
  error,
  fallbackMessage = "The request could not be completed.",
) {
  const responseData = error.response?.data;

  if (responseData?.error?.message) {
    return responseData.error.message;
  }

  if (responseData?.error?.details) {
    const details = responseData.error.details;

    if (typeof details === "string") {
      return details;
    }

    const firstValue = Object.values(details)[0];

    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return String(firstValue[0]);
    }
  }

  if (responseData?.detail) {
    return responseData.detail;
  }

  if (!error.response) {
    return (
      "Unable to connect with the server. "
      + "Please ensure the backend is running."
    );
  }

  return fallbackMessage;
}