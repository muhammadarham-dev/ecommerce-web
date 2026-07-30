import {
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiMapPin,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";


function formatAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "0.00";
  }

  return amount.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}


function ShippingRatePreview({
  zone = null,
  method = null,
  charge = "0.00",
  freeShippingThreshold = "",
  estimatedMinDays = 3,
  estimatedMaxDays = 5,
  codAvailable = true,
  isActive = true,
}) {
  return (
    <aside className="admin-shipping-preview-card">
      <div className="admin-shipping-preview-card__heading">
        <div>
          <span>Live preview</span>
          <h2>Shipping option</h2>
        </div>

        <FiTruck />
      </div>

      <div className="admin-shipping-preview-location">
        <span>
          <FiMapPin />
        </span>

        <div>
          <small>Delivery zone</small>

          <strong>
            {zone?.name || "Select a zone"}
          </strong>

          <p>
            {[
              zone?.city,
              zone?.province,
              zone?.country,
            ]
              .filter(Boolean)
              .join(", ")
              || "Location not selected"}
          </p>
        </div>
      </div>

      <div className="admin-shipping-preview-method">
        <span>
          <FiTruck />
        </span>

        <div>
          <small>Shipping method</small>

          <strong>
            {method?.name
              || "Select a method"}
          </strong>

          <p>
            {method?.description
              || "Method details will appear here."}
          </p>
        </div>
      </div>

      <div className="admin-shipping-preview-grid">
        <div>
          <FiDollarSign />
          <small>Delivery charge</small>
          <strong>
            {formatAmount(charge)}
          </strong>
        </div>

        <div>
          <FiClock />
          <small>Estimated delivery</small>
          <strong>
            {estimatedMinDays}
            {" - "}
            {estimatedMaxDays}
            {" days"}
          </strong>
        </div>
      </div>

      <div className="admin-shipping-preview-details">
        <div>
          <span>Free shipping threshold</span>

          <strong>
            {freeShippingThreshold
              ? formatAmount(
                freeShippingThreshold,
              )
              : "Not configured"}
          </strong>
        </div>

        <div>
          <span>Cash on Delivery</span>

          <strong
            className={
              codAvailable
                ? "admin-shipping-positive"
                : "admin-shipping-negative"
            }
          >
            {codAvailable
              ? <FiCheckCircle />
              : <FiXCircle />}

            {codAvailable
              ? "Available"
              : "Unavailable"}
          </strong>
        </div>

        <div>
          <span>Rate status</span>

          <strong
            className={
              isActive
                ? "admin-shipping-positive"
                : "admin-shipping-negative"
            }
          >
            {isActive
              ? "Active"
              : "Inactive"}
          </strong>
        </div>
      </div>
    </aside>
  );
}


export default ShippingRatePreview;
