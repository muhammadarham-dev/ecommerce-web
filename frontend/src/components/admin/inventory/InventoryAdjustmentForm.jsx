import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheck,
  FiSliders,
} from "react-icons/fi";


const EMPTY_FORM = {
  targetType: "PRODUCT",
  product_id: "",
  variant_id: "",
  operation: "INCREASE",
  quantity: "1",
  note: "",
};


function InventoryAdjustmentForm({
  products = [],
  variants = [],
  initialTarget = null,
  isSubmitting = false,
  errorMessage = "",
  onSubmit,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [localError, setLocalError] = useState("");

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  );

  const sortedVariants = useMemo(
    () => [...variants].sort((a, b) => (
      (a.variant_name || a.sku).localeCompare(b.variant_name || b.sku)
    )),
    [variants],
  );

  useEffect(() => {
    if (!initialTarget) {
      return;
    }

    setFormData((current) => ({
      ...current,
      targetType: initialTarget.targetType,
      product_id: initialTarget.targetType === "PRODUCT"
        ? String(initialTarget.id)
        : "",
      variant_id: initialTarget.targetType === "VARIANT"
        ? String(initialTarget.id)
        : "",
    }));
  }, [initialTarget]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => {
      if (name === "targetType") {
        return {
          ...current,
          targetType: value,
          product_id: "",
          variant_id: "",
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLocalError("");

    const quantity = Number.parseInt(formData.quantity, 10);

    if (!Number.isInteger(quantity) || quantity < 0) {
      setLocalError("Quantity must be a valid whole number.");
      return;
    }

    if (
      formData.operation !== "SET"
      && quantity <= 0
    ) {
      setLocalError("Increase and decrease quantities must be greater than zero.");
      return;
    }

    if (
      formData.targetType === "PRODUCT"
      && !formData.product_id
    ) {
      setLocalError("Select a product.");
      return;
    }

    if (
      formData.targetType === "VARIANT"
      && !formData.variant_id
    ) {
      setLocalError("Select a product variant.");
      return;
    }

    const payload = {
      operation: formData.operation,
      quantity,
      note: formData.note.trim(),
    };

    if (formData.targetType === "PRODUCT") {
      payload.product_id = Number(formData.product_id);
    } else {
      payload.variant_id = Number(formData.variant_id);
    }

    onSubmit?.(payload);
  };

  return (
    <form className="admin-form-card admin-inventory-adjustment" onSubmit={handleSubmit}>
      <div className="admin-form-card__heading">
        <div className="admin-form-card__icon">
          <FiSliders />
        </div>

        <div>
          <span>Manual inventory control</span>
          <h2>Adjust Stock</h2>
          <p>Increase, decrease, or set an exact stock quantity with an audit note.</p>
        </div>
      </div>

      {(localError || errorMessage) && (
        <div className="admin-form-error">
          {localError || errorMessage}
        </div>
      )}

      <div className="admin-segmented-control">
        <button
          type="button"
          className={formData.targetType === "PRODUCT" ? "active" : ""}
          onClick={() => handleFieldChange({
            target: { name: "targetType", value: "PRODUCT" },
          })}
        >
          Simple Product
        </button>

        <button
          type="button"
          className={formData.targetType === "VARIANT" ? "active" : ""}
          onClick={() => handleFieldChange({
            target: { name: "targetType", value: "VARIANT" },
          })}
        >
          Product Variant
        </button>
      </div>

      {formData.targetType === "PRODUCT" ? (
        <label className="admin-field">
          <span>Product</span>
          <select
            name="product_id"
            value={formData.product_id}
            onChange={handleFieldChange}
            required
          >
            <option value="">Select product</option>
            {sortedProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} — {product.sku} — {product.stock} units
              </option>
            ))}
          </select>
          <small>Products using variants must be adjusted through a selected variant.</small>
        </label>
      ) : (
        <label className="admin-field">
          <span>Variant</span>
          <select
            name="variant_id"
            value={formData.variant_id}
            onChange={handleFieldChange}
            required
          >
            <option value="">Select variant</option>
            {sortedVariants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.variant_name || variant.product_name} — {variant.sku} — {variant.stock} units
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="admin-form-grid admin-form-grid--two">
        <label className="admin-field">
          <span>Operation</span>
          <select
            name="operation"
            value={formData.operation}
            onChange={handleFieldChange}
          >
            <option value="INCREASE">Increase stock</option>
            <option value="DECREASE">Decrease stock</option>
            <option value="SET">Set exact quantity</option>
          </select>
        </label>

        <label className="admin-field">
          <span>Quantity</span>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleFieldChange}
            min="0"
            step="1"
            required
          />
        </label>
      </div>

      <label className="admin-field">
        <span>Audit Note</span>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleFieldChange}
          rows="4"
          maxLength="1000"
          placeholder="Reason for this stock adjustment"
        />
      </label>

      <button
        type="submit"
        className="admin-button admin-button--primary admin-button--full"
        disabled={isSubmitting}
      >
        <FiCheck />
        {isSubmitting ? "Adjusting Stock..." : "Apply Stock Adjustment"}
      </button>
    </form>
  );
}


export default InventoryAdjustmentForm;