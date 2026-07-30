import {
  FiCheckCircle,
  FiCircle,
} from "react-icons/fi";


const timelineSteps = [
  {
    status: "PENDING",
    label: "Order placed",
    dateField: "created_at",
  },
  {
    status: "CONFIRMED",
    label: "Order confirmed",
    dateField: "confirmed_at",
  },
  {
    status: "SHIPPED",
    label: "Order shipped",
    dateField: "shipped_at",
  },
  {
    status: "DELIVERED",
    label: "Order delivered",
    dateField: "delivered_at",
  },
];


const statusRank = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 1,
  SHIPPED: 2,
  DELIVERED: 3,
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


function OrderTimeline({
  order,
}) {
  if (order.status === "CANCELLED") {
    return (
      <section className="admin-order-card">
        <div className="admin-order-card__heading">
          <div>
            <span>Order progress</span>
            <h2>Status timeline</h2>
          </div>
        </div>

        <div className="admin-order-cancelled-timeline">
          <FiCheckCircle />

          <div>
            <strong>Order cancelled</strong>

            <span>
              {formatDate(order.cancelled_at)}
            </span>
          </div>
        </div>
      </section>
    );
  }

  const currentRank =
    statusRank[order.status] ?? 0;

  return (
    <section className="admin-order-card">
      <div className="admin-order-card__heading">
        <div>
          <span>Order progress</span>
          <h2>Status timeline</h2>
        </div>
      </div>

      <div className="admin-order-timeline">
        {timelineSteps.map(
          (step, index) => {
            const isComplete =
              currentRank >= index;

            const dateValue =
              order[step.dateField];

            return (
              <div
                key={step.status}
                className={
                  isComplete
                    ? (
                      "admin-order-timeline__step "
                      + "admin-order-timeline__step--complete"
                    )
                    : (
                      "admin-order-timeline__step"
                    )
                }
              >
                <span className="admin-order-timeline__icon">
                  {isComplete
                    ? <FiCheckCircle />
                    : <FiCircle />}
                </span>

                <div>
                  <strong>
                    {step.label}
                  </strong>

                  <span>
                    {formatDate(dateValue)}
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


export default OrderTimeline;