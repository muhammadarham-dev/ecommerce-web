import {
  useEffect,
  useState,
} from "react";

import {
  FiEdit2,
  FiPlus,
  FiSave,
  FiTrash2,
  FiTruck,
  FiX,
} from "react-icons/fi";


const emptyMethod = {
  name: "",
  code: "",
  description: "",
  isDefault: false,
  isActive: true,
  displayOrder: "0",
};


function ShippingMethodManager({
  methods = [],
  isLoading = false,
  isSaving = false,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [
    form,
    setForm,
  ] = useState(emptyMethod);

  const [
    editingCode,
    setEditingCode,
  ] = useState("");

  const [
    validationMessage,
    setValidationMessage,
  ] = useState("");

  useEffect(() => {
    if (!editingCode) {
      setForm(emptyMethod);
    }
  }, [editingCode]);

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

  const handleEdit = (method) => {
    setEditingCode(method.code);

    setForm({
      name: method.name || "",
      code: method.code || "",
      description:
        method.description || "",
      isDefault:
        method.is_default === true,
      isActive:
        method.is_active !== false,
      displayOrder: String(
        method.display_order ?? 0,
      ),
    });

    setValidationMessage("");
  };

  const handleCancel = () => {
    setEditingCode("");
    setForm(emptyMethod);
    setValidationMessage("");
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setValidationMessage(
        "Method name is required.",
      );
      return;
    }

    if (!form.code.trim()) {
      setValidationMessage(
        "Method code is required.",
      );
      return;
    }

    if (
      Number(form.displayOrder) < 0
    ) {
      setValidationMessage(
        "Display order cannot be negative.",
      );
      return;
    }

    setValidationMessage("");

    if (editingCode) {
      await onUpdate(
        editingCode,
        form,
      );
    } else {
      await onCreate(form);
    }

    handleCancel();
  };

  return (
    <div className="admin-shipping-manager-layout">
      <form
        className="admin-shipping-manager-form"
        onSubmit={handleSubmit}
      >
        <div className="admin-shipping-manager-form__heading">
          <div>
            <span>Shipping methods</span>

            <h2>
              {editingCode
                ? "Edit Method"
                : "Create Method"}
            </h2>
          </div>

          {editingCode ? (
            <button
              type="button"
              className="admin-shipping-icon-button"
              onClick={handleCancel}
              aria-label="Cancel editing"
            >
              <FiX />
            </button>
          ) : (
            <FiTruck />
          )}
        </div>

        <div className="admin-shipping-form-grid">
          <label>
            Method name

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              maxLength="100"
              placeholder="Standard Delivery"
              disabled={isSaving}
              required
            />
          </label>

          <label>
            Method code

            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              maxLength="50"
              placeholder="STANDARD"
              disabled={isSaving}
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
              "Describe this delivery method."
            }
            disabled={isSaving}
          />
        </label>

        <label>
          Display order

          <input
            type="number"
            name="displayOrder"
            value={form.displayOrder}
            onChange={handleChange}
            min="0"
            step="1"
            disabled={isSaving}
          />
        </label>

        <div className="admin-shipping-switch-list">
          <label className="admin-shipping-switch">
            <input
              type="checkbox"
              name="isDefault"
              checked={form.isDefault}
              onChange={handleChange}
              disabled={isSaving}
            />

            <span>
              <strong>Default method</strong>

              <small>
                Saving this as default removes the
                default status from other methods.
              </small>
            </span>
          </label>

          <label className="admin-shipping-switch">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              disabled={isSaving}
            />

            <span>
              <strong>Method is active</strong>

              <small>
                Only active methods are available
                during checkout.
              </small>
            </span>
          </label>
        </div>

        {validationMessage && (
          <div className="admin-form-message admin-form-message--error">
            {validationMessage}
          </div>
        )}

        <button
          type="submit"
          className="admin-primary-button"
          disabled={isSaving}
        >
          {editingCode
            ? <FiSave />
            : <FiPlus />}

          {isSaving
            ? "Saving..."
            : (
              editingCode
                ? "Update Method"
                : "Create Method"
            )}
        </button>
      </form>

      <div className="admin-shipping-manager-list">
        <div className="admin-shipping-manager-list__heading">
          <div>
            <span>Configured methods</span>
            <h2>Method directory</h2>
          </div>

          <strong>
            {methods.length}
          </strong>
        </div>

        {isLoading ? (
          <div className="admin-shipping-state">
            <div className="admin-loading-spinner" />
            <p>Loading methods...</p>
          </div>
        ) : (
          <div className="admin-shipping-records">
            {methods.map((method) => (
              <article
                key={method.id}
                className="admin-shipping-record"
              >
                <div>
                  <span className="admin-shipping-record__icon">
                    <FiTruck />
                  </span>

                  <span>
                    <strong>
                      {method.name}
                    </strong>

                    <small>
                      {method.code}
                      {" · Order "}
                      {method.display_order}
                    </small>

                    <small>
                      {method.description
                        || "No description"}
                    </small>
                  </span>
                </div>

                <div className="admin-shipping-record__actions">
                  {method.is_default && (
                    <span className="admin-shipping-pill admin-shipping-pill--default">
                      Default
                    </span>
                  )}

                  <span
                    className={
                      method.is_active
                        ? (
                          "admin-shipping-pill "
                          + "admin-shipping-pill--positive"
                        )
                        : (
                          "admin-shipping-pill "
                          + "admin-shipping-pill--neutral"
                        )
                    }
                  >
                    {method.is_active
                      ? "Active"
                      : "Inactive"}
                  </span>

                  <button
                    type="button"
                    className="admin-shipping-action-button"
                    onClick={() =>
                      handleEdit(method)
                    }
                    aria-label={
                      `Edit method ${method.name}`
                    }
                  >
                    <FiEdit2 />
                  </button>

                  <button
                    type="button"
                    className={
                      "admin-shipping-action-button "
                      + "admin-shipping-action-button--danger"
                    }
                    onClick={() =>
                      onDelete(method)
                    }
                    aria-label={
                      `Delete method ${method.name}`
                    }
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </article>
            ))}

            {!methods.length && (
              <div className="admin-shipping-empty admin-shipping-empty--compact">
                <FiTruck />
                <p>No methods created yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


export default ShippingMethodManager;
