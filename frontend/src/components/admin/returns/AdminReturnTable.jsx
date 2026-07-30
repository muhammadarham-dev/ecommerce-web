import {
  FiArrowRight,
  FiRotateCcw,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";


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


function AdminReturnTable({
  returnRequests = [],
  formatMoney,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="admin-returns-state">
        <div className="admin-loading-spinner" />
        <p>Loading return requests...</p>
      </div>
    );
  }

  if (!returnRequests.length) {
    return (
      <div className="admin-returns-empty">
        <FiRotateCcw />

        <h3>No return requests found</h3>

        <p>
          No return requests match the selected
          filters.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-returns-table-shell">
      <table className="admin-returns-table">
        <thead>
          <tr>
            <th>Return</th>
            <th>Order</th>
            <th>Customer</th>
            <th>Reason</th>
            <th>Items</th>
            <th>Refund</th>
            <th>Status</th>
            <th>Created</th>
            <th aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {returnRequests.map(
            (returnRequest) => (
              <tr
                key={
                  returnRequest.return_number
                }
              >
                <td>
                  <strong className="admin-return-reference">
                    {
                      returnRequest.return_number
                    }
                  </strong>
                </td>

                <td>
                  <span className="admin-return-order">
                    {
                      returnRequest.order_number
                    }
                  </span>
                </td>

                <td>
                  <span className="admin-return-customer">
                    {
                      returnRequest.customer_username
                    }
                  </span>
                </td>

                <td>
                  <span className="admin-return-reason">
                    {normalizeLabel(
                      returnRequest.reason,
                    )}
                  </span>
                </td>

                <td>
                  <span>
                    {
                      returnRequest.items?.length
                      ?? 0
                    } item
                    {
                      (
                        returnRequest.items
                          ?.length ?? 0
                      ) === 1
                        ? ""
                        : "s"
                    }
                  </span>
                </td>

                <td>
                  <strong>
                    {formatMoney(
                      returnRequest.refund_amount,
                    )}
                  </strong>
                </td>

                <td>
                  <span
                    className={
                      `admin-return-status admin-return-status--${
                        String(
                          returnRequest.status
                          || "unknown",
                        ).toLowerCase()
                      }`
                    }
                  >
                    {normalizeLabel(
                      returnRequest.status,
                    )}
                  </span>
                </td>

                <td>
                  <span className="admin-return-date">
                    {formatDate(
                      returnRequest.created_at,
                    )}
                  </span>
                </td>

                <td>
                  <Link
                    to={
                      `/admin/returns/${
                        encodeURIComponent(
                          returnRequest
                            .return_number,
                        )
                      }`
                    }
                    className="admin-return-open-button"
                    aria-label={
                      `Open return request ${
                        returnRequest
                          .return_number
                      }`
                    }
                  >
                    <FiArrowRight />
                  </Link>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}


export default AdminReturnTable;