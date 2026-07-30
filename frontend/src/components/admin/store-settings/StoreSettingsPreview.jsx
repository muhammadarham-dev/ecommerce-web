import { useEffect, useMemo, useState } from "react";
import {
  FiMail,
  FiMapPin,
  FiPhone,
  FiShoppingBag,
} from "react-icons/fi";
import { resolveMediaUrl } from "../../../utils/media";

function usePreview(file, existingUrl, removed) {
  const [objectUrl, setObjectUrl] = useState("");

  useEffect(() => {
    if (!(file instanceof File)) {
      setObjectUrl("");
      return undefined;
    }

    const nextUrl = URL.createObjectURL(file);
    setObjectUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  if (removed) {
    return "";
  }

  return objectUrl || resolveMediaUrl(existingUrl) || "";
}

function StoreSettingsPreview({ values }) {
  const logoUrl = usePreview(
    values.logo_file,
    values.logo_url,
    values.remove_logo,
  );

  const faviconUrl = usePreview(
    values.favicon_file,
    values.favicon_url,
    values.remove_favicon,
  );

  const location = useMemo(
    () => [values.city, values.province, values.country]
      .filter(Boolean)
      .join(", "),
    [values.city, values.province, values.country],
  );

  return (
    <aside className="admin-store-settings-preview">
      <div className="admin-store-settings-preview__heading">
        <div>
          <span>Live preview</span>
          <h2>Store Identity</h2>
        </div>

        {faviconUrl ? (
          <img src={faviconUrl} alt="Favicon preview" />
        ) : (
          <FiShoppingBag />
        )}
      </div>

      <div className="admin-store-settings-preview__brand">
        <div className="admin-store-settings-preview__logo">
          {logoUrl ? (
            <img src={logoUrl} alt="Store logo preview" />
          ) : (
            <FiShoppingBag />
          )}
        </div>

        <div>
          <strong>{values.store_name || "Ecommerce Store"}</strong>
          <span>{values.tagline || "Your store tagline"}</span>
        </div>
      </div>

      <p className="admin-store-settings-preview__description">
        {values.description || "Your public store description will appear here."}
      </p>

      <div className="admin-store-settings-preview__details">
        <div>
          <FiMail />
          <span>{values.support_email || "No support email"}</span>
        </div>

        <div>
          <FiPhone />
          <span>{values.support_phone || "No support phone"}</span>
        </div>

        <div>
          <FiMapPin />
          <span>{location || "No location configured"}</span>
        </div>
      </div>

      <div className="admin-store-settings-preview__commerce">
        <article>
          <small>Currency</small>
          <strong>
            {values.currency_code} · {values.currency_symbol}
          </strong>
        </article>

        <article>
          <small>Tax</small>
          <strong>{Number(values.tax_percentage || 0).toFixed(2)}%</strong>
        </article>

        <article>
          <small>Returns</small>
          <strong>{values.return_window_days} days</strong>
        </article>

        <article>
          <small>Maintenance</small>
          <strong
            className={
              values.maintenance_mode
                ? "admin-store-settings-preview__warning"
                : "admin-store-settings-preview__active"
            }
          >
            {values.maintenance_mode ? "Enabled" : "Disabled"}
          </strong>
        </article>
      </div>
    </aside>
  );
}

export default StoreSettingsPreview;
