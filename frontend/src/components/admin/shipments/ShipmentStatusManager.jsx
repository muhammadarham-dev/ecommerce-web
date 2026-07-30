import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiTruck,
} from "react-icons/fi";

const statusTransitions = {
  READY: [
    "PICKED_UP",
    "CANCELLED",
  ],
  PICKED_UP: [
    "IN_TRANSIT",
    "DELIVERY_FAILED",
  ],
  IN_TRANSIT: [
    "OUT_FOR_DELIVERY",
    "DELIVERY_FAILED",
    "RETURNED",
  ],
  OUT_FOR_DELIVERY: [
    "DELIVERED",
    "DELIVERY_FAILED",
    "RETURNED",
  ],
  DELIVERY_FAILED: [
    "OUT_FOR_DELIVERY",
    "RETURNED",
  ],
  DELIVERED: [],
  RETURNED: [],
  CANCELLED: [],
};

function normalizeLabel(value) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) => character.toUpperCase(),
    );
}

function ShipmentStatusManager({
  shipment,
  isSubmitting,
  onSubmit,
}) {
  const [form, setForm] = useState({
    status: "",
    courierName: "",
    trackingNumber: "",
    estimatedDeliveryDate: "",
    message: "",
    location: "",
  });

  useEffect(() => {
    setForm({
      status: "",
      courierName:
        shipment?.courier_name || "",
      trackingNumber:
        shipment?.tracking_number || "",
      estimatedDeliveryDate:
        shipment?.estimated_delivery_date
        || "",
      message: "",
      location: "",
    });
  }, [
    shipment?.courier_name,
    shipment?.estimated_delivery_date,
    shipment?.shipment_number,
    shipment?.status,
    shipment?.tracking_number,
  ]);

  const nextStatuses = useMemo(
    () =>
      statusTransitions[
        shipment?.status
      ] ?? [],
    [shipment?.status],
  );

  const pickupMissingTracking =
    form.status === "PICKED_UP"
    && !form.trackingNumber.trim();

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (pickupMissingTracking) {
      return;
    }

    onSubmit(form);
  };

  return (
    <section className="admin-shipment-card">
      <div className="admin-shipment-card__heading">
        <div>
          <span>Shipment controls</span>
          <h2>Update shipment</h2>
        </div>

        <FiTruck />
      </div>

      <div className="admin-shipment-current-status">
        <small>Current status</small>

        <strong>
          {normalizeLabel(shipment.status)}
        </strong>
      </div>

      <form
        className="admin-shipment-update-form"
        onSubmit={handleSubmit}
      >
        <label>
          Next status

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
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
          Courier name

          <input
            type="text"
            name="courierName"
            value={form.courierName}
            onChange={handleChange}
            maxLength="100"
            placeholder="Courier company"
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
            maxLength="150"
            placeholder="Courier tracking number"
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
          Event location

          <input
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            maxLength="255"
            placeholder="Current shipment location"
            disabled={isSubmitting}
          />
        </label>

        <label>
          Event message

          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            maxLength="500"
            placeholder="Add an update for the shipment timeline"
            disabled={isSubmitting}
          />
        </label>

        {pickupMissingTracking && (
          <div className="admin-shipment-warning">
            A tracking number is required before
            marking the shipment as picked up.
          </div>
        )}

        {nextStatuses.length === 0 && (
          <div className="admin-shipment-terminal">
            This shipment has reached a terminal
            status. Courier details may still be
            updated.
          </div>
        )}

        <button
          type="submit"
          className="admin-primary-button"
          disabled={
            isSubmitting
            || pickupMissingTracking
          }
        >
          <FiCheckCircle />

          {isSubmitting
            ? "Updating..."
            : "Update Shipment"}
        </button>
      </form>
    </section>
  );
}

export default ShipmentStatusManager;