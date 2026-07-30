import apiClient from "../api/client";

const ENDPOINT = "/store-settings/management/";

function text(value) {
  return String(value ?? "").trim();
}

function buildPayload(values) {
  return {
    store_name: text(values.store_name),
    tagline: text(values.tagline),
    description: text(values.description),
    support_email: text(values.support_email),
    support_phone: text(values.support_phone),
    whatsapp_number: text(values.whatsapp_number),
    address: text(values.address),
    city: text(values.city),
    province: text(values.province),
    country: text(values.country),
    postal_code: text(values.postal_code),
    currency_code: text(values.currency_code).toUpperCase(),
    currency_symbol: text(values.currency_symbol),
    tax_percentage: String(values.tax_percentage ?? "0.00"),
    return_window_days: Number(values.return_window_days ?? 7),
    low_stock_threshold: Number(values.low_stock_threshold ?? 5),
    order_cancellation_window_hours: Number(
      values.order_cancellation_window_hours ?? 24,
    ),
    maintenance_mode: Boolean(values.maintenance_mode),
    maintenance_message: text(values.maintenance_message),
    allow_cash_on_delivery: Boolean(values.allow_cash_on_delivery),
    allow_bank_transfer: Boolean(values.allow_bank_transfer),
    facebook_url: text(values.facebook_url),
    instagram_url: text(values.instagram_url),
    youtube_url: text(values.youtube_url),
    linkedin_url: text(values.linkedin_url),
    twitter_url: text(values.twitter_url),
  };
}

function buildFormData(values) {
  const formData = new FormData();

  Object.entries(buildPayload(values)).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  if (values.logo_file instanceof File) {
    formData.append("logo", values.logo_file);
  }

  if (values.favicon_file instanceof File) {
    formData.append("favicon", values.favicon_file);
  }

  return formData;
}

export async function fetchAdminStoreSettings() {
  const response = await apiClient.get(ENDPOINT);
  return response.data;
}

export async function updateAdminStoreSettings(values) {
  const hasFiles =
    values.logo_file instanceof File
    || values.favicon_file instanceof File;

  let response;

  if (hasFiles) {
    response = await apiClient.patch(
      ENDPOINT,
      buildFormData(values),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  } else {
    response = await apiClient.patch(
      ENDPOINT,
      buildPayload(values),
    );
  }

  const clearPayload = {};

  if (values.remove_logo && !(values.logo_file instanceof File)) {
    clearPayload.logo = null;
  }

  if (
    values.remove_favicon
    && !(values.favicon_file instanceof File)
  ) {
    clearPayload.favicon = null;
  }

  if (Object.keys(clearPayload).length) {
    response = await apiClient.patch(
      ENDPOINT,
      clearPayload,
    );
  }

  return response.data;
}
