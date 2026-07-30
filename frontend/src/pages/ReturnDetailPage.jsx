import {
  useEffect,
  useState,
} from "react";

import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiPackage,
  FiRotateCcw,
  FiX,
} from "react-icons/fi";

import {
  Link,
  useLocation,
  useParams,
} from "react-router-dom";

import {
  cancelReturnRequest,
  fetchReturnRequest,
} from "../services/returnService";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  formatCurrency,
} from "../utils/currency";

import {
  formatOrderDate,
} from "../utils/order";

import {
  formatReturnValue,
  getReturnStatusClass,
} from "../utils/returns";


const returnProgressSteps = [
  "REQUESTED",
  "APPROVED",
  "PRODUCT_RECEIVED",
  "REFUNDED",
];


function ReturnDetailPage() {
  const {
    returnNumber,
  } = useParams();

  const location = useLocation();

  const [
    returnRequest,
    setReturnRequest,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isCancelling,
    setIsCancelling,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState(
    location.state?.message ?? "",
  );

  useEffect(() => {
    let isActive = true;

    async function loadReturn() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const returnData =
          await fetchReturnRequest(
            returnNumber,
          );

        if (isActive) {
          setReturnRequest(returnData);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load return request.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadReturn();

    return () => {
      isActive = false;
    };
  }, [returnNumber]);

  const handleCancel = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this return request?",
    );

    if (!confirmed) {
      return;
    }

    setIsCancelling(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result =
        await cancelReturnRequest(
          returnRequest.return_number,
        );

      setReturnRequest(
        result.returnRequest,
      );

      setSuccessMessage(
        result.message
        ?? (
          "Return request cancelled "
          + "successfully."
        ),
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to cancel return request.",
        ),
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <section className="route-loading">
        <div className="loading-spinner" />

        <p>Loading return details...</p>
      </section>
    );
  }

  if (!returnRequest) {
    return (
      <section className="return-page">
        <div className="container return-empty-card">
          <FiAlertTriangle />

          <h1>Return Unavailable</h1>

          <p>
            {errorMessage
              || (
                "The requested return could "
                + "not be found."
              )}
          </p>

          <Link
            to="/returns"
            className="primary-button"
          >
            <FiArrowLeft />
            Back to My Returns
          </Link>
        </div>
      </section>
    );
  }

  const currentProgressIndex =
    returnProgressSteps.indexOf(
      returnRequest.status,
    );

  const isRejected =
    returnRequest.status === "REJECTED";

  const isCancelled =
    returnRequest.status === "CANCELLED";

  return (
    <section className="return-page">
      <div className="return-page-header">
        <div className="container">
          <Link
            to="/returns"
            className="return-back-link"
          >
            <FiArrowLeft />
            Back to My Returns
          </Link>

          <div className="return-detail-title">
            <div>
              <span className="section-label">
                Return details
              </span>

              <h1>
                {returnRequest.return_number}
              </h1>

              <p>
                Created
                {" "}
                {formatOrderDate(
                  returnRequest.created_at,
                )}
              </p>
            </div>

            <span
              className={
                "return-status-badge large "
                + getReturnStatusClass(
                  returnRequest.status,
                )
              }
            >
              {formatReturnValue(
                returnRequest.status,
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="container return-detail-content">
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

        <section className="return-progress-card">
          {isRejected || isCancelled ? (
            <div className="return-final-state">
              <FiX />

              <div>
                <h2>
                  {isRejected
                    ? "Return Rejected"
                    : "Return Cancelled"}
                </h2>

                <p>
                  {returnRequest.admin_note
                    || (
                      "This return request will "
                      + "not continue further."
                    )}
                </p>
              </div>
            </div>
          ) : (
            <div className="return-progress">
              {returnProgressSteps.map(
                (step, index) => {
                  const isComplete =
                    index
                    <= currentProgressIndex;

                  return (
                    <div
                      key={step}
                      className={
                        isComplete
                          ? "return-progress-step complete"
                          : "return-progress-step"
                      }
                    >
                      <span>
                        {isComplete
                          ? <FiCheck />
                          : index + 1}
                      </span>

                      <strong>
                        {formatReturnValue(step)}
                      </strong>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </section>

        <div className="return-detail-layout">
          <main className="return-detail-main">
            <section className="return-card">
              <div className="return-card-heading">
                <FiPackage />

                <div>
                  <span>Returned products</span>
                  <h2>Return Items</h2>
                </div>
              </div>

              <div className="return-detail-items">
                {returnRequest.items?.map(
                  (item) => (
                    <article
                      key={item.id}
                      className="return-detail-item"
                    >
                      <FiPackage />

                      <div>
                        <strong>
                          {item.variant_name
                            || item.product_name}
                        </strong>

                        <span>
                          SKU:
                          {" "}
                          {item.variant_sku
                            || item.product_sku}
                        </span>
                      </div>

                      <div>
                        <span>Quantity</span>
                        <strong>
                          {item.quantity}
                        </strong>
                      </div>

                      <div>
                        <span>Unit Price</span>

                        <strong>
                          {formatCurrency(
                            item.unit_price,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Line Total</span>

                        <strong>
                          {formatCurrency(
                            item.line_total,
                          )}
                        </strong>
                      </div>
                    </article>
                  ),
                )}
              </div>
            </section>

            <section className="return-card">
              <div className="return-card-heading">
                <FiRotateCcw />

                <div>
                  <span>Return information</span>
                  <h2>Reason and Details</h2>
                </div>
              </div>

              <div className="return-reason-details">
                <div>
                  <span>Reason</span>

                  <strong>
                    {formatReturnValue(
                      returnRequest.reason,
                    )}
                  </strong>
                </div>

                <p>
                  {returnRequest.details
                    || (
                      "No additional details "
                      + "were provided."
                    )}
                </p>
              </div>
            </section>

            {returnRequest.admin_note && (
              <section className="return-card">
                <div className="return-card-heading">
                  <FiClock />

                  <div>
                    <span>Store response</span>
                    <h2>Admin Note</h2>
                  </div>
                </div>

                <p className="return-admin-note">
                  {returnRequest.admin_note}
                </p>
              </section>
            )}
          </main>

          <aside className="return-detail-sidebar">
            <section className="return-card">
              <div className="return-card-heading">
                <FiRotateCcw />

                <div>
                  <span>Request summary</span>
                  <h2>Return Summary</h2>
                </div>
              </div>

              <div className="return-detail-summary">
                <div>
                  <span>Order Number</span>

                  <Link
                    to={
                      `/orders/${
                        returnRequest.order_number
                      }`
                    }
                  >
                    {
                      returnRequest.order_number
                    }
                  </Link>
                </div>

                <div>
                  <span>Status</span>

                  <strong>
                    {formatReturnValue(
                      returnRequest.status,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Products</span>

                  <strong>
                    {
                      returnRequest.items?.length
                      ?? 0
                    }
                  </strong>
                </div>

                <div>
                  <span>Refund Amount</span>

                  <strong>
                    {formatCurrency(
                      returnRequest.refund_amount,
                    )}
                  </strong>
                </div>

                {returnRequest.reviewed_by_username && (
                  <div>
                    <span>Reviewed By</span>

                    <strong>
                      {
                        returnRequest
                          .reviewed_by_username
                      }
                    </strong>
                  </div>
                )}
              </div>
            </section>

            {returnRequest
              .can_customer_cancel && (
              <section className="return-cancel-card">
                <FiAlertTriangle />

                <h3>Cancel Return</h3>

                <p>
                  A return can only be cancelled
                  while it is still requested.
                </p>

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling
                    ? "Cancelling..."
                    : "Cancel Return Request"}
                </button>
              </section>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}


export default ReturnDetailPage;