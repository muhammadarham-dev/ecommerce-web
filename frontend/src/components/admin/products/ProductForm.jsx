import { useEffect, useMemo, useState } from "react";
import {
  FiBox,
  FiCheck,
  FiDollarSign,
  FiFileText,
  FiHash,
  FiLayers,
  FiSave,
  FiStar,
} from "react-icons/fi";


const emptyForm = {
  category_id: "",
  name: "",
  sku: "",
  description: "",
  price: "",
  discount_price: "",
  stock: "0",
  is_active: true,
  is_featured: false,
};


function ProductForm({
  categories,
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel,
}) {
  const [form, setForm] = useState(emptyForm);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!initialValues) {
      setForm(emptyForm);
      return;
    }

    setForm({
      category_id: String(initialValues.category?.id ?? ""),
      name: initialValues.name ?? "",
      sku: initialValues.sku ?? "",
      description: initialValues.description ?? "",
      price: String(initialValues.price ?? ""),
      discount_price: String(initialValues.discount_price ?? ""),
      stock: String(initialValues.stock ?? 0),
      is_active: initialValues.is_active !== false,
      is_featured: initialValues.is_featured === true,
    });
  }, [initialValues]);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.is_active !== false),
    [categories],
  );

  const updateField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLocalError("");

    if (!form.category_id) {
      setLocalError("Select an active category.");
      return;
    }

    if (!form.name.trim() || !form.sku.trim()) {
      setLocalError("Product name and SKU are required.");
      return;
    }

    const price = Number(form.price);
    const discountPrice = form.discount_price
      ? Number(form.discount_price)
      : null;

    if (!Number.isFinite(price) || price <= 0) {
      setLocalError("Enter a valid regular price.");
      return;
    }

    if (
      discountPrice !== null
      && (!Number.isFinite(discountPrice) || discountPrice <= 0)
    ) {
      setLocalError("Enter a valid discount price.");
      return;
    }

    if (discountPrice !== null && discountPrice >= price) {
      setLocalError(
        "Discount price must be lower than the regular price.",
      );
      return;
    }

    onSubmit({
      category_id: Number(form.category_id),
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description.trim(),
      price: form.price,
      discount_price: form.discount_price || null,
      stock: Math.max(0, Number.parseInt(form.stock || "0", 10)),
      is_active: form.is_active,
      is_featured: form.is_featured,
    });
  };

  return (
    <form className="admin-form-card" onSubmit={handleSubmit}>
      <div className="admin-form-card__heading">
        <div>
          <span>Catalog details</span>
          <h2>Product information</h2>
        </div>

        <FiBox />
      </div>

      {localError && (
        <div className="admin-form-message admin-form-message--error">
          {localError}
        </div>
      )}

      <div className="admin-form-grid">
        <label className="admin-field admin-field--wide">
          <span>
            <FiLayers />
            Category
          </span>

          <select
            value={form.category_id}
            onChange={(event) => updateField("category_id", event.target.value)}
            required
          >
            <option value="">Select a category</option>
            {activeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field admin-field--wide">
          <span>
            <FiFileText />
            Product name
          </span>

          <input
            type="text"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Premium wireless headphones"
            maxLength="255"
            required
          />
        </label>

        <label className="admin-field">
          <span>
            <FiHash />
            SKU
          </span>

          <input
            type="text"
            value={form.sku}
            onChange={(event) => updateField("sku", event.target.value)}
            placeholder="PRD-1001"
            maxLength="100"
            required
          />
        </label>

        <label className="admin-field">
          <span>
            <FiBox />
            Stock quantity
          </span>

          <input
            type="number"
            value={form.stock}
            onChange={(event) => updateField("stock", event.target.value)}
            min="0"
            step="1"
            required
          />
        </label>

        <label className="admin-field">
          <span>
            <FiDollarSign />
            Regular price
          </span>

          <input
            type="number"
            value={form.price}
            onChange={(event) => updateField("price", event.target.value)}
            min="0.01"
            step="0.01"
            required
          />
        </label>

        <label className="admin-field">
          <span>
            <FiDollarSign />
            Discount price
          </span>

          <input
            type="number"
            value={form.discount_price}
            onChange={(event) => updateField("discount_price", event.target.value)}
            min="0.01"
            step="0.01"
            placeholder="Optional"
          />
        </label>

        <label className="admin-field admin-field--wide">
          <span>
            <FiFileText />
            Description
          </span>

          <textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Describe the product, its benefits, and important specifications."
            rows="7"
            required
          />
        </label>
      </div>

      <div className="admin-form-switches">
        <label className="admin-switch-card">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => updateField("is_active", event.target.checked)}
          />

          <span className="admin-switch-card__control">
            <FiCheck />
          </span>

          <span>
            <strong>Active product</strong>
            <small>Allow customers to view and purchase this product.</small>
          </span>
        </label>

        <label className="admin-switch-card">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(event) => updateField("is_featured", event.target.checked)}
          />

          <span className="admin-switch-card__control">
            <FiStar />
          </span>

          <span>
            <strong>Featured product</strong>
            <small>Display this product in featured store sections.</small>
          </span>
        </label>
      </div>

      <div className="admin-form-actions">
        <button
          type="submit"
          className="admin-primary-button"
          disabled={isSubmitting}
        >
          <FiSave />
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}


export default ProductForm;