import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheckCircle,
  FiMinus,
  FiPackage,
  FiPlus,
  FiRotateCcw,
} from "react-icons/fi";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  fetchOrder,
} from "../services/orderService";

import {
  createReturnRequest,
} from "../services/returnService";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  formatCurrency,
} from "../utils/currency";

import {
  returnReasonOptions,
} from "../utils/returns";


function CreateReturnPage() {
  const {
    orderNumber,
  } = useParams();

  const navigate = useNavigate();

  const [
    order,
    setOrder,
  ] = useState(null);

  const [
    reason,
    setReason,
  ] = useState("DAMAGED");

  const [
    details,
    setDetails,
  ] = useState("");

  const [
    quantities,
    setQuantities,
  ] = useState({});

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

  useEffect(() => {
    let isActive = true;

    async function loadOrder() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const orderData =
          await fetchOrder(orderNumber);

        if (!isActive) {
          return;
        }

        setOrder(orderData);

        const initialQuantities = {};

        orderData.items?.forEach((item) => {
          initialQuantities[item.id] = 0;
        });

        setQuantities(initialQuantities);
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load order information.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      isActive = false;
    };
  }, [orderNumber]);

  const selectedItems = useMemo(
    () => (
      order?.items
        ?.filter(
          (item) =>
            Number(
              quantities[item.id] ?? 0,
            ) > 0,
        )
        .map((item) => ({
          order_item_id: item.id,
          quantity: Number(
            quantities[item.id],
          ),
        }))
      ?? []
    ),
    [
      order,
      quantities,
    ],
  );

  const estimatedRefund = useMemo(
    () => (
      order?.items?.reduce(
        (total, item) => {
          const quantity = Number(
            quantities[item.id] ?? 0,
          );

          return (
            total
            + (
              Number(item.unit_price ?? 0)
              * quantity
            )
          );
        },
        0,
      )
      ?? 0
    ),
    [
      order,
      quantities,
    ],
  );

  const updateQuantity = (
    item,
    difference,
  ) => {
    setQuantities(
      (currentQuantities) => {
        const currentQuantity = Number(
          currentQuantities[item.id] ?? 0,
        );

        const nextQuantity = Math.min(
          Number(item.quantity),
          Math.max(
            0,
            currentQuantity + difference,
          ),
        );

        return {
          ...currentQuantities,
          [item.id]: nextQuantity,
        };
      },
    );

    setErrorMessage("");
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (selectedItems.length === 0) {
      setErrorMessage(
        "Please select at least one product.",
      );

      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result =
        await createReturnRequest({
          orderId: order.id,
          reason,
          details: details.trim(),
          items: selectedItems,
        });

      navigate(
        `/returns/${
          result.returnRequest.return_number
        }`,
        {
          replace: true,

          state: {
            message:
              result.message
              ?? (
                "Return request created "
                + "successfully."
              ),
          },
        },
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to create return request.",
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
          Preparing return request...
        </p>
      </section>
    );
  }

  if (
    !order
    || order.status !== "DELIVERED"
  ) {
    return (
      <section className="return-page">
        <div className="container return-empty-card">
          <FiAlertTriangle />

          <h1>Return Unavailable</h1>

          <p>
            {errorMessage
              || (
                "A return request can only be "
                + "created for a delivered order."
              )}
          </p>

          <Link
            to={`/orders/${orderNumber}`}
            className="primary-button"
          >
            <FiArrowLeft />
            Back to Order
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="return-page">
      <div className="return-page-header">
        <div className="container">
          <Link
            to={`/orders/${orderNumber}`}
            className="return-back-link"
          >
            <FiArrowLeft />
            Back to Order
          </Link>

          <span className="section-label">
            Return products
          </span>

          <h1>Create Return Request</h1>

          <p>
            Select the products and quantities
            you want to return.
          </p>
        </div>
      </div>

      <form
        className="container create-return-layout"
        onSubmit={handleSubmit}
      >
        <div className="create-return-main">
          {errorMessage && (
            <div className="store-message error">
              {errorMessage}
            </div>
          )}

          <section className="return-card">
            <div className="return-card-heading">
              <FiPackage />

              <div>
                <span>Step 1</span>
                <h2>Select Products</h2>
              </div>
            </div>

            <div className="return-product-list">
              {order.items?.map((item) => {
                const selectedQuantity =
                  Number(
                    quantities[item.id] ?? 0,
                  );

                const isSelected =
                  selectedQuantity > 0;

                return (
                  <article
                    key={item.id}
                    className={
                      isSelected
                        ? "return-product selected"
                        : "return-product"
                    }
                  >
                    <div className="return-product-icon">
                      <FiPackage />
                    </div>

                    <div className="return-product-info">
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

                      <small>
                        Purchased quantity:
                        {" "}
                        {item.quantity}
                      </small>
                    </div>

                    <strong>
                      {formatCurrency(
                        item.unit_price,
                      )}
                    </strong>

                    <div className="return-quantity">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item,
                            -1,
                          )
                        }
                        disabled={
                          selectedQuantity <= 0
                        }
                        aria-label="Decrease return quantity"
                      >
                        <FiMinus />
                      </button>

                      <span>
                        {selectedQuantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item,
                            1,
                          )
                        }
                        disabled={
                          selectedQuantity
                          >= Number(item.quantity)
                        }
                        aria-label="Increase return quantity"
                      >
                        <FiPlus />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="return-card">
            <div className="return-card-heading">
              <FiRotateCcw />

              <div>
                <span>Step 2</span>
                <h2>Return Reason</h2>
              </div>
            </div>

            <label className="return-form-field">
              Reason

              <select
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value,
                  )
                }
              >
                {returnReasonOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="return-form-field">
              Additional details
              <small>Optional</small>

              <textarea
                value={details}
                onChange={(event) =>
                  setDetails(
                    event.target.value,
                  )
                }
                rows="7"
                maxLength="2000"
                placeholder={
                  "Describe the product condition "
                  + "and return reason."
                }
              />

              <span className="return-character-count">
                {details.length}
                {" / 2000"}
              </span>
            </label>
          </section>
        </div>

        <aside className="return-summary-card">
          <span className="section-label">
            Return summary
          </span>

          <h2>{order.order_number}</h2>

          <div className="return-summary-details">
            <div>
              <span>Selected Products</span>

              <strong>
                {selectedItems.length}
              </strong>
            </div>

            <div>
              <span>Total Quantity</span>

              <strong>
                {selectedItems.reduce(
                  (total, item) =>
                    total + item.quantity,
                  0,
                )}
              </strong>
            </div>

            <div>
              <span>Reason</span>

              <strong>
                {
                  returnReasonOptions.find(
                    (option) =>
                      option.value === reason,
                  )?.label
                }
              </strong>
            </div>
          </div>

          <div className="return-estimated-refund">
            <span>
              Estimated Product Value
            </span>

            <strong>
              {formatCurrency(
                estimatedRefund,
              )}
            </strong>
          </div>

          <p className="return-summary-note">
            The final refund amount will be
            confirmed after the returned products
            are reviewed.
          </p>

          <button
            type="submit"
            className="return-submit-button"
            disabled={
              isSubmitting
              || selectedItems.length === 0
            }
          >
            {isSubmitting
              ? "Submitting Request..."
              : "Submit Return Request"}

            {!isSubmitting && (
              <FiCheckCircle />
            )}
          </button>
        </aside>
      </form>
    </section>
  );
}


export default CreateReturnPage;