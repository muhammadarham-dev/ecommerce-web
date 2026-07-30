import apiClient from "../api/client";
import { extractList } from "../utils/apiData";


export async function fetchReturns() {
  const response = await apiClient.get(
    "/returns/",
  );

  return extractList(response.data);
}


export async function fetchReturnRequest(
  returnNumber,
) {
  const response = await apiClient.get(
    `/returns/${returnNumber}/`,
  );

  return (
    response.data.return_request
    ?? response.data
  );
}


export async function createReturnRequest({
  orderId,
  reason,
  details = "",
  items,
}) {
  const response = await apiClient.post(
    "/returns/",
    {
      order_id: orderId,
      reason,
      details,
      items,
    },
  );

  return {
    message: response.data.message,
    returnRequest:
      response.data.return_request
      ?? response.data,
  };
}


export async function cancelReturnRequest(
  returnNumber,
) {
  const response = await apiClient.post(
    `/returns/${returnNumber}/cancel/`,
    {},
  );

  return {
    message: response.data.message,
    returnRequest:
      response.data.return_request
      ?? response.data,
  };
}