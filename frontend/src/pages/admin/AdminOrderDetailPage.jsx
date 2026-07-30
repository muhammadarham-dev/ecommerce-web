import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiUser,
} from "react-icons/fi";

import {
  Link,
  useParams,
} from "react-router-dom";

import OrderItemsTable from
  "../../components/admin/orders/OrderItemsTable";

import OrderStatusManager from
  "../../components/admin/orders/OrderStatusManager";

import OrderTimeline from
  "../../components/admin/orders/OrderTimeline";

import PaymentVerificationPanel from
  "../../components/admin/orders/PaymentVerificationPanel";

import useStoreSettings from
  "../../hooks/useStoreSettings";

import {
  fetchAdminOrder,
  fetchOrderPayment,
  refundAdminPayment,
  rejectAdminPayment,
  updateAdminOrderStatus,
  verifyAdminPayment,
} from "../../services/adminOrderService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";


function normalizeLabel(value) {
  return String(value ?? "Unknown")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}


function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}


function AdminOrderDetailPage() {
  const {
    orderNumber,
  } = useParams();

  const {
    formatMoney,
  } = useStoreSettings();

  const [
    order,
    setOrder,
  ] = useState(null);

  const [
    payment,
    setPayment,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isUpdatingOrder,
    setIsUpdatingOrder,
  ] = useState(false);

  const [
    isUpdatingPayment,
    setIsUpdatingPayment,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    noticeMessage,
    setNoticeMessage,
  ] = useState("");

  const money = useMemo(
    () =>
      typeof formatMoney === "function"
        ? formatMoney
        : (value) =>
          new Intl.NumberFormat(
            "en-US",
            {
              style: "currency",
              currency: "USD",
            },
          ).format(
            Number(value || 0),
          ),
    [formatMoney],
  );

  const loadOrder = useCallback(
    async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [
          orderData,
          paymentData,
        ] = await Promise.all([
          fetchAdminOrder(orderNumber),
          fetchOrderPayment(orderNumber)
            .catch(() => null),
        ]);

        setOrder(orderData);
        setPayment(paymentData);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load this order.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [orderNumber],
  );

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const refreshOrderAndPayment =
    useCallback(
      async () => {
        const [
          orderData,
          paymentData,
        ] = await Promise.all([
          fetchAdminOrder(orderNumber),
          fetchOrderPayment(orderNumber)
            .catch(() => null),
        ]);

        setOrder(orderData);
        setPayment(paymentData);
      },
      [orderNumber],
    );

  const handleOrderUpdate =
    async (payload) => {
      setIsUpdatingOrder(true);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        const result =
          await updateAdminOrderStatus(
            orderNumber,
            payload,
          );

        setOrder(result.order);
        setNoticeMessage(
          result.message
          || "Order updated successfully.",
        );

        const updatedPayment =
          await fetchOrderPayment(
            orderNumber,
          ).catch(() => null);

        setPayment(updatedPayment);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to update the order.",
          ),
        );
      } finally {
        setIsUpdatingOrder(false);
      }
    };

  const handleVerifyPayment =
    async () => {
      if (!payment?.payment_number) {
        return;
      }

      setIsUpdatingPayment(true);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        const result =
          await verifyAdminPayment(
            payment.payment_number,
          );

        setPayment(result.payment);
        await refreshOrderAndPayment();

        setNoticeMessage(
          result.message
          || "Payment verified successfully.",
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to verify this payment.",
          ),
        );
      } finally {
        setIsUpdatingPayment(false);
      }
    };

  const handleRejectPayment =
    async (reason) => {
      if (!payment?.payment_number) {
        return;
      }

      setIsUpdatingPayment(true);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        const result =
          await rejectAdminPayment(
            payment.payment_number,
            reason,
          );

        setPayment(result.payment);
        await refreshOrderAndPayment();

        setNoticeMessage(
          result.message
          || "Payment rejected successfully.",
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to reject this payment.",
          ),
        );
      } finally {
        setIsUpdatingPayment(false);
      }
    };

  const handleRefundPayment =
    async () => {
      if (!payment?.payment_number) {
        return;
      }

      const confirmed =
        window.confirm(
          "Mark this payment as refunded?",
        );

      if (!confirmed) {
        return;
      }

      setIsUpdatingPayment(true);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        const result =
          await refundAdminPayment(
            payment.payment_number,
          );

        setPayment(result.payment);
        await refreshOrderAndPayment();

        setNoticeMessage(
          result.message
          || "Payment refunded successfully.",
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to refund this payment.",
          ),
        );
      } finally {
        setIsUpdatingPayment(false);
      }
    };

  if (isLoading) {
    return (
      <div className="admin-orders-state">
        <div className="admin-loading-spinner" />
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <section className="admin-orders-page">
        <div className="admin-form-message admin-form-message--error">
          {errorMessage
            || "Order not found."}
        </div>
      </section>
    );
  }

  return (
    <section className="admin-order-detail-page">
      <div className="admin-order-detail-page__heading">
        <div>
          <Link
            to="/admin/orders"
            className="admin-order-back-link"
          >
            <FiArrowLeft />
            Back to Orders
          </Link>

          <span className="admin-orders-eyebrow">
            Order details
          </span>

          <h1>{order.order_number}</h1>

          <p>
            Created {formatDate(order.created_at)}
          </p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={loadOrder}
          disabled={isLoading}
        >
          <FiRefreshCw />
          Refresh
        </button>
      </div>

      {noticeMessage && (
        <div className="admin-form-message admin-form-message--success">
          {noticeMessage}
        </div>
      )}

      {errorMessage && (
        <div className="admin-form-message admin-form-message--error">
          {errorMessage}
        </div>
      )}

      <div className="admin-order-detail-summary">
        <div>
          <small>Order status</small>

          <span
            className={
              `admin-status-badge admin-status-badge--${
                String(
                  order.status,
                ).toLowerCase()
              }`
            }
          >
            {normalizeLabel(order.status)}
          </span>
        </div>

        <div>
          <small>Payment status</small>

          <span
            className={
              `admin-payment-badge admin-payment-badge--${
                String(
                  order.payment_status,
                ).toLowerCase()
              }`
            }
          >
            {normalizeLabel(
              order.payment_status,
            )}
          </span>
        </div>

        <div>
          <small>Payment method</small>
          <strong>
            {normalizeLabel(
              order.payment_method,
            )}
          </strong>
        </div>

        <div>
          <small>Order total</small>
          <strong>
            {money(order.total_amount)}
          </strong>
        </div>
      </div>

      <div className="admin-order-detail-grid">
        <div className="admin-order-detail-main">
          <OrderItemsTable
            items={order.items ?? []}
            formatMoney={money}
          />

          <section className="admin-order-card">
            <div className="admin-order-card__heading">
              <div>
                <span>Order calculation</span>
                <h2>Payment summary</h2>
              </div>
            </div>

            <div className="admin-order-totals">
              <div>
                <span>Subtotal</span>
                <strong>
                  {money(order.subtotal)}
                </strong>
              </div>

              <div>
                <span>Shipping fee</span>
                <strong>
                  {money(order.shipping_fee)}
                </strong>
              </div>

              <div>
                <span>Discount</span>
                <strong>
                  -{money(
                    order.discount_amount,
                  )}
                </strong>
              </div>

              {order.coupon_code && (
                <div>
                  <span>Coupon</span>
                  <strong>
                    {order.coupon_code}
                  </strong>
                </div>
              )}

              <div className="admin-order-totals__grand">
                <span>Total</span>
                <strong>
                  {money(order.total_amount)}
                </strong>
              </div>
            </div>
          </section>

          <PaymentVerificationPanel
            payment={payment}
            formatMoney={money}
            isBusy={isUpdatingPayment}
            onVerify={
              handleVerifyPayment
            }
            onReject={
              handleRejectPayment
            }
            onRefund={
              handleRefundPayment
            }
          />
        </div>

        <aside className="admin-order-detail-sidebar">
          <OrderStatusManager
            order={order}
            isSubmitting={
              isUpdatingOrder
            }
            onSubmit={
              handleOrderUpdate
            }
          />

          <OrderTimeline
            order={order}
          />

          <section className="admin-order-card">
            <div className="admin-order-card__heading">
              <div>
                <span>Customer</span>
                <h2>Customer details</h2>
              </div>

              <FiUser />
            </div>

            <div className="admin-order-info-list">
              <div>
                <small>Name</small>
                <strong>
                  {order.customer?.full_name
                    || order.customer?.username
                    || "Customer"}
                </strong>
              </div>

              <div>
                <small>Email</small>
                <strong>
                  {order.customer?.email
                    || "Not available"}
                </strong>
              </div>

              <div>
                <small>Recipient</small>
                <strong>
                  {order.recipient_name}
                </strong>
              </div>

              <div>
                <small>Phone</small>
                <strong>
                  <FiPhone />
                  {order.recipient_phone}
                </strong>
              </div>
            </div>
          </section>

          <section className="admin-order-card">
            <div className="admin-order-card__heading">
              <div>
                <span>Delivery</span>
                <h2>Shipping address</h2>
              </div>

              <FiMapPin />
            </div>

            <address className="admin-order-address">
              <strong>
                {order.recipient_name}
              </strong>

              <span>
                {order.address_line_1}
              </span>

              {order.address_line_2 && (
                <span>
                  {order.address_line_2}
                </span>
              )}

              <span>
                {order.city}, {order.province}
              </span>

              <span>
                {order.postal_code
                  ? `${order.postal_code}, `
                  : ""}
                {order.country}
              </span>
            </address>

            <div className="admin-order-shipping-details">
              <div>
                <small>Shipping method</small>
                <strong>
                  {order.shipping_method_name
                    || "Not available"}
                </strong>
              </div>

              <div>
                <small>Shipping zone</small>
                <strong>
                  {order.shipping_zone_name
                    || "Not available"}
                </strong>
              </div>

              <div>
                <small>Estimated delivery</small>
                <strong>
                  {order.estimated_delivery_start
                    || "Not available"}
                  {order.estimated_delivery_end
                    ? (
                      ` – ${
                        order.estimated_delivery_end
                      }`
                    )
                    : ""}
                </strong>
              </div>
            </div>
          </section>

          {order.notes && (
            <section className="admin-order-card">
              <div className="admin-order-card__heading">
                <div>
                  <span>Customer message</span>
                  <h2>Order notes</h2>
                </div>
              </div>

              <p className="admin-order-notes">
                {order.notes}
              </p>
            </section>
          )}
        </aside>
      </div>
    </section>
  );
}


export default AdminOrderDetailPage;