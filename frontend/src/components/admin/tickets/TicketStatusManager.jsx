import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";


const statusTransitions = {
  OPEN: [
    "ASSIGNED",
    "IN_PROGRESS",
    "CLOSED",
  ],
  ASSIGNED: [
    "IN_PROGRESS",
    "WAITING_FOR_CUSTOMER",
    "RESOLVED",
    "CLOSED",
  ],
  IN_PROGRESS: [
    "WAITING_FOR_CUSTOMER",
    "RESOLVED",
    "CLOSED",
  ],
  WAITING_FOR_CUSTOMER: [
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
  ],
  RESOLVED: [
    "IN_PROGRESS",
    "CLOSED",
  ],
  CLOSED: [],
};


function normalizeLabel(value) {
  return String(value ?? "")
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


function TicketStatusManager({
  ticket,
  currentUser,
  isBusy,
  onClaim,
  onStatusUpdate,
}) {
  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("");

  useEffect(() => {
    setSelectedStatus("");
  }, [
    ticket?.assigned_agent?.id,
    ticket?.status,
    ticket?.ticket_number,
  ]);

  const nextStatuses = useMemo(
    () =>
      statusTransitions[
        ticket?.status
      ] ?? [],
    [ticket?.status],
  );

  const isAssignedToCurrentUser =
    Number(ticket?.assigned_agent?.id)
    === Number(currentUser?.id);

  const isClosed =
    ticket?.status === "CLOSED";

  const canClaim =
    !isClosed
    && !isAssignedToCurrentUser;

  const canUpdateStatus =
    !isClosed
    && isAssignedToCurrentUser;

  const handleStatusSubmit = (
    event,
  ) => {
    event.preventDefault();

    if (
      !selectedStatus
      || !canUpdateStatus
    ) {
      return;
    }

    onStatusUpdate(selectedStatus);
  };

  return (
    <section className="admin-ticket-card">
      <div className="admin-ticket-card__heading">
        <div>
          <span>Ticket controls</span>
          <h2>Claim and status</h2>
        </div>

        <FiUsers />
      </div>

      <div className="admin-ticket-assignment">
        <small>Assigned administrator</small>

        <strong>
          {getFullName(
            ticket.assigned_agent,
          )}
        </strong>

        {ticket.assigned_agent?.email && (
          <span>
            {ticket.assigned_agent.email}
          </span>
        )}
      </div>

      {canClaim && (
        <button
          type="button"
          className="admin-primary-button"
          onClick={onClaim}
          disabled={isBusy}
        >
          <FiUserCheck />

          {isBusy
            ? "Claiming..."
            : (
              ticket.assigned_agent
                ? "Take Over Ticket"
                : "Claim This Ticket"
            )}
        </button>
      )}

      {nextStatuses.length > 0 ? (
        <form
          className="admin-ticket-status-form"
          onSubmit={handleStatusSubmit}
        >
          <label>
            Next ticket status

            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(
                  event.target.value,
                )
              }
              disabled={
                isBusy
                || !canUpdateStatus
              }
            >
              <option value="">
                Select next status
              </option>

              {nextStatuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {normalizeLabel(status)}
                  </option>
                ),
              )}
            </select>
          </label>

          {!isAssignedToCurrentUser && (
            <div className="admin-ticket-warning">
              Claim this ticket before changing
              its status.
            </div>
          )}

          <button
            type="submit"
            className="admin-primary-button"
            disabled={
              isBusy
              || !selectedStatus
              || !canUpdateStatus
            }
          >
            <FiCheckCircle />

            {isBusy
              ? "Updating..."
              : "Update Status"}
          </button>
        </form>
      ) : (
        <div className="admin-ticket-terminal">
          This ticket is closed and cannot be
          modified.
        </div>
      )}
    </section>
  );
}


export default TicketStatusManager;