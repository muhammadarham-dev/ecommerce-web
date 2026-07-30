import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiMapPin,
  FiPackage,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  fetchShipment,
} from "../services/shipmentService";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  formatShipmentDate,
  formatShipmentDay,
  formatShipmentValue,
  getShipmentStatusClass,
  isShipmentTerminal,
  shipmentProgressSteps,
} from "../utils/shipments";


function ShipmentDetailPage() {
  const {
    shipmentNumber,
  } = useParams();

  const [
    shipment,
    setShipment,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    copied,
    setCopied,
  ] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadShipment() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const shipmentData =
          await fetchShipment(
            shipmentNumber,
          );

        if (isActive) {
          setShipment(shipmentData);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load shipment details.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadShipment();

    return () => {
      isActive = false;
    };
  }, [shipmentNumber]);

  const orderedEvents = useMemo(
    () => (
      [...(shipment?.events ?? [])]
        .sort(
          (firstEvent, secondEvent) =>
            new Date(
              firstEvent.created_at,
            ).getTime()
            - new Date(
              secondEvent.created_at,
            ).getTime(),
        )
    ),
    [shipment],
  );

  const handleCopyTracking = async () => {
    if (!shipment?.tracking_number) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        shipment.tracking_number,
      );

      setCopied(true);

      window.setTimeout(
        () => setCopied(false),
        1800,
      );
    } catch {
      setErrorMessage(
        "Unable to copy tracking number.",
      );
    }
  };

  if (isLoading) {
    return (
      <section className="route-loading">
        <div className="loading-spinner" />

        <p>Loading shipment tracking...</p>
      </section>
    );
  }

  if (!shipment) {
    return (
      <section className="shipment-page">
        <div className="container shipment-empty-card">
          <FiAlertTriangle />

          <h1>Shipment Unavailable</h1>

          <p>
            {errorMessage
              || (
                "The requested shipment could "
                + "not be found."
              )}
          </p>

          <Link
            to="/shipments"
            className="primary-button"
          >
            <FiArrowLeft />
            Back to My Shipments
          </Link>
        </div>
      </section>
    );
  }

  const currentStepIndex =
    shipmentProgressSteps.indexOf(
      shipment.status,
    );

  const terminalShipment =
    isShipmentTerminal(
      shipment.status,
    );

  return (
    <section className="shipment-page">
      <div className="shipment-page-header">
        <div className="container">
          <Link
            to="/shipments"
            className="shipment-back-link"
          >
            <FiArrowLeft />
            Back to My Shipments
          </Link>

          <div className="shipment-detail-title">
            <div>
              <span className="section-label">
                Shipment tracking
              </span>

              <h1>
                {shipment.shipment_number}
              </h1>

              <p>
                Order
                {" "}
                {shipment.order_number}
              </p>
            </div>

            <span
              className={
                "shipment-status-badge large "
                + getShipmentStatusClass(
                  shipment.status,
                )
              }
            >
              {formatShipmentValue(
                shipment.status,
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="container shipment-detail-content">
        {errorMessage && (
          <div className="store-message error">
            {errorMessage}
          </div>
        )}

        <section className="shipment-progress-card">
          {terminalShipment ? (
            <div className="shipment-terminal-state">
              <FiXCircle />

              <div>
                <h2>
                  {formatShipmentValue(
                    shipment.status,
                  )}
                </h2>

                <p>
                  Check the latest shipment event
                  below for additional information.
                </p>
              </div>
            </div>
          ) : (
            <div className="shipment-progress">
              {shipmentProgressSteps.map(
                (step, index) => {
                  const isComplete =
                    index <= currentStepIndex;

                  return (
                    <div
                      key={step}
                      className={
                        isComplete
                          ? (
                            "shipment-progress-step "
                            + "complete"
                          )
                          : (
                            "shipment-progress-step"
                          )
                      }
                    >
                      <span>
                        {isComplete
                          ? <FiCheck />
                          : index + 1}
                      </span>

                      <strong>
                        {formatShipmentValue(
                          step,
                        )}
                      </strong>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </section>

        <div className="shipment-detail-layout">
          <main className="shipment-detail-main">
            <section className="shipment-card">
              <div className="shipment-card-heading">
                <FiMapPin />

                <div>
                  <span>Tracking history</span>
                  <h2>Shipment Timeline</h2>
                </div>
              </div>

              {orderedEvents.length === 0 ? (
                <div className="shipment-events-empty">
                  <FiClock />

                  <p>
                    No shipment events have been
                    recorded yet.
                  </p>
                </div>
              ) : (
                <div className="shipment-timeline">
                  {orderedEvents.map(
                    (event, index) => (
                      <article
                        key={event.id}
                        className="shipment-timeline-event"
                      >
                        <div className="shipment-timeline-marker">
                          <span>
                            {index
                              === orderedEvents.length
                                - 1
                              ? <FiTruck />
                              : <FiCheck />}
                          </span>
                        </div>

                        <div className="shipment-timeline-content">
                          <div>
                            <strong>
                              {formatShipmentValue(
                                event.status,
                              )}
                            </strong>

                            <time>
                              {formatShipmentDate(
                                event.created_at,
                              )}
                            </time>
                          </div>

                          <p>
                            {event.message
                              || (
                                "Shipment status "
                                + "updated."
                              )}
                          </p>

                          {event.location && (
                            <span>
                              <FiMapPin />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}
            </section>
          </main>

          <aside className="shipment-detail-sidebar">
            <section className="shipment-card">
              <div className="shipment-card-heading">
                <FiTruck />

                <div>
                  <span>
                    Courier information
                  </span>

                  <h2>Tracking Details</h2>
                </div>
              </div>

              <div className="shipment-summary-details">
                <div>
                  <span>Courier</span>

                  <strong>
                    {shipment.courier_name
                      || "Not assigned"}
                  </strong>
                </div>

                <div>
                  <span>Tracking Number</span>

                  <div className="shipment-tracking-number">
                    <strong>
                      {shipment.tracking_number
                        || "Not assigned"}
                    </strong>

                    {shipment.tracking_number && (
                      <button
                        type="button"
                        onClick={
                          handleCopyTracking
                        }
                        aria-label={
                          "Copy tracking number"
                        }
                      >
                        {copied
                          ? <FiCheckCircle />
                          : <FiCopy />}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <span>
                    Estimated Delivery
                  </span>

                  <strong>
                    {formatShipmentDay(
                      shipment
                        .estimated_delivery_date,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Shipped At</span>

                  <strong>
                    {formatShipmentDate(
                      shipment.shipped_at,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Delivered At</span>

                  <strong>
                    {formatShipmentDate(
                      shipment.delivered_at,
                    )}
                  </strong>
                </div>
              </div>
            </section>

            <section className="shipment-card">
              <div className="shipment-card-heading">
                <FiPackage />

                <div>
                  <span>Related order</span>
                  <h2>Order Information</h2>
                </div>
              </div>

              <div className="shipment-order-information">
                <div>
                  <span>Order Number</span>

                  <Link
                    to={
                      `/orders/${
                        shipment.order_number
                      }`
                    }
                  >
                    {shipment.order_number}
                  </Link>
                </div>

                <div>
                  <span>Shipment Created</span>

                  <strong>
                    {formatShipmentDate(
                      shipment.created_at,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Last Updated</span>

                  <strong>
                    {formatShipmentDate(
                      shipment.updated_at,
                    )}
                  </strong>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}


export default ShipmentDetailPage;