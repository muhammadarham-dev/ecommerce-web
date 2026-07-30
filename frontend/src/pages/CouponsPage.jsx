import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCalendar,
  FiCopy,
  FiSearch,
  FiShoppingBag,
  FiTag,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import useStoreSettings from
  "../hooks/useStoreSettings";

import {
  fetchAvailableCoupons,
} from "../services/couponService";

import {
  getApiErrorMessage,
} from "../utils/apiData";


function formatDate(value) {
  if (!value) {
    return "No expiry date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No expiry date";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle: "medium",
    },
  ).format(date);
}


function CouponsPage() {
  const {
    formatMoney,
  } = useStoreSettings();

  const [coupons, setCoupons] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [copiedCode, setCopiedCode] =
    useState("");

  useEffect(() => {
    let isActive = true;

    async function loadCoupons() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const couponData =
          await fetchAvailableCoupons({
            ordering: "expires_at,code",
          });

        if (isActive) {
          setCoupons(couponData);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load available coupons.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadCoupons();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredCoupons = useMemo(
    () => {
      const normalizedSearch =
        searchTerm.trim().toLowerCase();

      if (!normalizedSearch) {
        return coupons;
      }

      return coupons.filter((coupon) =>
        [
          coupon.code,
          coupon.name,
          coupon.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch),
      );
    },
    [
      coupons,
      searchTerm,
    ],
  );

  const handleCopy = async (
    couponCode,
  ) => {
    try {
      await navigator.clipboard.writeText(
        couponCode,
      );

      setCopiedCode(couponCode);

      window.setTimeout(() => {
        setCopiedCode("");
      }, 1800);
    } catch {
      setErrorMessage(
        "Unable to copy the coupon code.",
      );
    }
  };

  return (
    <section className="coupons-page">
      <header className="coupons-page__header">
        <div className="container">
          <span className="section-label">
            Store savings
          </span>

          <h1>Coupons & Offers</h1>

          <p>
            Browse active coupon codes and apply
            an eligible discount during checkout.
          </p>
        </div>
      </header>

      <div className="container coupons-page__content">
        <div className="coupons-toolbar">
          <div className="coupons-search">
            <FiSearch />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value,
                )
              }
              placeholder="Search coupons"
            />
          </div>

          <Link
            to="/checkout"
            className="coupons-checkout-link"
          >
            <FiShoppingBag />
            Go to Checkout
          </Link>
        </div>

        {errorMessage && (
          <div className="store-message error">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="coupons-empty-state">
            <div className="loading-spinner" />
            <p>Loading active coupons...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="coupons-empty-state">
            <FiTag />

            <h2>No Active Coupons</h2>

            <p>
              New discounts will appear here
              when they become available.
            </p>

            <Link
              to="/products"
              className="primary-button"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="coupons-grid">
            {filteredCoupons.map(
              (coupon) => {
                const isPercentage =
                  coupon.discount_type
                  === "PERCENTAGE";

                const discountText =
                  isPercentage
                    ? `${Number(
                      coupon.value,
                    )}% OFF`
                    : `${formatMoney(
                      coupon.value,
                    )} OFF`;

                return (
                  <article
                    key={coupon.id}
                    className="coupon-card"
                  >
                    <div className="coupon-card__accent">
                      <FiTag />
                    </div>

                    <div className="coupon-card__content">
                      <span className="coupon-card__discount">
                        {discountText}
                      </span>

                      <h2>{coupon.name}</h2>

                      <p>
                        {coupon.description
                          || (
                            "Apply this coupon during "
                            + "checkout to receive an "
                            + "eligible discount."
                          )}
                      </p>

                      <div className="coupon-card__conditions">
                        <span>
                          Minimum order
                          <strong>
                            {formatMoney(
                              coupon
                                .minimum_order_amount,
                            )}
                          </strong>
                        </span>

                        {coupon
                          .maximum_discount_amount && (
                          <span>
                            Maximum discount
                            <strong>
                              {formatMoney(
                                coupon
                                  .maximum_discount_amount,
                              )}
                            </strong>
                          </span>
                        )}

                        <span>
                          Uses remaining
                          <strong>
                            {coupon
                              .customer_remaining_uses}
                          </strong>
                        </span>
                      </div>

                      <div className="coupon-card__expiry">
                        <FiCalendar />
                        {formatDate(
                          coupon.expires_at,
                        )}
                      </div>
                    </div>

                    <div className="coupon-card__footer">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(coupon.code)
                        }
                      >
                        <FiCopy />

                        {copiedCode === coupon.code
                          ? "Copied"
                          : coupon.code}
                      </button>

                      <Link
                        to={
                          `/checkout?coupon=${
                            encodeURIComponent(
                              coupon.code,
                            )
                          }`
                        }
                      >
                        Use at Checkout
                      </Link>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </div>
    </section>
  );
}


export default CouponsPage;