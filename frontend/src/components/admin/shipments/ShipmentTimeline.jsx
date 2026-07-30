import {
  FiCheckCircle,
  FiMapPin,
} from "react-icons/fi";

function normalizeLabel(value) {
  return String(value ?? "Unknown")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) => character.toUpperCase(),
    );
}

function formatDateTime(value) {
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

function ShipmentTimeline({
  events = [],
}) {
  return (
    <section className="admin-shipment-card">
      <div className="admin-shipment-card__heading">
        <div>
          <span>Tracking history</span>
          <h2>Shipment timeline</h2>
        </div>

        <strong>
          {events.length} event
          {events.length === 1 ? "" : "s"}
        </strong>
      </div>

      {events.length === 0 ? (
        <div className="admin-shipments-empty admin-shipments-empty--compact">
          <p>No shipment events are available.</p>
        </div>
      ) : (
        <div className="admin-shipment-timeline">
          {events.map((event) => (
            <article
              key={event.id}
              className="admin-shipment-timeline__event"
            >
              <span className="admin-shipment-timeline__icon">
                <FiCheckCircle />
              </span>

              <div>
                <div className="admin-shipment-timeline__heading">
                  <strong>
                    {normalizeLabel(event.status)}
                  </strong>

                  <time>
                    {formatDateTime(
                      event.created_at,
                    )}
                  </time>
                </div>

                <p>
                  {event.message
                    || "Shipment status updated."}
                </p>

                {event.location && (
                  <span className="admin-shipment-location">
                    <FiMapPin />
                    {event.location}
                  </span>
                )}

                {event.created_by_username && (
                  <small>
                    Updated by{" "}
                    {event.created_by_username}
                  </small>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default ShipmentTimeline;