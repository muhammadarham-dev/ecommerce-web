import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiDollarSign,
  FiFilter,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
} from "react-icons/fi";

import AdminReturnTable from
  "../../components/admin/returns/AdminReturnTable";

import useStoreSettings from
  "../../hooks/useStoreSettings";

import {
  fetchAdminReturns,
} from "../../services/adminReturnService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";


const initialFilters = {
  search: "",
  status: "",
  reason: "",
  orderNumber: "",
  customer: "",
  createdFrom: "",
  createdTo: "",
  ordering: "-created_at",
};


function AdminReturnsPage() {
  const {
    formatMoney,
  } = useStoreSettings();

  const [
    returnRequests,
    setReturnRequests,
  ] = useState([]);

  const [
    totalCount,
    setTotalCount,
  ] = useState(0);

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

  const loadReturns = useCallback(
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

      if (appliedFilters.reason) {
        params.reason =
          appliedFilters.reason;
      }

      if (
        appliedFilters.orderNumber.trim()
      ) {
        params.order_number =
          appliedFilters.orderNumber.trim();
      }

      if (
        appliedFilters.customer.trim()
      ) {
        params.customer =
          appliedFilters.customer.trim();
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

      try {
        const result =
          await fetchAdminReturns(params);

        setReturnRequests(result.items);
        setTotalCount(result.count);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load return requests.",
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
    loadReturns();
  }, [loadReturns]);

  const summary = useMemo(
    () => {
      const requested =
        returnRequests.filter(
          (item) =>
            item.status === "REQUESTED",
        ).length;

      const active =
        returnRequests.filter(
          (item) =>
            [
              "APPROVED",
              "PRODUCT_RECEIVED",
            ].includes(item.status),
        ).length;

      const refunded =
        returnRequests.filter(
          (item) =>
            item.status === "REFUNDED",
        ).length;

      const refundValue =
        returnRequests.reduce(
          (total, item) =>
            total
            + Number(
              item.refund_amount || 0,
            ),
          0,
        );

      return {
        requested,
        active,
        refunded,
        refundValue,
      };
    },
    [returnRequests],
  );

  const handleSubmit = (
    event,
  ) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  return (
    <section className="admin-returns-page">
      <div className="admin-returns-page__heading">
        <div>
          <span className="admin-returns-eyebrow">
            After-sales operations
          </span>

          <h1>Returns</h1>

          <p>
            Review return requests, inspect
            returned items, restore inventory and
            complete customer refunds.
          </p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={() =>
            loadReturns({
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

      <div className="admin-returns-summary-grid">
        <article className="admin-return-stat-card">
          <span>
            <FiRotateCcw />
          </span>

          <div>
            <small>Total Results</small>
            <strong>
              {Number(
                totalCount,
              ).toLocaleString("en-US")}
            </strong>
          </div>
        </article>

        <article className="admin-return-stat-card">
          <span>
            <FiFilter />
          </span>

          <div>
            <small>Requested</small>
            <strong>
              {summary.requested}
            </strong>
          </div>
        </article>

        <article className="admin-return-stat-card">
          <span>
            <FiCheckCircle />
          </span>

          <div>
            <small>In Progress</small>
            <strong>
              {summary.active}
            </strong>
          </div>
        </article>

        <article className="admin-return-stat-card">
          <span>
            <FiDollarSign />
          </span>

          <div>
            <small>
              Listed Refund Value
            </small>
            <strong>
              {money(
                summary.refundValue,
              )}
            </strong>
          </div>
        </article>
      </div>

      <form
        className="admin-return-filters"
        onSubmit={handleSubmit}
      >
        <label className="admin-return-search">
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
              "Search return, order, customer or details"
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
            All statuses
          </option>
          <option value="REQUESTED">
            Requested
          </option>
          <option value="APPROVED">
            Approved
          </option>
          <option value="REJECTED">
            Rejected
          </option>
          <option value="PRODUCT_RECEIVED">
            Product Received
          </option>
          <option value="REFUNDED">
            Refunded
          </option>
          <option value="CANCELLED">
            Cancelled
          </option>
        </select>

        <select
          value={filters.reason}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                reason:
                  event.target.value,
              }),
            )
          }
        >
          <option value="">
            All reasons
          </option>
          <option value="DAMAGED">
            Damaged Product
          </option>
          <option value="WRONG_PRODUCT">
            Wrong Product
          </option>
          <option value="DEFECTIVE">
            Defective Product
          </option>
          <option value="NOT_AS_DESCRIBED">
            Product Not as Described
          </option>
          <option value="SIZE_OR_FIT">
            Size or Fit Issue
          </option>
          <option value="CHANGED_MIND">
            Changed Mind
          </option>
          <option value="OTHER">
            Other
          </option>
        </select>

        <input
          type="text"
          value={filters.orderNumber}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                orderNumber:
                  event.target.value,
              }),
            )
          }
          placeholder="Order number"
        />

        <input
          type="text"
          value={filters.customer}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                customer:
                  event.target.value,
              }),
            )
          }
          placeholder="Customer username"
        />

        <label className="admin-return-date-filter">
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

        <label className="admin-return-date-filter">
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
          <option value="-refund_amount">
            Highest refund
          </option>
          <option value="refund_amount">
            Lowest refund
          </option>
          <option value="status">
            Status
          </option>
        </select>

        <div className="admin-return-filter-actions">
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

      <AdminReturnTable
        returnRequests={returnRequests}
        formatMoney={money}
        isLoading={isLoading}
      />
    </section>
  );
}


export default AdminReturnsPage;