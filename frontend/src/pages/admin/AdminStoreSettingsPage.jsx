import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCreditCard,
  FiDollarSign,
  FiImage,
  FiPhone,
  FiRefreshCw,
  FiSave,
  FiShare2,
  FiTool,
} from "react-icons/fi";
import StoreSettingsForm from "../../components/admin/store-settings/StoreSettingsForm";
import StoreSettingsPreview from "../../components/admin/store-settings/StoreSettingsPreview";
import useStoreSettings from "../../hooks/useStoreSettings";
import {
  fetchAdminStoreSettings,
  updateAdminStoreSettings,
} from "../../services/adminStoreSettingsService";
import { getApiErrorMessage } from "../../utils/apiData";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "ico"]);

const tabs = [
  { id: "BRANDING", label: "Branding", icon: FiImage },
  { id: "CONTACT", label: "Contact", icon: FiPhone },
  { id: "COMMERCE", label: "Commerce", icon: FiDollarSign },
  { id: "PAYMENTS", label: "Payments", icon: FiCreditCard },
  { id: "SOCIAL", label: "Social", icon: FiShare2 },
  { id: "MAINTENANCE", label: "Maintenance", icon: FiTool },
];

function normalizeSettings(data = {}) {
  return {
    id: data.id ?? 1,
    store_name: data.store_name ?? "Ecommerce Store",
    tagline: data.tagline ?? "",
    description: data.description ?? "",
    logo_url: data.logo_url ?? "",
    favicon_url: data.favicon_url ?? "",
    logo_file: null,
    favicon_file: null,
    remove_logo: false,
    remove_favicon: false,
    support_email: data.support_email ?? "",
    support_phone: data.support_phone ?? "",
    whatsapp_number: data.whatsapp_number ?? "",
    address: data.address ?? "",
    city: data.city ?? "",
    province: data.province ?? "",
    country: data.country ?? "Pakistan",
    postal_code: data.postal_code ?? "",
    currency_code: data.currency_code ?? "PKR",
    currency_symbol: data.currency_symbol ?? "Rs.",
    tax_percentage: String(data.tax_percentage ?? "0.00"),
    return_window_days: String(data.return_window_days ?? 7),
    low_stock_threshold: String(data.low_stock_threshold ?? 5),
    order_cancellation_window_hours: String(
      data.order_cancellation_window_hours ?? 24,
    ),
    maintenance_mode: data.maintenance_mode === true,
    maintenance_message:
      data.maintenance_message
      ?? "The store is temporarily unavailable. Please try again later.",
    allow_cash_on_delivery: data.allow_cash_on_delivery !== false,
    allow_bank_transfer: data.allow_bank_transfer !== false,
    facebook_url: data.facebook_url ?? "",
    instagram_url: data.instagram_url ?? "",
    youtube_url: data.youtube_url ?? "",
    linkedin_url: data.linkedin_url ?? "",
    twitter_url: data.twitter_url ?? "",
    updated_by_username: data.updated_by_username ?? "",
    updated_at: data.updated_at ?? "",
  };
}

function validateImage(file) {
  if (!file) {
    return "";
  }

  const extension = String(file.name ?? "")
    .split(".")
    .pop()
    .toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return "Only JPG, JPEG, PNG, WEBP and ICO files are allowed.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "Image size cannot exceed 5 MB.";
  }

  return "";
}

function AdminStoreSettingsPage() {
  const [activeTab, setActiveTab] = useState("BRANDING");
  const [values, setValues] = useState(normalizeSettings());
  const [savedValues, setSavedValues] = useState(normalizeSettings());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { refreshStoreSettings } = useStoreSettings();

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await fetchAdminStoreSettings();
      const normalized = normalizeSettings(result);
      setValues(normalized);
      setSavedValues(normalized);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to load store settings."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify({
      ...values,
      logo_file: values.logo_file?.name ?? "",
      favicon_file: values.favicon_file?.name ?? "",
    }) !== JSON.stringify({
      ...savedValues,
      logo_file: savedValues.logo_file?.name ?? "",
      favicon_file: savedValues.favicon_file?.name ?? "",
    }),
    [values, savedValues],
  );

  const handleFieldChange = (event) => {
    const { checked, name, type, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleFileChange = (fieldName, file) => {
    const validationMessage = validateImage(file);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    const isLogo = fieldName === "logo_file";

    setValues((current) => ({
      ...current,
      [fieldName]: file,
      [isLogo ? "remove_logo" : "remove_favicon"]: false,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleRemoveImage = (imageType) => {
    const isLogo = imageType === "logo";

    setValues((current) => ({
      ...current,
      [isLogo ? "logo_file" : "favicon_file"]: null,
      [isLogo ? "remove_logo" : "remove_favicon"]: true,
    }));
  };

  const validateForm = () => {
    if (!values.store_name.trim()) {
      return "Store name is required.";
    }

    if (values.currency_code.trim().length < 3) {
      return "Currency code must contain at least 3 characters.";
    }

    const tax = Number(values.tax_percentage);

    if (!Number.isFinite(tax) || tax < 0 || tax > 100) {
      return "Tax percentage must be between 0 and 100.";
    }

    const returnWindow = Number(values.return_window_days);

    if (!Number.isInteger(returnWindow) || returnWindow < 1 || returnWindow > 365) {
      return "Return window must be between 1 and 365 days.";
    }

    if (Number(values.low_stock_threshold) < 1) {
      return "Low-stock threshold must be at least 1.";
    }

    if (Number(values.order_cancellation_window_hours) < 1) {
      return "Cancellation window must be at least 1 hour.";
    }

    if (!values.allow_cash_on_delivery && !values.allow_bank_transfer) {
      return "At least one payment method must remain enabled.";
    }

    if (values.maintenance_mode && !values.maintenance_message.trim()) {
      return "A maintenance message is required when maintenance mode is enabled.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateForm();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      setSuccessMessage("");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await updateAdminStoreSettings(values);
      const normalized = normalizeSettings(result);
      setValues(normalized);
      setSavedValues(normalized);
      await refreshStoreSettings();
      setSuccessMessage("Store settings updated successfully.");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to update store settings."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setValues({
      ...savedValues,
      logo_file: null,
      favicon_file: null,
      remove_logo: false,
      remove_favicon: false,
    });
    setErrorMessage("");
    setSuccessMessage("");
  };

  if (isLoading) {
    return (
      <div className="admin-store-settings-state">
        <div className="admin-loading-spinner" />
        <p>Loading store settings...</p>
      </div>
    );
  }

  return (
    <form className="admin-store-settings-page" onSubmit={handleSubmit}>
      <header className="admin-store-settings-page__heading">
        <div>
          <span className="admin-store-settings-eyebrow">
            Global configuration
          </span>
          <h1>Store Settings</h1>
          <p>
            Manage branding, contact information, currency, operational rules,
            payment methods and maintenance controls.
          </p>
        </div>

        <div className="admin-store-settings-heading-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={handleReset}
            disabled={isSaving || !hasUnsavedChanges}
          >
            <FiRefreshCw /> Reset Changes
          </button>

          <button
            type="submit"
            className="admin-primary-button"
            disabled={isSaving || !hasUnsavedChanges}
          >
            <FiSave /> {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </header>

      {successMessage && (
        <div className="admin-form-message admin-form-message--success">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="admin-form-message admin-form-message--error">
          {errorMessage}
        </div>
      )}

      <div className="admin-store-settings-meta">
        <span>
          Last updated by: <strong>{values.updated_by_username || "System"}</strong>
        </span>
        <span>
          Updated: <strong>
            {values.updated_at
              ? new Date(values.updated_at).toLocaleString()
              : "Not available"}
          </strong>
        </span>
      </div>

      <div className="admin-store-settings-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              className={
                activeTab === tab.id
                  ? "admin-store-settings-tab admin-store-settings-tab--active"
                  : "admin-store-settings-tab"
              }
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="admin-store-settings-layout">
        <StoreSettingsForm
          activeTab={activeTab}
          values={values}
          disabled={isSaving}
          onFieldChange={handleFieldChange}
          onFileChange={handleFileChange}
          onRemoveImage={handleRemoveImage}
        />

        <StoreSettingsPreview values={values} />
      </div>
    </form>
  );
}

export default AdminStoreSettingsPage;
