import {
  useEffect,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiCreditCard,
  FiFile,
  FiLock,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  fetchOrder,
} from "../services/orderService";

import {
  fetchPaymentByOrder,
  submitBankTransfer,
} from "../services/paymentService";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  formatCurrency,
} from "../utils/currency";


function getFieldError(
  error,
  fieldName,
) {
  const responseData =
    error.response?.data;

  const details =
    responseData?.error?.details
    ?? responseData;

  const fieldError =
    details?.[fieldName];

  if (Array.isArray(fieldError)) {
    return String(fieldError[0]);
  }

  if (typeof fieldError === "string") {
    return fieldError;
  }

  return "";
}


function formatStatus(value) {
  if (!value) {
    return "Unknown";
  }

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}


function BankTransferPage() {
  const {
    orderNumber,
  } = useParams();

  const [
    order,
    setOrder,
  ] = useState(null);

  const [
    payment,
    setPayment,
  ] = useState(null);

  const [
    transactionReference,
    setTransactionReference,
  ] = useState("");

  const [
    proof,
    setProof,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    fieldErrors,
    setFieldErrors,
  ] = useState({});

  useEffect(() => {
    let isActive = true;

    async function loadPaymentInformation() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [
          orderData,
          paymentData,
        ] = await Promise.all([
          fetchOrder(orderNumber),
          fetchPaymentByOrder(orderNumber),
        ]);

        if (!isActive) {
          return;
        }

        setOrder(orderData);
        setPayment(paymentData);

        setTransactionReference(
          paymentData.transaction_reference
          ?? "",
        );
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load payment information.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadPaymentInformation();

    return () => {
      isActive = false;
    };
  }, [orderNumber]);

  const handleReferenceChange = (
    event,
  ) => {
    setTransactionReference(
      event.target.value,
    );

    setFieldErrors(
      (currentErrors) => ({
        ...currentErrors,
        transaction_reference: "",
      }),
    );

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleFileChange = (
    event,
  ) => {
    const selectedFile =
      event.target.files?.[0]
      ?? null;

    setProof(selectedFile);

    setFieldErrors(
      (currentErrors) => ({
        ...currentErrors,
        proof: "",
      }),
    );

    setErrorMessage("");
    setSuccessMessage("");
  };

  const validateForm = () => {
    const errors = {};

    if (!transactionReference.trim()) {
      errors.transaction_reference =
        "Transaction reference is required.";
    }

    if (!proof) {
      errors.proof =
        "Payment proof file is required.";
    }

    setFieldErrors(errors);

    return (
      Object.keys(errors).length === 0
    );
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    setFieldErrors({});

    try {
      const result =
        await submitBankTransfer({
          orderNumber,
          transactionReference:
            transactionReference.trim(),
          proof,
        });

      setPayment(result.payment);
      setSuccessMessage(
        result.message
        ?? "Payment proof submitted successfully.",
      );

      setProof(null);

      const fileInput =
        document.getElementById(
          "payment-proof",
        );

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      setFieldErrors({
        transaction_reference:
          getFieldError(
            error,
            "transaction_reference",
          ),

        proof:
          getFieldError(
            error,
            "proof",
          ),
      });

      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to submit payment proof.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="route-loading">
        <div className="loading-spinner" />

        <p>
          Loading payment information...
        </p>
      </section>
    );
  }

  if (!order || !payment) {
    return (
      <section className="payment-page">
        <div className="container payment-unavailable-card">
          <FiAlertCircle />

          <h1>
            Payment Information Unavailable
          </h1>

          <p>
            {errorMessage
              || (
                "The requested payment "
                + "could not be loaded."
              )}
          </p>

          <Link
            to="/orders"
            className="primary-button"
          >
            <FiArrowLeft />
            Return to Orders
          </Link>
        </div>
      </section>
    );
  }

  const isBankTransfer =
    order.payment_method
    === "BANK_TRANSFER";

  const isPaid =
    payment.status === "PAID"
    || order.payment_status === "PAID";

  const isSubmitted =
    payment.status === "SUBMITTED"
    || Boolean(payment.submitted_at);

  const isRejected =
    payment.status === "REJECTED";

  return (
    <section className="payment-page">
      <div className="payment-page-header">
        <div className="container">
          <span className="section-label">
            Secure payment
          </span>

          <h1>Bank Transfer Payment</h1>

          <p>
            Submit your bank transaction
            reference and payment proof for
            verification.
          </p>
        </div>
      </div>

      <div className="container payment-layout">
        <div className="payment-main-card">
          <div className="payment-card-heading">
            <div className="payment-heading-icon">
              <FiCreditCard />
            </div>

            <div>
              <span>
                Order payment
              </span>

              <h2>
                Submit Transfer Proof
              </h2>
            </div>
          </div>

          {successMessage && (
            <div className="store-message success">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="store-message error">
              {errorMessage}
            </div>
          )}

          {!isBankTransfer ? (
            <div className="payment-method-message">
              <FiAlertCircle />

              <div>
                <h3>
                  Bank transfer is not required
                </h3>

                <p>
                  This order uses Cash on
                  Delivery. Payment will be
                  collected when the order
                  arrives.
                </p>
              </div>
            </div>
          ) : isPaid ? (
            <div className="payment-state-card paid">
              <FiCheck />

              <div>
                <h3>
                  Payment verified
                </h3>

                <p>
                  Your payment has been
                  successfully verified.
                </p>
              </div>
            </div>
          ) : (
            <>
              {isSubmitted
                && !isRejected && (
                  <div className="payment-state-card pending">
                    <FiClock />

                    <div>
                      <h3>
                        Proof submitted
                      </h3>

                      <p>
                        Your payment proof is
                        waiting for verification.
                        You may submit a new file
                        when correction is needed.
                      </p>
                    </div>
                  </div>
                )}

              {isRejected && (
                <div className="payment-state-card rejected">
                  <FiX />

                  <div>
                    <h3>
                      Payment proof rejected
                    </h3>

                    <p>
                      {payment.rejection_reason
                        || (
                          "Please verify your "
                          + "transaction details "
                          + "and submit new proof."
                        )}
                    </p>
                  </div>
                </div>
              )}

              <div className="bank-instruction-card">
                <FiAlertCircle />

                <div>
                  <strong>
                    Before submitting
                  </strong>

                  <p>
                    Transfer the exact order
                    amount using the bank details
                    provided by the store. Enter
                    the bank transaction reference
                    exactly as shown on your
                    receipt.
                  </p>
                </div>
              </div>

              <form
                className="payment-proof-form"
                onSubmit={handleSubmit}
              >
                <label>
                  Transaction reference

                  <div
                    className={
                      fieldErrors
                        .transaction_reference
                        ? (
                          "payment-input-group "
                          + "input-error"
                        )
                        : "payment-input-group"
                    }
                  >
                    <FiCreditCard />

                    <input
                      type="text"
                      value={
                        transactionReference
                      }
                      onChange={
                        handleReferenceChange
                      }
                      placeholder="Enter bank transaction reference"
                      maxLength="100"
                      autoComplete="off"
                    />
                  </div>

                  {fieldErrors
                    .transaction_reference && (
                      <small className="field-error">
                        {
                          fieldErrors
                            .transaction_reference
                        }
                      </small>
                    )}
                </label>

                <label>
                  Payment proof

                  <div
                    className={
                      fieldErrors.proof
                        ? (
                          "payment-file-input "
                          + "input-error"
                        )
                        : "payment-file-input"
                    }
                  >
                    <input
                      id="payment-proof"
                      type="file"
                      onChange={
                        handleFileChange
                      }
                    />

                    <FiUploadCloud />

                    <div>
                      <strong>
                        {proof
                          ? proof.name
                          : "Choose payment proof"}
                      </strong>

                      <span>
                        Upload the receipt or
                        transaction screenshot.
                      </span>
                    </div>
                  </div>

                  {fieldErrors.proof && (
                    <small className="field-error">
                      {fieldErrors.proof}
                    </small>
                  )}
                </label>

                {proof && (
                  <div className="selected-proof-card">
                    <FiFile />

                    <div>
                      <strong>
                        {proof.name}
                      </strong>

                      <span>
                        {(
                          proof.size
                          / 1024
                          / 1024
                        ).toFixed(2)}
                        {" MB"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setProof(null);

                        const fileInput =
                          document
                            .getElementById(
                              "payment-proof",
                            );

                        if (fileInput) {
                          fileInput.value = "";
                        }
                      }}
                      aria-label="Remove selected file"
                    >
                      <FiX />
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className="payment-submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Submitting Proof..."
                    : (
                      isSubmitted
                        ? "Submit Updated Proof"
                        : "Submit Payment Proof"
                    )}

                  {!isSubmitting && (
                    <FiUploadCloud />
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <aside className="payment-summary-card">
          <span className="section-label">
            Payment summary
          </span>

          <h2>{order.order_number}</h2>

          <div className="payment-summary-details">
            <div>
              <span>Order Status</span>

              <strong>
                {formatStatus(order.status)}
              </strong>
            </div>

            <div>
              <span>Payment Method</span>

              <strong>
                {order.payment_method
                  === "BANK_TRANSFER"
                  ? "Bank Transfer"
                  : "Cash on Delivery"}
              </strong>
            </div>

            <div>
              <span>Payment Status</span>

              <strong>
                {formatStatus(
                  payment.status
                  ?? order.payment_status,
                )}
              </strong>
            </div>

            <div>
              <span>Payment Number</span>

              <strong>
                {payment.payment_number}
              </strong>
            </div>
          </div>

          <div className="payment-total">
            <span>Amount to Pay</span>

            <strong>
              {formatCurrency(
                payment.amount
                ?? order.total_amount,
              )}
            </strong>
          </div>

          {payment.transaction_reference && (
            <div className="payment-reference-card">
              <span>
                Submitted Reference
              </span>

              <strong>
                {
                  payment
                    .transaction_reference
                }
              </strong>
            </div>
          )}

          <div className="payment-security-note">
            <FiLock />

            <span>
              Payment proof is securely
              submitted to the Django backend
              for verification.
            </span>
          </div>

          <Link
            to={`/orders/${order.order_number}`}
            className="payment-order-link"
          >
            View Order Details
          </Link>

          <Link
            to="/orders"
            className="payment-back-link"
          >
            <FiArrowLeft />
            Back to My Orders
          </Link>
        </aside>
      </div>
    </section>
  );
}


export default BankTransferPage;