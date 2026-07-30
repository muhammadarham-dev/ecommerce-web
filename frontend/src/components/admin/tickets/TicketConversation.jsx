import {
  FiFile,
  FiLock,
  FiMessageCircle,
} from "react-icons/fi";

import {
  resolveMediaUrl,
} from "../../../utils/media";


function getFullName(user) {
  if (!user) {
    return "Unknown user";
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


function TicketConversation({
  messages = [],
  currentUser,
}) {
  if (!messages.length) {
    return (
      <section className="admin-ticket-card">
        <div className="admin-ticket-card__heading">
          <div>
            <span>Conversation</span>
            <h2>Ticket messages</h2>
          </div>

          <FiMessageCircle />
        </div>

        <div className="admin-tickets-empty admin-tickets-empty--compact">
          <p>No messages are available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-ticket-card">
      <div className="admin-ticket-card__heading">
        <div>
          <span>Conversation</span>
          <h2>Ticket messages</h2>
        </div>

        <strong>
          {messages.length} message
          {messages.length === 1 ? "" : "s"}
        </strong>
      </div>

      <div className="admin-ticket-conversation">
        {messages.map((message) => {
          const isCurrentUser =
            message.sender?.id
            === currentUser?.id;

          const senderRole = String(
            message.sender?.role ?? "",
          ).toUpperCase();

          const isStaff =
            message.sender?.is_superuser
            || [
              "ADMIN",
              "SUPPORT_AGENT",
            ].includes(senderRole);

          const attachments =
            Array.isArray(
              message.attachments,
            )
              ? message.attachments
              : [];

          return (
            <article
              key={message.id}
              className={[
                "admin-ticket-message",
                isCurrentUser
                  ? (
                    "admin-ticket-message--current"
                  )
                  : "",
                isStaff
                  ? (
                    "admin-ticket-message--staff"
                  )
                  : (
                    "admin-ticket-message--customer"
                  ),
                message.is_internal_note
                  ? (
                    "admin-ticket-message--internal"
                  )
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="admin-ticket-message__header">
                <div>
                  <strong>
                    {getFullName(
                      message.sender,
                    )}
                  </strong>

                  <span>
                    {isStaff
                      ? "Support Staff"
                      : "Customer"}
                  </span>
                </div>

                <div>
                  {message.is_internal_note && (
                    <span className="admin-ticket-internal-label">
                      <FiLock />
                      Internal note
                    </span>
                  )}

                  <time>
                    {formatDate(
                      message.created_at,
                    )}
                  </time>
                </div>
              </div>

              <p>
                {message.body}
              </p>

              {attachments.length > 0 && (
                <div className="admin-ticket-attachments">
                  {attachments.map(
                    (attachment) => {
                      const fileUrl =
                        resolveMediaUrl(
                          attachment.file,
                        );

                      return (
                        <a
                          key={attachment.id}
                          href={fileUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-ticket-attachment"
                          onClick={(event) => {
                            if (!fileUrl) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <FiFile />

                          <span>
                            {
                              attachment.original_name
                              || "Attachment"
                            }
                          </span>
                        </a>
                      );
                    },
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}


export default TicketConversation;