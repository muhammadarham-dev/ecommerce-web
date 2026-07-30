import {
  useEffect,
  useState,
} from "react";

import {
  FiEdit2,
  FiMapPin,
  FiPlus,
  FiSave,
  FiTrash2,
  FiX,
} from "react-icons/fi";


const emptyZone = {
  name: "",
  code: "",
  country: "Pakistan",
  province: "",
  city: "",
  priority: "0",
  isActive: true,
};


function ShippingZoneManager({
  zones = [],
  isLoading = false,
  isSaving = false,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [
    form,
    setForm,
  ] = useState(emptyZone);

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
      setForm(emptyZone);
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

  const handleEdit = (zone) => {
    setEditingCode(zone.code);

    setForm({
      name: zone.name || "",
      code: zone.code || "",
      country:
        zone.country || "Pakistan",
      province: zone.province || "",
      city: zone.city || "",
      priority: String(
        zone.priority ?? 0,
      ),
      isActive:
        zone.is_active !== false,
    });

    setValidationMessage("");
  };

  const handleCancel = () => {
    setEditingCode("");
    setForm(emptyZone);
    setValidationMessage("");
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setValidationMessage(
        "Zone name is required.",
      );
      return;
    }

    if (!form.code.trim()) {
      setValidationMessage(
        "Zone code is required.",
      );
      return;
    }

    if (!form.country.trim()) {
      setValidationMessage(
        "Country is required.",
      );
      return;
    }

    if (Number(form.priority) < 0) {
      setValidationMessage(
        "Priority cannot be negative.",
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
            <span>Shipping zones</span>

            <h2>
              {editingCode
                ? "Edit Zone"
                : "Create Zone"}
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
            <FiMapPin />
          )}
        </div>

        <div className="admin-shipping-form-grid">
          <label>
            Zone name

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              maxLength="150"
              placeholder="Lahore City"
              disabled={isSaving}
              required
            />
          </label>

          <label>
            Zone code

            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              maxLength="50"
              placeholder="PK-LHE"
              disabled={isSaving}
              required
            />
          </label>
        </div>

        <div className="admin-shipping-form-grid admin-shipping-form-grid--three">
          <label>
            Country

            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              maxLength="100"
              disabled={isSaving}
              required
            />
          </label>

          <label>
            Province

            <input
              type="text"
              name="province"
              value={form.province}
              onChange={handleChange}
              maxLength="100"
              placeholder="Punjab"
              disabled={isSaving}
            />
          </label>

          <label>
            City

            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              maxLength="100"
              placeholder="Lahore"
              disabled={isSaving}
            />
          </label>
        </div>

        <div className="admin-shipping-form-grid">
          <label>
            Priority

            <input
              type="number"
              name="priority"
              value={form.priority}
              onChange={handleChange}
              min="0"
              step="1"
              disabled={isSaving}
            />

            <small>
              Higher-priority zones are matched first.
            </small>
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
              <strong>Zone is active</strong>

              <small>
                Inactive zones are ignored during
                checkout.
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
                ? "Update Zone"
                : "Create Zone"
            )}
        </button>
      </form>

      <div className="admin-shipping-manager-list">
        <div className="admin-shipping-manager-list__heading">
          <div>
            <span>Configured zones</span>
            <h2>Zone directory</h2>
          </div>

          <strong>
            {zones.length}
          </strong>
        </div>

        {isLoading ? (
          <div className="admin-shipping-state">
            <div className="admin-loading-spinner" />
            <p>Loading zones...</p>
          </div>
        ) : (
          <div className="admin-shipping-records">
            {zones.map((zone) => (
              <article
                key={zone.id}
                className="admin-shipping-record"
              >
                <div>
                  <span className="admin-shipping-record__icon">
                    <FiMapPin />
                  </span>

                  <span>
                    <strong>
                      {zone.name}
                    </strong>

                    <small>
                      {zone.code}
                      {" · "}
                      {zone.zone_level}
                    </small>

                    <small>
                      {[
                        zone.city,
                        zone.province,
                        zone.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </small>
                  </span>
                </div>

                <div className="admin-shipping-record__actions">
                  <span
                    className={
                      zone.is_active
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
                    {zone.is_active
                      ? "Active"
                      : "Inactive"}
                  </span>

                  <button
                    type="button"
                    className="admin-shipping-action-button"
                    onClick={() =>
                      handleEdit(zone)
                    }
                    aria-label={
                      `Edit zone ${zone.name}`
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
                      onDelete(zone)
                    }
                    aria-label={
                      `Delete zone ${zone.name}`
                    }
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </article>
            ))}

            {!zones.length && (
              <div className="admin-shipping-empty admin-shipping-empty--compact">
                <FiMapPin />
                <p>No zones created yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


export default ShippingZoneManager;
