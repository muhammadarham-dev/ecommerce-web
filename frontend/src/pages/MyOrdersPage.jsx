import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiArrowRight,
  FiCreditCard,
  FiPackage,
  FiSearch,
  FiShoppingBag,
  FiTruck,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import {
  fetchOrders,
} from "../services/orderService";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  formatCurrency,
} from "../utils/currency";

import {
  formatOrderDate,
  formatOrderStatus,
  formatPaymentMethod,
  getOrderStatusClass,
} from "../utils/order";


const statusOptions = [
  {
    value: "",
    label: "All Orders",
  },
  {
    value: "PENDING",
    label: "Pending",
  },
  {
    value: "CONFIRMED",
    label: "Confirmed",
  },
  {
    value: "PROCESSING",
    label: "Processing",
  },
  {
    value: "SHIPPED",
    label: "Shipped",
  },
  {
    value: "DELIVERED",
    label: "Delivered",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
];


function MyOrdersPage() {
  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    ordering,
    setOrdering,
  ] = useState("-created_at");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => {
        setSearchTerm(
          searchInput.trim(),
        );
      },
      400,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  useEffect(() => {
    let isActive = true;

    async function loadOrders() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const params = {
          ordering,
        };

        if (searchTerm) {
          params.search = searchTerm;
        }

        const orderData =
          await fetchOrders(params);

        if (isActive) {
          setOrders(orderData);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load your orders.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isActive = false;
    };
  }, [
    ordering,
    searchTerm,
  ]);

  const filteredOrders = useMemo(
    () => {
      if (!statusFilter) {
        return orders;
      }

      return orders.filter(
        (order) =>
          order.status === statusFilter,
      );
    },
    [
      orders,
      statusFilter,
    ],
  );

  return (
    <section className="orders-page">
      <div className="orders-page-header">
        <div className="container">
          <span className="section-label">
            Order history
          </span>

          <h1>My Orders</h1>

          <p>
            Track your purchases, review order
            details and manage eligible orders.
          </p>
        </div>
      </div>

      <div className="container orders-content">
        <div className="orders-toolbar">
          <div className="orders-search">
            <FiSearch />

            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value,
                )
              }
              placeholder={
                "Search by order number "
                + "or product"
              }
              aria-label="Search orders"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value,
              )
            }
            aria-label="Filter by status"
          >
            {statusOptions.map(
              (option) => (
                <option
                  key={
                    option.value
                    || "all"
                  }
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>

          <select
            value={ordering}
            onChange={(event) =>
              setOrdering(
                event.target.value,
              )
            }
            aria-label="Sort orders"
          >
            <option value="-created_at">
              Newest First
            </option>

            <option value="created_at">
              Oldest First
            </option>

            <option value="-total_amount">
              Highest Total
            </option>

            <option value="total_amount">
              Lowest Total
            </option>
          </select>
        </div>

        {errorMessage && (
          <div className="store-message error">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="orders-loading">
            <div className="loading-spinner" />

            <p>Loading your orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty">
            <FiShoppingBag />

            <h2>No Orders Found</h2>

            <p>
              No orders match your current
              search or filter.
            </p>

            <Link
              to="/products"
              className="primary-button"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map(
              (order) => (
                <article
                  key={order.id}
                  className="order-list-card"
                >
                  <div className="order-list-header">
                    <div>
                      <span>Order Number</span>

                      <h2>
                        {order.order_number}
                      </h2>

                      <small>
                        {formatOrderDate(
                          order.created_at,
                        )}
                      </small>
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

                  <div className="order-list-body">
                    <div className="order-products-preview">
                      <FiPackage />

                      <div>
                        <strong>
                          {order.items?.length
                            || 0}
                          {" "}
                          {order.items?.length
                            === 1
                            ? "Item"
                            : "Items"}
                        </strong>

                        <p>
                          {order.items
                            ?.slice(0, 3)
                            .map(
                              (item) =>
                                item.variant_name
                                || item.product_name,
                            )
                            .join(", ")
                            || "Order products"}

                          {order.items?.length
                            > 3
                            ? (
                              ` and ${
                                order.items.length
                                - 3
                              } more`
                            )
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="order-list-information">
                      <div>
                        <FiCreditCard />

                        <span>
                          <small>
                            Payment
                          </small>

                          <strong>
                            {formatPaymentMethod(
                              order.payment_method,
                            )}
                          </strong>
                        </span>
                      </div>

                      <div>
                        <FiTruck />

                        <span>
                          <small>
                            Delivery
                          </small>

                          <strong>
                            {order
                              .shipping_method_name
                              || "Standard Delivery"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="order-list-footer">
                    <div>
                      <span>Total Amount</span>

                      <strong>
                        {formatCurrency(
                          order.total_amount,
                        )}
                      </strong>
                    </div>

                    <div className="order-list-actions">
                      {order.payment_method
                        === "BANK_TRANSFER"
                        && order.payment_status
                          !== "PAID" && (
                          <Link
                            to={
                              `/payments/${
                                order.order_number
                              }`
                            }
                            className="order-payment-link"
                          >
                            Submit Payment
                          </Link>
                        )}

                      <Link
                        to={
                          `/orders/${
                            order.order_number
                          }`
                        }
                        className="order-detail-link"
                      >
                        View Details
                        <FiArrowRight />
                      </Link>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}


export default MyOrdersPage;