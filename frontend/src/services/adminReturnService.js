import apiClient from "../api/client";
import { extractList } from "../utils/apiData";


function normalizeIdentifier(value) {
  return String(value ?? "").trim();
}


export async function fetchAdminReturns(
  params = {},
) {
  const response = await apiClient.get(
    "/returns/management/requests/",
    {
      params,
    },
  );

  const items = extractList(response.data);

  return {
    items,
    count:
      typeof response.data?.count === "number"
        ? response.data.count
        : items.length,
  };
}


export async function fetchAdminReturn(
  returnNumber,
) {
  const normalizedReturnNumber =
    normalizeIdentifier(returnNumber);

  const response = await apiClient.get(
    `/returns/management/requests/${
      encodeURIComponent(
        normalizedReturnNumber,
      )
    }/`,
  );

  return (
    response.data.return_request
    ?? response.data
  );
}


export async function updateAdminReturnStatus(
  returnNumber,
  {
    status,
    adminNote = "",
  },
) {
  const normalizedReturnNumber =
    normalizeIdentifier(returnNumber);

  const response = await apiClient.patch(
    `/returns/management/requests/${
      encodeURIComponent(
        normalizedReturnNumber,
      )
    }/status/`,
    {
      status,
      admin_note: String(
        adminNote ?? "",
      ).trim(),
    },
  );

  return {
    message: response.data.message,
    returnRequest:
      response.data.return_request
      ?? response.data,
  };
}