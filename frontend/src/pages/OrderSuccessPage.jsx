import {
  useEffect,
  useState,
} from "react";

import {
  FiArrowRight,
  FiCheck,
  FiCreditCard,
  FiHome,
  FiMapPin,
  FiPackage,
  FiShoppingBag,
  FiTruck,
} from "react-icons/fi";

import {
  Link,
  useLocation,
  useParams,
} from "react-router-dom";

import {
  fetchOrder,
} from "../services/orderService";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  formatCurrency,
} from "../utils/currency";


function formatStatus(value) {
  if (!value) {
    return "Unknown";
  }

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}


function formatPaymentMethod(value) {
  if (value === "CASH_ON_DELIVERY") {
    return "Cash on Delivery";
  }

  if (value === "BANK_TRANSFER") {
    return "Bank Transfer";
  }

  return formatStatus(value);
}


function OrderSuccessPage() {
  const {
    orderNumber,
  } = useParams();

  const location = useLocation();

  const [
    order,
    setOrder,
  ] = useState(
    location.state?.order ?? null,
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(
    !location.state?.order,
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const successMessage =
    location.state?.message
    || "Order placed successfully.";

  useEffect(() => {
    if (order) {
      return undefined;
    }

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
              "Unable to load your order details.",
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
  }, [
    order,
    orderNumber,
  ]);

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
      <section className="order-success-page">
        <div className="container order-success-card">
          <div className="order-success-icon">
            <FiPackage />
          </div>

          <span className="section-label">
            Order unavailable
          </span>

          <h1>
            Unable to Load Order
          </h1>

          <p className="order-success-description">
            {errorMessage
              || (
                "The requested order could not "
                + "be found."
              )}
          </p>

          <div className="order-success-actions">
            <Link
              to="/orders"
              className="primary-button"
            >
              View My Orders
            </Link>

            <Link
              to="/products"
              className="secondary-button"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const isBankTransfer =
    order.payment_method
    === "BANK_TRANSFER";

  const deliveryLocation = [
    order.city,
    order.province,
    order.country,
  ]
    .filter(Boolean)
    .join(", ");

  const estimatedDelivery =
    order.estimated_delivery_start
    && order.estimated_delivery_end
      ? (
        `${order.estimated_delivery_start} `
        + `to ${order.estimated_delivery_end}`
      )
      : (
        order.estimated_delivery_min_days
        && order.estimated_delivery_max_days
          ? (
            `${order.estimated_delivery_min_days}`
            + " - "
            + `${order.estimated_delivery_max_days}`
            + " days"
          )
          : "Will be updated soon"
      );

  return (
    <section className="order-success-page">
      <div className="container order-success-card">
        <div className="order-success-icon">
          <FiCheck />
        </div>

        <span className="section-label">
          Order confirmed
        </span>

        <h1>
          Thank You for Your Order
        </h1>

        <p className="order-success-description">
          {successMessage}
          {" "}
          Your order is now available in your
          account for tracking and management.
        </p>

        <div className="order-number-card">
          <span>Order Number</span>

          <strong>
            {order.order_number}
          </strong>
        </div>

        <div className="order-success-information">
          <div>
            <FiPackage />

            <span>
              <small>Order Status</small>

              <strong>
                {formatStatus(order.status)}
              </strong>
            </span>
          </div>

          <div>
            <FiCreditCard />

            <span>
              <small>Payment Method</small>

              <strong>
                {formatPaymentMethod(
                  order.payment_method,
                )}
              </strong>
            </span>
          </div>

          <div>
            <FiCreditCard />

            <span>
              <small>Payment Status</small>

              <strong>
                {formatStatus(
                  order.payment_status,
                )}
              </strong>
            </span>
          </div>

          <div>
            <FiTruck />

            <span>
              <small>Shipping Method</small>

              <strong>
                {order.shipping_method_name
                  || "Standard Delivery"}
              </strong>
            </span>
          </div>

          <div>
            <FiMapPin />

            <span>
              <small>Delivery Location</small>

              <strong>
                {deliveryLocation
                  || "Address saved"}
              </strong>
            </span>
          </div>

          <div>
            <FiTruck />

            <span>
              <small>Estimated Delivery</small>

              <strong>
                {estimatedDelivery}
              </strong>
            </span>
          </div>
        </div>

        <div className="order-success-total">
          <span>Total Amount</span>

          <strong>
            {formatCurrency(
              order.total_amount,
            )}
          </strong>
        </div>

        {isBankTransfer && (
          <div className="bank-transfer-notice">
            <FiCreditCard />

            <div>
              <strong>
                Payment proof required
              </strong>

              <p>
                Complete your bank transfer and
                submit the transaction reference
                with your payment receipt for
                verification.
              </p>

              <Link
                to={
                  `/payments/${order.order_number}`
                }
                className="bank-transfer-action"
              >
                Submit Payment Proof
                <FiArrowRight />
              </Link>
            </div>
          </div>
        )}

        {!isBankTransfer && (
          <div className="bank-transfer-notice">
            <FiTruck />

            <div>
              <strong>
                Cash on Delivery selected
              </strong>

              <p>
                Payment will be collected when
                your order is delivered.
              </p>
            </div>
          </div>
        )}

        <div className="order-success-actions">
          <Link
            to={
              `/orders/${order.order_number}`
            }
            className="primary-button"
          >
            <FiPackage />
            View Order Details
          </Link>

          <Link
            to="/orders"
            className="secondary-button"
          >
            <FiHome />
            My Orders
          </Link>

          <Link
            to="/products"
            className="secondary-button"
          >
            <FiShoppingBag />
            Continue Shopping
          </Link>
        </div>
      </div>
    </section>
  );
}


export default OrderSuccessPage;