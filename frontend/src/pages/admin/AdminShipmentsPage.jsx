import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiFilter,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiTruck,
} from "react-icons/fi";

import AdminShipmentTable from
  "../../components/admin/shipments/AdminShipmentTable";

import ShipmentForm from
  "../../components/admin/shipments/ShipmentForm";

import {
  createAdminShipment,
  fetchAdminShipments,
  fetchEligibleShipmentOrders,
} from "../../services/adminShipmentService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";

const initialFilters = {
  search: "",
  status: "",
  courierName: "",
  orderNumber: "",
  trackingNumber: "",
  createdFrom: "",
  createdTo: "",
  estimatedFrom: "",
  estimatedTo: "",
  ordering: "-created_at",
};

function AdminShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [eligibleOrders, setEligibleOrders] =
    useState([]);
  const [filters, setFilters] =
    useState(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState(initialFilters);
  const [isLoading, setIsLoading] =
    useState(true);
  const [isRefreshing, setIsRefreshing] =
    useState(false);
  const [isLoadingOrders, setIsLoadingOrders] =
    useState(true);
  const [isCreating, setIsCreating] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [noticeMessage, setNoticeMessage] =
    useState("");

  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true);

    try {
      const orders =
        await fetchEligibleShipmentOrders();
      setEligibleOrders(orders);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to load eligible orders.",
        ),
      );
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  const loadShipments = useCallback(
    async ({ showRefreshState = false } = {}) => {
      if (showRefreshState) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage("");

      const params = {
        ordering: appliedFilters.ordering,
      };

      if (appliedFilters.search.trim()) {
        params.search =
          appliedFilters.search.trim();
      }

      if (appliedFilters.status) {
        params.status = appliedFilters.status;
      }

      if (appliedFilters.courierName.trim()) {
        params.courier_name =
          appliedFilters.courierName.trim();
      }

      if (appliedFilters.orderNumber.trim()) {
        params.order_number =
          appliedFilters.orderNumber.trim();
      }

      if (appliedFilters.trackingNumber.trim()) {
        params.tracking_number =
          appliedFilters.trackingNumber.trim();
      }

      if (appliedFilters.createdFrom) {
        params.created_from =
          appliedFilters.createdFrom;
      }

      if (appliedFilters.createdTo) {
        params.created_to =
          appliedFilters.createdTo;
      }

      if (appliedFilters.estimatedFrom) {
        params.estimated_from =
          appliedFilters.estimatedFrom;
      }

      if (appliedFilters.estimatedTo) {
        params.estimated_to =
          appliedFilters.estimatedTo;
      }

      try {
        const result =
          await fetchAdminShipments(params);
        setShipments(result.items);
        setTotalCount(result.count);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load shipments.",
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
    loadShipments();
  }, [loadShipments]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const summary = useMemo(
    () => ({
      ready: shipments.filter(
        (shipment) =>
          shipment.status === "READY",
      ).length,
      moving: shipments.filter(
        (shipment) =>
          [
            "PICKED_UP",
            "IN_TRANSIT",
            "OUT_FOR_DELIVERY",
          ].includes(shipment.status),
      ).length,
      delivered: shipments.filter(
        (shipment) =>
          shipment.status === "DELIVERED",
      ).length,
    }),
    [shipments],
  );

  const handleCreate = async (values) => {
    setIsCreating(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const result =
        await createAdminShipment(values);

      setNoticeMessage(
        result.message
        || "Shipment created successfully.",
      );

      await Promise.all([
        loadShipments({
          showRefreshState: true,
        }),
        loadOrders(),
      ]);

      return true;
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to create this shipment.",
        ),
      );
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const updateFilter = (name, value) => {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  return (
    <section className="admin-shipments-page">
      <div className="admin-shipments-page__heading">
        <div>
          <span className="admin-shipments-eyebrow">
            Order fulfilment
          </span>
          <h1>Shipments</h1>
          <p>
            Create shipments, assign tracking
            details and manage delivery progress.
          </p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={() =>
            Promise.all([
              loadShipments({
                showRefreshState: true,
              }),
              loadOrders(),
            ])
          }
          disabled={isRefreshing}
        >
          <FiRefreshCw />
          {isRefreshing
            ? "Refreshing..."
            : "Refresh"}
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

      <div className="admin-shipments-summary-grid">
        <article className="admin-shipment-stat-card">
          <span><FiPackage /></span>
          <div>
            <small>Total Results</small>
            <strong>{totalCount}</strong>
          </div>
        </article>

        <article className="admin-shipment-stat-card">
          <span><FiPackage /></span>
          <div>
            <small>Visible Ready</small>
            <strong>{summary.ready}</strong>
          </div>
        </article>

        <article className="admin-shipment-stat-card">
          <span><FiTruck /></span>
          <div>
            <small>Visible In Transit</small>
            <strong>{summary.moving}</strong>
          </div>
        </article>

        <article className="admin-shipment-stat-card">
          <span><FiCheckCircle /></span>
          <div>
            <small>Visible Delivered</small>
            <strong>{summary.delivered}</strong>
          </div>
        </article>
      </div>

      <ShipmentForm
        orders={eligibleOrders}
        isLoadingOrders={isLoadingOrders}
        isSubmitting={isCreating}
        onRefreshOrders={loadOrders}
        onSubmit={handleCreate}
      />

      <form
        className="admin-shipment-filters"
        onSubmit={handleFilterSubmit}
      >
        <label className="admin-shipment-search">
          <FiSearch />
          <input
            type="search"
            value={filters.search}
            onChange={(event) =>
              updateFilter(
                "search",
                event.target.value,
              )
            }
            placeholder="Search shipment, tracking, courier, order or customer"
          />
        </label>

        <select
          value={filters.status}
          onChange={(event) =>
            updateFilter(
              "status",
              event.target.value,
            )
          }
        >
          <option value="">All statuses</option>
          <option value="READY">Ready</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="DELIVERY_FAILED">Delivery Failed</option>
          <option value="RETURNED">Returned</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <input
          type="text"
          value={filters.courierName}
          onChange={(event) =>
            updateFilter(
              "courierName",
              event.target.value,
            )
          }
          placeholder="Courier name"
        />

        <input
          type="text"
          value={filters.orderNumber}
          onChange={(event) =>
            updateFilter(
              "orderNumber",
              event.target.value,
            )
          }
          placeholder="Order number"
        />

        <input
          type="text"
          value={filters.trackingNumber}
          onChange={(event) =>
            updateFilter(
              "trackingNumber",
              event.target.value,
            )
          }
          placeholder="Tracking number"
        />

        <label className="admin-shipment-date-filter">
          <span>Created from</span>
          <input
            type="date"
            value={filters.createdFrom}
            onChange={(event) =>
              updateFilter(
                "createdFrom",
                event.target.value,
              )
            }
          />
        </label>

        <label className="admin-shipment-date-filter">
          <span>Created to</span>
          <input
            type="date"
            value={filters.createdTo}
            onChange={(event) =>
              updateFilter(
                "createdTo",
                event.target.value,
              )
            }
          />
        </label>

        <label className="admin-shipment-date-filter">
          <span>Estimated from</span>
          <input
            type="date"
            value={filters.estimatedFrom}
            onChange={(event) =>
              updateFilter(
                "estimatedFrom",
                event.target.value,
              )
            }
          />
        </label>

        <label className="admin-shipment-date-filter">
          <span>Estimated to</span>
          <input
            type="date"
            value={filters.estimatedTo}
            onChange={(event) =>
              updateFilter(
                "estimatedTo",
                event.target.value,
              )
            }
          />
        </label>

        <select
          value={filters.ordering}
          onChange={(event) =>
            updateFilter(
              "ordering",
              event.target.value,
            )
          }
        >
          <option value="-created_at">Newest first</option>
          <option value="created_at">Oldest first</option>
          <option value="estimated_delivery_date">Earliest delivery</option>
          <option value="-estimated_delivery_date">Latest delivery</option>
          <option value="status">Status</option>
        </select>

        <div className="admin-shipment-filter-actions">
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

      <AdminShipmentTable
        shipments={shipments}
        isLoading={isLoading}
      />
    </section>
  );
}

export default AdminShipmentsPage;