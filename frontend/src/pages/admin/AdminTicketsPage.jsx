import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  FiAlertTriangle,
  FiFilter,
  FiMessageSquare,
  FiRefreshCw,
  FiSearch,
  FiUserCheck,
} from "react-icons/fi";

import AdminTicketTable from
  "../../components/admin/tickets/AdminTicketTable";

import {
  fetchAdminTicketDashboard,
  fetchAdminTickets,
} from "../../services/adminTicketService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";


const initialFilters = {
  search: "",
  category: "",
  priority: "",
  status: "",
  assignedToMe: false,
  unassigned: "",
  createdFrom: "",
  createdTo: "",
  ordering: "-updated_at",
};


function AdminTicketsPage() {
  const [
    tickets,
    setTickets,
  ] = useState([]);

  const [
    totalCount,
    setTotalCount,
  ] = useState(0);

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

  const loadTickets = useCallback(
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

      if (appliedFilters.category) {
        params.category =
          appliedFilters.category;
      }

      if (appliedFilters.priority) {
        params.priority =
          appliedFilters.priority;
      }

      if (appliedFilters.status) {
        params.status =
          appliedFilters.status;
      }

      if (
        appliedFilters.assignedToMe
      ) {
        params.assigned_to_me = true;
      }

      if (
        appliedFilters.unassigned
        !== ""
      ) {
        params.unassigned =
          appliedFilters.unassigned;
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
        const [
          listResult,
          dashboardResult,
        ] = await Promise.all([
          fetchAdminTickets(params),
          fetchAdminTicketDashboard(),
        ]);

        setTickets(listResult.items);
        setTotalCount(listResult.count);
        setDashboard(dashboardResult);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load support tickets.",
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
    loadTickets();
  }, [loadTickets]);

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

  const summary =
    dashboard?.summary ?? {};

  return (
    <section className="admin-tickets-page">
      <div className="admin-tickets-page__heading">
        <div>
          <span className="admin-tickets-eyebrow">
            Customer support
          </span>

          <h1>Support Tickets</h1>

          <p>
            Claim customer tickets, respond to
            issues, add internal notes and
            resolve support requests.
          </p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={() =>
            loadTickets({
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

      <div className="admin-tickets-summary-grid">
        <article className="admin-ticket-stat-card">
          <span>
            <FiMessageSquare />
          </span>

          <div>
            <small>Total Tickets</small>

            <strong>
              {Number(
                summary.total_tickets
                ?? totalCount,
              ).toLocaleString("en-US")}
            </strong>
          </div>
        </article>

        <article className="admin-ticket-stat-card">
          <span>
            <FiAlertTriangle />
          </span>

          <div>
            <small>Open / Unassigned</small>

            <strong>
              {Number(
                summary.open_tickets || 0,
              ).toLocaleString("en-US")}
              {" / "}
              {Number(
                summary.unassigned_tickets
                || 0,
              ).toLocaleString("en-US")}
            </strong>
          </div>
        </article>

        <article className="admin-ticket-stat-card">
          <span>
            <FiUserCheck />
          </span>

          <div>
            <small>Claimed by Me</small>

            <strong>
              {Number(
                summary.assigned_to_me || 0,
              ).toLocaleString("en-US")}
            </strong>
          </div>
        </article>

        <article className="admin-ticket-stat-card">
          <span>
            <FiAlertTriangle />
          </span>

          <div>
            <small>Urgent Tickets</small>

            <strong>
              {Number(
                summary.urgent_tickets || 0,
              ).toLocaleString("en-US")}
            </strong>
          </div>
        </article>
      </div>

      <form
        className="admin-ticket-filters"
        onSubmit={handleSubmit}
      >
        <label className="admin-ticket-search">
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
              "Search ticket, subject, customer, order or product"
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

          <option value="OPEN">
            Open
          </option>

          <option value="ASSIGNED">
            Assigned
          </option>

          <option value="IN_PROGRESS">
            In Progress
          </option>

          <option value="WAITING_FOR_CUSTOMER">
            Waiting for Customer
          </option>

          <option value="RESOLVED">
            Resolved
          </option>

          <option value="CLOSED">
            Closed
          </option>
        </select>

        <select
          value={filters.priority}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                priority:
                  event.target.value,
              }),
            )
          }
        >
          <option value="">
            All priorities
          </option>

          <option value="LOW">
            Low
          </option>

          <option value="MEDIUM">
            Medium
          </option>

          <option value="HIGH">
            High
          </option>

          <option value="URGENT">
            Urgent
          </option>
        </select>

        <select
          value={filters.category}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                category:
                  event.target.value,
              }),
            )
          }
        >
          <option value="">
            All categories
          </option>

          <option value="ORDER_ISSUE">
            Order Issue
          </option>

          <option value="PAYMENT_ISSUE">
            Payment Issue
          </option>

          <option value="DELIVERY_ISSUE">
            Delivery Issue
          </option>

          <option value="RETURN_REFUND">
            Return or Refund
          </option>

          <option value="DAMAGED_PRODUCT">
            Damaged Product
          </option>

          <option value="PRODUCT_INFORMATION">
            Product Information
          </option>

          <option value="ACCOUNT_ISSUE">
            Account Issue
          </option>

          <option value="GENERAL_COMPLAINT">
            General Complaint
          </option>
        </select>

        <select
          value={filters.unassigned}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                unassigned:
                  event.target.value,
                assignedToMe:
                  event.target.value
                  ? false
                  : current.assignedToMe,
              }),
            )
          }
        >
          <option value="">
            Any assignment
          </option>

          <option value="true">
            Unassigned only
          </option>

          <option value="false">
            Claimed only
          </option>
        </select>

        <label className="admin-ticket-checkbox-filter">
          <input
            type="checkbox"
            checked={
              filters.assignedToMe
            }
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  assignedToMe:
                    event.target.checked,
                  unassigned:
                    event.target.checked
                      ? ""
                      : current.unassigned,
                }),
              )
            }
          />

          <span>Claimed by me</span>
        </label>

        <label className="admin-ticket-date-filter">
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

        <label className="admin-ticket-date-filter">
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
          <option value="-updated_at">
            Recently updated
          </option>

          <option value="-created_at">
            Newest created
          </option>

          <option value="created_at">
            Oldest created
          </option>

          <option value="priority">
            Priority
          </option>

          <option value="status">
            Status
          </option>
        </select>

        <div className="admin-ticket-filter-actions">
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

      <AdminTicketTable
        tickets={tickets}
        isLoading={isLoading}
      />
    </section>
  );
}


export default AdminTicketsPage;