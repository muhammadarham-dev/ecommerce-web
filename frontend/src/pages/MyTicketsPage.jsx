import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiArrowRight,
  FiHelpCircle,
  FiMessageSquare,
  FiPlus,
  FiSearch,
  FiUser,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import {
  fetchTickets,
} from "../services/ticketService";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  formatTicketDate,
  formatTicketValue,
  getTicketPriorityClass,
  getTicketStatusClass,
  ticketStatusOptions,
} from "../utils/tickets";


function MyTicketsPage() {
  const [
    tickets,
    setTickets,
  ] = useState([]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadTickets() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const ticketData =
          await fetchTickets();

        if (isActive) {
          setTickets(ticketData);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load support tickets.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredTickets = useMemo(
    () => {
      const normalizedSearch =
        searchTerm.trim().toLowerCase();

      return tickets.filter(
        (ticket) => {
          const matchesStatus =
            !statusFilter
            || ticket.status
              === statusFilter;

          const searchText = [
            ticket.ticket_number,
            ticket.subject,
            ticket.category,
            ticket.order_number,
            ticket.product?.name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !normalizedSearch
            || searchText.includes(
              normalizedSearch,
            );

          return (
            matchesStatus
            && matchesSearch
          );
        },
      );
    },
    [
      tickets,
      searchTerm,
      statusFilter,
    ],
  );

  return (
    <section className="tickets-page">
      <div className="ticket-page-header">
        <div className="container">
          <span className="section-label">
            Customer support
          </span>

          <h1>My Support Tickets</h1>

          <p>
            View support conversations and
            track the progress of your issues.
          </p>
        </div>
      </div>

      <div className="container tickets-content">
        <div className="tickets-toolbar">
          <div className="tickets-search">
            <FiSearch />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value,
                )
              }
              placeholder={
                "Search tickets, orders "
                + "or products"
              }
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value,
              )
            }
          >
            {ticketStatusOptions.map(
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

          <Link
            to="/tickets/create"
            className="create-ticket-button"
          >
            <FiPlus />
            New Ticket
          </Link>
        </div>

        {errorMessage && (
          <div className="store-message error">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="tickets-empty">
            <div className="loading-spinner" />
            <p>Loading support tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="tickets-empty">
            <FiHelpCircle />

            <h2>No Support Tickets</h2>

            <p>
              Create a support ticket whenever
              you need help with an order,
              product or account issue.
            </p>

            <Link
              to="/tickets/create"
              className="primary-button"
            >
              Create Support Ticket
            </Link>
          </div>
        ) : (
          <div className="tickets-list">
            {filteredTickets.map(
              (ticket) => (
                <article
                  key={ticket.id}
                  className="ticket-list-card"
                >
                  <div className="ticket-list-header">
                    <div>
                      <span>Ticket Number</span>

                      <h2>
                        {ticket.ticket_number}
                      </h2>

                      <small>
                        Updated
                        {" "}
                        {formatTicketDate(
                          ticket.updated_at,
                        )}
                      </small>
                    </div>

                    <div className="ticket-list-badges">
                      <span
                        className={
                          "ticket-priority-badge "
                          + getTicketPriorityClass(
                            ticket.priority,
                          )
                        }
                      >
                        {formatTicketValue(
                          ticket.priority,
                        )}
                      </span>

                      <span
                        className={
                          "ticket-status-badge "
                          + getTicketStatusClass(
                            ticket.status,
                          )
                        }
                      >
                        {formatTicketValue(
                          ticket.status,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="ticket-list-body">
                    <div className="ticket-subject">
                      <FiMessageSquare />

                      <div>
                        <strong>
                          {ticket.subject}
                        </strong>

                        <span>
                          {formatTicketValue(
                            ticket.category,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="ticket-list-meta">
                      <div>
                        <span>Order</span>

                        <strong>
                          {ticket.order_number
                            || "Not linked"}
                        </strong>
                      </div>

                      <div>
                        <span>Product</span>

                        <strong>
                          {ticket.product?.name
                            || "Not linked"}
                        </strong>
                      </div>

                      <div>
                        <span>Assigned Agent</span>

                        <strong>
                          {ticket
                            .assigned_agent
                            ?.username
                            || "Not assigned"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="ticket-list-footer">
                    <div>
                      <FiUser />

                      <span>
                        Created
                        {" "}
                        {formatTicketDate(
                          ticket.created_at,
                        )}
                      </span>
                    </div>

                    <Link
                      to={
                        `/tickets/${
                          ticket.ticket_number
                        }`
                      }
                    >
                      Open Conversation
                      <FiArrowRight />
                    </Link>
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


export default MyTicketsPage;