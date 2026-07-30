import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiSave,
} from "react-icons/fi";

import ShippingRatePreview from
  "./ShippingRatePreview";


const emptyForm = {
  zoneId: "",
  methodId: "",
  charge: "0.00",
  freeShippingThreshold: "",
  estimatedMinDays: "3",
  estimatedMaxDays: "5",
  codAvailable: true,
  isActive: true,
};


function rateToForm(rate) {
  if (!rate) {
    return emptyForm;
  }

  return {
    zoneId: String(
      rate.zone ?? "",
    ),
    methodId: String(
      rate.method ?? "",
    ),
    charge: String(
      rate.charge ?? "0.00",
    ),
    freeShippingThreshold:
      rate.free_shipping_threshold
      ?? "",
    estimatedMinDays: String(
      rate.estimated_min_days ?? 3,
    ),
    estimatedMaxDays: String(
      rate.estimated_max_days ?? 5,
    ),
    codAvailable:
      rate.cod_available !== false,
    isActive:
      rate.is_active !== false,
  };
}


function ShippingRateForm({
  initialRate = null,
  zones = [],
  methods = [],
  isSubmitting = false,
  onSubmit,
}) {
  const [
    form,
    setForm,
  ] = useState(
    rateToForm(initialRate),
  );

  const [
    validationMessage,
    setValidationMessage,
  ] = useState("");

  useEffect(() => {
    setForm(
      rateToForm(initialRate),
    );
    setValidationMessage("");
  }, [initialRate]);

  const selectedZone = useMemo(
    () =>
      zones.find(
        (zone) =>
          String(zone.id)
          === String(form.zoneId),
      ) ?? null,
    [
      form.zoneId,
      zones,
    ],
  );

  const selectedMethod = useMemo(
    () =>
      methods.find(
        (method) =>
          String(method.id)
          === String(form.methodId),
      ) ?? null,
    [
      form.methodId,
      methods,
    ],
  );

  const handleChange = (
    event,
  ) => {
    const {
      checked,
      name,
      type,
      value,
    } = event.target;

    setForm(
      (current) => ({
        ...current,
        [name]:
          type === "checkbox"
            ? checked
            : value,
      }),
    );
  };

  const validateForm = () => {
    if (!form.zoneId) {
      return "Select a shipping zone.";
    }

    if (!form.methodId) {
      return "Select a shipping method.";
    }

    if (
      Number(form.charge) < 0
    ) {
      return (
        "Shipping charge cannot be negative."
      );
    }

    if (
      form.freeShippingThreshold !== ""
      && Number(
        form.freeShippingThreshold,
      ) < 0
    ) {
      return (
        "Free shipping threshold cannot "
        + "be negative."
      );
    }

    const minimumDays = Number(
      form.estimatedMinDays,
    );

    const maximumDays = Number(
      form.estimatedMaxDays,
    );

    if (
      !Number.isInteger(minimumDays)
      || minimumDays < 1
    ) {
      return (
        "Minimum delivery days must be "
        + "at least 1."
      );
    }

    if (
      !Number.isInteger(maximumDays)
      || maximumDays < 1
    ) {
      return (
        "Maximum delivery days must be "
        + "at least 1."
      );
    }

    if (
      maximumDays < minimumDays
    ) {
      return (
        "Maximum delivery days cannot be "
        + "less than minimum delivery days."
      );
    }

    return "";
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    const message = validateForm();

    if (message) {
      setValidationMessage(message);
      return;
    }

    setValidationMessage("");

    await onSubmit(form);
  };

  return (
    <div className="admin-shipping-form-layout">
      <form
        className="admin-shipping-form"
        onSubmit={handleSubmit}
      >
        <section className="admin-shipping-form-card">
          <div className="admin-shipping-form-card__heading">
            <div>
              <span>Rate assignment</span>
              <h2>Zone and method</h2>
            </div>
          </div>

          <div className="admin-shipping-form-grid">
            <label>
              Shipping zone

              <select
                name="zoneId"
                value={form.zoneId}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              >
                <option value="">
                  Select zone
                </option>

                {zones.map((zone) => (
                  <option
                    key={zone.id}
                    value={zone.id}
                  >
                    {zone.name}
                    {" — "}
                    {zone.code}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Shipping method

              <select
                name="methodId"
                value={form.methodId}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              >
                <option value="">
                  Select method
                </option>

                {methods.map((method) => (
                  <option
                    key={method.id}
                    value={method.id}
                  >
                    {method.name}
                    {" — "}
                    {method.code}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="admin-shipping-form-card">
          <div className="admin-shipping-form-card__heading">
            <div>
              <span>Pricing</span>
              <h2>Delivery charge</h2>
            </div>
          </div>

          <div className="admin-shipping-form-grid">
            <label>
              Shipping charge

              <input
                type="number"
                name="charge"
                value={form.charge}
                onChange={handleChange}
                min="0"
                step="0.01"
                disabled={isSubmitting}
                required
              />
            </label>

            <label>
              Free shipping threshold

              <input
                type="number"
                name="freeShippingThreshold"
                value={
                  form.freeShippingThreshold
                }
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Leave blank to disable"
                disabled={isSubmitting}
              />

              <small>
                Orders at or above this amount
                receive free shipping.
              </small>
            </label>
          </div>
        </section>

        <section className="admin-shipping-form-card">
          <div className="admin-shipping-form-card__heading">
            <div>
              <span>Delivery estimate</span>
              <h2>Expected delivery days</h2>
            </div>
          </div>

          <div className="admin-shipping-form-grid">
            <label>
              Minimum days

              <input
                type="number"
                name="estimatedMinDays"
                value={
                  form.estimatedMinDays
                }
                onChange={handleChange}
                min="1"
                step="1"
                disabled={isSubmitting}
                required
              />
            </label>

            <label>
              Maximum days

              <input
                type="number"
                name="estimatedMaxDays"
                value={
                  form.estimatedMaxDays
                }
                onChange={handleChange}
                min="1"
                step="1"
                disabled={isSubmitting}
                required
              />
            </label>
          </div>
        </section>

        <section className="admin-shipping-form-card">
          <div className="admin-shipping-form-card__heading">
            <div>
              <span>Availability</span>
              <h2>Payment and status</h2>
            </div>
          </div>

          <div className="admin-shipping-switch-list">
            <label className="admin-shipping-switch">
              <input
                type="checkbox"
                name="codAvailable"
                checked={
                  form.codAvailable
                }
                onChange={handleChange}
                disabled={isSubmitting}
              />

              <span>
                <strong>
                  Cash on Delivery available
                </strong>

                <small>
                  Customers can use COD for this
                  zone and method.
                </small>
              </span>
            </label>

            <label className="admin-shipping-switch">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                disabled={isSubmitting}
              />

              <span>
                <strong>
                  Shipping rate is active
                </strong>

                <small>
                  Only active rates are used in
                  checkout calculations.
                </small>
              </span>
            </label>
          </div>
        </section>

        {validationMessage && (
          <div className="admin-form-message admin-form-message--error">
            {validationMessage}
          </div>
        )}

        <div className="admin-shipping-form-actions">
          <button
            type="submit"
            className="admin-primary-button"
            disabled={isSubmitting}
          >
            <FiSave />

            {isSubmitting
              ? "Saving..."
              : (
                initialRate
                  ? "Update Shipping Rate"
                  : "Create Shipping Rate"
              )}
          </button>
        </div>
      </form>

      <ShippingRatePreview
        zone={selectedZone}
        method={selectedMethod}
        charge={form.charge}
        freeShippingThreshold={
          form.freeShippingThreshold
        }
        estimatedMinDays={
          form.estimatedMinDays
        }
        estimatedMaxDays={
          form.estimatedMaxDays
        }
        codAvailable={
          form.codAvailable
        }
        isActive={form.isActive}
      />
    </div>
  );
}


export default ShippingRateForm;
