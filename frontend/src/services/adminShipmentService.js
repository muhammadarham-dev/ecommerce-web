import apiClient from "../api/client";
import { extractList } from "../utils/apiData";


function normalizeIdentifier(value) {
  return String(value ?? "").trim();
}


function buildShipmentPayload(values = {}) {
  const payload = {};

  if (
    values.status !== undefined
    && values.status !== ""
  ) {
    payload.status = String(
      values.status,
    ).trim();
  }

  if (values.courierName !== undefined) {
    payload.courier_name = String(
      values.courierName ?? "",
    ).trim();
  }

  if (
    values.trackingNumber !== undefined
  ) {
    payload.tracking_number = String(
      values.trackingNumber ?? "",
    ).trim();
  }

  if (
    values.estimatedDeliveryDate
    !== undefined
  ) {
    payload.estimated_delivery_date =
      values.estimatedDeliveryDate || null;
  }

  if (values.message !== undefined) {
    payload.message = String(
      values.message ?? "",
    ).trim();
  }

  if (values.location !== undefined) {
    payload.location = String(
      values.location ?? "",
    ).trim();
  }

  return payload;
}


export async function fetchAdminShipments(
  params = {},
) {
  const response = await apiClient.get(
    "/shipments/management/shipments/",
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


export async function fetchAdminShipment(
  shipmentNumber,
) {
  const normalizedShipmentNumber =
    normalizeIdentifier(shipmentNumber);

  const response = await apiClient.get(
    `/shipments/management/shipments/${
      encodeURIComponent(
        normalizedShipmentNumber,
      )
    }/`,
  );

  return (
    response.data.shipment
    ?? response.data
  );
}


export async function fetchEligibleShipmentOrders() {
  const eligibleStatuses = [
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
  ];

  const responses = await Promise.all(
    eligibleStatuses.map((status) =>
      apiClient.get(
        "/orders/management/orders/",
        {
          params: {
            status,
            ordering: "-created_at",
          },
        },
      ),
    ),
  );

  const orderMap = new Map();

  responses.forEach((response) => {
    const orders = extractList(
      response.data,
    );

    orders.forEach((order) => {
      if (order?.id) {
        orderMap.set(
          order.id,
          order,
        );
      }
    });
  });

  return Array.from(
    orderMap.values(),
  );
}


export async function createAdminShipment({
  orderId,
  courierName = "",
  trackingNumber = "",
  estimatedDeliveryDate = "",
  message = "",
  location = "",
}) {
  const response = await apiClient.post(
    "/shipments/management/shipments/create/",
    {
      order_id: Number(orderId),

      ...buildShipmentPayload({
        courierName,
        trackingNumber,
        estimatedDeliveryDate,
        message,
        location,
      }),
    },
  );

  return {
    message: response.data.message,

    shipment:
      response.data.shipment
      ?? response.data,
  };
}


export async function updateAdminShipment(
  shipmentNumber,
  values = {},
) {
  const normalizedShipmentNumber =
    normalizeIdentifier(shipmentNumber);

  const response = await apiClient.patch(
    `/shipments/management/shipments/${
      encodeURIComponent(
        normalizedShipmentNumber,
      )
    }/update/`,

    buildShipmentPayload(values),
  );

  return {
    message: response.data.message,

    shipment:
      response.data.shipment
      ?? response.data,
  };
}