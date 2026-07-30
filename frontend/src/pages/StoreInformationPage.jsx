import {
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiFacebook,
  FiInstagram,
  FiLinkedin,
  FiMail,
  FiMapPin,
  FiPhone,
  FiRefreshCcw,
  FiSettings,
  FiShoppingBag,
  FiTwitter,
  FiYoutube,
} from "react-icons/fi";

import useStoreSettings from
  "../hooks/useStoreSettings";

import {
  buildWhatsAppUrl,
  formatStoreAddress,
} from "../utils/storeSettings";


function StoreInformationPage() {
  const {
    storeSettings,
    isStoreSettingsLoading,
    storeSettingsError,
  } = useStoreSettings();

  if (isStoreSettingsLoading) {
    return (
      <section className="route-loading">
        <div className="loading-spinner" />

        <p>
          Loading store information...
        </p>
      </section>
    );
  }

  const fullAddress =
    formatStoreAddress(
      storeSettings,
    );

  const whatsappUrl =
    buildWhatsAppUrl(
      storeSettings.whatsapp_number,
    );

  const socialLinks = [
    {
      label: "Facebook",
      url: storeSettings.facebook_url,
      icon: FiFacebook,
    },
    {
      label: "Instagram",
      url: storeSettings.instagram_url,
      icon: FiInstagram,
    },
    {
      label: "YouTube",
      url: storeSettings.youtube_url,
      icon: FiYoutube,
    },
    {
      label: "LinkedIn",
      url: storeSettings.linkedin_url,
      icon: FiLinkedin,
    },
    {
      label: "Twitter",
      url: storeSettings.twitter_url,
      icon: FiTwitter,
    },
  ].filter(
    (item) => Boolean(item.url),
  );

  return (
    <section className="store-information-page">
      <div className="store-information-header">
        <div className="container">
          <span className="section-label">
            About our store
          </span>

          <h1>
            {storeSettings.store_name}
          </h1>

          <p>
            {storeSettings.tagline
              || storeSettings.description}
          </p>
        </div>
      </div>

      <div className="container store-information-content">
        {storeSettingsError && (
          <div className="store-message error">
            {storeSettingsError}
          </div>
        )}

        <div className="store-information-layout">
          <main className="store-information-main">
            <section className="store-information-card store-brand-card">
              <div className="store-information-card__heading">
                <FiShoppingBag />

                <div>
                  <span>
                    Store profile
                  </span>

                  <h2>
                    About the Store
                  </h2>
                </div>
              </div>

              <div className="store-brand-profile">
                {storeSettings.logo_url ? (
                  <img
                    src={
                      storeSettings.logo_url
                    }
                    alt={
                      storeSettings
                        .store_name
                    }
                  />
                ) : (
                  <div className="store-brand-profile__fallback">
                    {storeSettings
                      .store_name
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div>
                  <h3>
                    {storeSettings.store_name}
                  </h3>

                  <strong>
                    {storeSettings.tagline
                      || (
                        "Premium ecommerce "
                        + "experience"
                      )}
                  </strong>

                  <p>
                    {storeSettings.description
                      || (
                        "Explore quality products "
                        + "with secure checkout "
                        + "and reliable delivery."
                      )}
                  </p>
                </div>
              </div>
            </section>

            <section className="store-information-card">
              <div className="store-information-card__heading">
                <FiSettings />

                <div>
                  <span>
                    Store policies
                  </span>

                  <h2>
                    Shopping Information
                  </h2>
                </div>
              </div>

              <div className="store-policy-grid">
                <article>
                  <FiRefreshCcw />

                  <div>
                    <strong>
                      Return Window
                    </strong>

                    <p>
                      Eligible products can be
                      returned within{" "}
                      {
                        storeSettings
                          .return_window_days
                      }{" "}
                      days after delivery.
                    </p>
                  </div>
                </article>

                <article>
                  <FiCreditCard />

                  <div>
                    <strong>
                      Payment Methods
                    </strong>

                    <p>
                      {storeSettings
                        .allow_cash_on_delivery
                        ? (
                          "Cash on Delivery"
                        )
                        : ""}
                      {storeSettings
                        .allow_cash_on_delivery
                        && storeSettings
                          .allow_bank_transfer
                        ? " and "
                        : ""}
                      {storeSettings
                        .allow_bank_transfer
                        ? "Bank Transfer"
                        : ""}
                    </p>
                  </div>
                </article>

                <article>
                  <FiCheckCircle />

                  <div>
                    <strong>
                      Tax Percentage
                    </strong>

                    <p>
                      Current configured store tax
                      is{" "}
                      {Number(
                        storeSettings
                          .tax_percentage
                          ?? 0,
                      ).toFixed(2)}
                      %.
                    </p>
                  </div>
                </article>

                <article>
                  <FiClock />

                  <div>
                    <strong>
                      Store Status
                    </strong>

                    <p>
                      {storeSettings
                        .maintenance_mode
                        ? (
                          "The store is currently "
                          + "under maintenance."
                        )
                        : (
                          "The store is currently "
                          + "available for shopping."
                        )}
                    </p>
                  </div>
                </article>
              </div>
            </section>
          </main>

          <aside className="store-information-sidebar">
            <section className="store-information-card">
              <div className="store-information-card__heading">
                <FiPhone />

                <div>
                  <span>
                    Customer support
                  </span>

                  <h2>Contact Us</h2>
                </div>
              </div>

              <div className="store-contact-list">
                {storeSettings
                  .support_email && (
                  <a
                    href={
                      `mailto:${
                        storeSettings
                          .support_email
                      }`
                    }
                  >
                    <FiMail />

                    <span>
                      <small>
                        Support Email
                      </small>

                      <strong>
                        {
                          storeSettings
                            .support_email
                        }
                      </strong>
                    </span>
                  </a>
                )}

                {storeSettings
                  .support_phone && (
                  <a
                    href={
                      `tel:${
                        storeSettings
                          .support_phone
                      }`
                    }
                  >
                    <FiPhone />

                    <span>
                      <small>
                        Support Phone
                      </small>

                      <strong>
                        {
                          storeSettings
                            .support_phone
                        }
                      </strong>
                    </span>
                  </a>
                )}

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FiPhone />

                    <span>
                      <small>
                        WhatsApp
                      </small>

                      <strong>
                        {
                          storeSettings
                            .whatsapp_number
                        }
                      </strong>
                    </span>
                  </a>
                )}

                {fullAddress && (
                  <div>
                    <FiMapPin />

                    <span>
                      <small>
                        Store Address
                      </small>

                      <strong>
                        {fullAddress}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </section>

            {socialLinks.length > 0 && (
              <section className="store-information-card">
                <div className="store-information-card__heading">
                  <FiShoppingBag />

                  <div>
                    <span>
                      Social channels
                    </span>

                    <h2>Follow the Store</h2>
                  </div>
                </div>

                <div className="store-social-list">
                  {socialLinks.map(
                    (socialLink) => {
                      const Icon =
                        socialLink.icon;

                      return (
                        <a
                          key={
                            socialLink.label
                          }
                          href={
                            socialLink.url
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Icon />
                          {socialLink.label}
                        </a>
                      );
                    },
                  )}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}


export default StoreInformationPage;