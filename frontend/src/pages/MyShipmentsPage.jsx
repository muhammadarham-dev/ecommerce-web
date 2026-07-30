import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiArrowRight,
  FiClock,
  FiMapPin,
  FiPackage,
  FiSearch,
  FiTruck,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import {
  fetchShipments,
} from "../services/shipmentService";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  formatShipmentDay,
  formatShipmentDate,
  formatShipmentValue,
  getShipmentStatusClass,
  shipmentStatusOptions,
} from "../utils/shipments";


function MyShipmentsPage() {
  const [
    shipments,
    setShipments,
  ] = useState([]);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadShipments() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const shipmentData =
          await fetchShipments();

        if (isActive) {
          setShipments(shipmentData);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load your shipments.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadShipments();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredShipments = useMemo(
    () => {
      const normalizedSearch =
        searchTerm.trim().toLowerCase();

      return shipments.filter(
        (shipment) => {
          const matchesStatus =
            !statusFilter
            || shipment.status
              === statusFilter;

          const searchableText = [
            shipment.shipment_number,
            shipment.order_number,
            shipment.tracking_number,
            shipment.courier_name,
            shipment.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !normalizedSearch
            || searchableText.includes(
              normalizedSearch,
            );

          return (
            matchesStatus
            && matchesSearch
          );
        },
      );
    },
    [
      shipments,
      searchTerm,
      statusFilter,
    ],
  );

  return (
    <section className="shipments-page">
      <div className="shipment-page-header">
        <div className="container">
          <span className="section-label">
            Delivery tracking
          </span>

          <h1>My Shipments</h1>

          <p>
            Track courier information, shipment
            status and estimated delivery dates.
          </p>
        </div>
      </div>

      <div className="container shipments-content">
        <div className="shipments-toolbar">
          <div className="shipments-search">
            <FiSearch />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value,
                )
              }
              placeholder={
                "Search shipment, order, "
                + "courier or tracking number"
              }
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value,
              )
            }
          >
            {shipmentStatusOptions.map(
              (option) => (
                <option
                  key={
                    option.value
                    || "all"
                  }
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>
        </div>

        {errorMessage && (
          <div className="store-message error">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="shipments-empty">
            <div className="loading-spinner" />

            <p>Loading shipments...</p>
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="shipments-empty">
            <FiTruck />

            <h2>No Shipments Found</h2>

            <p>
              Shipment tracking will appear after
              your confirmed order is prepared.
            </p>

            <Link
              to="/orders"
              className="primary-button"
            >
              View My Orders
            </Link>
          </div>
        ) : (
          <div className="shipments-list">
            {filteredShipments.map(
              (shipment) => {
                const latestEvent =
                  shipment.events?.[0]
                  ?? null;

                return (
                  <article
                    key={shipment.id}
                    className="shipment-list-card"
                  >
                    <div className="shipment-list-card__header">
                      <div>
                        <span>
                          Shipment Number
                        </span>

                        <h2>
                          {
                            shipment
                              .shipment_number
                          }
                        </h2>

                        <small>
                          Created
                          {" "}
                          {formatShipmentDate(
                            shipment.created_at,
                          )}
                        </small>
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

                    <div className="shipment-list-card__body">
                      <div>
                        <FiPackage />

                        <span>
                          <small>
                            Order Number
                          </small>

                          <Link
                            to={
                              `/orders/${
                                shipment
                                  .order_number
                              }`
                            }
                          >
                            {
                              shipment
                                .order_number
                            }
                          </Link>
                        </span>
                      </div>

                      <div>
                        <FiTruck />

                        <span>
                          <small>Courier</small>

                          <strong>
                            {shipment.courier_name
                              || "Not assigned"}
                          </strong>
                        </span>
                      </div>

                      <div>
                        <FiPackage />

                        <span>
                          <small>
                            Tracking Number
                          </small>

                          <strong>
                            {shipment
                              .tracking_number
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

                    <div className="shipment-list-card__footer">
                      <div>
                        <FiMapPin />

                        <span>
                          {latestEvent?.message
                            || (
                              "Shipment tracking "
                              + "has started."
                            )}
                        </span>
                      </div>

                      <Link
                        to={
                          `/shipments/${
                            shipment
                              .shipment_number
                          }`
                        }
                      >
                        Track Shipment
                        <FiArrowRight />
                      </Link>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </div>
    </section>
  );
}


export default MyShipmentsPage;