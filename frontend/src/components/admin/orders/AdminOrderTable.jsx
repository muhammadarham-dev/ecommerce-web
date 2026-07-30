import {
  FiArrowRight,
  FiPackage,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";


function normalizeLabel(value) {
  return String(value ?? "Unknown")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}


function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}


function AdminOrderTable({
  orders = [],
  formatMoney,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="admin-orders-state">
        <div className="admin-loading-spinner" />
        <p>Loading orders...</p>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="admin-orders-empty">
        <FiPackage />

        <h3>No orders found</h3>

        <p>
          No orders match the selected filters.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-orders-table-shell">
      <table className="admin-orders-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Delivery</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Total</th>
            <th>Created</th>
            <th aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.order_number}>
              <td>
                <div className="admin-order-reference">
                  <strong>
                    {order.order_number}
                  </strong>

                  <span>
                    {order.items?.length ?? 0} item
                    {(order.items?.length ?? 0) === 1
                      ? ""
                      : "s"}
                  </span>
                </div>
              </td>

              <td>
                <div className="admin-order-customer">
                  <strong>
                    {order.customer?.full_name
                      || order.customer?.username
                      || "Customer"}
                  </strong>

                  <span>
                    {order.customer?.email
                      || "Email unavailable"}
                  </span>
                </div>
              </td>

              <td>
                <div className="admin-order-delivery">
                  <strong>
                    {order.city || "Unknown city"}
                  </strong>

                  <span>
                    {order.shipping_method_name
                      || "Shipping method unavailable"}
                  </span>
                </div>
              </td>

              <td>
                <span
                  className={
                    `admin-status-badge admin-status-badge--${
                      String(
                        order.status || "unknown",
                      ).toLowerCase()
                    }`
                  }
                >
                  {normalizeLabel(order.status)}
                </span>
              </td>

              <td>
                <div className="admin-order-payment">
                  <span
                    className={
                      `admin-payment-badge admin-payment-badge--${
                        String(
                          order.payment_status
                          || "unknown",
                        ).toLowerCase()
                      }`
                    }
                  >
                    {normalizeLabel(
                      order.payment_status,
                    )}
                  </span>

                  <small>
                    {normalizeLabel(
                      order.payment_method,
                    )}
                  </small>
                </div>
              </td>

              <td>
                <strong className="admin-order-total">
                  {formatMoney(order.total_amount)}
                </strong>
              </td>

              <td>
                <span className="admin-order-date">
                  {formatDate(order.created_at)}
                </span>
              </td>

              <td>
                <Link
                  to={
                    `/admin/orders/${
                      encodeURIComponent(
                        order.order_number,
                      )
                    }`
                  }
                  className="admin-order-open-button"
                  aria-label={
                    `Open order ${
                      order.order_number
                    }`
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


export default AdminOrderTable;