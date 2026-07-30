import {
  useEffect,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiFile,
  FiMessageSquare,
  FiPaperclip,
  FiSend,
  FiUser,
  FiX,
  FiHelpCircle,
} from "react-icons/fi";

import {
  Link,
  useLocation,
  useParams,
} from "react-router-dom";

import {
  closeTicket,
  fetchTicket,
  replyToTicket,
} from "../services/ticketService";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  resolveMediaUrl,
} from "../utils/media";

import {
  formatTicketDate,
  formatTicketValue,
  getTicketPriorityClass,
  getTicketStatusClass,
  validateTicketFiles,
} from "../utils/tickets";


function TicketDetailPage() {
  const {
    ticketNumber,
  } = useParams();

  const location = useLocation();

  const [
    ticket,
    setTicket,
  ] = useState(null);

  const [
    replyBody,
    setReplyBody,
  ] = useState("");

  const [
    attachments,
    setAttachments,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isReplying,
    setIsReplying,
  ] = useState(false);

  const [
    isClosing,
    setIsClosing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState(
    location.state?.message ?? "",
  );

  useEffect(() => {
    let isActive = true;

    async function loadTicket() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const ticketData =
          await fetchTicket(
            ticketNumber,
          );

        if (isActive) {
          setTicket(ticketData);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load support ticket.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadTicket();

    return () => {
      isActive = false;
    };
  }, [ticketNumber]);

  const handleFilesChange = (
    event,
  ) => {
    const selectedFiles =
      Array.from(
        event.target.files || [],
      );

    const validation =
      validateTicketFiles(
        selectedFiles,
      );

    if (!validation.valid) {
      setErrorMessage(
        validation.message,
      );

      event.target.value = "";
      return;
    }

    setAttachments(selectedFiles);
    setErrorMessage("");
  };

  const removeAttachment = (
    fileIndex,
  ) => {
    setAttachments(
      (currentFiles) =>
        currentFiles.filter(
          (_, index) =>
            index !== fileIndex,
        ),
    );
  };

  const handleReply = async (
    event,
  ) => {
    event.preventDefault();

    if (!replyBody.trim()) {
      setErrorMessage(
        "Reply message is required.",
      );

      return;
    }

    const validation =
      validateTicketFiles(
        attachments,
      );

    if (!validation.valid) {
      setErrorMessage(
        validation.message,
      );

      return;
    }

    setIsReplying(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result =
        await replyToTicket({
          ticketNumber:
            ticket.ticket_number,
          body: replyBody.trim(),
          attachments,
        });

      setTicket(result.ticket);
      setReplyBody("");
      setAttachments([]);

      const input =
        document.getElementById(
          "ticket-reply-files",
        );

      if (input) {
        input.value = "";
      }

      setSuccessMessage(
        result.message
        ?? "Reply added successfully.",
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to send your reply.",
        ),
      );
    } finally {
      setIsReplying(false);
    }
  };

  const handleCloseTicket = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to close this ticket?",
    );

    if (!confirmed) {
      return;
    }

    setIsClosing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result =
        await closeTicket(
          ticket.ticket_number,
        );

      setTicket(result.ticket);

      setSuccessMessage(
        result.message
        ?? "Ticket closed successfully.",
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to close this ticket.",
        ),
      );
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoading) {
    return (
      <section className="route-loading">
        <div className="loading-spinner" />

        <p>Loading ticket conversation...</p>
      </section>
    );
  }

  if (!ticket) {
    return (
      <section className="ticket-page">
        <div className="container ticket-empty-card">
          <FiAlertCircle />

          <h1>Ticket Unavailable</h1>

          <p>
            {errorMessage
              || (
                "The requested support ticket "
                + "could not be found."
              )}
          </p>

          <Link
            to="/tickets"
            className="primary-button"
          >
            <FiArrowLeft />
            Back to Support Tickets
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="ticket-page">
      <div className="ticket-page-header">
        <div className="container">
          <Link
            to="/tickets"
            className="ticket-back-link"
          >
            <FiArrowLeft />
            Back to Support Tickets
          </Link>

          <div className="ticket-detail-title">
            <div>
              <span className="section-label">
                Support conversation
              </span>

              <h1>
                {ticket.ticket_number}
              </h1>

              <p>{ticket.subject}</p>
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
        </div>
      </div>

      <div className="container ticket-detail-layout">
        <main className="ticket-conversation-card">
          {successMessage && (
            <div className="store-message success">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="store-message error">
              {errorMessage}
            </div>
          )}

          <div className="ticket-conversation-heading">
            <FiMessageSquare />

            <div>
              <span>Ticket Messages</span>
              <h2>Conversation</h2>
            </div>
          </div>

          <div className="ticket-messages">
            {ticket.messages?.map(
              (message) => {
                const isCustomer =
                  message.sender?.id
                  === ticket.customer?.id;

                return (
                  <article
                    key={message.id}
                    className={
                      isCustomer
                        ? (
                          "ticket-message "
                          + "customer"
                        )
                        : (
                          "ticket-message "
                          + "support"
                        )
                    }
                  >
                    <div className="ticket-message-avatar">
                      <FiUser />
                    </div>

                    <div className="ticket-message-content">
                      <div className="ticket-message-header">
                        <strong>
                          {isCustomer
                            ? "You"
                            : (
                              message.sender
                                ?.first_name
                              || message.sender
                                ?.username
                              || "Support Agent"
                            )}
                        </strong>

                        <span>
                          {formatTicketDate(
                            message.created_at,
                          )}
                        </span>
                      </div>

                      <p>{message.body}</p>

                      {message.attachments
                        ?.length > 0 && (
                        <div className="message-attachments">
                          {message.attachments.map(
                            (attachment) => (
                              <a
                                key={attachment.id}
                                href={
                                  resolveMediaUrl(
                                    attachment.file,
                                  )
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                <FiFile />

                                <span>
                                  {attachment
                                    .original_name
                                    || "Attachment"}
                                </span>
                              </a>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              },
            )}
          </div>

          {ticket.can_customer_reply ? (
            <form
              className="ticket-reply-form"
              onSubmit={handleReply}
            >
              <label>
                Your reply

                <textarea
                  value={replyBody}
                  onChange={(event) =>
                    setReplyBody(
                      event.target.value,
                    )
                  }
                  rows="6"
                  maxLength="5000"
                  placeholder={
                    "Write a reply to the "
                    + "support team..."
                  }
                  required
                />
              </label>

              <div className="ticket-reply-actions">
                <label className="ticket-reply-attachment">
                  <input
                    id="ticket-reply-files"
                    type="file"
                    multiple
                    accept={
                      ".jpg,.jpeg,.png,"
                      + ".webp,.pdf"
                    }
                    onChange={
                      handleFilesChange
                    }
                  />

                  <FiPaperclip />
                  Attach Files
                </label>

                <button
                  type="submit"
                  disabled={isReplying}
                >
                  {isReplying
                    ? "Sending Reply..."
                    : "Send Reply"}

                  {!isReplying && <FiSend />}
                </button>
              </div>

              {attachments.length > 0 && (
                <div className="ticket-attachment-list">
                  {attachments.map(
                    (file, index) => (
                      <div
                        key={
                          `${file.name}-${index}`
                        }
                        className="ticket-selected-file"
                      >
                        <FiFile />

                        <div>
                          <strong>
                            {file.name}
                          </strong>

                          <span>
                            {(
                              file.size
                              / 1024
                              / 1024
                            ).toFixed(2)}
                            {" MB"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeAttachment(
                              index,
                            )
                          }
                        >
                          <FiX />
                        </button>
                      </div>
                    ),
                  )}
                </div>
              )}
            </form>
          ) : (
            <div className="ticket-closed-message">
              <FiCheckCircle />

              <div>
                <strong>
                  This ticket is closed
                </strong>

                <p>
                  Closed support tickets cannot
                  receive additional replies.
                </p>
              </div>
            </div>
          )}
        </main>

        <aside className="ticket-detail-sidebar">
          <section className="ticket-card">
            <div className="ticket-card-heading">
              <FiHelpCircle />

              <div>
                <span>Ticket information</span>
                <h2>Summary</h2>
              </div>
            </div>

            <div className="ticket-detail-summary">
              <div>
                <span>Category</span>

                <strong>
                  {formatTicketValue(
                    ticket.category,
                  )}
                </strong>
              </div>

              <div>
                <span>Priority</span>

                <strong>
                  {formatTicketValue(
                    ticket.priority,
                  )}
                </strong>
              </div>

              <div>
                <span>Status</span>

                <strong>
                  {formatTicketValue(
                    ticket.status,
                  )}
                </strong>
              </div>

              <div>
                <span>Order</span>

                {ticket.order_number ? (
                  <Link
                    to={
                      `/orders/${
                        ticket.order_number
                      }`
                    }
                  >
                    {ticket.order_number}
                  </Link>
                ) : (
                  <strong>Not linked</strong>
                )}
              </div>

              <div>
                <span>Product</span>

                {ticket.product?.id ? (
                  <Link
                    to={
                      `/products/${
                        ticket.product.id
                      }`
                    }
                  >
                    {ticket.product.name}
                  </Link>
                ) : (
                  <strong>Not linked</strong>
                )}
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

              <div>
                <span>Created</span>

                <strong>
                  {formatTicketDate(
                    ticket.created_at,
                  )}
                </strong>
              </div>
            </div>
          </section>

          {ticket.can_customer_close && (
            <section className="ticket-close-card">
              <FiCheckCircle />

              <h3>Issue Resolved?</h3>

              <p>
                Close this ticket after confirming
                that your support issue has been
                resolved.
              </p>

              <button
                type="button"
                onClick={handleCloseTicket}
                disabled={isClosing}
              >
                {isClosing
                  ? "Closing Ticket..."
                  : "Close This Ticket"}
              </button>
            </section>
          )}
        </aside>
      </div>
    </section>
  );
}


export default TicketDetailPage;