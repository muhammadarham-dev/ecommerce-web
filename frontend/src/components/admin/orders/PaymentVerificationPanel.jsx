import {
  useState,
} from "react";

import {
  FiCheckCircle,
  FiExternalLink,
  FiRefreshCw,
  FiXCircle,
} from "react-icons/fi";

import {
  resolveMediaUrl,
} from "../../../utils/media";


function normalizeLabel(value) {
  return String(value ?? "Unknown")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}


function formatDate(value) {
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


function PaymentVerificationPanel({
  payment,
  formatMoney,
  isBusy,
  onVerify,
  onReject,
  onRefund,
}) {
  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  if (!payment) {
    return (
      <section className="admin-order-card">
        <div className="admin-order-card__heading">
          <div>
            <span>Payment record</span>
            <h2>Payment verification</h2>
          </div>
        </div>

        <div className="admin-orders-empty admin-orders-empty--compact">
          <p>
            No payment record is available for
            this order.
          </p>
        </div>
      </section>
    );
  }

  const proofUrl =
    resolveMediaUrl(payment.proof);

  const handleReject = () => {
    const normalizedReason =
      rejectionReason.trim();

    if (!normalizedReason) {
      return;
    }

    onReject(normalizedReason);
  };

  return (
    <section className="admin-order-card">
      <div className="admin-order-card__heading">
        <div>
          <span>Payment record</span>
          <h2>Payment verification</h2>
        </div>

        <span
          className={
            `admin-payment-badge admin-payment-badge--${
              String(
                payment.status || "unknown",
              ).toLowerCase()
            }`
          }
        >
          {normalizeLabel(payment.status)}
        </span>
      </div>

      <div className="admin-payment-details-grid">
        <div>
          <small>Payment number</small>
          <strong>
            {payment.payment_number}
          </strong>
        </div>

        <div>
          <small>Method</small>
          <strong>
            {normalizeLabel(payment.method)}
          </strong>
        </div>

        <div>
          <small>Amount</small>
          <strong>
            {formatMoney(payment.amount)}
          </strong>
        </div>

        <div>
          <small>Reference</small>
          <strong>
            {payment.transaction_reference
              || "Not submitted"}
          </strong>
        </div>

        <div>
          <small>Submitted</small>
          <strong>
            {formatDate(payment.submitted_at)}
          </strong>
        </div>

        <div>
          <small>Verified by</small>
          <strong>
            {payment.verified_by_username
              || "Not verified"}
          </strong>
        </div>
      </div>

      {proofUrl && (
        <a
          href={proofUrl}
          target="_blank"
          rel="noreferrer"
          className="admin-payment-proof-link"
        >
          <FiExternalLink />
          Open payment proof
        </a>
      )}

      {payment.rejection_reason && (
        <div className="admin-order-warning">
          <strong>Rejection reason:</strong>{" "}
          {payment.rejection_reason}
        </div>
      )}

      {payment.status === "SUBMITTED" && (
        <div className="admin-payment-actions">
          <button
            type="button"
            className="admin-primary-button"
            onClick={onVerify}
            disabled={isBusy}
          >
            <FiCheckCircle />
            {isBusy
              ? "Processing..."
              : "Verify Payment"}
          </button>

          <div className="admin-payment-reject-box">
            <textarea
              value={rejectionReason}
              onChange={(event) =>
                setRejectionReason(
                  event.target.value,
                )
              }
              placeholder={
                "Enter a clear rejection reason"
              }
              maxLength="2000"
              disabled={isBusy}
            />

            <button
              type="button"
              className="admin-danger-button"
              onClick={handleReject}
              disabled={
                isBusy
                || !rejectionReason.trim()
              }
            >
              <FiXCircle />
              Reject Payment
            </button>
          </div>
        </div>
      )}

      {payment.status === "PAID" && (
        <button
          type="button"
          className="admin-secondary-button"
          onClick={onRefund}
          disabled={isBusy}
        >
          <FiRefreshCw />
          {isBusy
            ? "Processing..."
            : "Mark as Refunded"}
        </button>
      )}
    </section>
  );
}


export default PaymentVerificationPanel;