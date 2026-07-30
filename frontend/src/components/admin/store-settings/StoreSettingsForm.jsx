import {
  FiAlertTriangle,
  FiCreditCard,
  FiDollarSign,
  FiImage,
  FiMapPin,
  FiPhone,
  FiShare2,
  FiTool,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";

const ACCEPTED_IMAGES = ".jpg,.jpeg,.png,.webp,.ico";

function StoreSettingsForm({
  activeTab,
  values,
  disabled,
  onFieldChange,
  onFileChange,
  onRemoveImage,
}) {
  if (activeTab === "BRANDING") {
    return (
      <section className="admin-store-settings-card">
        <div className="admin-store-settings-card__heading">
          <div>
            <span>Brand identity</span>
            <h2>Store Branding</h2>
            <p>Configure the public store identity and image assets.</p>
          </div>
          <FiImage />
        </div>

        <div className="admin-store-settings-grid">
          <label>
            Store name
            <input
              type="text"
              name="store_name"
              value={values.store_name}
              onChange={onFieldChange}
              maxLength="150"
              disabled={disabled}
              required
            />
          </label>

          <label>
            Tagline
            <input
              type="text"
              name="tagline"
              value={values.tagline}
              onChange={onFieldChange}
              maxLength="255"
              disabled={disabled}
            />
          </label>
        </div>

        <label>
          Description
          <textarea
            name="description"
            value={values.description}
            onChange={onFieldChange}
            disabled={disabled}
          />
        </label>

        <div className="admin-store-settings-upload-grid">
          <div className="admin-store-settings-upload">
            <strong>Store logo</strong>
            <small>JPG, JPEG, PNG, WEBP or ICO. Maximum 5 MB.</small>

            <label className="admin-store-settings-upload__button">
              <FiUpload /> Select Logo
              <input
                type="file"
                accept={ACCEPTED_IMAGES}
                onChange={(event) =>
                  onFileChange("logo_file", event.target.files?.[0] ?? null)
                }
                disabled={disabled}
              />
            </label>

            {(values.logo_url || values.logo_file) && !values.remove_logo && (
              <button
                type="button"
                className="admin-store-settings-remove-button"
                onClick={() => onRemoveImage("logo")}
                disabled={disabled}
              >
                <FiTrash2 /> Remove Logo
              </button>
            )}
          </div>

          <div className="admin-store-settings-upload">
            <strong>Browser favicon</strong>
            <small>Square PNG, WEBP or ICO is recommended.</small>

            <label className="admin-store-settings-upload__button">
              <FiUpload /> Select Favicon
              <input
                type="file"
                accept={ACCEPTED_IMAGES}
                onChange={(event) =>
                  onFileChange("favicon_file", event.target.files?.[0] ?? null)
                }
                disabled={disabled}
              />
            </label>

            {(values.favicon_url || values.favicon_file) && !values.remove_favicon && (
              <button
                type="button"
                className="admin-store-settings-remove-button"
                onClick={() => onRemoveImage("favicon")}
                disabled={disabled}
              >
                <FiTrash2 /> Remove Favicon
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (activeTab === "CONTACT") {
    return (
      <section className="admin-store-settings-card">
        <div className="admin-store-settings-card__heading">
          <div>
            <span>Customer communication</span>
            <h2>Contact Information</h2>
            <p>Manage public support and business address details.</p>
          </div>
          <FiPhone />
        </div>

        <div className="admin-store-settings-grid">
          <label>
            Support email
            <input
              type="email"
              name="support_email"
              value={values.support_email}
              onChange={onFieldChange}
              disabled={disabled}
            />
          </label>

          <label>
            Support phone
            <input
              type="text"
              name="support_phone"
              value={values.support_phone}
              onChange={onFieldChange}
              maxLength="30"
              disabled={disabled}
            />
          </label>

          <label>
            WhatsApp number
            <input
              type="text"
              name="whatsapp_number"
              value={values.whatsapp_number}
              onChange={onFieldChange}
              maxLength="30"
              disabled={disabled}
            />
          </label>

          <label>
            Postal code
            <input
              type="text"
              name="postal_code"
              value={values.postal_code}
              onChange={onFieldChange}
              maxLength="20"
              disabled={disabled}
            />
          </label>
        </div>

        <div className="admin-store-settings-card__subheading">
          <FiMapPin /> <strong>Store address</strong>
        </div>

        <label>
          Street address
          <textarea
            name="address"
            value={values.address}
            onChange={onFieldChange}
            disabled={disabled}
          />
        </label>

        <div className="admin-store-settings-grid admin-store-settings-grid--three">
          <label>
            City
            <input
              type="text"
              name="city"
              value={values.city}
              onChange={onFieldChange}
              maxLength="100"
              disabled={disabled}
            />
          </label>

          <label>
            Province
            <input
              type="text"
              name="province"
              value={values.province}
              onChange={onFieldChange}
              maxLength="100"
              disabled={disabled}
            />
          </label>

          <label>
            Country
            <input
              type="text"
              name="country"
              value={values.country}
              onChange={onFieldChange}
              maxLength="100"
              disabled={disabled}
              required
            />
          </label>
        </div>
      </section>
    );
  }

  if (activeTab === "COMMERCE") {
    return (
      <section className="admin-store-settings-card">
        <div className="admin-store-settings-card__heading">
          <div>
            <span>Business rules</span>
            <h2>Commerce Settings</h2>
            <p>Configure currency, tax and operational limits.</p>
          </div>
          <FiDollarSign />
        </div>

        <div className="admin-store-settings-grid admin-store-settings-grid--three">
          <label>
            Currency code
            <input
              type="text"
              name="currency_code"
              value={values.currency_code}
              onChange={onFieldChange}
              maxLength="10"
              disabled={disabled}
              required
            />
          </label>

          <label>
            Currency symbol
            <input
              type="text"
              name="currency_symbol"
              value={values.currency_symbol}
              onChange={onFieldChange}
              maxLength="10"
              disabled={disabled}
              required
            />
          </label>

          <label>
            Tax percentage
            <input
              type="number"
              name="tax_percentage"
              value={values.tax_percentage}
              onChange={onFieldChange}
              min="0"
              max="100"
              step="0.01"
              disabled={disabled}
              required
            />
          </label>
        </div>

        <div className="admin-store-settings-grid admin-store-settings-grid--three">
          <label>
            Return window (days)
            <input
              type="number"
              name="return_window_days"
              value={values.return_window_days}
              onChange={onFieldChange}
              min="1"
              max="365"
              disabled={disabled}
              required
            />
          </label>

          <label>
            Low-stock threshold
            <input
              type="number"
              name="low_stock_threshold"
              value={values.low_stock_threshold}
              onChange={onFieldChange}
              min="1"
              disabled={disabled}
              required
            />
          </label>

          <label>
            Cancellation window (hours)
            <input
              type="number"
              name="order_cancellation_window_hours"
              value={values.order_cancellation_window_hours}
              onChange={onFieldChange}
              min="1"
              disabled={disabled}
              required
            />
          </label>
        </div>
      </section>
    );
  }

  if (activeTab === "PAYMENTS") {
    return (
      <section className="admin-store-settings-card">
        <div className="admin-store-settings-card__heading">
          <div>
            <span>Checkout controls</span>
            <h2>Payment Methods</h2>
            <p>At least one payment method must remain enabled.</p>
          </div>
          <FiCreditCard />
        </div>

        <div className="admin-store-settings-switch-list">
          <label className="admin-store-settings-switch">
            <input
              type="checkbox"
              name="allow_cash_on_delivery"
              checked={values.allow_cash_on_delivery}
              onChange={onFieldChange}
              disabled={disabled}
            />
            <span>
              <strong>Cash on Delivery</strong>
              <small>Allow payment when an order is delivered.</small>
            </span>
          </label>

          <label className="admin-store-settings-switch">
            <input
              type="checkbox"
              name="allow_bank_transfer"
              checked={values.allow_bank_transfer}
              onChange={onFieldChange}
              disabled={disabled}
            />
            <span>
              <strong>Bank Transfer</strong>
              <small>Allow orders using bank-transfer payments.</small>
            </span>
          </label>
        </div>
      </section>
    );
  }

  if (activeTab === "SOCIAL") {
    return (
      <section className="admin-store-settings-card">
        <div className="admin-store-settings-card__heading">
          <div>
            <span>Social presence</span>
            <h2>Social Media Links</h2>
            <p>Add complete public profile URLs.</p>
          </div>
          <FiShare2 />
        </div>

        <div className="admin-store-settings-grid">
          {[
            ["facebook_url", "Facebook URL"],
            ["instagram_url", "Instagram URL"],
            ["youtube_url", "YouTube URL"],
            ["linkedin_url", "LinkedIn URL"],
            ["twitter_url", "X / Twitter URL"],
          ].map(([name, label]) => (
            <label key={name}>
              {label}
              <input
                type="url"
                name={name}
                value={values[name]}
                onChange={onFieldChange}
                disabled={disabled}
              />
            </label>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="admin-store-settings-card">
      <div className="admin-store-settings-card__heading">
        <div>
          <span>Store availability</span>
          <h2>Maintenance Mode</h2>
          <p>Temporarily restrict public storefront access.</p>
        </div>
        <FiTool />
      </div>

      <label className="admin-store-settings-switch admin-store-settings-switch--warning">
        <input
          type="checkbox"
          name="maintenance_mode"
          checked={values.maintenance_mode}
          onChange={onFieldChange}
          disabled={disabled}
        />
        <span>
          <strong>Enable maintenance mode</strong>
          <small>Customers will temporarily lose storefront access.</small>
        </span>
      </label>

      <label>
        Maintenance message
        <textarea
          name="maintenance_message"
          value={values.maintenance_message}
          onChange={onFieldChange}
          maxLength="500"
          disabled={disabled}
          required={values.maintenance_mode}
        />
      </label>

      {values.maintenance_mode && (
        <div className="admin-store-settings-maintenance-warning">
          <FiAlertTriangle />
          <div>
            <strong>Public requests will receive a maintenance response.</strong>
            <p>Admin and store-settings endpoints remain available.</p>
          </div>
        </div>
      )}
    </section>
  );
}

export default StoreSettingsForm;
