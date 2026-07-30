import {
  useEffect,
  useState,
} from "react";

import {
  FiImage,
  FiSave,
} from "react-icons/fi";

import BannerPreview from
  "./BannerPreview";


const emptyForm = {
  title: "",
  subtitle: "",
  description: "",
  image: null,
  mobileImage: null,
  position: "HERO",
  buttonText: "",
  buttonUrl: "",
  backgroundColor: "#11130f",
  textColor: "#ffffff",
  displayOrder: "0",
  isActive: true,
  startsAt: "",
  endsAt: "",
};


function toDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffset =
    date.getTimezoneOffset() * 60000;

  return new Date(
    date.getTime() - timezoneOffset,
  )
    .toISOString()
    .slice(0, 16);
}


function bannerToForm(banner) {
  if (!banner) {
    return emptyForm;
  }

  return {
    title: banner.title || "",
    subtitle: banner.subtitle || "",
    description:
      banner.description || "",
    image: null,
    mobileImage: null,
    position:
      banner.position || "HERO",
    buttonText:
      banner.button_text || "",
    buttonUrl:
      banner.button_url || "",
    backgroundColor:
      banner.background_color
      || "#11130f",
    textColor:
      banner.text_color
      || "#ffffff",
    displayOrder:
      String(
        banner.display_order ?? 0,
      ),
    isActive:
      banner.is_active !== false,
    startsAt: toDateTimeLocal(
      banner.starts_at,
    ),
    endsAt: toDateTimeLocal(
      banner.ends_at,
    ),
  };
}


function isSupportedImage(file) {
  if (!file) {
    return true;
  }

  return [
    "image/jpeg",
    "image/png",
    "image/webp",
  ].includes(file.type);
}


function isValidHexColor(value) {
  if (!value) {
    return true;
  }

  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(
    value,
  );
}


function BannerForm({
  initialBanner = null,
  isSubmitting = false,
  onSubmit,
}) {
  const [
    form,
    setForm,
  ] = useState(
    bannerToForm(initialBanner),
  );

  const [
    validationMessage,
    setValidationMessage,
  ] = useState("");

  useEffect(() => {
    setForm(
      bannerToForm(initialBanner),
    );
    setValidationMessage("");
  }, [initialBanner]);

  const isEditing =
    Boolean(initialBanner);

  const handleChange = (
    event,
  ) => {
    const {
      checked,
      files,
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
            : (
              type === "file"
                ? files?.[0] || null
                : value
            ),
      }),
    );
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      return "Banner title is required.";
    }

    if (
      !isEditing
      && !(form.image instanceof File)
    ) {
      return (
        "A desktop banner image is "
        + "required."
      );
    }

    if (
      form.image
      && !isSupportedImage(form.image)
    ) {
      return (
        "Desktop image must be JPG, "
        + "PNG or WEBP."
      );
    }

    if (
      form.mobileImage
      && !isSupportedImage(
        form.mobileImage,
      )
    ) {
      return (
        "Mobile image must be JPG, "
        + "PNG or WEBP."
      );
    }

    const maximumSize =
      8 * 1024 * 1024;

    if (
      form.image
      && form.image.size > maximumSize
    ) {
      return (
        "Desktop image cannot exceed "
        + "8 MB."
      );
    }

    if (
      form.mobileImage
      && form.mobileImage.size
        > maximumSize
    ) {
      return (
        "Mobile image cannot exceed "
        + "8 MB."
      );
    }

    if (
      form.buttonUrl.trim()
      && !form.buttonText.trim()
    ) {
      return (
        "Button text is required when "
        + "a button URL is provided."
      );
    }

    if (
      form.buttonText.trim()
      && !form.buttonUrl.trim()
    ) {
      return (
        "Button URL is required when "
        + "button text is provided."
      );
    }

    if (
      Number(form.displayOrder) < 0
    ) {
      return (
        "Display order cannot be "
        + "negative."
      );
    }

    if (
      !isValidHexColor(
        form.backgroundColor.trim(),
      )
    ) {
      return (
        "Enter a valid hexadecimal "
        + "background color."
      );
    }

    if (
      !isValidHexColor(
        form.textColor.trim(),
      )
    ) {
      return (
        "Enter a valid hexadecimal "
        + "text color."
      );
    }

    if (
      form.startsAt
      && form.endsAt
      && new Date(form.endsAt)
        <= new Date(form.startsAt)
    ) {
      return (
        "Ending time must be later "
        + "than the starting time."
      );
    }

    return "";
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    const message = validateForm();

    if (message) {
      setValidationMessage(message);
      return;
    }

    setValidationMessage("");

    await onSubmit(form);
  };

  return (
    <div className="admin-banner-form-layout">
      <form
        className="admin-banner-form"
        onSubmit={handleSubmit}
      >
        <section className="admin-banner-form-card">
          <div className="admin-banner-form-card__heading">
            <div>
              <span>Banner content</span>
              <h2>Text and placement</h2>
            </div>
          </div>

          <div className="admin-banner-form-grid">
            <label>
              Banner title

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength="200"
                placeholder="Summer collection"
                disabled={isSubmitting}
                required
              />
            </label>

            <label>
              Position

              <select
                name="position"
                value={form.position}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="HERO">
                  Hero Banner
                </option>

                <option value="PROMOTIONAL">
                  Promotional Banner
                </option>

                <option value="CATEGORY">
                  Category Banner
                </option>

                <option value="SIDEBAR">
                  Sidebar Banner
                </option>
              </select>
            </label>
          </div>

          <label>
            Subtitle

            <input
              type="text"
              name="subtitle"
              value={form.subtitle}
              onChange={handleChange}
              maxLength="300"
              placeholder="Optional supporting headline"
              disabled={isSubmitting}
            />
          </label>

          <label>
            Description

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder={
                "Add a concise banner description."
              }
              disabled={isSubmitting}
            />
          </label>
        </section>

        <section className="admin-banner-form-card">
          <div className="admin-banner-form-card__heading">
            <div>
              <span>Banner media</span>
              <h2>Desktop and mobile images</h2>
            </div>

            <FiImage />
          </div>

          <div className="admin-banner-form-grid">
            <label>
              Desktop image

              <input
                type="file"
                name="image"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleChange}
                disabled={isSubmitting}
              />

              <small>
                JPG, PNG or WEBP. Maximum 8 MB.
              </small>
            </label>

            <label>
              Mobile image

              <input
                type="file"
                name="mobileImage"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleChange}
                disabled={isSubmitting}
              />

              <small>
                Optional responsive image.
              </small>
            </label>
          </div>

          {isEditing && (
            <div className="admin-banner-form-note">
              Leave an image field empty to keep
              its existing image.
            </div>
          )}
        </section>

        <section className="admin-banner-form-card">
          <div className="admin-banner-form-card__heading">
            <div>
              <span>Call to action</span>
              <h2>Button configuration</h2>
            </div>
          </div>

          <div className="admin-banner-form-grid">
            <label>
              Button text

              <input
                type="text"
                name="buttonText"
                value={form.buttonText}
                onChange={handleChange}
                maxLength="100"
                placeholder="Shop Now"
                disabled={isSubmitting}
              />
            </label>

            <label>
              Button URL

              <input
                type="text"
                name="buttonUrl"
                value={form.buttonUrl}
                onChange={handleChange}
                maxLength="500"
                placeholder="/products"
                disabled={isSubmitting}
              />
            </label>
          </div>
        </section>

        <section className="admin-banner-form-card">
          <div className="admin-banner-form-card__heading">
            <div>
              <span>Appearance</span>
              <h2>Colors and order</h2>
            </div>
          </div>

          <div className="admin-banner-form-grid admin-banner-form-grid--three">
            <label>
              Background color

              <div className="admin-banner-color-field">
                <input
                  type="color"
                  value={
                    /^#[0-9a-fA-F]{6}$/.test(
                      form.backgroundColor,
                    )
                      ? form.backgroundColor
                      : "#11130f"
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        backgroundColor:
                          event.target.value,
                      }),
                    )
                  }
                  disabled={isSubmitting}
                />

                <input
                  type="text"
                  name="backgroundColor"
                  value={form.backgroundColor}
                  onChange={handleChange}
                  maxLength="20"
                  placeholder="#11130f"
                  disabled={isSubmitting}
                />
              </div>
            </label>

            <label>
              Text color

              <div className="admin-banner-color-field">
                <input
                  type="color"
                  value={
                    /^#[0-9a-fA-F]{6}$/.test(
                      form.textColor,
                    )
                      ? form.textColor
                      : "#ffffff"
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        textColor:
                          event.target.value,
                      }),
                    )
                  }
                  disabled={isSubmitting}
                />

                <input
                  type="text"
                  name="textColor"
                  value={form.textColor}
                  onChange={handleChange}
                  maxLength="20"
                  placeholder="#ffffff"
                  disabled={isSubmitting}
                />
              </div>
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
                disabled={isSubmitting}
              />
            </label>
          </div>
        </section>

        <section className="admin-banner-form-card">
          <div className="admin-banner-form-card__heading">
            <div>
              <span>Availability</span>
              <h2>Schedule and status</h2>
            </div>
          </div>

          <div className="admin-banner-form-grid">
            <label>
              Starts at

              <input
                type="datetime-local"
                name="startsAt"
                value={form.startsAt}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </label>

            <label>
              Ends at

              <input
                type="datetime-local"
                name="endsAt"
                value={form.endsAt}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </label>
          </div>

          <label className="admin-banner-switch">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              disabled={isSubmitting}
            />

            <span>
              <strong>Banner is active</strong>

              <small>
                Active banners appear when their
                schedule is currently valid.
              </small>
            </span>
          </label>
        </section>

        {validationMessage && (
          <div className="admin-form-message admin-form-message--error">
            {validationMessage}
          </div>
        )}

        <div className="admin-banner-form-actions">
          <button
            type="submit"
            className="admin-primary-button"
            disabled={isSubmitting}
          >
            <FiSave />

            {isSubmitting
              ? "Saving..."
              : (
                isEditing
                  ? "Update Banner"
                  : "Create Banner"
              )}
          </button>
        </div>
      </form>

      <BannerPreview
        title={form.title}
        subtitle={form.subtitle}
        description={form.description}
        buttonText={form.buttonText}
        buttonUrl={form.buttonUrl}
        backgroundColor={
          form.backgroundColor
        }
        textColor={form.textColor}
        image={form.image}
        existingImage={
          initialBanner?.image || ""
        }
        mobileImage={form.mobileImage}
        existingMobileImage={
          initialBanner?.mobile_image || ""
        }
        position={form.position}
      />
    </div>
  );
}


export default BannerForm;
