import {
  FiArrowRight,
  FiMessageSquare,
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


function getFullName(user) {
  if (!user) {
    return "Unassigned";
  }

  const fullName = [
    user.first_name,
    user.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user.username;
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


function AdminTicketTable({
  tickets = [],
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="admin-tickets-state">
        <div className="admin-loading-spinner" />
        <p>Loading support tickets...</p>
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="admin-tickets-empty">
        <FiMessageSquare />

        <h3>No support tickets found</h3>

        <p>
          No tickets match the selected
          filters.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-tickets-table-shell">
      <table className="admin-tickets-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Customer</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned agent</th>
            <th>Updated</th>
            <th aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.ticket_number}>
              <td>
                <div className="admin-ticket-reference">
                  <strong>
                    {ticket.ticket_number}
                  </strong>

                  <span>
                    {ticket.subject}
                  </span>
                </div>
              </td>

              <td>
                <div className="admin-ticket-customer">
                  <strong>
                    {getFullName(
                      ticket.customer,
                    )}
                  </strong>

                  <span>
                    {ticket.customer?.email
                      || "Email unavailable"}
                  </span>
                </div>
              </td>

              <td>
                <span className="admin-ticket-category">
                  {normalizeLabel(
                    ticket.category,
                  )}
                </span>
              </td>

              <td>
                <span
                  className={
                    `admin-ticket-priority admin-ticket-priority--${
                      String(
                        ticket.priority
                        || "unknown",
                      ).toLowerCase()
                    }`
                  }
                >
                  {normalizeLabel(
                    ticket.priority,
                  )}
                </span>
              </td>

              <td>
                <span
                  className={
                    `admin-ticket-status admin-ticket-status--${
                      String(
                        ticket.status
                        || "unknown",
                      ).toLowerCase()
                    }`
                  }
                >
                  {normalizeLabel(
                    ticket.status,
                  )}
                </span>
              </td>

              <td>
                <span className="admin-ticket-agent">
                  {getFullName(
                    ticket.assigned_agent,
                  )}
                </span>
              </td>

              <td>
                <span className="admin-ticket-date">
                  {formatDate(
                    ticket.updated_at,
                  )}
                </span>
              </td>

              <td>
                <Link
                  to={
                    `/admin/tickets/${
                      encodeURIComponent(
                        ticket.ticket_number,
                      )
                    }`
                  }
                  className="admin-ticket-open-button"
                  aria-label={
                    `Open ticket ${
                      ticket.ticket_number
                    }`
                  }
                >
                  <FiArrowRight />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


export default AdminTicketTable;