import {
  useMemo,
  useState,
} from "react";

import {
  FiPackage,
  FiRefreshCw,
} from "react-icons/fi";

const initialForm = {
  orderId: "",
  courierName: "",
  trackingNumber: "",
  estimatedDeliveryDate: "",
  message: "",
  location: "",
};

function getCustomerLabel(order) {
  const customer =
    order.customer
    || order.customer_username
    || order.customer_email
    || "Customer";

  if (typeof customer === "string") {
    return customer;
  }

  return (
    customer.username
    || customer.email
    || "Customer"
  );
}

function ShipmentForm({
  orders = [],
  isLoadingOrders = false,
  isSubmitting = false,
  onRefreshOrders,
  onSubmit,
}) {
  const [form, setForm] = useState(initialForm);
  const [validationMessage, setValidationMessage] =
    useState("");

  const selectedOrder = useMemo(
    () =>
      orders.find(
        (order) =>
          Number(order.id)
          === Number(form.orderId),
      ) ?? null,
    [form.orderId, orders],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.orderId) {
      setValidationMessage(
        "Select an eligible order.",
      );
      return;
    }

    setValidationMessage("");

    const wasSuccessful = await onSubmit(form);

    if (wasSuccessful !== false) {
      setForm(initialForm);
    }
  };

  return (
    <section className="admin-shipment-card">
      <div className="admin-shipment-card__heading">
        <div>
          <span>Fulfilment setup</span>
          <h2>Create shipment</h2>
        </div>

        <FiPackage />
      </div>

      <form
        className="admin-shipment-create-form"
        onSubmit={handleSubmit}
      >
        <div className="admin-shipment-order-row">
          <label>
            Eligible order

            <select
              name="orderId"
              value={form.orderId}
              onChange={handleChange}
              disabled={
                isSubmitting
                || isLoadingOrders
              }
            >
              <option value="">
                {isLoadingOrders
                  ? "Loading eligible orders..."
                  : "Select an order"}
              </option>

              {orders.map((order) => (
                <option
                  key={order.id}
                  value={order.id}
                >
                  {order.order_number}
                  {" — "}
                  {getCustomerLabel(order)}
                  {" — "}
                  {String(
                    order.status || "",
                  ).replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="admin-secondary-button"
            onClick={onRefreshOrders}
            disabled={
              isSubmitting
              || isLoadingOrders
            }
          >
            <FiRefreshCw />
            Refresh Orders
          </button>
        </div>

        {selectedOrder?.status === "CONFIRMED" && (
          <div className="admin-shipment-info">
            Move this order to processing before
            advancing the shipment beyond the
            ready stage.
          </div>
        )}

        <div className="admin-shipment-form-grid">
          <label>
            Courier name

            <input
              type="text"
              name="courierName"
              value={form.courierName}
              onChange={handleChange}
              placeholder="Example: DHL"
              maxLength="100"
              disabled={isSubmitting}
            />
          </label>

          <label>
            Tracking number

            <input
              type="text"
              name="trackingNumber"
              value={form.trackingNumber}
              onChange={handleChange}
              placeholder="Optional during creation"
              maxLength="150"
              disabled={isSubmitting}
            />
          </label>

          <label>
            Estimated delivery date

            <input
              type="date"
              name="estimatedDeliveryDate"
              value={form.estimatedDeliveryDate}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </label>

          <label>
            Current location

            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Warehouse or city"
              maxLength="255"
              disabled={isSubmitting}
            />
          </label>
        </div>

        <label>
          Initial shipment message

          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Optional note for the first shipment event"
            maxLength="500"
            disabled={isSubmitting}
          />
        </label>

        {validationMessage && (
          <div className="admin-shipment-warning">
            {validationMessage}
          </div>
        )}

        {!isLoadingOrders
          && orders.length === 0 && (
          <div className="admin-shipment-info">
            No confirmed, processing or shipped
            order is currently available.
          </div>
        )}

        <button
          type="submit"
          className="admin-primary-button"
          disabled={
            isSubmitting
            || isLoadingOrders
            || !form.orderId
          }
        >
          <FiPackage />

          {isSubmitting
            ? "Creating..."
            : "Create Shipment"}
        </button>
      </form>
    </section>
  );
}

export default ShipmentForm;