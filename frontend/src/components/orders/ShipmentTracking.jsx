import {
  useEffect,
  useState,
} from "react";

import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiPackage,
  FiTruck,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import {
  fetchShipmentForOrder,
} from "../../services/shipmentService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";

import {
  formatShipmentDay,
  formatShipmentValue,
  getShipmentStatusClass,
} from "../../utils/shipments";


function ShipmentTracking({
  orderNumber,
}) {
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

  useEffect(() => {
    if (!orderNumber) {
      setIsLoading(false);
      return undefined;
    }

    let isActive = true;

    async function loadShipment() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const shipmentData =
          await fetchShipmentForOrder(
            orderNumber,
          );

        if (isActive) {
          setShipment(shipmentData);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load shipment tracking.",
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
  }, [orderNumber]);

  if (isLoading) {
    return (
      <section className="order-shipment-widget loading">
        <div className="loading-spinner" />

        <p>Loading shipment tracking...</p>
      </section>
    );
  }

  if (!shipment) {
    return (
      <section className="order-shipment-widget empty">
        <FiPackage />

        <div>
          <h3>Shipment Not Created Yet</h3>

          <p>
            {errorMessage
              || (
                "Tracking information will appear "
                + "after the store creates the shipment."
              )}
          </p>
        </div>
      </section>
    );
  }

  const latestEvent =
    shipment.events?.[0] ?? null;

  return (
    <section className="order-shipment-widget">
      <div className="order-shipment-widget__header">
        <div className="order-shipment-widget__icon">
          {shipment.status === "DELIVERED"
            ? <FiCheckCircle />
            : <FiTruck />}
        </div>

        <div>
          <span>Shipment tracking</span>

          <h3>
            {shipment.shipment_number}
          </h3>
        </div>

        <span
          className={
            "shipment-status-badge "
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

      <div className="order-shipment-widget__details">
        <div>
          <FiTruck />

          <span>
            <small>Courier</small>

            <strong>
              {shipment.courier_name
                || "Will be assigned soon"}
            </strong>
          </span>
        </div>

        <div>
          <FiPackage />

          <span>
            <small>Tracking Number</small>

            <strong>
              {shipment.tracking_number
                || "Not assigned"}
            </strong>
          </span>
        </div>

        <div>
          <FiClock />

          <span>
            <small>
              Estimated Delivery
            </small>

            <strong>
              {formatShipmentDay(
                shipment
                  .estimated_delivery_date,
              )}
            </strong>
          </span>
        </div>
      </div>

      {latestEvent && (
        <div className="order-shipment-widget__latest">
          <FiMapPin />

          <div>
            <strong>
              {latestEvent.message
                || formatShipmentValue(
                  latestEvent.status,
                )}
            </strong>

            <span>
              {latestEvent.location
                || "Location unavailable"}
            </span>
          </div>
        </div>
      )}

      <Link
        to={
          `/shipments/${
            shipment.shipment_number
          }`
        }
        className="order-shipment-widget__link"
      >
        View Full Tracking
        <FiArrowRight />
      </Link>
    </section>
  );
}


export default ShipmentTracking;