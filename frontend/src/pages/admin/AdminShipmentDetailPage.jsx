import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiCalendar,
  FiExternalLink,
  FiMail,
  FiRefreshCw,
  FiTruck,
  FiUser,
} from "react-icons/fi";

import {
  Link,
  useParams,
} from "react-router-dom";

import ShipmentStatusManager from
  "../../components/admin/shipments/ShipmentStatusManager";

import ShipmentTimeline from
  "../../components/admin/shipments/ShipmentTimeline";

import {
  fetchAdminShipment,
  updateAdminShipment,
} from "../../services/adminShipmentService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";

function normalizeLabel(value) {
  return String(value ?? "Unknown")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) => character.toUpperCase(),
    );
}

function formatDate(value, includeTime = false) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return includeTime
    ? date.toLocaleString(
      "en-US",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    )
    : date.toLocaleDateString(
      "en-US",
      {
        dateStyle: "medium",
      },
    );
}

function AdminShipmentDetailPage() {
  const { shipmentNumber } = useParams();

  const [shipment, setShipment] =
    useState(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [isUpdating, setIsUpdating] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [noticeMessage, setNoticeMessage] =
    useState("");

  const loadShipment = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await fetchAdminShipment(
        shipmentNumber,
      );
      setShipment(data);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to load this shipment.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [shipmentNumber]);

  useEffect(() => {
    loadShipment();
  }, [loadShipment]);

  const handleUpdate = async (values) => {
    setIsUpdating(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const result = await updateAdminShipment(
        shipmentNumber,
        values,
      );

      setShipment(result.shipment);
      setNoticeMessage(
        result.message
        || "Shipment updated successfully.",
      );
      return true;
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to update this shipment.",
        ),
      );
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-shipments-state">
        <div className="admin-loading-spinner" />
        <p>Loading shipment details...</p>
      </div>
    );
  }

  if (!shipment) {
    return (
      <section className="admin-shipments-page">
        <div className="admin-form-message admin-form-message--error">
          {errorMessage || "Shipment not found."}
        </div>
      </section>
    );
  }

  return (
    <section className="admin-shipment-detail-page">
      <div className="admin-shipment-detail-page__heading">
        <div>
          <Link
            to="/admin/shipments"
            className="admin-shipment-back-link"
          >
            <FiArrowLeft />
            Back to Shipments
          </Link>

          <span className="admin-shipments-eyebrow">
            Shipment details
          </span>

          <h1>{shipment.shipment_number}</h1>

          <p>
            Tracking{" "}
            {shipment.tracking_number
              || "not assigned"}
          </p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={loadShipment}
          disabled={isLoading}
        >
          <FiRefreshCw />
          Refresh
        </button>
      </div>

      {noticeMessage && (
        <div className="admin-form-message admin-form-message--success">
          {noticeMessage}
        </div>
      )}

      {errorMessage && (
        <div className="admin-form-message admin-form-message--error">
          {errorMessage}
        </div>
      )}

      <div className="admin-shipment-detail-summary">
        <div>
          <small>Status</small>
          <span
            className={
              `admin-shipment-status admin-shipment-status--${String(
                shipment.status,
              ).toLowerCase()}`
            }
          >
            {normalizeLabel(shipment.status)}
          </span>
        </div>

        <div>
          <small>Courier</small>
          <strong>
            {shipment.courier_name
              || "Not assigned"}
          </strong>
        </div>

        <div>
          <small>Estimated delivery</small>
          <strong>
            {formatDate(
              shipment.estimated_delivery_date,
            )}
          </strong>
        </div>

        <div>
          <small>Last updated</small>
          <strong>
            {formatDate(
              shipment.updated_at,
              true,
            )}
          </strong>
        </div>
      </div>

      <div className="admin-shipment-detail-grid">
        <div className="admin-shipment-detail-main">
          <ShipmentTimeline
            events={shipment.events ?? []}
          />

          <section className="admin-shipment-card">
            <div className="admin-shipment-card__heading">
              <div>
                <span>Delivery lifecycle</span>
                <h2>Important dates</h2>
              </div>
              <FiCalendar />
            </div>

            <div className="admin-shipment-date-grid">
              <div>
                <small>Created</small>
                <strong>
                  {formatDate(
                    shipment.created_at,
                    true,
                  )}
                </strong>
              </div>

              <div>
                <small>Shipped</small>
                <strong>
                  {formatDate(
                    shipment.shipped_at,
                    true,
                  )}
                </strong>
              </div>

              <div>
                <small>Delivered</small>
                <strong>
                  {formatDate(
                    shipment.delivered_at,
                    true,
                  )}
                </strong>
              </div>
            </div>
          </section>
        </div>

        <aside className="admin-shipment-detail-sidebar">
          <ShipmentStatusManager
            shipment={shipment}
            isSubmitting={isUpdating}
            onSubmit={handleUpdate}
          />

          <section className="admin-shipment-card">
            <div className="admin-shipment-card__heading">
              <div>
                <span>Order</span>
                <h2>Related order</h2>
              </div>
              <FiTruck />
            </div>

            <div className="admin-shipment-info-list">
              <div>
                <small>Order number</small>
                <Link
                  to={`/admin/orders/${encodeURIComponent(
                    shipment.order_number,
                  )}`}
                  className="admin-shipment-order-link"
                >
                  {shipment.order_number}
                  <FiExternalLink />
                </Link>
              </div>

              <div>
                <small>Tracking number</small>
                <strong>
                  {shipment.tracking_number
                    || "Not assigned"}
                </strong>
              </div>
            </div>
          </section>

          <section className="admin-shipment-card">
            <div className="admin-shipment-card__heading">
              <div>
                <span>Customer</span>
                <h2>Recipient details</h2>
              </div>
              <FiUser />
            </div>

            <div className="admin-shipment-info-list">
              <div>
                <small>Username</small>
                <strong>
                  {shipment.customer_username}
                </strong>
              </div>

              <div>
                <small>Email</small>
                <strong className="admin-shipment-email">
                  <FiMail />
                  {shipment.customer_email}
                </strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

export default AdminShipmentDetailPage;