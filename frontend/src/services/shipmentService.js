import apiClient from "../api/client";
import { extractList } from "../utils/apiData";


export async function fetchShipments() {
  const response = await apiClient.get(
    "/shipments/",
  );

  return extractList(response.data);
}


export async function fetchShipment(
  shipmentNumber,
) {
  const response = await apiClient.get(
    `/shipments/${shipmentNumber}/`,
  );

  return (
    response.data.shipment
    ?? response.data
  );
}


export async function fetchShipmentForOrder(
  orderNumber,
) {
  const shipments =
    await fetchShipments();

  return (
    shipments.find(
      (shipment) =>
        String(shipment.order_number)
        === String(orderNumber),
    )
    ?? null
  );
}