import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiAlertTriangle,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiPackage,
  FiShoppingBag,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";

import DashboardStatCard from
  "../../components/admin/DashboardStatCard";

import useStoreSettings from
  "../../hooks/useStoreSettings";

import {
  fetchAdminDashboard,
} from "../../services/adminDashboardService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";


function normalizeStatusLabel(status) {
  return String(status || "Unknown")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}


function AdminDashboardPage() {
  const {
    formatMoney,
  } = useStoreSettings();

  const [
    dashboard,
    setDashboard,
  ] = useState(null);

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

  const loadDashboard = useCallback(
    async ({ showRefreshState = false } = {}) => {
      if (showRefreshState) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage("");

      try {
        const data = await fetchAdminDashboard();
        setDashboard(data);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load the administration dashboard.",
          ),
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const summary = dashboard?.summary || {};

  const revenueRows = Array.isArray(
    dashboard?.last_30_days_revenue,
  )
    ? dashboard.last_30_days_revenue
    : [];

  const statusRows = Array.isArray(
    dashboard?.orders_by_status,
  )
    ? dashboard.orders_by_status
    : [];

  const largestRevenue = useMemo(
    () => Math.max(
      ...revenueRows.map((item) =>
        Number(item.revenue || 0),
      ),
      1,
    ),
    [revenueRows],
  );

  const totalCatalogItems =
    Number(summary.simple_products || 0)
    + Number(summary.active_variants || 0);

  const lowStockItems =
    Number(summary.low_stock_products || 0)
    + Number(summary.low_stock_variants || 0);

  const outOfStockItems =
    Number(summary.out_of_stock_products || 0)
    + Number(summary.out_of_stock_variants || 0);

  const money = (value) => {
    if (typeof formatMoney === "function") {
      return formatMoney(value);
    }

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
      },
    ).format(Number(value || 0));
  };

  if (isLoading) {
    return (
      <div className="admin-dashboard-state">
        <div className="admin-loading-spinner" />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__toolbar">
        <div>
          <span className="admin-dashboard__eyebrow">
            Store overview
          </span>

          <h2>Business performance</h2>

          <p>
            Live totals are calculated from orders,
            customers, products, variants and inventory.
          </p>
        </div>

        <button
          type="button"
          className="admin-dashboard__refresh-button"
          onClick={() =>
            loadDashboard({
              showRefreshState: true,
            })
          }
          disabled={isRefreshing}
        >
          <FiTrendingUp />
          {isRefreshing ? "Refreshing..." : "Refresh data"}
        </button>
      </div>

      {errorMessage && (
        <div className="admin-dashboard__error">
          <FiAlertTriangle />
          <span>{errorMessage}</span>
        </div>
      )}

      <section className="admin-stat-grid">
        <DashboardStatCard
          icon={FiDollarSign}
          label="Total Revenue"
          value={money(summary.total_revenue)}
          helper={`${money(summary.today_revenue)} earned today`}
          tone="accent"
        />

        <DashboardStatCard
          icon={FiShoppingBag}
          label="Total Orders"
          value={Number(summary.total_orders || 0).toLocaleString("en-US")}
          helper={`${Number(summary.today_orders || 0).toLocaleString("en-US")} orders today`}
        />

        <DashboardStatCard
          icon={FiCheckCircle}
          label="Paid Orders"
          value={Number(summary.paid_orders || 0).toLocaleString("en-US")}
          helper="Completed payment records"
          tone="success"
        />

        <DashboardStatCard
          icon={FiUsers}
          label="Customers"
          value={Number(summary.total_customers || 0).toLocaleString("en-US")}
          helper="Registered customer accounts"
        />

        <DashboardStatCard
          icon={FiPackage}
          label="Catalog Items"
          value={totalCatalogItems.toLocaleString("en-US")}
          helper={`${Number(summary.simple_products || 0)} products · ${Number(summary.active_variants || 0)} variants`}
        />

        <DashboardStatCard
          icon={FiClock}
          label="Cancelled Orders"
          value={Number(summary.cancelled_orders || 0).toLocaleString("en-US")}
          helper="Orders marked as cancelled"
          tone="muted"
        />

        <DashboardStatCard
          icon={FiAlertTriangle}
          label="Low Stock"
          value={lowStockItems.toLocaleString("en-US")}
          helper={`Threshold: ${Number(summary.low_stock_threshold || 0)} units`}
          tone="warning"
        />

        <DashboardStatCard
          icon={FiBox}
          label="Out of Stock"
          value={outOfStockItems.toLocaleString("en-US")}
          helper="Products and variants unavailable"
          tone="danger"
        />
      </section>

      <section className="admin-dashboard__content-grid">
        <article className="admin-panel admin-panel--wide">
          <div className="admin-panel__header">
            <div>
              <span>Revenue analytics</span>
              <h3>Last 30 days</h3>
            </div>

            <FiTrendingUp />
          </div>

          {revenueRows.length === 0 ? (
            <div className="admin-panel__empty">
              <FiDollarSign />
              <h4>No paid sales recorded</h4>
              <p>
                Revenue data will appear after paid orders
                are available.
              </p>
            </div>
          ) : (
            <div className="admin-revenue-chart">
              <div className="admin-revenue-chart__bars">
                {revenueRows.map((item) => {
                  const revenue = Number(item.revenue || 0);
                  const percentage = Math.max(
                    (revenue / largestRevenue) * 100,
                    revenue > 0 ? 5 : 1,
                  );

                  return (
                    <div
                      key={item.date}
                      className="admin-revenue-chart__column"
                      title={`${item.date}: ${money(item.revenue)}`}
                    >
                      <span className="admin-revenue-chart__tooltip">
                        <strong>{money(item.revenue)}</strong>
                        <small>{item.orders} orders</small>
                      </span>

                      <span
                        className="admin-revenue-chart__bar"
                        style={{
                          height: `${percentage}%`,
                        }}
                      />

                      <small>
                        {new Date(`${item.date}T00:00:00`).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </small>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </article>

        <article className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <span>Order operations</span>
              <h3>Status breakdown</h3>
            </div>

            <FiShoppingBag />
          </div>

          {statusRows.length === 0 ? (
            <div className="admin-panel__empty admin-panel__empty--compact">
              <FiShoppingBag />
              <h4>No orders available</h4>
            </div>
          ) : (
            <div className="admin-status-list">
              {statusRows.map((item) => {
                const totalOrders = Number(summary.total_orders || 0);
                const width = totalOrders > 0
                  ? (Number(item.count || 0) / totalOrders) * 100
                  : 0;

                return (
                  <div
                    key={item.status}
                    className="admin-status-list__item"
                  >
                    <div>
                      <span>{normalizeStatusLabel(item.status)}</span>
                      <strong>{item.count}</strong>
                    </div>

                    <div className="admin-status-list__track">
                      <span
                        style={{
                          width: `${Math.max(width, 2)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="admin-dashboard__inventory-grid">
        <article className="admin-inventory-card">
          <span className="admin-inventory-card__icon admin-inventory-card__icon--warning">
            <FiAlertTriangle />
          </span>

          <div>
            <span>Inventory attention</span>
            <strong>{lowStockItems} low-stock items</strong>
            <p>
              Restock products and variants before they
              become unavailable.
            </p>
          </div>
        </article>

        <article className="admin-inventory-card">
          <span className="admin-inventory-card__icon admin-inventory-card__icon--danger">
            <FiBox />
          </span>

          <div>
            <span>Unavailable inventory</span>
            <strong>{outOfStockItems} out-of-stock items</strong>
            <p>
              These catalog entries cannot currently be
              purchased by customers.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}


export default AdminDashboardPage;