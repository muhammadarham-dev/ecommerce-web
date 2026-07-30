import {
  FiFacebook,
  FiInstagram,
  FiLinkedin,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTwitter,
  FiYoutube,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import useStoreSettings from "../../hooks/useStoreSettings";

import {
  buildWhatsAppUrl,
  formatStoreAddress,
} from "../../utils/storeSettings";


function Footer() {
  const {
    storeSettings,
  } = useStoreSettings();

  const currentYear =
    new Date().getFullYear();

  const storeName =
    storeSettings?.store_name
    || "ShopSphere";

  const fullAddress =
    formatStoreAddress(
      storeSettings,
    );

  const whatsappUrl =
    buildWhatsAppUrl(
      storeSettings?.whatsapp_number,
    );

  const socialLinks = [
    {
      label: "Facebook",
      url: storeSettings?.facebook_url,
      icon: FiFacebook,
    },
    {
      label: "Instagram",
      url: storeSettings?.instagram_url,
      icon: FiInstagram,
    },
    {
      label: "YouTube",
      url: storeSettings?.youtube_url,
      icon: FiYoutube,
    },
    {
      label: "LinkedIn",
      url: storeSettings?.linkedin_url,
      icon: FiLinkedin,
    },
    {
      label: "Twitter",
      url: storeSettings?.twitter_url,
      icon: FiTwitter,
    },
  ].filter(
    (socialLink) =>
      Boolean(socialLink.url),
  );

  return (
    <footer className="ec-footer">
      <div className="container ec-footer__grid">
        <section className="ec-footer__brand-column">
          <Link
            to="/"
            className="ec-footer__brand"
          >
            {storeSettings?.logo_url ? (
              <img
                src={storeSettings.logo_url}
                alt={storeName}
              />
            ) : (
              <span className="ec-footer__brand-mark">
                {storeName
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}

            <strong>{storeName}</strong>
          </Link>

          <p>
            {storeSettings?.description
              || storeSettings?.tagline
              || (
                "Premium products, secure "
                + "checkout and reliable delivery."
              )}
          </p>

          {socialLinks.length > 0 && (
            <div className="ec-footer__socials">
              {socialLinks.map(
                (socialLink) => {
                  const Icon =
                    socialLink.icon;

                  return (
                    <a
                      key={socialLink.label}
                      href={socialLink.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={socialLink.label}
                    >
                      <Icon />
                    </a>
                  );
                },
              )}
            </div>
          )}
        </section>

        <nav className="ec-footer__column">
          <h3>Shopping</h3>

          <Link to="/products">
            All Products
          </Link>

          <Link to="/wishlist">
            Wishlist
          </Link>

          <Link to="/coupons">
            Coupons & Offers
          </Link>

          <Link to="/recently-viewed">
            Recently Viewed
          </Link>

          <Link to="/cart">
            Shopping Cart
          </Link>
        </nav>

        <nav className="ec-footer__column">
          <h3>Customer Account</h3>

          <Link to="/account">
            My Account
          </Link>

          <Link to="/orders">
            My Orders
          </Link>

          <Link to="/shipments">
            My Shipments
          </Link>

          <Link to="/returns">
            Returns
          </Link>

          <Link to="/tickets">
            Support Tickets
          </Link>
        </nav>

        <section className="ec-footer__column ec-footer__contact">
          <h3>Contact</h3>

          {storeSettings?.support_email && (
            <a
              href={`mailto:${storeSettings.support_email}`}
            >
              <FiMail />
              <span>
                {storeSettings.support_email}
              </span>
            </a>
          )}

          {storeSettings?.support_phone && (
            <a
              href={`tel:${storeSettings.support_phone}`}
            >
              <FiPhone />
              <span>
                {storeSettings.support_phone}
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
              <span>WhatsApp Support</span>
            </a>
          )}

          {fullAddress && (
            <div>
              <FiMapPin />
              <span>{fullAddress}</span>
            </div>
          )}
        </section>
      </div>

      <div className="container ec-footer__bottom">
        <span>
          © {currentYear} {storeName}.
          All rights reserved.
        </span>

        <nav>
          <Link to="/store-information">
            Store Information
          </Link>

          <Link to="/security">
            Security
          </Link>

          <Link to="/email-preferences">
            Email Preferences
          </Link>
        </nav>
      </div>
    </footer>
  );
}


export default Footer;