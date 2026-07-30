import {
  FiArrowRight,
  FiTruck,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

function normalizeLabel(value) {
  return String(value ?? "Unknown")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) => character.toUpperCase(),
    );
}

function formatDate(value, includeTime = false) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return includeTime
    ? date.toLocaleString(
      "en-US",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    )
    : date.toLocaleDateString(
      "en-US",
      {
        dateStyle: "medium",
      },
    );
}

function AdminShipmentTable({
  shipments = [],
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="admin-shipments-state">
        <div className="admin-loading-spinner" />
        <p>Loading shipments...</p>
      </div>
    );
  }

  if (!shipments.length) {
    return (
      <div className="admin-shipments-empty">
        <FiTruck />
        <h3>No shipments found</h3>
        <p>
          No shipment records match the selected
          filters.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-shipments-table-shell">
      <table className="admin-shipments-table">
        <thead>
          <tr>
            <th>Shipment</th>
            <th>Order</th>
            <th>Customer</th>
            <th>Courier</th>
            <th>Tracking</th>
            <th>Status</th>
            <th>Estimated Delivery</th>
            <th>Updated</th>
            <th aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {shipments.map((shipment) => (
            <tr key={shipment.shipment_number}>
              <td>
                <strong className="admin-shipment-reference">
                  {shipment.shipment_number}
                </strong>
              </td>

              <td>{shipment.order_number}</td>

              <td>
                <div className="admin-shipment-customer">
                  <strong>
                    {shipment.customer_username}
                  </strong>
                  <span>
                    {shipment.customer_email}
                  </span>
                </div>
              </td>

              <td>
                {shipment.courier_name
                  || "Not assigned"}
              </td>

              <td>
                {shipment.tracking_number
                  || "Not available"}
              </td>

              <td>
                <span
                  className={
                    `admin-shipment-status admin-shipment-status--${String(
                      shipment.status || "unknown",
                    ).toLowerCase()}`
                  }
                >
                  {normalizeLabel(shipment.status)}
                </span>
              </td>

              <td>
                {formatDate(
                  shipment.estimated_delivery_date,
                )}
              </td>

              <td>
                {formatDate(
                  shipment.updated_at,
                  true,
                )}
              </td>

              <td>
                <Link
                  to={`/admin/shipments/${encodeURIComponent(
                    shipment.shipment_number,
                  )}`}
                  className="admin-shipment-open-button"
                  aria-label={
                    `Open shipment ${shipment.shipment_number}`
                  }
                >
                  <FiArrowRight />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminShipmentTable;