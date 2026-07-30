import {
  FiEdit2,
  FiPower,
  FiTrash2,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import useStoreSettings from
  "../../../hooks/useStoreSettings";


function formatDateTime(value) {
  if (!value) {
    return "No limit";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No limit";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}


function getUsageLabel(coupon) {
  const used = Number(
    coupon.current_usage_count || 0,
  );

  if (
    coupon.total_usage_limit === null
    || coupon.total_usage_limit === undefined
  ) {
    return `${used} / Unlimited`;
  }

  return (
    `${used} / ${coupon.total_usage_limit}`
  );
}


function AdminCouponTable({
  coupons = [],
  isLoading = false,
  isUpdatingCode = "",
  isDeletingCode = "",
  onToggleStatus,
  onDelete,
}) {
  const {
    formatMoney,
  } = useStoreSettings();

  if (isLoading) {
    return (
      <div className="admin-coupons-state">
        <div className="admin-loading-spinner" />
        <p>Loading coupons...</p>
      </div>
    );
  }

  if (!coupons.length) {
    return (
      <div className="admin-coupons-empty">
        <FiPower />

        <h3>No coupons found</h3>

        <p>
          No coupon records match the selected
          filters.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-coupon-table-shell">
      <table className="admin-coupon-table">
        <thead>
          <tr>
            <th>Coupon</th>
            <th>Discount</th>
            <th>Minimum Order</th>
            <th>Usage</th>
            <th>Schedule</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {coupons.map((coupon) => {
            const isPercentage =
              coupon.discount_type
              === "PERCENTAGE";

            const discountLabel =
              isPercentage
                ? `${Number(coupon.value)}%`
                : formatMoney(coupon.value);

            const isUpdating =
              isUpdatingCode === coupon.code;

            const isDeleting =
              isDeletingCode === coupon.code;

            return (
              <tr key={coupon.id}>
                <td>
                  <div className="admin-coupon-identity">
                    <strong>
                      {coupon.code}
                    </strong>

                    <span>
                      {coupon.name}
                    </span>
                  </div>
                </td>

                <td>
                  <div className="admin-coupon-discount">
                    <strong>
                      {discountLabel}
                    </strong>

                    <span>
                      {isPercentage
                        ? "Percentage"
                        : "Fixed amount"}
                    </span>

                    {coupon
                      .maximum_discount_amount
                      && isPercentage && (
                      <small>
                        Maximum{" "}
                        {formatMoney(
                          coupon
                            .maximum_discount_amount,
                        )}
                      </small>
                    )}
                  </div>
                </td>

                <td>
                  {formatMoney(
                    coupon.minimum_order_amount,
                  )}
                </td>

                <td>
                  <div className="admin-coupon-usage">
                    <strong>
                      {getUsageLabel(coupon)}
                    </strong>

                    <span>
                      Per customer:{" "}
                      {coupon.per_customer_limit}
                    </span>
                  </div>
                </td>

                <td>
                  <div className="admin-coupon-schedule">
                    <span>
                      Starts:{" "}
                      {formatDateTime(
                        coupon.starts_at,
                      )}
                    </span>

                    <span>
                      Expires:{" "}
                      {formatDateTime(
                        coupon.expires_at,
                      )}
                    </span>
                  </div>
                </td>

                <td>
                  <div className="admin-coupon-status-cell">
                    <span
                      className={
                        coupon.is_currently_valid
                          ? (
                            "admin-coupon-validity "
                            + "admin-coupon-validity--valid"
                          )
                          : (
                            "admin-coupon-validity "
                            + "admin-coupon-validity--invalid"
                          )
                      }
                    >
                      {coupon.is_currently_valid
                        ? "Currently Valid"
                        : "Not Valid"}
                    </span>

                    <span
                      className={
                        coupon.is_active
                          ? (
                            "admin-coupon-active "
                            + "admin-coupon-active--yes"
                          )
                          : (
                            "admin-coupon-active "
                            + "admin-coupon-active--no"
                          )
                      }
                    >
                      {coupon.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                </td>

                <td>
                  <div className="admin-coupon-actions">
                    <Link
                      to={
                        `/admin/coupons/${
                          encodeURIComponent(
                            coupon.code,
                          )
                        }/edit`
                      }
                      className="admin-coupon-action-button"
                      aria-label={
                        `Edit coupon ${coupon.code}`
                      }
                    >
                      <FiEdit2 />
                    </Link>

                    <button
                      type="button"
                      className="admin-coupon-action-button"
                      onClick={() =>
                        onToggleStatus(coupon)
                      }
                      disabled={
                        isUpdating || isDeleting
                      }
                      aria-label={
                        coupon.is_active
                          ? (
                            `Deactivate coupon ${
                              coupon.code
                            }`
                          )
                          : (
                            `Activate coupon ${
                              coupon.code
                            }`
                          )
                      }
                    >
                      <FiPower />
                    </button>

                    <button
                      type="button"
                      className={
                        "admin-coupon-action-button "
                        + "admin-coupon-action-button--danger"
                      }
                      onClick={() =>
                        onDelete(coupon)
                      }
                      disabled={
                        isUpdating || isDeleting
                      }
                      aria-label={
                        `Delete coupon ${coupon.code}`
                      }
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


export default AdminCouponTable;
