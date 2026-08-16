import {
  useEffect,
  useState,
} from "react";

import {
  FiArrowRight,
  FiCheck,
  FiCreditCard,
  FiDollarSign,
  FiLock,
  FiMapPin,
  FiPackage,
  FiPlus,
  FiTag,
  FiTruck,
  FiX,
} from "react-icons/fi";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import CouponBox from
  "../components/checkout/CouponBox";

import useCart from "../hooks/useCart";

import useStoreSettings from
  "../hooks/useStoreSettings";

import {
  createAddress,
  fetchAddresses,
} from "../services/addressService";

import {
  placeOrder,
} from "../services/orderService";

import {
  validateCoupon,
} from "../services/couponService";

import {
  fetchShippingMethods,
  fetchShippingQuote,
} from "../services/shippingService";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  getProductImage,
} from "../utils/media";


const initialAddressForm = {
  recipient_name: "",
  phone_number: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  province: "Punjab",
  postal_code: "",
  country: "Pakistan",
  is_default: false,
};


function CheckoutPage() {
  const navigate = useNavigate();

  const [
    searchParams,
  ] = useSearchParams();

  const {
    storeSettings,
    formatMoney,
  } = useStoreSettings();

  const requestedCouponCode =
    String(
      searchParams.get("coupon")
      ?? "",
    )
      .trim()
      .toUpperCase();

  const {
    cartItems,
    cartCount,
    cartSubtotal,
    isCartLoading,
    refreshCart,
  } = useCart();

  const [
    addresses,
    setAddresses,
  ] = useState([]);

  const [
    shippingMethods,
    setShippingMethods,
  ] = useState([]);

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState("");

  const [
    shippingMethodCode,
    setShippingMethodCode,
  ] = useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState(
    "CASH_ON_DELIVERY",
  );

  const [
    couponCode,
    setCouponCode,
  ] = useState(
    requestedCouponCode,
  );

  const [
    couponResult,
    setCouponResult,
  ] = useState(null);

  const [
    couponError,
    setCouponError,
  ] = useState("");

  const [
    isApplyingCoupon,
    setIsApplyingCoupon,
  ] = useState(false);

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    shippingQuote,
    setShippingQuote,
  ] = useState(null);

  const [
    addressForm,
    setAddressForm,
  ] = useState(
    initialAddressForm,
  );

  const [
    showAddressForm,
    setShowAddressForm,
  ] = useState(false);

  const [
    isLoadingData,
    setIsLoadingData,
  ] = useState(true);

  const [
    isLoadingQuote,
    setIsLoadingQuote,
  ] = useState(false);

  const [
    isSavingAddress,
    setIsSavingAddress,
  ] = useState(false);

  const [
    isPlacingOrder,
    setIsPlacingOrder,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const cashOnDeliveryEnabled =
    storeSettings
      ?.allow_cash_on_delivery
    !== false;

  const bankTransferEnabled =
    storeSettings
      ?.allow_bank_transfer
    !== false;

  useEffect(() => {
    if (
      !cashOnDeliveryEnabled
      && bankTransferEnabled
    ) {
      setPaymentMethod(
        "BANK_TRANSFER",
      );
    } else if (
      cashOnDeliveryEnabled
      && !bankTransferEnabled
    ) {
      setPaymentMethod(
        "CASH_ON_DELIVERY",
      );
    }

    setAddressForm(
      (currentAddress) => ({
        ...currentAddress,

        country:
          currentAddress.country
          || storeSettings?.country
          || "Pakistan",
      }),
    );
  }, [
    bankTransferEnabled,
    cashOnDeliveryEnabled,
    storeSettings?.country,
  ]);

  useEffect(() => {
    let isActive = true;

    async function loadCheckoutData() {
      setIsLoadingData(true);
      setErrorMessage("");

      try {
        const [
          addressData,
          shippingMethodData,
        ] = await Promise.all([
          fetchAddresses(),
          fetchShippingMethods(),
        ]);

        if (!isActive) {
          return;
        }

        setAddresses(
          addressData,
        );

        setShippingMethods(
          shippingMethodData,
        );

        const defaultAddress =
          addressData.find(
            (address) =>
              address.is_default,
          )
          ?? addressData[0];

        const defaultMethod =
          shippingMethodData.find(
            (method) =>
              method.is_default,
          )
          ?? shippingMethodData[0];

        if (defaultAddress) {
          setSelectedAddressId(
            String(
              defaultAddress.id,
            ),
          );
        }

        if (defaultMethod) {
          setShippingMethodCode(
            defaultMethod.code,
          );
        }

        if (
          addressData.length === 0
        ) {
          setShowAddressForm(true);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load checkout information.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingData(false);
        }
      }
    }

    loadCheckoutData();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (
      !selectedAddressId
      || !shippingMethodCode
    ) {
      setShippingQuote(null);
      return undefined;
    }

    let isActive = true;

    async function loadQuote() {
      setIsLoadingQuote(true);
      setErrorMessage("");

      try {
        const quote =
          await fetchShippingQuote({
            addressId:
              selectedAddressId,

            shippingMethodCode,
          });

        if (isActive) {
          setShippingQuote(quote);
        }
      } catch (error) {
        if (isActive) {
          setShippingQuote(null);

          setErrorMessage(
            getApiErrorMessage(
              error,
              "Shipping is not available for the selected address.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingQuote(false);
        }
      }
    }

    loadQuote();

    return () => {
      isActive = false;
    };
  }, [
    selectedAddressId,
    shippingMethodCode,
  ]);

  useEffect(() => {
    const cashOnDeliveryUnavailable =
      paymentMethod
        === "CASH_ON_DELIVERY"
      && shippingQuote
      && shippingQuote.cod_available
        === false;

    if (
      cashOnDeliveryUnavailable
      && bankTransferEnabled
    ) {
      setPaymentMethod(
        "BANK_TRANSFER",
      );
    }
  }, [
    bankTransferEnabled,
    paymentMethod,
    shippingQuote,
  ]);

  const handleAddressChange = (
    event,
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setAddressForm(
      (currentAddress) => ({
        ...currentAddress,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      }),
    );

    setErrorMessage("");
  };

  const handleCreateAddress =
    async (event) => {
      event.preventDefault();

      setIsSavingAddress(true);
      setErrorMessage("");

      try {
        const newAddress =
          await createAddress({
            ...addressForm,

            recipient_name:
              addressForm
                .recipient_name
                .trim(),

            phone_number:
              addressForm
                .phone_number
                .trim(),

            address_line_1:
              addressForm
                .address_line_1
                .trim(),

            address_line_2:
              addressForm
                .address_line_2
                .trim(),

            city:
              addressForm
                .city
                .trim(),

            province:
              addressForm
                .province
                .trim(),

            postal_code:
              addressForm
                .postal_code
                .trim(),

            country:
              addressForm
                .country
                .trim(),
          });

        const updatedAddresses =
          await fetchAddresses();

        setAddresses(
          updatedAddresses,
        );

        setSelectedAddressId(
          String(newAddress.id),
        );

        setAddressForm(
          initialAddressForm,
        );

        setShowAddressForm(false);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to save the delivery address.",
          ),
        );
      } finally {
        setIsSavingAddress(false);
      }
    };

  const handleApplyCoupon =
    async (enteredCode) => {
      const normalizedCode =
        String(
          enteredCode ?? "",
        )
          .trim()
          .toUpperCase();

      if (!normalizedCode) {
        setCouponError(
          "Enter a coupon code first.",
        );

        return;
      }

      setIsApplyingCoupon(true);
      setCouponError("");
      setErrorMessage("");

      try {
        const result =
          await validateCoupon(
            normalizedCode,
          );

        setCouponCode(
          result.coupon?.code
          ?? normalizedCode,
        );

        setCouponResult(result);
      } catch (error) {
        setCouponCode("");
        setCouponResult(null);

        setCouponError(
          getApiErrorMessage(
            error,
            "This coupon could not be applied.",
          ),
        );
      } finally {
        setIsApplyingCoupon(false);
      }
    };

  const handleRemoveCoupon =
    () => {
      setCouponCode("");
      setCouponResult(null);
      setCouponError("");
    };

  const handlePlaceOrder =
    async () => {
      if (!selectedAddressId) {
        setErrorMessage(
          "Please select a delivery address.",
        );

        return;
      }

      if (!shippingMethodCode) {
        setErrorMessage(
          "Please select a shipping method.",
        );

        return;
      }

      if (!shippingQuote) {
        setErrorMessage(
          "A valid shipping quote is required before placing the order.",
        );

        return;
      }

      if (
        paymentMethod
          === "CASH_ON_DELIVERY"
        && !cashOnDeliveryEnabled
      ) {
        setErrorMessage(
          "Cash on Delivery is disabled by the store.",
        );

        return;
      }

      if (
        paymentMethod
          === "BANK_TRANSFER"
        && !bankTransferEnabled
      ) {
        setErrorMessage(
          "Bank Transfer is disabled by the store.",
        );

        return;
      }

      if (
        paymentMethod
          === "CASH_ON_DELIVERY"
        && shippingQuote
        && shippingQuote.cod_available
          === false
      ) {
        setErrorMessage(
          "Cash on Delivery is unavailable for this shipping option.",
        );

        return;
      }

      setIsPlacingOrder(true);
      setErrorMessage("");

      try {
        const result =
          await placeOrder({
            addressId:
              selectedAddressId,

            paymentMethod,

            shippingMethodCode,

            notes:
              notes.trim(),

            couponCode:
              couponResult
                ?.coupon
                ?.code
              ?? "",
          });

        await refreshCart();

        navigate(
          `/order-success/${
            result.order.order_number
          }`,
          {
            replace: true,

            state: {
              order: result.order,
              message:
                result.message,
            },
          },
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to place your order.",
          ),
        );
      } finally {
        setIsPlacingOrder(false);
      }
    };

  if (
    isCartLoading
    || isLoadingData
  ) {
    return (
      <section className="route-loading">
        <div className="loading-spinner" />

        <p>
          Preparing secure checkout...
        </p>
      </section>
    );
  }

  if (
    cartItems.length === 0
  ) {
    return (
      <section className="checkout-empty-page">
        <div className="container checkout-empty-card">
          <FiPackage />

          <h1>
            Your cart is empty
          </h1>

          <p>
            Add products to your cart
            before proceeding to checkout.
          </p>

          <Link
            to="/products"
            className="primary-button"
          >
            Explore Products
          </Link>
        </div>
      </section>
    );
  }

  const displayedSubtotal =
    shippingQuote?.subtotal
    ?? cartSubtotal;

  const displayedShipping =
    shippingQuote?.shipping_fee
    ?? 0;

  const displayedDiscount =
    Number(
      couponResult
        ?.discount_amount
      ?? 0,
    );

  const totalBeforeDiscount =
    Number(
      shippingQuote
        ?.total_amount
      ?? (
        Number(
          displayedSubtotal,
        )
        + Number(
          displayedShipping,
        )
      ),
    );

  const displayedTotal =
    Math.max(
      totalBeforeDiscount
      - displayedDiscount,
      0,
    );

  return (
    <section className="checkout-page">
      <div className="checkout-header">
        <div className="container">
          <span className="section-label">
            Secure checkout
          </span>

          <h1>
            Complete Your Order
          </h1>

          <p>
            Select your address,
            delivery method and payment
            option.
          </p>

          <div className="checkout-steps">
            <span className="active">
              <FiMapPin />
              Address
            </span>

            <span className="active">
              <FiTruck />
              Delivery
            </span>

            <span className="active">
              <FiCreditCard />
              Payment
            </span>
          </div>
        </div>
      </div>

      <div className="container checkout-layout">
        <div className="checkout-main">
          {errorMessage && (
            <div className="store-message error">
              {errorMessage}
            </div>
          )}

          <section className="checkout-section-card">
            <div className="checkout-section-heading">
              <div className="checkout-heading-icon">
                <FiMapPin />
              </div>

              <div>
                <span>Step 1</span>

                <h2>
                  Delivery Address
                </h2>
              </div>

              <button
                type="button"
                className="checkout-add-button"
                onClick={() =>
                  setShowAddressForm(
                    (current) =>
                      !current,
                  )
                }
              >
                {showAddressForm
                  ? <FiX />
                  : <FiPlus />}

                {showAddressForm
                  ? "Close"
                  : "Add Address"}
              </button>
            </div>

            {showAddressForm && (
              <form
                className="checkout-address-form"
                onSubmit={
                  handleCreateAddress
                }
              >
                <div className="checkout-field-grid">
                  <label>
                    Recipient name

                    <input
                      type="text"
                      name="recipient_name"
                      value={
                        addressForm
                          .recipient_name
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="Muhammad Hamza"
                      required
                    />
                  </label>

                  <label>
                    Phone number

                    <input
                      type="tel"
                      name="phone_number"
                      value={
                        addressForm
                          .phone_number
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="+92 300 1234567"
                      required
                    />
                  </label>
                </div>

                <label>
                  Address line 1

                  <input
                    type="text"
                    name="address_line_1"
                    value={
                      addressForm
                        .address_line_1
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="House number, street and area"
                    required
                  />
                </label>

                <label>
                  Address line 2
                  <small>
                    Optional
                  </small>

                  <input
                    type="text"
                    name="address_line_2"
                    value={
                      addressForm
                        .address_line_2
                    }
                    onChange={
                      handleAddressChange
                    }
                    placeholder="Apartment, floor or landmark"
                  />
                </label>

                <div className="checkout-field-grid">
                  <label>
                    City

                    <input
                      type="text"
                      name="city"
                      value={
                        addressForm.city
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="Sahiwal"
                      required
                    />
                  </label>

                  <label>
                    Province

                    <input
                      type="text"
                      name="province"
                      value={
                        addressForm
                          .province
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="Punjab"
                      required
                    />
                  </label>
                </div>

                <div className="checkout-field-grid">
                  <label>
                    Postal code
                    <small>
                      Optional
                    </small>

                    <input
                      type="text"
                      name="postal_code"
                      value={
                        addressForm
                          .postal_code
                      }
                      onChange={
                        handleAddressChange
                      }
                      placeholder="57000"
                    />
                  </label>

                  <label>
                    Country

                    <input
                      type="text"
                      name="country"
                      value={
                        addressForm
                          .country
                      }
                      onChange={
                        handleAddressChange
                      }
                      required
                    />
                  </label>
                </div>

                <label className="checkout-checkbox">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={
                      addressForm
                        .is_default
                    }
                    onChange={
                      handleAddressChange
                    }
                  />

                  Make this my default
                  address
                </label>

                <button
                  type="submit"
                  className="checkout-save-address"
                  disabled={
                    isSavingAddress
                  }
                >
                  {isSavingAddress
                    ? "Saving Address..."
                    : (
                      "Save Delivery "
                      + "Address"
                    )}
                </button>
              </form>
            )}

            {addresses.length > 0 && (
              <div className="checkout-address-grid">
                {addresses.map(
                  (address) => {
                    const isSelected =
                      String(
                        address.id,
                      )
                      === String(
                        selectedAddressId,
                      );

                    return (
                      <button
                        type="button"
                        key={address.id}
                        className={
                          isSelected
                            ? (
                              "checkout-address-card "
                              + "selected"
                            )
                            : (
                              "checkout-address-card"
                            )
                        }
                        onClick={() =>
                          setSelectedAddressId(
                            String(
                              address.id,
                            ),
                          )
                        }
                      >
                        <div className="address-card-top">
                          <strong>
                            {
                              address
                                .recipient_name
                            }
                          </strong>

                          {address
                            .is_default
                            && (
                              <span>
                                Default
                              </span>
                            )}
                        </div>

                        <p>
                          {
                            address
                              .address_line_1
                          }

                          {address
                            .address_line_2
                            ? (
                              `, ${
                                address
                                  .address_line_2
                              }`
                            )
                            : ""}
                        </p>

                        <p>
                          {address.city},
                          {" "}
                          {address.province}
                          {" "}
                          {
                            address
                              .postal_code
                          }
                        </p>

                        <small>
                          {
                            address
                              .phone_number
                          }
                        </small>

                        {isSelected && (
                          <div className="address-selected-icon">
                            <FiCheck />
                          </div>
                        )}
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </section>

          <section className="checkout-section-card">
            <div className="checkout-section-heading">
              <div className="checkout-heading-icon">
                <FiTruck />
              </div>

              <div>
                <span>Step 2</span>

                <h2>
                  Shipping Method
                </h2>
              </div>
            </div>

            {shippingMethods.length
              === 0 ? (
                <div className="store-message error">
                  No active shipping method
                  is currently available.
                </div>
              ) : (
                <div className="shipping-method-list">
                  {shippingMethods.map(
                    (method) => {
                      const isSelected =
                        method.code
                        === shippingMethodCode;

                      return (
                        <button
                          type="button"
                          key={method.id}
                          className={
                            isSelected
                              ? (
                                "shipping-method-card "
                                + "selected"
                              )
                              : (
                                "shipping-method-card"
                              )
                          }
                          onClick={() =>
                            setShippingMethodCode(
                              method.code,
                            )
                          }
                        >
                          <span className="shipping-method-radio">
                            {isSelected && (
                              <FiCheck />
                            )}
                          </span>

                          <div>
                            <strong>
                              {method.name}
                            </strong>

                            <p>
                              {
                                method
                                  .description
                                || (
                                  "Reliable "
                                  + "delivery for "
                                  + "your order."
                                )
                              }
                            </p>
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              )}

            {isLoadingQuote && (
              <div className="quote-loading">
                Calculating delivery
                charges...
              </div>
            )}

            {shippingQuote
              && !isLoadingQuote
              && (
                <div className="shipping-quote-card">
                  <div>
                    <small>
                      Delivery zone
                    </small>

                    <strong>
                      {
                        shippingQuote
                          .zone?.name
                        ?? (
                          "Matched "
                          + "delivery zone"
                        )
                      }
                    </strong>
                  </div>

                  <div>
                    <small>
                      Estimated delivery
                    </small>

                    <strong>
                      {
                        shippingQuote
                          .estimated_delivery
                          ?.minimum_days
                        ?? shippingQuote
                          .rate
                          ?.estimated_min_days
                      }
                      {" - "}
                      {
                        shippingQuote
                          .estimated_delivery
                          ?.maximum_days
                        ?? shippingQuote
                          .rate
                          ?.estimated_max_days
                      }
                      {" days"}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Shipping charge
                    </small>

                    <strong>
                      {
                        shippingQuote
                          .free_shipping_applied
                          ? "Free"
                          : formatMoney(
                            shippingQuote
                              .shipping_fee,
                          )
                      }
                    </strong>
                  </div>
                </div>
              )}
          </section>

          <section className="checkout-section-card">
            <div className="checkout-section-heading">
              <div className="checkout-heading-icon">
                <FiCreditCard />
              </div>

              <div>
                <span>Step 3</span>

                <h2>
                  Payment Method
                </h2>
              </div>
            </div>

            <div className="payment-method-grid">
              {cashOnDeliveryEnabled && (
                <button
                  type="button"
                  className={
                    paymentMethod
                      === "CASH_ON_DELIVERY"
                      ? (
                        "payment-method-card "
                        + "selected"
                      )
                      : (
                        "payment-method-card"
                      )
                  }
                  disabled={
                    Boolean(
                      shippingQuote
                      && shippingQuote
                        .cod_available
                        === false,
                    )
                  }
                  onClick={() =>
                    setPaymentMethod(
                      "CASH_ON_DELIVERY",
                    )
                  }
                >
                  <FiDollarSign />

                  <div>
                    <strong>
                      Cash on Delivery
                    </strong>

                    <p>
                      Pay when your order
                      arrives.
                    </p>

                    {shippingQuote
                      && shippingQuote
                        .cod_available
                        === false
                      && (
                        <small>
                          Unavailable for this
                          delivery option
                        </small>
                      )}
                  </div>
                </button>
              )}

              {bankTransferEnabled && (
                <button
                  type="button"
                  className={
                    paymentMethod
                      === "BANK_TRANSFER"
                      ? (
                        "payment-method-card "
                        + "selected"
                      )
                      : (
                        "payment-method-card"
                      )
                  }
                  onClick={() =>
                    setPaymentMethod(
                      "BANK_TRANSFER",
                    )
                  }
                >
                  <FiCreditCard />

                  <div>
                    <strong>
                      Bank Transfer
                    </strong>

                    <p>
                      Transfer funds and
                      upload payment proof
                      after ordering.
                    </p>
                  </div>
                </button>
              )}
            </div>
          </section>

          <section className="checkout-section-card">
            <CouponBox
              appliedCoupon={
                couponResult?.coupon
                ?? null
              }
              couponResult={
                couponResult
              }
              errorMessage={
                couponError
              }
              isApplying={
                isApplyingCoupon
              }
              onApply={
                handleApplyCoupon
              }
              onRemove={
                handleRemoveCoupon
              }
              formatMoney={
                formatMoney
              }
              initialCode={
                requestedCouponCode
              }
            />
          </section>

          <section className="checkout-section-card">
            <div className="checkout-section-heading">
              <div className="checkout-heading-icon">
                <FiTag />
              </div>

              <div>
                <span>Optional</span>

                <h2>
                  Order Notes
                </h2>
              </div>
            </div>

            <label className="checkout-notes-field">
              Order notes
              <small>Optional</small>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
                placeholder="Delivery instructions or additional notes"
                rows="4"
                maxLength="1000"
              />
            </label>
          </section>
        </div>

        <aside className="checkout-summary">
          <span className="section-label">
            Order summary
          </span>

          <h2>
            {cartCount}
            {" "}
            {cartCount === 1
              ? "Item"
              : "Items"}
          </h2>

          <div className="checkout-summary-items">
            {cartItems.map(
              (item) => {
                const product =
                  item.product ?? {};

                return (
                  <article
                    key={item.id}
                    className="checkout-summary-item"
                  >
                    <div>
                      <img
                        src={
                          getProductImage(
                            product,
                          )
                        }
                        alt={
                          product.name
                          ?? item
                            .product_name
                        }
                        onError={
                          (event) => {
                            event
                              .currentTarget
                              .src =
                              "/product-placeholder.svg";
                          }
                        }
                      />

                      <span>
                        {item.quantity}
                      </span>
                    </div>

                    <section>
                      <strong>
                        {product.name
                          ?? item
                            .product_name}
                      </strong>

                      {item.variant && (
                        <small>
                          {
                            item.variant
                              .variant_name
                            ?? item.variant
                              .name
                            ?? item.variant
                              .sku
                          }
                        </small>
                      )}
                    </section>

                    <strong>
                      {formatMoney(
                        item.line_total
                        ?? item.total_price
                        ?? (
                          Number(
                            item.unit_price
                            ?? product
                              .final_price
                            ?? product
                              .price,
                          )
                          * Number(
                            item.quantity,
                          )
                        ),
                      )}
                    </strong>
                  </article>
                );
              },
            )}
          </div>

          <div className="checkout-summary-prices">
            <div>
              <span>Subtotal</span>

              <strong>
                {formatMoney(
                  displayedSubtotal,
                )}
              </strong>
            </div>

            <div>
              <span>Shipping</span>

              <strong>
                {shippingQuote
                  ?.free_shipping_applied
                  ? "Free"
                  : formatMoney(
                    displayedShipping,
                  )}
              </strong>
            </div>

            {couponResult?.coupon && (
              <>
                <div>
                  <span>
                    Coupon
                    {" "}
                    (
                    {
                      couponResult
                        .coupon
                        .code
                    }
                    )
                  </span>

                  <strong>
                    Applied
                  </strong>
                </div>

                <div className="checkout-discount-row">
                  <span>
                    Discount
                  </span>

                  <strong>
                    -{formatMoney(
                      displayedDiscount,
                    )}
                  </strong>
                </div>
              </>
            )}
          </div>

          <div className="checkout-summary-total">
            <span>
              Estimated Total
            </span>

            <strong>
              {formatMoney(
                displayedTotal,
              )}
            </strong>
          </div>

          <button
            type="button"
            className="place-order-button"
            onClick={
              handlePlaceOrder
            }
            disabled={
              isPlacingOrder
              || isLoadingQuote
              || !selectedAddressId
              || !shippingMethodCode
              || !shippingQuote
            }
          >
            {isPlacingOrder
              ? "Placing Order..."
              : "Place Order"}

            {!isPlacingOrder && (
              <FiArrowRight />
            )}
          </button>

          <div className="checkout-security-note">
            <FiLock />

            <span>
              Your checkout is protected
              through secure authentication.
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}


export default CheckoutPage;
