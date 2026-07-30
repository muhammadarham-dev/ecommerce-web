import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  FiEdit3,
  FiPlus,
  FiSave,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import {
  createAdminAttribute,
  createAdminAttributeValue,
  deleteAdminAttribute,
  deleteAdminAttributeValue,
  fetchAdminAttributes,
  updateAdminAttribute,
  updateAdminAttributeValue,
} from "../../../services/adminVariantService";

import {
  getApiErrorMessage,
} from "../../../utils/apiData";


const EMPTY_ATTRIBUTE_FORM = {
  name: "",
  display_order: "0",
  is_active: true,
};

const EMPTY_VALUE_FORM = {
  attribute: "",
  value: "",
  display_value: "",
  color_code: "",
  display_order: "0",
  is_active: true,
};


function AttributeManager({ onAttributesChanged }) {
  const [attributes, setAttributes] = useState([]);
  const [attributeForm, setAttributeForm] = useState(EMPTY_ATTRIBUTE_FORM);
  const [valueForm, setValueForm] = useState(EMPTY_VALUE_FORM);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [editingValue, setEditingValue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  const loadAttributes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await fetchAdminAttributes({ ordering: "display_order,name" });
      setAttributes(data);
      onAttributesChanged?.(data);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to load product attributes."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [onAttributesChanged]);

  useEffect(() => {
    loadAttributes();
  }, [loadAttributes]);

  const resetAttributeForm = () => {
    setEditingAttribute(null);
    setAttributeForm(EMPTY_ATTRIBUTE_FORM);
  };

  const resetValueForm = () => {
    setEditingValue(null);
    setValueForm(EMPTY_VALUE_FORM);
  };

  const handleAttributeSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setNoticeMessage("");

    const payload = {
      name: attributeForm.name.trim(),
      display_order: Number.parseInt(attributeForm.display_order, 10) || 0,
      is_active: attributeForm.is_active,
    };

    try {
      if (editingAttribute) {
        await updateAdminAttribute(editingAttribute.slug, payload);
        setNoticeMessage("Attribute updated successfully.");
      } else {
        await createAdminAttribute(payload);
        setNoticeMessage("Attribute created successfully.");
      }

      resetAttributeForm();
      await loadAttributes();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to save the attribute."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleValueSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setNoticeMessage("");

    const payload = {
      attribute: Number(valueForm.attribute),
      value: valueForm.value.trim(),
      display_value: valueForm.display_value.trim(),
      color_code: valueForm.color_code.trim(),
      display_order: Number.parseInt(valueForm.display_order, 10) || 0,
      is_active: valueForm.is_active,
    };

    try {
      if (editingValue) {
        await updateAdminAttributeValue(editingValue.id, payload);
        setNoticeMessage("Attribute value updated successfully.");
      } else {
        await createAdminAttributeValue(payload);
        setNoticeMessage("Attribute value created successfully.");
      }

      resetValueForm();
      await loadAttributes();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to save the attribute value."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const startAttributeEdit = (attribute) => {
    setEditingAttribute(attribute);
    setAttributeForm({
      name: attribute.name,
      display_order: String(attribute.display_order ?? 0),
      is_active: attribute.is_active !== false,
    });
  };

  const startValueEdit = (value) => {
    setEditingValue(value);
    setValueForm({
      attribute: String(value.attribute),
      value: value.value ?? "",
      display_value: value.display_value ?? "",
      color_code: value.color_code ?? "",
      display_order: String(value.display_order ?? 0),
      is_active: value.is_active !== false,
    });
  };

  const handleDeleteAttribute = async (attribute) => {
    const confirmed = window.confirm(
      `Delete the “${attribute.name}” attribute and its values?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAdminAttribute(attribute.slug);
      setNoticeMessage("Attribute deleted successfully.");
      await loadAttributes();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to delete this attribute. It may be used by existing variants.",
        ),
      );
    }
  };

  const handleDeleteValue = async (value) => {
    const confirmed = window.confirm(
      `Delete the “${value.display_value || value.value}” value?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAdminAttributeValue(value.id);
      setNoticeMessage("Attribute value deleted successfully.");
      await loadAttributes();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to delete this value. It may be used by existing variants.",
        ),
      );
    }
  };

  return (
    <section className="admin-attribute-manager">
      <div className="admin-section-heading">
        <div>
          <span>Variant configuration</span>
          <h2>Attributes & Values</h2>
          <p>Create reusable options such as Size, Color, Storage, and Material.</p>
        </div>
      </div>

      {noticeMessage && (
        <div className="admin-inline-message admin-inline-message--success">
          {noticeMessage}
        </div>
      )}

      {errorMessage && (
        <div className="admin-inline-message admin-inline-message--error">
          {errorMessage}
        </div>
      )}

      <div className="admin-attribute-manager__forms">
        <form className="admin-form-card" onSubmit={handleAttributeSubmit}>
          <div className="admin-subsection-heading">
            <div>
              <span>Step one</span>
              <h3>{editingAttribute ? "Edit Attribute" : "New Attribute"}</h3>
            </div>
          </div>

          <label className="admin-field">
            <span>Name</span>
            <input
              type="text"
              value={attributeForm.name}
              onChange={(event) => setAttributeForm((current) => ({
                ...current,
                name: event.target.value,
              }))}
              placeholder="Color"
              required
            />
          </label>

          <label className="admin-field">
            <span>Display Order</span>
            <input
              type="number"
              min="0"
              value={attributeForm.display_order}
              onChange={(event) => setAttributeForm((current) => ({
                ...current,
                display_order: event.target.value,
              }))}
            />
          </label>

          <label className="admin-check-field">
            <input
              type="checkbox"
              checked={attributeForm.is_active}
              onChange={(event) => setAttributeForm((current) => ({
                ...current,
                is_active: event.target.checked,
              }))}
            />
            <span>
              <strong>Active attribute</strong>
              <small>Available while creating product variants.</small>
            </span>
          </label>

          <div className="admin-form-actions">
            {editingAttribute && (
              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={resetAttributeForm}
              >
                <FiX /> Cancel
              </button>
            )}

            <button
              type="submit"
              className="admin-button admin-button--primary"
              disabled={isSaving}
            >
              {editingAttribute ? <FiSave /> : <FiPlus />}
              {editingAttribute ? "Save Attribute" : "Add Attribute"}
            </button>
          </div>
        </form>

        <form className="admin-form-card" onSubmit={handleValueSubmit}>
          <div className="admin-subsection-heading">
            <div>
              <span>Step two</span>
              <h3>{editingValue ? "Edit Value" : "New Value"}</h3>
            </div>
          </div>

          <label className="admin-field">
            <span>Attribute</span>
            <select
              value={valueForm.attribute}
              onChange={(event) => setValueForm((current) => ({
                ...current,
                attribute: event.target.value,
              }))}
              required
            >
              <option value="">Select attribute</option>
              {attributes.map((attribute) => (
                <option key={attribute.id} value={attribute.id}>
                  {attribute.name}
                </option>
              ))}
            </select>
          </label>

          <div className="admin-form-grid admin-form-grid--two">
            <label className="admin-field">
              <span>Value</span>
              <input
                type="text"
                value={valueForm.value}
                onChange={(event) => setValueForm((current) => ({
                  ...current,
                  value: event.target.value,
                }))}
                placeholder="black"
                required
              />
            </label>

            <label className="admin-field">
              <span>Display Value</span>
              <input
                type="text"
                value={valueForm.display_value}
                onChange={(event) => setValueForm((current) => ({
                  ...current,
                  display_value: event.target.value,
                }))}
                placeholder="Black"
              />
            </label>

            <label className="admin-field">
              <span>Color Code</span>
              <input
                type="text"
                value={valueForm.color_code}
                onChange={(event) => setValueForm((current) => ({
                  ...current,
                  color_code: event.target.value,
                }))}
                placeholder="#000000"
              />
            </label>

            <label className="admin-field">
              <span>Display Order</span>
              <input
                type="number"
                min="0"
                value={valueForm.display_order}
                onChange={(event) => setValueForm((current) => ({
                  ...current,
                  display_order: event.target.value,
                }))}
              />
            </label>
          </div>

          <label className="admin-check-field">
            <input
              type="checkbox"
              checked={valueForm.is_active}
              onChange={(event) => setValueForm((current) => ({
                ...current,
                is_active: event.target.checked,
              }))}
            />
            <span>
              <strong>Active value</strong>
              <small>Available in variant combinations.</small>
            </span>
          </label>

          <div className="admin-form-actions">
            {editingValue && (
              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={resetValueForm}
              >
                <FiX /> Cancel
              </button>
            )}

            <button
              type="submit"
              className="admin-button admin-button--primary"
              disabled={isSaving || !attributes.length}
            >
              {editingValue ? <FiSave /> : <FiPlus />}
              {editingValue ? "Save Value" : "Add Value"}
            </button>
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="admin-module-state">
          <div className="loading-spinner" />
          <p>Loading attributes...</p>
        </div>
      ) : (
        <div className="admin-attribute-list">
          {attributes.map((attribute) => (
            <article key={attribute.id} className="admin-attribute-card">
              <header>
                <div>
                  <strong>{attribute.name}</strong>
                  <span>{attribute.slug}</span>
                </div>

                <div className="admin-table-actions">
                  <button
                    type="button"
                    className="admin-icon-action"
                    onClick={() => startAttributeEdit(attribute)}
                    aria-label={`Edit ${attribute.name}`}
                  >
                    <FiEdit3 />
                  </button>

                  <button
                    type="button"
                    className="admin-icon-action admin-icon-action--danger"
                    onClick={() => handleDeleteAttribute(attribute)}
                    aria-label={`Delete ${attribute.name}`}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </header>

              <div className="admin-attribute-card__values">
                {(attribute.values || []).length ? (
                  attribute.values.map((value) => (
                    <div key={value.id} className="admin-attribute-value">
                      <span>
                        {value.color_code && (
                          <i style={{ backgroundColor: value.color_code }} />
                        )}
                        <strong>{value.display_value || value.value}</strong>
                        <small>{value.value}</small>
                      </span>

                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-icon-action"
                          onClick={() => startValueEdit(value)}
                          aria-label={`Edit ${value.display_value || value.value}`}
                        >
                          <FiEdit3 />
                        </button>

                        <button
                          type="button"
                          className="admin-icon-action admin-icon-action--danger"
                          onClick={() => handleDeleteValue(value)}
                          aria-label={`Delete ${value.display_value || value.value}`}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No values have been added.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}


export default AttributeManager;