import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiSave,
} from "react-icons/fi";

import useStoreSettings from
  "../../../hooks/useStoreSettings";


const emptyForm = {
  code: "",
  name: "",
  description: "",
  discountType: "PERCENTAGE",
  value: "",
  minimumOrderAmount: "0.00",
  maximumDiscountAmount: "",
  totalUsageLimit: "",
  perCustomerLimit: "1",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};


function toDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffset =
    date.getTimezoneOffset() * 60000;

  return new Date(
    date.getTime() - timezoneOffset,
  )
    .toISOString()
    .slice(0, 16);
}


function couponToForm(coupon) {
  if (!coupon) {
    return emptyForm;
  }

  return {
    code: coupon.code || "",
    name: coupon.name || "",
    description:
      coupon.description || "",
    discountType:
      coupon.discount_type
      || "PERCENTAGE",
    value:
      coupon.value ?? "",
    minimumOrderAmount:
      coupon.minimum_order_amount
      ?? "0.00",
    maximumDiscountAmount:
      coupon.maximum_discount_amount
      ?? "",
    totalUsageLimit:
      coupon.total_usage_limit
      ?? "",
    perCustomerLimit:
      coupon.per_customer_limit
      ?? "1",
    startsAt: toDateTimeLocal(
      coupon.starts_at,
    ),
    expiresAt: toDateTimeLocal(
      coupon.expires_at,
    ),
    isActive:
      coupon.is_active !== false,
  };
}


function CouponForm({
  initialCoupon = null,
  isSubmitting = false,
  onSubmit,
}) {
  const {
    formatMoney,
  } = useStoreSettings();

  const [
    form,
    setForm,
  ] = useState(
    couponToForm(initialCoupon),
  );

  const [
    validationMessage,
    setValidationMessage,
  ] = useState("");

  useEffect(() => {
    setForm(
      couponToForm(initialCoupon),
    );
    setValidationMessage("");
  }, [initialCoupon]);

  const isEditing =
    Boolean(initialCoupon);

  const previewLabel = useMemo(
    () => {
      const value =
        Number(form.value || 0);

      if (
        form.discountType
        === "PERCENTAGE"
      ) {
        return `${value}% off`;
      }

      return `${formatMoney(value)} off`;
    },
    [
      form.discountType,
      form.value,
      formatMoney,
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
    const discountValue =
      Number(form.value);

    if (!form.code.trim()) {
      return "Coupon code is required.";
    }

    if (!form.name.trim()) {
      return "Coupon name is required.";
    }

    if (
      !Number.isFinite(discountValue)
      || discountValue <= 0
    ) {
      return (
        "Discount value must be greater "
        + "than zero."
      );
    }

    if (
      form.discountType === "PERCENTAGE"
      && discountValue > 100
    ) {
      return (
        "Percentage discount cannot "
        + "exceed 100."
      );
    }

    if (
      Number(
        form.minimumOrderAmount || 0,
      ) < 0
    ) {
      return (
        "Minimum order amount cannot "
        + "be negative."
      );
    }

    if (
      form.maximumDiscountAmount !== ""
      && Number(
        form.maximumDiscountAmount,
      ) <= 0
    ) {
      return (
        "Maximum discount amount must "
        + "be greater than zero."
      );
    }

    if (
      form.totalUsageLimit !== ""
      && Number(
        form.totalUsageLimit,
      ) <= 0
    ) {
      return (
        "Total usage limit must be "
        + "greater than zero."
      );
    }

    if (
      Number(form.perCustomerLimit) <= 0
    ) {
      return (
        "Per-customer limit must be "
        + "greater than zero."
      );
    }

    if (
      form.startsAt
      && form.expiresAt
      && new Date(form.expiresAt)
        <= new Date(form.startsAt)
    ) {
      return (
        "Expiry time must be later "
        + "than the start time."
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
    <form
      className="admin-coupon-form"
      onSubmit={handleSubmit}
    >
      <section className="admin-coupon-form-card">
        <div className="admin-coupon-form-card__heading">
          <div>
            <span>Coupon identity</span>
            <h2>Basic information</h2>
          </div>

          <FiCheckCircle />
        </div>

        <div className="admin-coupon-form-grid">
          <label>
            Coupon code

            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              maxLength="50"
              placeholder="SUMMER20"
              disabled={isSubmitting}
              required
            />
          </label>

          <label>
            Coupon name

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              maxLength="150"
              placeholder="Summer Sale"
              disabled={isSubmitting}
              required
            />
          </label>
        </div>

        <label>
          Description

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder={
              "Explain the offer and its conditions."
            }
            disabled={isSubmitting}
          />
        </label>
      </section>

      <section className="admin-coupon-form-card">
        <div className="admin-coupon-form-card__heading">
          <div>
            <span>Discount rules</span>
            <h2>Value and limits</h2>
          </div>
        </div>

        <div className="admin-coupon-preview">
          <small>Customer offer preview</small>
          <strong>{previewLabel}</strong>
        </div>

        <div className="admin-coupon-form-grid">
          <label>
            Discount type

            <select
              name="discountType"
              value={form.discountType}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="PERCENTAGE">
                Percentage
              </option>

              <option value="FIXED">
                Fixed Amount
              </option>
            </select>
          </label>

          <label>
            Discount value

            <input
              type="number"
              name="value"
              value={form.value}
              onChange={handleChange}
              min="0.01"
              max={
                form.discountType
                === "PERCENTAGE"
                  ? "100"
                  : undefined
              }
              step="0.01"
              placeholder="10.00"
              disabled={isSubmitting}
              required
            />
          </label>

          <label>
            Minimum order amount

            <input
              type="number"
              name="minimumOrderAmount"
              value={
                form.minimumOrderAmount
              }
              onChange={handleChange}
              min="0"
              step="0.01"
              disabled={isSubmitting}
            />
          </label>

          <label>
            Maximum discount amount

            <input
              type="number"
              name="maximumDiscountAmount"
              value={
                form.maximumDiscountAmount
              }
              onChange={handleChange}
              min="0.01"
              step="0.01"
              placeholder="Optional"
              disabled={
                isSubmitting
                || form.discountType
                  !== "PERCENTAGE"
              }
            />
          </label>

          <label>
            Total usage limit

            <input
              type="number"
              name="totalUsageLimit"
              value={form.totalUsageLimit}
              onChange={handleChange}
              min="1"
              step="1"
              placeholder="Unlimited"
              disabled={isSubmitting}
            />
          </label>

          <label>
            Per-customer limit

            <input
              type="number"
              name="perCustomerLimit"
              value={
                form.perCustomerLimit
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

      <section className="admin-coupon-form-card">
        <div className="admin-coupon-form-card__heading">
          <div>
            <span>Availability</span>
            <h2>Schedule and status</h2>
          </div>
        </div>

        <div className="admin-coupon-form-grid">
          <label>
            Starts at

            <input
              type="datetime-local"
              name="startsAt"
              value={form.startsAt}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </label>

          <label>
            Expires at

            <input
              type="datetime-local"
              name="expiresAt"
              value={form.expiresAt}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </label>
        </div>

        <label className="admin-coupon-switch">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
            disabled={isSubmitting}
          />

          <span>
            <strong>Coupon is active</strong>

            <small>
              Active coupons may be shown to
              eligible customers during their
              valid schedule.
            </small>
          </span>
        </label>
      </section>

      {validationMessage && (
        <div className="admin-form-message admin-form-message--error">
          {validationMessage}
        </div>
      )}

      <div className="admin-coupon-form-actions">
        <button
          type="submit"
          className="admin-primary-button"
          disabled={isSubmitting}
        >
          <FiSave />

          {isSubmitting
            ? "Saving..."
            : (
              isEditing
                ? "Update Coupon"
                : "Create Coupon"
            )}
        </button>
      </div>
    </form>
  );
}


export default CouponForm;
