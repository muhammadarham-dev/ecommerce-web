import {
  FiArrowUpRight,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import {
  resolveMediaUrl,
} from "../../utils/media";


function isInternalUrl(url) {
  return (
    typeof url === "string"
    && url.startsWith("/")
  );
}


function PromotionAction({
  banner,
}) {
  if (
    !banner.button_text
    || !banner.button_url
  ) {
    return null;
  }

  const content = (
    <>
      {banner.button_text}
      <FiArrowUpRight />
    </>
  );

  if (
    isInternalUrl(
      banner.button_url,
    )
  ) {
    return (
      <Link
        to={banner.button_url}
        className="promotion-banner__action"
      >
        {content}
      </Link>
    );
  }

  return (
    <a
      href={banner.button_url}
      target="_blank"
      rel="noreferrer"
      className="promotion-banner__action"
    >
      {content}
    </a>
  );
}


function PromotionBanner({
  banners = [],
}) {
  if (
    !Array.isArray(banners)
    || banners.length === 0
  ) {
    return null;
  }

  const visibleBanners =
    banners.slice(0, 2);

  return (
    <section className="promotion-banner-section">
      <div className="container">
        <div className="promotion-banner__heading">
          <div>
            <span className="section-label">
              Limited promotions
            </span>

            <h2>
              Offers selected for you
            </h2>
          </div>
        </div>

        <div
          className={
            visibleBanners.length === 1
              ? (
                "promotion-banner__grid "
                + "promotion-banner__grid--single"
              )
              : "promotion-banner__grid"
          }
        >
          {visibleBanners.map(
            (banner, index) => {
              const imageUrl =
                resolveMediaUrl(
                  banner.image,
                );

              const mobileImageUrl =
                resolveMediaUrl(
                  banner.mobile_image,
                );

              return (
                <article
                  key={
                    banner.id
                    ?? `${banner.title}-${index}`
                  }
                  className="promotion-banner"
                  style={{
                    "--promotion-background":
                      banner.background_color
                      || "#11130f",

                    "--promotion-text":
                      banner.text_color
                      || "#ffffff",
                  }}
                >
                  {(imageUrl
                    || mobileImageUrl) && (
                    <picture className="promotion-banner__picture">
                      {mobileImageUrl && (
                        <source
                          media="(max-width: 700px)"
                          srcSet={
                            mobileImageUrl
                          }
                        />
                      )}

                      <img
                        src={
                          imageUrl
                          || mobileImageUrl
                        }
                        alt={banner.title}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style
                            .display = "none";
                        }}
                      />
                    </picture>
                  )}

                  <div className="promotion-banner__overlay" />

                  <div className="promotion-banner__content">
                    {banner.subtitle && (
                      <span>
                        {banner.subtitle}
                      </span>
                    )}

                    <h3>
                      {banner.title}
                    </h3>

                    {banner.description && (
                      <p>
                        {banner.description}
                      </p>
                    )}

                    <PromotionAction
                      banner={banner}
                    />
                  </div>
                </article>
              );
            },
          )}
        </div>
      </div>
    </section>
  );
}


export default PromotionBanner;