import {
  FiEdit2,
  FiPower,
  FiTrash2,
  FiTruck,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";


function formatAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "0.00";
  }

  return amount.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}


function AdminShippingRateTable({
  rates = [],
  isLoading = false,
  isUpdatingId = null,
  isDeletingId = null,
  onToggleStatus,
  onDelete,
}) {
  if (isLoading) {
    return (
      <div className="admin-shipping-state">
        <div className="admin-loading-spinner" />
        <p>Loading shipping rates...</p>
      </div>
    );
  }

  if (!rates.length) {
    return (
      <div className="admin-shipping-empty">
        <FiTruck />

        <h3>No shipping rates found</h3>

        <p>
          Create a rate after adding at least one
          zone and shipping method.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-shipping-table-shell">
      <table className="admin-shipping-table">
        <thead>
          <tr>
            <th>Zone</th>
            <th>Method</th>
            <th>Charge</th>
            <th>Free Shipping</th>
            <th>Delivery Time</th>
            <th>COD</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {rates.map((rate) => {
            const isUpdating =
              Number(isUpdatingId)
              === Number(rate.id);

            const isDeleting =
              Number(isDeletingId)
              === Number(rate.id);

            return (
              <tr key={rate.id}>
                <td>
                  <div className="admin-shipping-table-primary">
                    <strong>
                      {rate.zone_name}
                    </strong>

                    <span>
                      {rate.zone_code}
                    </span>
                  </div>
                </td>

                <td>
                  <div className="admin-shipping-table-primary">
                    <strong>
                      {rate.method_name}
                    </strong>

                    <span>
                      {rate.method_code}
                    </span>
                  </div>
                </td>

                <td>
                  <strong>
                    {formatAmount(
                      rate.charge,
                    )}
                  </strong>
                </td>

                <td>
                  {rate.free_shipping_threshold
                    ? (
                      <span>
                        At{" "}
                        {formatAmount(
                          rate
                            .free_shipping_threshold,
                        )}
                      </span>
                    )
                    : (
                      <span className="admin-shipping-muted">
                        Not configured
                      </span>
                    )}
                </td>

                <td>
                  <span>
                    {rate.estimated_min_days}
                    {" - "}
                    {rate.estimated_max_days}
                    {" days"}
                  </span>
                </td>

                <td>
                  <span
                    className={
                      rate.cod_available
                        ? (
                          "admin-shipping-pill "
                          + "admin-shipping-pill--positive"
                        )
                        : (
                          "admin-shipping-pill "
                          + "admin-shipping-pill--neutral"
                        )
                    }
                  >
                    {rate.cod_available
                      ? "Available"
                      : "Unavailable"}
                  </span>
                </td>

                <td>
                  <span
                    className={
                      rate.is_active
                        ? (
                          "admin-shipping-pill "
                          + "admin-shipping-pill--positive"
                        )
                        : (
                          "admin-shipping-pill "
                          + "admin-shipping-pill--neutral"
                        )
                    }
                  >
                    {rate.is_active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </td>

                <td>
                  <div className="admin-shipping-actions">
                    <Link
                      to={
                        `/admin/shipping-rates/${
                          rate.id
                        }/edit`
                      }
                      className="admin-shipping-action-button"
                      aria-label={
                        `Edit shipping rate ${
                          rate.id
                        }`
                      }
                    >
                      <FiEdit2 />
                    </Link>

                    <button
                      type="button"
                      className="admin-shipping-action-button"
                      onClick={() =>
                        onToggleStatus(rate)
                      }
                      disabled={
                        isUpdating
                        || isDeleting
                      }
                      aria-label={
                        rate.is_active
                          ? "Deactivate rate"
                          : "Activate rate"
                      }
                    >
                      <FiPower />
                    </button>

                    <button
                      type="button"
                      className={
                        "admin-shipping-action-button "
                        + "admin-shipping-action-button--danger"
                      }
                      onClick={() =>
                        onDelete(rate)
                      }
                      disabled={
                        isUpdating
                        || isDeleting
                      }
                      aria-label="Delete rate"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


export default AdminShippingRateTable;
