import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiCheck,
  FiPackage,
} from "react-icons/fi";


const EMPTY_FORM = {
  product_id: "",
  sku: "",
  price_override: "",
  stock: "0",
  is_active: true,
  selectedValues: {},
};


function buildInitialForm(initialData) {
  if (!initialData) {
    return EMPTY_FORM;
  }

  const selectedValues = {};

  for (const option of initialData.options || []) {
    selectedValues[String(option.attribute)] = String(option.value);
  }

  return {
    product_id: String(initialData.product ?? ""),
    sku: initialData.sku ?? "",
    price_override: initialData.price_override ?? "",
    stock: String(initialData.stock ?? 0),
    is_active: initialData.is_active !== false,
    selectedValues,
  };
}


function VariantForm({
  initialData = null,
  products = [],
  attributes = [],
  isSubmitting = false,
  errorMessage = "",
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState(() => buildInitialForm(initialData));
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setFormData(buildInitialForm(initialData));
  }, [initialData]);

  const activeAttributes = useMemo(
    () => attributes.filter((attribute) => attribute.is_active !== false),
    [attributes],
  );

  const handleFieldChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAttributeChange = (attributeId, valueId) => {
    setFormData((current) => ({
      ...current,
      selectedValues: {
        ...current.selectedValues,
        [String(attributeId)]: valueId,
      },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLocalError("");

    const attributeValueIds = Object.values(formData.selectedValues)
      .filter(Boolean)
      .map((value) => Number(value));

    if (!formData.product_id) {
      setLocalError("Select a product.");
      return;
    }

    if (!formData.sku.trim()) {
      setLocalError("Variant SKU is required.");
      return;
    }

    if (!attributeValueIds.length) {
      setLocalError("Select at least one attribute value.");
      return;
    }

    const stock = Number.parseInt(formData.stock, 10);

    if (!Number.isInteger(stock) || stock < 0) {
      setLocalError("Stock must be zero or a positive whole number.");
      return;
    }

    const payload = {
      product_id: Number(formData.product_id),
      sku: formData.sku.trim().toUpperCase(),
      price_override: formData.price_override === ""
        ? null
        : Number(formData.price_override),
      stock,
      is_active: formData.is_active,
      attribute_value_ids: attributeValueIds,
    };

    onSubmit?.(payload);
  };

  return (
    <form className="admin-form-card admin-variant-form" onSubmit={handleSubmit}>
      <div className="admin-form-card__heading">
        <div className="admin-form-card__icon">
          <FiPackage />
        </div>

        <div>
          <span>Catalog configuration</span>
          <h2>{initialData ? "Update Variant" : "Create Variant"}</h2>
          <p>Connect a product with a unique SKU, option combination, price, and stock.</p>
        </div>
      </div>

      {(localError || errorMessage) && (
        <div className="admin-form-error">
          {localError || errorMessage}
        </div>
      )}

      <div className="admin-form-grid admin-form-grid--two">
        <label className="admin-field">
          <span>Product</span>
          <select
            name="product_id"
            value={formData.product_id}
            onChange={handleFieldChange}
            required
          >
            <option value="">Select product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span>Variant SKU</span>
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleFieldChange}
            placeholder="SKU-BLACK-L"
            maxLength="100"
            required
          />
        </label>

        <label className="admin-field">
          <span>Price Override</span>
          <input
            type="number"
            name="price_override"
            value={formData.price_override}
            onChange={handleFieldChange}
            placeholder="Use product price"
            min="0"
            step="0.01"
          />
          <small>Leave empty to use the product final price.</small>
        </label>

        <label className="admin-field">
          <span>Opening Stock</span>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleFieldChange}
            min="0"
            step="1"
            required
          />
        </label>
      </div>

      <div className="admin-attribute-selector">
        <div className="admin-subsection-heading">
          <div>
            <span>Combination</span>
            <h3>Attribute Values</h3>
          </div>
          <small>Select no more than one value from each attribute.</small>
        </div>

        {!activeAttributes.length ? (
          <div className="admin-module-state admin-module-state--compact">
            <p>Create active attributes and values before creating a variant.</p>
          </div>
        ) : (
          <div className="admin-form-grid admin-form-grid--two">
            {activeAttributes.map((attribute) => {
              const activeValues = (attribute.values || []).filter(
                (value) => value.is_active !== false,
              );

              return (
                <label className="admin-field" key={attribute.id}>
                  <span>{attribute.name}</span>
                  <select
                    value={formData.selectedValues[String(attribute.id)] ?? ""}
                    onChange={(event) => handleAttributeChange(
                      attribute.id,
                      event.target.value,
                    )}
                  >
                    <option value="">Not selected</option>
                    {activeValues.map((value) => (
                      <option key={value.id} value={value.id}>
                        {value.display_value || value.value}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <label className="admin-check-field">
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={handleFieldChange}
        />
        <span>
          <strong>Active variant</strong>
          <small>Customers can select this variant when its product is active.</small>
        </span>
      </label>

      <div className="admin-form-actions">
        <button
          type="button"
          className="admin-button admin-button--secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <FiArrowLeft />
          Cancel
        </button>

        <button
          type="submit"
          className="admin-button admin-button--primary"
          disabled={isSubmitting || !activeAttributes.length}
        >
          <FiCheck />
          {isSubmitting
            ? "Saving..."
            : initialData
              ? "Save Changes"
              : "Create Variant"}
        </button>
      </div>
    </form>
  );
}


export default VariantForm;