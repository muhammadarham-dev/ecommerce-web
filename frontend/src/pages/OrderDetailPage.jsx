import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiMapPin,
  FiPackage,
  FiRefreshCcw,
  FiRotateCcw,
  FiShoppingBag,
  FiStar,
  FiTruck,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import {
  Link,
  useParams,
} from "react-router-dom";

import ShipmentTracking from
  "../components/orders/ShipmentTracking";

import {
  cancelOrder,
  fetchOrder,
} from "../services/orderService";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  formatCurrency,
} from "../utils/currency";

import {
  getProductImage,
  resolveMediaUrl,
} from "../utils/media";

import {
  formatOrderDate,
  formatOrderStatus,
  formatPaymentMethod,
  getOrderStatusClass,
} from "../utils/order";


const orderProgressSteps = [
  {
    value: "PENDING",
    label: "Order Placed",
    icon: FiShoppingBag,
  },
  {
    value: "CONFIRMED",
    label: "Confirmed",
    icon: FiCheckCircle,
  },
  {
    value: "PROCESSING",
    label: "Processing",
    icon: FiPackage,
  },
  {
    value: "SHIPPED",
    label: "Shipped",
    icon: FiTruck,
  },
  {
    value: "DELIVERED",
    label: "Delivered",
    icon: FiCheck,
  },
];


function getProductId(item) {
  if (
    item?.product
    && typeof item.product === "object"
  ) {
    return item.product.id;
  }

  return (
    item?.product
    ?? item?.product_id
    ?? null
  );
}


function getProductName(item) {
  if (
    item?.product
    && typeof item.product === "object"
  ) {
    return (
      item.product.name
      ?? item.product_name
      ?? "Product"
    );
  }

  return (
    item?.product_name
    ?? item?.name
    ?? "Product"
  );
}


function getProductSku(item) {
  if (
    item?.product
    && typeof item.product === "object"
  ) {
    return (
      item.product.sku
      ?? item.product_sku
      ?? ""
    );
  }

  return (
    item?.product_sku
    ?? item?.sku
    ?? ""
  );
}


function getItemImage(item) {
  if (item?.product_image) {
    return resolveMediaUrl(
      item.product_image,
    );
  }

  if (item?.image) {
    return resolveMediaUrl(item.image);
  }

  if (
    item?.product
    && typeof item.product === "object"
  ) {
    return getProductImage(item.product);
  }

  return "/product-placeholder.svg";
}


function formatVariantOptions(
  variantOptions,
) {
  if (!variantOptions) {
    return "";
  }

  if (typeof variantOptions === "string") {
    return variantOptions;
  }

  if (Array.isArray(variantOptions)) {
    return variantOptions
      .map((option) => {
        if (typeof option === "string") {
          return option;
        }

        return (
          option.value
          ?? option.name
          ?? option.label
          ?? ""
        );
      })
      .filter(Boolean)
      .join(" • ");
  }

  if (typeof variantOptions === "object") {
    return Object.entries(variantOptions)
      .map(
        ([name, value]) =>
          `${name}: ${value}`,
      )
      .join(" • ");
  }

  return "";
}


function getVariantText(item) {
  const options = formatVariantOptions(
    item?.variant_options,
  );

  if (options) {
    return options;
  }

  return (
    item?.variant_name
    ?? item?.variant_sku
    ?? ""
  );
}


function getAddressValue(
  order,
  ...fieldNames
) {
  for (const fieldName of fieldNames) {
    const directValue =
      order?.[fieldName];

    if (directValue) {
      return directValue;
    }

    const addressValue =
      order?.shipping_address?.[fieldName];

    if (addressValue) {
      return addressValue;
    }

    const nestedAddressValue =
      order?.address?.[fieldName];

    if (nestedAddressValue) {
      return nestedAddressValue;
    }
  }

  return "";
}


function OrderStatusProgress({
  status,
}) {
  if (status === "CANCELLED") {
    return (
      <section className="order-cancelled-banner">
        <FiXCircle />

        <div>
          <h2>Order Cancelled</h2>

          <p>
            This order has been cancelled and
            will not proceed to shipment.
          </p>
        </div>
      </section>
    );
  }

  const currentStepIndex =
    orderProgressSteps.findIndex(
      (step) => step.value === status,
    );

  return (
    <section className="order-progress-card">
      <div className="order-progress">
        {orderProgressSteps.map(
          (step, index) => {
            const Icon = step.icon;

            const isComplete =
              currentStepIndex >= index;

            const isCurrent =
              currentStepIndex === index;

            return (
              <div
                key={step.value}
                className={[
                  "order-progress-step",
                  isComplete
                    ? "complete"
                    : "",
                  isCurrent
                    ? "current"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="order-progress-marker">
                  {isComplete ? (
                    <FiCheck />
                  ) : (
                    <Icon />
                  )}
                </div>

                <strong>
                  {step.label}
                </strong>
              </div>
            );
          },
        )}
      </div>
    </section>
  );
}


function OrderDetailPage() {
  const {
    orderNumber,
  } = useParams();

  const [
    order,
    setOrder,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isCancelling,
    setIsCancelling,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadOrder() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const orderData =
          await fetchOrder(orderNumber);

        if (isActive) {
          setOrder(orderData);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load order details.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      isActive = false;
    };
  }, [orderNumber]);

  const canCancelOrder = useMemo(
    () =>
      ["PENDING", "CONFIRMED"].includes(
        order?.status,
      ),
    [order?.status],
  );

  const isDelivered =
    order?.status === "DELIVERED";

  const showShipmentTracking = [
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
  ].includes(order?.status);

  const isBankTransfer =
    order?.payment_method
    === "BANK_TRANSFER";

  const bankTransferPending =
    isBankTransfer
    && order?.payment_status !== "PAID"
    && order?.status !== "CANCELLED";

  const recipientName =
    getAddressValue(
      order,
      "recipient_name",
      "shipping_recipient_name",
    );

  const phoneNumber =
    getAddressValue(
      order,
      "phone_number",
      "recipient_phone",
      "shipping_phone_number",
    );

  const addressLineOne =
    getAddressValue(
      order,
      "address_line_1",
      "shipping_address_line_1",
    );

  const addressLineTwo =
    getAddressValue(
      order,
      "address_line_2",
      "shipping_address_line_2",
    );

  const city =
    getAddressValue(
      order,
      "city",
      "shipping_city",
    );

  const province =
    getAddressValue(
      order,
      "province",
      "shipping_province",
    );

  const postalCode =
    getAddressValue(
      order,
      "postal_code",
      "shipping_postal_code",
    );

  const country =
    getAddressValue(
      order,
      "country",
      "shipping_country",
    );

  const handleCancelOrder = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?",
    );

    if (!confirmed) {
      return;
    }

    setIsCancelling(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result =
        await cancelOrder(
          order.order_number,
        );

      const updatedOrder =
        result?.order
        ?? result;

      setOrder(updatedOrder);

      setSuccessMessage(
        result?.message
        ?? "Order cancelled successfully.",
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to cancel this order.",
        ),
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <section className="route-loading">
        <div className="loading-spinner" />

        <p>Loading order details...</p>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="order-detail-page">
        <div className="container order-detail-empty">
          <FiAlertCircle />

          <h1>Order Unavailable</h1>

          <p>
            {errorMessage
              || (
                "The requested order could "
                + "not be found."
              )}
          </p>

          <Link
            to="/orders"
            className="primary-button"
          >
            <FiArrowLeft />
            Back to My Orders
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="order-detail-page">
      <div className="order-detail-header">
        <div className="container">
          <Link
            to="/orders"
            className="order-detail-back"
          >
            <FiArrowLeft />
            Back to My Orders
          </Link>

          <div className="order-detail-header-content">
            <div>
              <span className="section-label">
                Order details
              </span>

              <h1>
                {order.order_number}
              </h1>

              <p>
                Placed on
                {" "}
                {formatOrderDate(
                  order.created_at,
                )}
              </p>
            </div>

            <span
              className={
                "order-status-badge "
                + getOrderStatusClass(
                  order.status,
                )
              }
            >
              {formatOrderStatus(
                order.status,
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="container order-detail-content">
        {successMessage && (
          <div className="store-message success">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="store-message error">
            {errorMessage}
          </div>
        )}

        <OrderStatusProgress
          status={order.status}
        />

        <div className="order-detail-layout">
          <main className="order-detail-main">
            <section className="order-detail-card">
              <div className="order-detail-card-heading">
                <FiPackage />

                <div>
                  <span>
                    Purchased products
                  </span>

                  <h2>Order Items</h2>
                </div>

                <strong>
                  {order.items?.length ?? 0}
                  {" "}
                  {(order.items?.length ?? 0)
                    === 1
                    ? "Item"
                    : "Items"}
                </strong>
              </div>

              <div className="order-detail-items">
                {order.items?.map(
                  (item) => {
                    const productId =
                      getProductId(item);

                    const productName =
                      getProductName(item);

                    const productSku =
                      getProductSku(item);

                    const variantText =
                      getVariantText(item);

                    const quantity =
                      Number(
                        item.quantity ?? 1,
                      );

                    const unitPrice =
                      item.unit_price
                      ?? item.price
                      ?? 0;

                    const lineTotal =
                      item.line_total
                      ?? item.total_price
                      ?? (
                        Number(unitPrice)
                        * quantity
                      );

                    return (
                      <article
                        key={
                          item.id
                          ?? `${productId}-${variantText}`
                        }
                        className="order-detail-item"
                      >
                        <Link
                          to={
                            productId
                              ? `/products/${productId}`
                              : "/products"
                          }
                          className="order-detail-item-image"
                        >
                          <img
                            src={getItemImage(item)}
                            alt={productName}
                            onError={(event) => {
                              event.currentTarget.src =
                                "/product-placeholder.svg";
                            }}
                          />
                        </Link>

                        <div className="order-detail-item-info">
                          <Link
                            to={
                              productId
                                ? `/products/${productId}`
                                : "/products"
                            }
                          >
                            {productName}
                          </Link>

                          {productSku && (
                            <span>
                              SKU: {productSku}
                            </span>
                          )}

                          {variantText && (
                            <span>
                              {variantText}
                            </span>
                          )}

                          <div className="order-detail-item-meta">
                            <span>
                              Quantity:
                              {" "}
                              <strong>
                                {quantity}
                              </strong>
                            </span>

                            <span>
                              Unit Price:
                              {" "}
                              <strong>
                                {formatCurrency(
                                  unitPrice,
                                )}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="order-detail-item-total">
                          <span>Item Total</span>

                          <strong>
                            {formatCurrency(
                              lineTotal,
                            )}
                          </strong>

                          {isDelivered
                            && productId && (
                              <Link
                                to={
                                  `/reviews/write/${
                                    order.order_number
                                  }/${productId}`
                                }
                                className="order-review-button"
                              >
                                <FiStar />
                                Write Review
                              </Link>
                            )}
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            </section>

            {showShipmentTracking && (
              <ShipmentTracking
                orderNumber={
                  order.order_number
                }
              />
            )}

            <section className="order-detail-card">
              <div className="order-detail-card-heading">
                <FiMapPin />

                <div>
                  <span>
                    Delivery information
                  </span>

                  <h2>Shipping Address</h2>
                </div>
              </div>

              <div className="order-address-content">
                <div className="order-address-icon">
                  <FiMapPin />
                </div>

                <div>
                  <strong>
                    {recipientName
                      || "Customer"}
                  </strong>

                  {phoneNumber && (
                    <span>
                      {phoneNumber}
                    </span>
                  )}

                  <p>
                    {[
                      addressLineOne,
                      addressLineTwo,
                      city,
                      province,
                      postalCode,
                      country,
                    ]
                      .filter(Boolean)
                      .join(", ")
                      || (
                        "Shipping address "
                        + "unavailable."
                      )}
                  </p>
                </div>
              </div>
            </section>

            {order.notes && (
              <section className="order-detail-card">
                <div className="order-detail-card-heading">
                  <FiFileText />

                  <div>
                    <span>
                      Customer instructions
                    </span>

                    <h2>Order Notes</h2>
                  </div>
                </div>

                <p className="order-notes">
                  {order.notes}
                </p>
              </section>
            )}
          </main>

          <aside className="order-detail-sidebar">
            <section className="order-detail-card">
              <div className="order-detail-card-heading">
                <FiCreditCard />

                <div>
                  <span>
                    Payment information
                  </span>

                  <h2>Payment Summary</h2>
                </div>
              </div>

              <div className="order-payment-information">
                <div>
                  <span>Payment Method</span>

                  <strong>
                    {formatPaymentMethod(
                      order.payment_method,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Payment Status</span>

                  <strong
                    className={
                      order.payment_status
                        ?.toLowerCase()
                    }
                  >
                    {formatOrderStatus(
                      order.payment_status,
                    )}
                  </strong>
                </div>
              </div>

              {bankTransferPending && (
                <div className="bank-transfer-notice">
                  <FiCreditCard />

                  <div>
                    <strong>
                      Bank Transfer Required
                    </strong>

                    <p>
                      Submit your transaction
                      reference and payment proof
                      for verification.
                    </p>

                    <Link
                      to={
                        `/payments/${
                          order.order_number
                        }`
                      }
                    >
                      Submit Payment Proof
                    </Link>
                  </div>
                </div>
              )}
            </section>

            <section className="order-detail-card">
              <div className="order-detail-card-heading">
                <FiFileText />

                <div>
                  <span>Order total</span>
                  <h2>Price Summary</h2>
                </div>
              </div>

              <div className="order-price-summary">
                <div>
                  <span>Subtotal</span>

                  <strong>
                    {formatCurrency(
                      order.subtotal,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Shipping Fee</span>

                  <strong>
                    {formatCurrency(
                      order.shipping_fee,
                    )}
                  </strong>
                </div>

                {Number(
                  order.discount_amount ?? 0,
                ) > 0 && (
                  <div className="discount">
                    <span>Discount</span>

                    <strong>
                      -
                      {formatCurrency(
                        order.discount_amount,
                      )}
                    </strong>
                  </div>
                )}

                {order.coupon_code && (
                  <div>
                    <span>Coupon</span>

                    <strong>
                      {order.coupon_code}
                    </strong>
                  </div>
                )}

                <div className="order-price-total">
                  <span>Total Amount</span>

                  <strong>
                    {formatCurrency(
                      order.total_amount,
                    )}
                  </strong>
                </div>
              </div>
            </section>

            <section className="order-detail-card">
              <div className="order-detail-card-heading">
                <FiTruck />

                <div>
                  <span>
                    Delivery method
                  </span>

                  <h2>Shipping Details</h2>
                </div>
              </div>

              <div className="order-shipping-information">
                <div>
                  <span>Shipping Method</span>

                  <strong>
                    {order.shipping_method_name
                      || order.shipping_method_code
                      || "Standard Delivery"}
                  </strong>
                </div>

                {order
                  .estimated_delivery_date && (
                  <div>
                    <span>
                      Estimated Delivery
                    </span>

                    <strong>
                      {formatOrderDate(
                        order
                          .estimated_delivery_date,
                      )}
                    </strong>
                  </div>
                )}

                {order
                  .estimated_minimum_days
                  || order
                    .estimated_maximum_days ? (
                  <div>
                    <span>Delivery Time</span>

                    <strong>
                      {order
                        .estimated_minimum_days
                        ?? 0}
                      {" - "}
                      {order
                        .estimated_maximum_days
                        ?? 0}
                      {" days"}
                    </strong>
                  </div>
                ) : null}
              </div>
            </section>

            {isDelivered && (
              <section className="order-return-card">
                <FiRotateCcw />

                <h3>Need to Return an Item?</h3>

                <p>
                  Select eligible items and
                  submit a return request for
                  this delivered order.
                </p>

                <Link
                  to={
                    `/returns/create/${
                      order.order_number
                    }`
                  }
                >
                  <FiRotateCcw />
                  Create Return Request
                </Link>
              </section>
            )}

            {canCancelOrder && (
              <section className="order-cancel-card">
                <FiX />

                <h3>Cancel Order</h3>

                <p>
                  Cancellation is available
                  before the order enters the
                  processing stage.
                </p>

                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <>
                      <FiRefreshCcw />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <FiX />
                      Cancel This Order
                    </>
                  )}
                </button>
              </section>
            )}

            <div className="order-detail-help">
              <FiClock />

              <div>
                <strong>
                  Need Help?
                </strong>

                <p>
                  Contact customer support
                  regarding this order.
                </p>

                <Link to="/tickets/create">
                  Create Support Ticket
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}


export default OrderDetailPage;