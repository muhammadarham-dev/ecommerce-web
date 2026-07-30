import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiArrowRight,
  FiChevronRight,
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


function BannerButton({
  text,
  url,
}) {
  if (!text || !url) {
    return null;
  }

  if (isInternalUrl(url)) {
    return (
      <Link
        to={url}
        className="banner-hero__button"
      >
        {text}
        <FiChevronRight />
      </Link>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="banner-hero__button"
    >
      {text}
      <FiChevronRight />
    </a>
  );
}


function HeroBannerSlider({
  banners = [],
  fallbackBanner,
}) {
  const slides = useMemo(() => {
    if (
      Array.isArray(banners)
      && banners.length > 0
    ) {
      return banners;
    }

    return fallbackBanner
      ? [fallbackBanner]
      : [];
  }, [
    banners,
    fallbackBanner,
  ]);

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const [
    isPaused,
    setIsPaused,
  ] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (
      slides.length <= 1
      || isPaused
    ) {
      return undefined;
    }

    const sliderInterval =
      window.setInterval(() => {
        setActiveIndex(
          (currentIndex) =>
            (
              currentIndex + 1
            ) % slides.length,
        );
      }, 6000);

    return () => {
      window.clearInterval(
        sliderInterval,
      );
    };
  }, [
    isPaused,
    slides.length,
  ]);

  if (slides.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    setActiveIndex(
      (currentIndex) =>
        (
          currentIndex - 1
          + slides.length
        ) % slides.length,
    );
  };

  const handleNext = () => {
    setActiveIndex(
      (currentIndex) =>
        (
          currentIndex + 1
        ) % slides.length,
    );
  };

  return (
    <section
      className="banner-hero"
      onMouseEnter={() =>
        setIsPaused(true)
      }
      onMouseLeave={() =>
        setIsPaused(false)
      }
    >
      <div className="banner-hero__viewport">
        {slides.map(
          (banner, index) => {
            const imageUrl =
              resolveMediaUrl(
                banner.image,
              );

            const mobileImageUrl =
              resolveMediaUrl(
                banner.mobile_image,
              );

            const isActive =
              index === activeIndex;

            return (
              <article
                key={
                  banner.id
                  ?? `${banner.title}-${index}`
                }
                className={
                  isActive
                    ? (
                      "banner-hero__slide "
                      + "banner-hero__slide--active"
                    )
                    : "banner-hero__slide"
                }
                style={{
                  "--banner-background":
                    banner.background_color
                    || "#11130f",

                  "--banner-text":
                    banner.text_color
                    || "#ffffff",
                }}
                aria-hidden={!isActive}
              >
                {(imageUrl
                  || mobileImageUrl) && (
                  <picture className="banner-hero__picture">
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
                      loading={
                        index === 0
                          ? "eager"
                          : "lazy"
                      }
                      onError={(event) => {
                        event.currentTarget.style
                          .display = "none";
                      }}
                    />
                  </picture>
                )}

                <div className="banner-hero__overlay" />

                <div className="container banner-hero__content">
                  <div className="banner-hero__content-inner">
                    {banner.subtitle && (
                      <span className="banner-hero__eyebrow">
                        {banner.subtitle}
                      </span>
                    )}

                    <h1>
                      {banner.title}
                    </h1>

                    {banner.description && (
                      <p>
                        {banner.description}
                      </p>
                    )}

                    <BannerButton
                      text={
                        banner.button_text
                      }
                      url={
                        banner.button_url
                      }
                    />
                  </div>
                </div>
              </article>
            );
          },
        )}
      </div>

      {slides.length > 1 && (
        <>
          <div className="container banner-hero__controls">
            <button
              type="button"
              onClick={handlePrevious}
              aria-label="Previous banner"
            >
              <FiArrowLeft />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next banner"
            >
              <FiArrowRight />
            </button>
          </div>

          <div className="banner-hero__pagination">
            {slides.map(
              (banner, index) => (
                <button
                  type="button"
                  key={
                    banner.id
                    ?? `dot-${index}`
                  }
                  className={
                    index === activeIndex
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveIndex(index)
                  }
                  aria-label={
                    `Open banner ${index + 1}`
                  }
                />
              ),
            )}
          </div>
        </>
      )}
    </section>
  );
}


export default HeroBannerSlider;