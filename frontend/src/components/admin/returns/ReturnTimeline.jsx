import {
  FiCheckCircle,
  FiCircle,
} from "react-icons/fi";


const timelineSteps = [
  {
    status: "REQUESTED",
    label: "Return requested",
    dateField: "created_at",
  },
  {
    status: "APPROVED",
    label: "Return approved",
    dateField: "reviewed_at",
  },
  {
    status: "PRODUCT_RECEIVED",
    label: "Product received",
    dateField: "received_at",
  },
  {
    status: "REFUNDED",
    label: "Refund completed",
    dateField: "refunded_at",
  },
];


const statusRank = {
  REQUESTED: 0,
  APPROVED: 1,
  PRODUCT_RECEIVED: 2,
  REFUNDED: 3,
};


function formatDate(value) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Pending";
  }

  return date.toLocaleString(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}


function ReturnTimeline({
  returnRequest,
}) {
  if (
    returnRequest.status === "REJECTED"
  ) {
    return (
      <section className="admin-return-card">
        <div className="admin-return-card__heading">
          <div>
            <span>Return progress</span>
            <h2>Status timeline</h2>
          </div>
        </div>

        <div className="admin-return-terminal-event admin-return-terminal-event--rejected">
          <FiCheckCircle />

          <div>
            <strong>Return rejected</strong>

            <span>
              {formatDate(
                returnRequest.reviewed_at,
              )}
            </span>
          </div>
        </div>
      </section>
    );
  }

  if (
    returnRequest.status === "CANCELLED"
  ) {
    return (
      <section className="admin-return-card">
        <div className="admin-return-card__heading">
          <div>
            <span>Return progress</span>
            <h2>Status timeline</h2>
          </div>
        </div>

        <div className="admin-return-terminal-event admin-return-terminal-event--cancelled">
          <FiCheckCircle />

          <div>
            <strong>
              Return cancelled by customer
            </strong>

            <span>
              {formatDate(
                returnRequest.cancelled_at,
              )}
            </span>
          </div>
        </div>
      </section>
    );
  }

  const currentRank =
    statusRank[
      returnRequest.status
    ] ?? 0;

  return (
    <section className="admin-return-card">
      <div className="admin-return-card__heading">
        <div>
          <span>Return progress</span>
          <h2>Status timeline</h2>
        </div>
      </div>

      <div className="admin-return-timeline">
        {timelineSteps.map(
          (step, index) => {
            const isComplete =
              currentRank >= index;

            return (
              <div
                key={step.status}
                className={
                  isComplete
                    ? (
                      "admin-return-timeline__step "
                      + "admin-return-timeline__step--complete"
                    )
                    : (
                      "admin-return-timeline__step"
                    )
                }
              >
                <span className="admin-return-timeline__icon">
                  {isComplete
                    ? <FiCheckCircle />
                    : <FiCircle />}
                </span>

                <div>
                  <strong>
                    {step.label}
                  </strong>

                  <span>
                    {formatDate(
                      returnRequest[
                        step.dateField
                      ],
                    )}
                  </span>
                </div>
              </div>
            );
          },
        )}
      </div>
    </section>
  );
}


export default ReturnTimeline;