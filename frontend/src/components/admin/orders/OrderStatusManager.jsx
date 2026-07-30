import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiRefreshCw,
} from "react-icons/fi";


const statusTransitions = {
  PENDING: [
    "CONFIRMED",
    "CANCELLED",
  ],
  CONFIRMED: [
    "PROCESSING",
    "CANCELLED",
  ],
  PROCESSING: [
    "SHIPPED",
  ],
  SHIPPED: [
    "DELIVERED",
  ],
  DELIVERED: [],
  CANCELLED: [],
};


const paymentTransitions = {
  PENDING: [
    "PAID",
    "FAILED",
  ],
  FAILED: [
    "PENDING",
    "PAID",
  ],
  PAID: [
    "REFUNDED",
  ],
  REFUNDED: [],
};


function normalizeLabel(value) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}


function OrderStatusManager({
  order,
  isSubmitting,
  onSubmit,
}) {
  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("");

  const [
    selectedPaymentStatus,
    setSelectedPaymentStatus,
  ] = useState("");

  useEffect(() => {
    setSelectedStatus("");
    setSelectedPaymentStatus("");
  }, [
    order?.order_number,
    order?.payment_status,
    order?.status,
  ]);

  const nextStatuses = useMemo(
    () =>
      statusTransitions[
        order?.status
      ] ?? [],
    [order?.status],
  );

  const nextPaymentStatuses = useMemo(
    () =>
      paymentTransitions[
        order?.payment_status
      ] ?? [],
    [order?.payment_status],
  );

  const hasChanges =
    Boolean(selectedStatus)
    || Boolean(selectedPaymentStatus);

  const handleSubmit = (
    event,
  ) => {
    event.preventDefault();

    const payload = {};

    if (selectedStatus) {
      payload.status = selectedStatus;
    }

    if (selectedPaymentStatus) {
      payload.payment_status =
        selectedPaymentStatus;
    }

    onSubmit(payload);
  };

  return (
    <section className="admin-order-card">
      <div className="admin-order-card__heading">
        <div>
          <span>Order controls</span>
          <h2>Status management</h2>
        </div>

        <FiRefreshCw />
      </div>

      <div className="admin-order-current-status">
        <div>
          <small>Current order status</small>

          <strong>
            {normalizeLabel(order.status)}
          </strong>
        </div>

        <div>
          <small>Current payment status</small>

          <strong>
            {normalizeLabel(
              order.payment_status,
            )}
          </strong>
        </div>
      </div>

      <form
        className="admin-order-status-form"
        onSubmit={handleSubmit}
      >
        <label>
          Next order status

          <select
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(
                event.target.value,
              )
            }
            disabled={
              isSubmitting
              || nextStatuses.length === 0
            }
          >
            <option value="">
              Keep current status
            </option>

            {nextStatuses.map((status) => (
              <option
                key={status}
                value={status}
              >
                {normalizeLabel(status)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Next payment status

          <select
            value={selectedPaymentStatus}
            onChange={(event) =>
              setSelectedPaymentStatus(
                event.target.value,
              )
            }
            disabled={
              isSubmitting
              || nextPaymentStatuses.length
                === 0
            }
          >
            <option value="">
              Keep current status
            </option>

            {nextPaymentStatuses.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {normalizeLabel(status)}
                </option>
              ),
            )}
          </select>
        </label>

        {selectedStatus === "CANCELLED"
          && order.payment_status === "PAID"
          && selectedPaymentStatus
            !== "REFUNDED" && (
          <div className="admin-order-warning">
            A paid order must be refunded before
            it can be cancelled.
          </div>
        )}

        <button
          type="submit"
          className="admin-primary-button"
          disabled={
            isSubmitting
            || !hasChanges
            || (
              selectedStatus === "CANCELLED"
              && order.payment_status === "PAID"
              && selectedPaymentStatus
                !== "REFUNDED"
            )
          }
        >
          <FiCheckCircle />

          {isSubmitting
            ? "Updating..."
            : "Update Order"}
        </button>
      </form>
    </section>
  );
}


export default OrderStatusManager;