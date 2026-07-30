import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiExternalLink,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag,
  FiUser,
} from "react-icons/fi";

import {
  Link,
  useParams,
} from "react-router-dom";

import AdminTicketReplyForm from
  "../../components/admin/tickets/AdminTicketReplyForm";

import TicketConversation from
  "../../components/admin/tickets/TicketConversation";

import TicketStatusManager from
  "../../components/admin/tickets/TicketStatusManager";

import useAuth from
  "../../hooks/useAuth";

import {
  claimAdminTicket,
  fetchAdminTicket,
  replyToAdminTicket,
  updateAdminTicketStatus,
} from "../../services/adminTicketService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";


function normalizeLabel(value) {
  return String(value ?? "Unknown")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
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


function AdminTicketDetailPage() {
  const {
    ticketNumber,
  } = useParams();

  const {
    user,
  } = useAuth();

  const [
    ticket,
    setTicket,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isManaging,
    setIsManaging,
  ] = useState(false);

  const [
    isReplying,
    setIsReplying,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    noticeMessage,
    setNoticeMessage,
  ] = useState("");

  const loadTicket = useCallback(
    async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data =
          await fetchAdminTicket(
            ticketNumber,
          );

        setTicket(data);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load this support ticket.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [ticketNumber],
  );

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const isAssignedToCurrentUser =
    Number(ticket?.assigned_agent?.id)
    === Number(user?.id);

  const mayReply =
    ticket?.status !== "CLOSED"
    && isAssignedToCurrentUser;

  const contextLinks = useMemo(
    () => {
      const links = [];

      if (ticket?.order_number) {
        links.push({
          label: ticket.order_number,
          to:
            `/admin/orders/${
              encodeURIComponent(
                ticket.order_number,
              )
            }`,
          icon: FiShoppingBag,
        });
      }

      if (ticket?.product?.slug) {
        links.push({
          label: ticket.product.name,
          to:
            `/admin/products/${
              encodeURIComponent(
                ticket.product.slug,
              )
            }/edit`,
          icon: FiPackage,
        });
      }

      return links;
    },
    [
      ticket?.order_number,
      ticket?.product?.name,
      ticket?.product?.slug,
    ],
  );

  const handleClaim =
    async () => {
      setIsManaging(true);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        const result =
          await claimAdminTicket(
            ticketNumber,
          );

        setTicket(result.ticket);

        setNoticeMessage(
          result.message
          || "Ticket claimed successfully.",
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to claim this ticket.",
          ),
        );
      } finally {
        setIsManaging(false);
      }
    };

  const handleStatusUpdate =
    async (status) => {
      setIsManaging(true);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        const result =
          await updateAdminTicketStatus(
            ticketNumber,
            status,
          );

        setTicket(result.ticket);

        setNoticeMessage(
          result.message
          || (
            "Ticket status updated "
            + "successfully."
          ),
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to update ticket status.",
          ),
        );
      } finally {
        setIsManaging(false);
      }
    };

  const handleReply =
    async ({
      body,
      attachments,
      isInternalNote,
    }) => {
      setIsReplying(true);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        const result =
          await replyToAdminTicket({
            ticketNumber,
            body,
            attachments,
            isInternalNote,
          });

        setTicket(result.ticket);

        setNoticeMessage(
          result.message
          || "Reply added successfully.",
        );

        return true;
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to add this reply.",
          ),
        );

        return false;
      } finally {
        setIsReplying(false);
      }
    };

  if (isLoading) {
    return (
      <div className="admin-tickets-state">
        <div className="admin-loading-spinner" />
        <p>Loading ticket details...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <section className="admin-tickets-page">
        <div className="admin-form-message admin-form-message--error">
          {errorMessage
            || "Support ticket not found."}
        </div>
      </section>
    );
  }

  return (
    <section className="admin-ticket-detail-page">
      <div className="admin-ticket-detail-page__heading">
        <div>
          <Link
            to="/admin/tickets"
            className="admin-ticket-back-link"
          >
            <FiArrowLeft />
            Back to Tickets
          </Link>

          <span className="admin-tickets-eyebrow">
            Support ticket
          </span>

          <h1>{ticket.ticket_number}</h1>

          <p>{ticket.subject}</p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={loadTicket}
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

      <div className="admin-ticket-detail-summary">
        <div>
          <small>Status</small>

          <span
            className={
              `admin-ticket-status admin-ticket-status--${
                String(
                  ticket.status,
                ).toLowerCase()
              }`
            }
          >
            {normalizeLabel(
              ticket.status,
            )}
          </span>
        </div>

        <div>
          <small>Priority</small>

          <span
            className={
              `admin-ticket-priority admin-ticket-priority--${
                String(
                  ticket.priority,
                ).toLowerCase()
              }`
            }
          >
            {normalizeLabel(
              ticket.priority,
            )}
          </span>
        </div>

        <div>
          <small>Category</small>

          <strong>
            {normalizeLabel(
              ticket.category,
            )}
          </strong>
        </div>

        <div>
          <small>Last updated</small>

          <strong>
            {formatDate(
              ticket.updated_at,
            )}
          </strong>
        </div>
      </div>

      <div className="admin-ticket-detail-grid">
        <div className="admin-ticket-detail-main">
          <TicketConversation
            messages={
              ticket.messages ?? []
            }
            currentUser={user}
          />

          <AdminTicketReplyForm
            disabled={!mayReply}
            isSubmitting={isReplying}
            onSubmit={handleReply}
          />
        </div>

        <aside className="admin-ticket-detail-sidebar">
          <TicketStatusManager
            ticket={ticket}
            currentUser={user}
            isBusy={isManaging}
            onClaim={handleClaim}
            onStatusUpdate={
              handleStatusUpdate
            }
          />

          <section className="admin-ticket-card">
            <div className="admin-ticket-card__heading">
              <div>
                <span>Customer</span>
                <h2>Customer details</h2>
              </div>

              <FiUser />
            </div>

            <div className="admin-ticket-info-list">
              <div>
                <small>Name</small>

                <strong>
                  {getFullName(
                    ticket.customer,
                  )}
                </strong>
              </div>

              <div>
                <small>Username</small>

                <strong>
                  {ticket.customer?.username
                    || "Not available"}
                </strong>
              </div>

              <div>
                <small>Email</small>

                <strong>
                  {ticket.customer?.email
                    || "Not available"}
                </strong>
              </div>

              <div>
                <small>
                  Claimed by
                </small>

                <strong>
                  {getFullName(
                    ticket.assigned_agent,
                  )}
                </strong>
              </div>
            </div>
          </section>

          {contextLinks.length > 0 && (
            <section className="admin-ticket-card">
              <div className="admin-ticket-card__heading">
                <div>
                  <span>Related records</span>
                  <h2>Ticket context</h2>
                </div>
              </div>

              <div className="admin-ticket-context-links">
                {contextLinks.map(
                  (item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                      >
                        <Icon />

                        <span>
                          {item.label}
                        </span>

                        <FiExternalLink />
                      </Link>
                    );
                  },
                )}
              </div>
            </section>
          )}

          <section className="admin-ticket-card">
            <div className="admin-ticket-card__heading">
              <div>
                <span>Activity</span>
                <h2>Ticket timestamps</h2>
              </div>
            </div>

            <div className="admin-ticket-info-list">
              <div>
                <small>Created</small>

                <strong>
                  {formatDate(
                    ticket.created_at,
                  )}
                </strong>
              </div>

              <div>
                <small>Resolved</small>

                <strong>
                  {formatDate(
                    ticket.resolved_at,
                  )}
                </strong>
              </div>

              <div>
                <small>Closed</small>

                <strong>
                  {formatDate(
                    ticket.closed_at,
                  )}
                </strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}


export default AdminTicketDetailPage;