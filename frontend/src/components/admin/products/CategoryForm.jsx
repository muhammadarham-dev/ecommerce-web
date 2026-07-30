import { useEffect, useState } from "react";
import {
  FiCheck,
  FiFileText,
  FiFolder,
  FiImage,
  FiSave,
} from "react-icons/fi";

import { resolveMediaUrl } from "../../../utils/media";


const emptyForm = {
  name: "",
  description: "",
  is_active: true,
  image: null,
};


function CategoryForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel,
}) {
  const [form, setForm] = useState(emptyForm);
  const [previewUrl, setPreviewUrl] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!initialValues) {
      setForm(emptyForm);
      setPreviewUrl("");
      return;
    }

    setForm({
      name: initialValues.name ?? "",
      description: initialValues.description ?? "",
      is_active: initialValues.is_active !== false,
      image: null,
    });

    setPreviewUrl(resolveMediaUrl(initialValues.image) || "");
  }, [initialValues]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const updateField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile) {
      return;
    }

    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    updateField("image", selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLocalError("");

    if (!form.name.trim()) {
      setLocalError("Category name is required.");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("description", form.description.trim());
    formData.append("is_active", form.is_active ? "true" : "false");

    if (form.image) {
      formData.append("image", form.image);
    }

    onSubmit(formData);
  };

  return (
    <form className="admin-form-card" onSubmit={handleSubmit}>
      <div className="admin-form-card__heading">
        <div>
          <span>Catalog organization</span>
          <h2>Category information</h2>
        </div>

        <FiFolder />
      </div>

      {localError && (
        <div className="admin-form-message admin-form-message--error">
          {localError}
        </div>
      )}

      <div className="admin-category-form-layout">
        <div className="admin-form-grid">
          <label className="admin-field admin-field--wide">
            <span>
              <FiFileText />
              Category name
            </span>

            <input
              type="text"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Electronics"
              maxLength="150"
              required
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
              placeholder="Describe the products included in this category."
              rows="7"
            />
          </label>

          <label className="admin-switch-card admin-field--wide">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => updateField("is_active", event.target.checked)}
            />

            <span className="admin-switch-card__control">
              <FiCheck />
            </span>

            <span>
              <strong>Active category</strong>
              <small>Allow this category and its active products to appear in the store.</small>
            </span>
          </label>
        </div>

        <div className="admin-category-image-card">
          <div className="admin-category-image-card__preview">
            {previewUrl ? (
              <img src={previewUrl} alt="Category preview" />
            ) : (
              <FiImage />
            )}
          </div>

          <label className="admin-upload-button">
            <FiImage />
            Choose category image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>

          <small>Recommended: square JPG, PNG, or WebP image.</small>
        </div>
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


export default CategoryForm;