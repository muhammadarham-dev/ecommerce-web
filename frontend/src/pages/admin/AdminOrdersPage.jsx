import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiDollarSign,
  FiFilter,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
} from "react-icons/fi";

import AdminOrderTable from
  "../../components/admin/orders/AdminOrderTable";

import DashboardStatCard from
  "../../components/admin/DashboardStatCard";

import useStoreSettings from
  "../../hooks/useStoreSettings";

import {
  fetchAdminOrderDashboard,
  fetchAdminOrders,
} from "../../services/adminOrderService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";


const initialFilters = {
  search: "",
  status: "",
  paymentMethod: "",
  paymentStatus: "",
  createdFrom: "",
  createdTo: "",
  city: "",
  province: "",
  ordering: "-created_at",
};


function AdminOrdersPage() {
  const {
    formatMoney,
  } = useStoreSettings();

  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    filters,
    setFilters,
  ] = useState(initialFilters);

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState(initialFilters);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
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

  const loadOrders = useCallback(
    async ({
      showRefreshState = false,
    } = {}) => {
      if (showRefreshState) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage("");

      const params = {
        ordering:
          appliedFilters.ordering,
      };

      if (appliedFilters.search.trim()) {
        params.search =
          appliedFilters.search.trim();
      }

      if (appliedFilters.status) {
        params.status =
          appliedFilters.status;
      }

      if (
        appliedFilters.paymentMethod
      ) {
        params.payment_method =
          appliedFilters.paymentMethod;
      }

      if (
        appliedFilters.paymentStatus
      ) {
        params.payment_status =
          appliedFilters.paymentStatus;
      }

      if (
        appliedFilters.createdFrom
      ) {
        params.created_from =
          appliedFilters.createdFrom;
      }

      if (appliedFilters.createdTo) {
        params.created_to =
          appliedFilters.createdTo;
      }

      if (appliedFilters.city.trim()) {
        params.city =
          appliedFilters.city.trim();
      }

      if (
        appliedFilters.province.trim()
      ) {
        params.province =
          appliedFilters.province.trim();
      }

      try {
        const [
          orderData,
          dashboardData,
        ] = await Promise.all([
          fetchAdminOrders(params),
          fetchAdminOrderDashboard(),
        ]);

        setOrders(orderData);
        setDashboard(dashboardData);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load order management data.",
          ),
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [appliedFilters],
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleFilterSubmit = (
    event,
  ) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const summary =
    dashboard?.summary ?? {};

  return (
    <section className="admin-orders-page">
      <div className="admin-orders-page__heading">
        <div>
          <span className="admin-orders-eyebrow">
            Order operations
          </span>

          <h1>Orders</h1>

          <p>
            Review customer orders, payment
            status, delivery details and order
            progress.
          </p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={() =>
            loadOrders({
              showRefreshState: true,
            })
          }
          disabled={isRefreshing}
        >
          <FiRefreshCw />
          {isRefreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {errorMessage && (
        <div className="admin-form-message admin-form-message--error">
          {errorMessage}
        </div>
      )}

      <div className="admin-orders-summary-grid">
        <DashboardStatCard
          icon={FiShoppingBag}
          label="Total Orders"
          value={Number(
            summary.total_orders || 0,
          ).toLocaleString("en-US")}
          helper={`${Number(
            summary.today_orders || 0,
          ).toLocaleString("en-US")} today`}
        />

        <DashboardStatCard
          icon={FiPackage}
          label="Pending Orders"
          value={Number(
            summary.pending_orders || 0,
          ).toLocaleString("en-US")}
          helper={`${Number(
            summary.processing_orders || 0,
          ).toLocaleString("en-US")} processing`}
          tone="warning"
        />

        <DashboardStatCard
          icon={FiDollarSign}
          label="Paid Revenue"
          value={money(
            summary.paid_revenue || 0,
          )}
          helper={`${Number(
            summary.paid_orders || 0,
          ).toLocaleString("en-US")} paid orders`}
          tone="success"
        />

        <DashboardStatCard
          icon={FiFilter}
          label="Pending Payments"
          value={Number(
            summary.pending_payments || 0,
          ).toLocaleString("en-US")}
          helper={`${Number(
            summary.cancelled_orders || 0,
          ).toLocaleString("en-US")} cancelled`}
          tone="muted"
        />
      </div>

      <form
        className="admin-order-filters"
        onSubmit={handleFilterSubmit}
      >
        <label className="admin-order-search">
          <FiSearch />

          <input
            type="search"
            value={filters.search}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  search:
                    event.target.value,
                }),
              )
            }
            placeholder={
              "Search order, customer, product, SKU or city"
            }
          />
        </label>

        <select
          value={filters.status}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                status:
                  event.target.value,
              }),
            )
          }
        >
          <option value="">
            All order statuses
          </option>
          <option value="PENDING">
            Pending
          </option>
          <option value="CONFIRMED">
            Confirmed
          </option>
          <option value="PROCESSING">
            Processing
          </option>
          <option value="SHIPPED">
            Shipped
          </option>
          <option value="DELIVERED">
            Delivered
          </option>
          <option value="CANCELLED">
            Cancelled
          </option>
        </select>

        <select
          value={
            filters.paymentStatus
          }
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                paymentStatus:
                  event.target.value,
              }),
            )
          }
        >
          <option value="">
            All payment statuses
          </option>
          <option value="PENDING">
            Pending
          </option>
          <option value="PAID">
            Paid
          </option>
          <option value="FAILED">
            Failed
          </option>
          <option value="REFUNDED">
            Refunded
          </option>
        </select>

        <select
          value={
            filters.paymentMethod
          }
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                paymentMethod:
                  event.target.value,
              }),
            )
          }
        >
          <option value="">
            All payment methods
          </option>
          <option value="CASH_ON_DELIVERY">
            Cash on Delivery
          </option>
          <option value="BANK_TRANSFER">
            Bank Transfer
          </option>
        </select>

        <input
          type="text"
          value={filters.city}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                city:
                  event.target.value,
              }),
            )
          }
          placeholder="City"
        />

        <input
          type="text"
          value={filters.province}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                province:
                  event.target.value,
              }),
            )
          }
          placeholder="Province"
        />

        <label className="admin-order-date-filter">
          <span>From</span>

          <input
            type="date"
            value={filters.createdFrom}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  createdFrom:
                    event.target.value,
                }),
              )
            }
          />
        </label>

        <label className="admin-order-date-filter">
          <span>To</span>

          <input
            type="date"
            value={filters.createdTo}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  createdTo:
                    event.target.value,
                }),
              )
            }
          />
        </label>

        <select
          value={filters.ordering}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                ordering:
                  event.target.value,
              }),
            )
          }
        >
          <option value="-created_at">
            Newest first
          </option>
          <option value="created_at">
            Oldest first
          </option>
          <option value="-total_amount">
            Highest total
          </option>
          <option value="total_amount">
            Lowest total
          </option>
          <option value="status">
            Status
          </option>
        </select>

        <div className="admin-order-filter-actions">
          <button
            type="submit"
            className="admin-primary-button"
          >
            <FiFilter />
            Apply Filters
          </button>

          <button
            type="button"
            className="admin-secondary-button"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </form>

      <AdminOrderTable
        orders={orders}
        formatMoney={money}
        isLoading={isLoading}
      />
    </section>
  );
}


export default AdminOrdersPage;