import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiRotateCcw,
} from "react-icons/fi";


const statusTransitions = {
  REQUESTED: [
    "APPROVED",
    "REJECTED",
  ],
  APPROVED: [
    "PRODUCT_RECEIVED",
  ],
  PRODUCT_RECEIVED: [
    "REFUNDED",
  ],
  REJECTED: [],
  REFUNDED: [],
  CANCELLED: [],
};


function normalizeLabel(value) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}


function getActionLabel(status) {
  const labels = {
    APPROVED: "Approve Return",
    REJECTED: "Reject Return",
    PRODUCT_RECEIVED:
      "Mark Product Received",
    REFUNDED: "Complete Refund",
  };

  return labels[status] || "Update Return";
}


function ReturnStatusManager({
  returnRequest,
  isSubmitting,
  onSubmit,
}) {
  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("");

  const [
    adminNote,
    setAdminNote,
  ] = useState("");

  useEffect(() => {
    setSelectedStatus("");
    setAdminNote(
      returnRequest?.admin_note || "",
    );
  }, [
    returnRequest?.admin_note,
    returnRequest?.return_number,
    returnRequest?.status,
  ]);

  const nextStatuses = useMemo(
    () =>
      statusTransitions[
        returnRequest?.status
      ] ?? [],
    [returnRequest?.status],
  );

  const isTerminal =
    nextStatuses.length === 0;

  const handleSubmit = (
    event,
  ) => {
    event.preventDefault();

    if (!selectedStatus) {
      return;
    }

    onSubmit({
      status: selectedStatus,
      adminNote,
    });
  };

  return (
    <section className="admin-return-card">
      <div className="admin-return-card__heading">
        <div>
          <span>Return controls</span>
          <h2>Status management</h2>
        </div>

        <FiRotateCcw />
      </div>

      <div className="admin-return-current-status">
        <small>Current status</small>

        <strong>
          {normalizeLabel(
            returnRequest.status,
          )}
        </strong>
      </div>

      {isTerminal ? (
        <div className="admin-return-terminal">
          This return request is complete and
          cannot move to another status.
        </div>
      ) : (
        <form
          className="admin-return-status-form"
          onSubmit={handleSubmit}
        >
          <label>
            Next status

            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(
                  event.target.value,
                )
              }
              disabled={isSubmitting}
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

          <label>
            Admin note

            <textarea
              value={adminNote}
              onChange={(event) =>
                setAdminNote(
                  event.target.value,
                )
              }
              placeholder={
                selectedStatus === "REJECTED"
                  ? (
                    "Explain why the return "
                    + "request was rejected"
                  )
                  : (
                    "Add an internal note "
                    + "for this status update"
                  )
              }
              maxLength="2000"
              disabled={isSubmitting}
            />
          </label>

          {selectedStatus
            === "PRODUCT_RECEIVED" && (
            <div className="admin-return-info">
              Marking the product as received
              restores the returned quantity to
              inventory.
            </div>
          )}

          {selectedStatus
            === "REFUNDED" && (
            <div className="admin-return-warning">
              Confirm the refund was processed
              before completing this action.
            </div>
          )}

          <button
            type="submit"
            className="admin-primary-button"
            disabled={
              isSubmitting
              || !selectedStatus
            }
          >
            <FiCheckCircle />

            {isSubmitting
              ? "Updating..."
              : getActionLabel(
                selectedStatus,
              )}
          </button>
        </form>
      )}
    </section>
  );
}


export default ReturnStatusManager;