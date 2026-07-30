import apiClient from "../api/client";
import { extractList } from "../utils/apiData";


function normalizeBannerId(value) {
  const bannerId = Number(value);

  if (
    !Number.isInteger(bannerId)
    || bannerId <= 0
  ) {
    throw new Error(
      "A valid banner ID is required.",
    );
  }

  return bannerId;
}


function normalizeDateTime(value) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
}


function appendTextField(
  formData,
  key,
  value,
) {
  formData.append(
    key,
    String(value ?? "").trim(),
  );
}


function appendOptionalDateTime(
  formData,
  key,
  value,
) {
  const normalizedValue =
    normalizeDateTime(value);

  if (normalizedValue) {
    formData.append(
      key,
      normalizedValue,
    );
  }
}


export function buildBannerFormData(
  values = {},
) {
  const formData = new FormData();

  appendTextField(
    formData,
    "title",
    values.title,
  );

  appendTextField(
    formData,
    "subtitle",
    values.subtitle,
  );

  appendTextField(
    formData,
    "description",
    values.description,
  );

  appendTextField(
    formData,
    "position",
    values.position || "HERO",
  );

  appendTextField(
    formData,
    "button_text",
    values.buttonText,
  );

  appendTextField(
    formData,
    "button_url",
    values.buttonUrl,
  );

  appendTextField(
    formData,
    "background_color",
    values.backgroundColor,
  );

  appendTextField(
    formData,
    "text_color",
    values.textColor,
  );

  formData.append(
    "display_order",
    String(
      Number(values.displayOrder ?? 0),
    ),
  );

  formData.append(
    "is_active",
    values.isActive
      ? "true"
      : "false",
  );

  appendOptionalDateTime(
    formData,
    "starts_at",
    values.startsAt,
  );

  appendOptionalDateTime(
    formData,
    "ends_at",
    values.endsAt,
  );

  if (values.image instanceof File) {
    formData.append(
      "image",
      values.image,
    );
  }

  if (
    values.mobileImage
    instanceof File
  ) {
    formData.append(
      "mobile_image",
      values.mobileImage,
    );
  }

  return formData;
}


const multipartConfig = {
  headers: {
    "Content-Type":
      "multipart/form-data",
  },
};


export async function fetchAdminBanners(
  params = {},
) {
  const response = await apiClient.get(
    "/banners/management/banners/",
    {
      params,
    },
  );

  const items = extractList(
    response.data,
  );

  return {
    items,

    count:
      typeof response.data?.count
      === "number"
        ? response.data.count
        : items.length,
  };
}


export async function fetchAdminBanner(
  bannerId,
) {
  const normalizedBannerId =
    normalizeBannerId(bannerId);

  const response = await apiClient.get(
    `/banners/management/banners/${
      normalizedBannerId
    }/`,
  );

  return (
    response.data.banner
    ?? response.data
  );
}


export async function createAdminBanner(
  values,
) {
  const formData =
    buildBannerFormData(values);

  const response = await apiClient.post(
    "/banners/management/banners/",
    formData,
    multipartConfig,
  );

  return (
    response.data.banner
    ?? response.data
  );
}


export async function updateAdminBanner(
  bannerId,
  values,
) {
  const normalizedBannerId =
    normalizeBannerId(bannerId);

  const formData =
    buildBannerFormData(values);

  const response = await apiClient.patch(
    `/banners/management/banners/${
      normalizedBannerId
    }/`,
    formData,
    multipartConfig,
  );

  return (
    response.data.banner
    ?? response.data
  );
}


export async function updateAdminBannerStatus(
  bannerId,
  isActive,
) {
  const normalizedBannerId =
    normalizeBannerId(bannerId);

  const response = await apiClient.patch(
    `/banners/management/banners/${
      normalizedBannerId
    }/`,
    {
      is_active:
        Boolean(isActive),
    },
  );

  return (
    response.data.banner
    ?? response.data
  );
}


export async function deleteAdminBanner(
  bannerId,
) {
  const normalizedBannerId =
    normalizeBannerId(bannerId);

  await apiClient.delete(
    `/banners/management/banners/${
      normalizedBannerId
    }/`,
  );
}