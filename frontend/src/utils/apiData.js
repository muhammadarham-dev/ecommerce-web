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


function findFirstErrorMessage(value) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = findFirstErrorMessage(item);

      if (message) {
        return message;
      }
    }

    return "";
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const message = findFirstErrorMessage(item);

      if (message) {
        return message;
      }
    }
  }

  return "";
}


export function getApiErrorMessage(
  error,
  fallbackMessage = "The request could not be completed.",
) {
  const responseData = error.response?.data;
  const detailedMessage = findFirstErrorMessage(
    responseData?.error?.details,
  );

  if (detailedMessage) {
    return detailedMessage;
  }

  if (typeof responseData?.detail === "string") {
    return responseData.detail;
  }

  if (responseData?.error?.message) {
    return responseData.error.message;
  }

  if (responseData && !responseData.error) {
    const directMessage = findFirstErrorMessage(responseData);

    if (directMessage) {
      return directMessage;
    }
  }

  if (!error.response) {
    return (
      "Unable to connect with the server. "
      + "Please ensure the backend is running."
    );
  }

  return fallbackMessage;
}
