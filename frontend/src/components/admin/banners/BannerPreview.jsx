import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiImage,
} from "react-icons/fi";

import {
  resolveMediaUrl,
} from "../../../utils/media";


function BannerPreview({
  title = "",
  subtitle = "",
  description = "",
  buttonText = "",
  buttonUrl = "",
  backgroundColor = "",
  textColor = "",
  image = null,
  existingImage = "",
  mobileImage = null,
  existingMobileImage = "",
  position = "HERO",
}) {
  const [
    desktopPreviewUrl,
    setDesktopPreviewUrl,
  ] = useState("");

  const [
    mobilePreviewUrl,
    setMobilePreviewUrl,
  ] = useState("");

  useEffect(() => {
    if (!(image instanceof File)) {
      setDesktopPreviewUrl(
        resolveMediaUrl(existingImage) || "",
      );
      return undefined;
    }

    const objectUrl =
      URL.createObjectURL(image);

    setDesktopPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [
    existingImage,
    image,
  ]);

  useEffect(() => {
    if (!(mobileImage instanceof File)) {
      setMobilePreviewUrl(
        resolveMediaUrl(
          existingMobileImage,
        ) || "",
      );
      return undefined;
    }

    const objectUrl =
      URL.createObjectURL(mobileImage);

    setMobilePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [
    existingMobileImage,
    mobileImage,
  ]);

  const previewStyle = useMemo(
    () => ({
      backgroundColor:
        backgroundColor || "#11130f",
      color:
        textColor || "#ffffff",
    }),
    [
      backgroundColor,
      textColor,
    ],
  );

  return (
    <section className="admin-banner-preview-card">
      <div className="admin-banner-preview-card__heading">
        <div>
          <span>Live preview</span>
          <h2>Desktop banner</h2>
        </div>

        <span className="admin-banner-position-pill">
          {position}
        </span>
      </div>

      <div
        className="admin-banner-preview"
        style={previewStyle}
      >
        {desktopPreviewUrl ? (
          <img
            src={desktopPreviewUrl}
            alt={
              title || "Banner preview"
            }
          />
        ) : (
          <div className="admin-banner-preview__placeholder">
            <FiImage />
            <span>Select a banner image</span>
          </div>
        )}

        <div className="admin-banner-preview__overlay" />

        <div className="admin-banner-preview__content">
          {subtitle && (
            <span>
              {subtitle}
            </span>
          )}

          <h3>
            {title || "Banner title"}
          </h3>

          {description && (
            <p>
              {description}
            </p>
          )}

          {buttonText && buttonUrl && (
            <span className="admin-banner-preview__button">
              {buttonText}
            </span>
          )}
        </div>
      </div>

      <div className="admin-banner-mobile-preview-wrap">
        <div>
          <span>Mobile image</span>
          <small>
            Optional responsive image
          </small>
        </div>

        <div
          className="admin-banner-mobile-preview"
          style={previewStyle}
        >
          {mobilePreviewUrl ? (
            <img
              src={mobilePreviewUrl}
              alt={
                title
                  ? `${title} mobile preview`
                  : "Mobile banner preview"
              }
            />
          ) : (
            <div className="admin-banner-preview__placeholder">
              <FiImage />
              <span>
                Desktop image will be used
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


export default BannerPreview;
