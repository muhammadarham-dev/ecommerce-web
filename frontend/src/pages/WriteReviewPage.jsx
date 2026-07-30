import {
  useEffect,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiCheckCircle,
  FiMessageSquare,
  FiPackage,
  FiStar,
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
  createReview,
  fetchMyReviews,
} from "../services/reviewService";

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
  const data =
    error.response?.data?.error?.details
    ?? error.response?.data;

  const fieldError = data?.[fieldName];

  if (Array.isArray(fieldError)) {
    return String(fieldError[0]);
  }

  if (typeof fieldError === "string") {
    return fieldError;
  }

  return "";
}


function WriteReviewPage() {
  const {
    orderNumber,
    productId,
  } = useParams();

  const navigate = useNavigate();

  const [
    order,
    setOrder,
  ] = useState(null);

  const [
    orderItem,
    setOrderItem,
  ] = useState(null);

  const [
    existingReview,
    setExistingReview,
  ] = useState(null);

  const [
    rating,
    setRating,
  ] = useState(5);

  const [
    hoveredRating,
    setHoveredRating,
  ] = useState(0);

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    comment,
    setComment,
  ] = useState("");

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
    fieldErrors,
    setFieldErrors,
  ] = useState({});

  useEffect(() => {
    let isActive = true;

    async function loadReviewInformation() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [
          orderData,
          reviewsData,
        ] = await Promise.all([
          fetchOrder(orderNumber),
          fetchMyReviews(),
        ]);

        if (!isActive) {
          return;
        }

        const selectedItem =
          orderData.items?.find(
            (item) =>
              String(item.product)
              === String(productId),
          );

        const previousReview =
          reviewsData.find(
            (review) =>
              String(review.product?.id)
              === String(productId),
          );

        setOrder(orderData);
        setOrderItem(selectedItem ?? null);
        setExistingReview(
          previousReview ?? null,
        );
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load review information.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadReviewInformation();

    return () => {
      isActive = false;
    };
  }, [
    orderNumber,
    productId,
  ]);

  const validateForm = () => {
    const errors = {};

    if (
      !Number.isInteger(rating)
      || rating < 1
      || rating > 5
    ) {
      errors.rating =
        "Please select a rating.";
    }

    if (!comment.trim()) {
      errors.comment =
        "Review comment is required.";
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
    setFieldErrors({});

    try {
      const result = await createReview({
        productId: Number(productId),
        orderId: order.id,
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });

      navigate("/reviews", {
        replace: true,

        state: {
          message:
            result.message
            ?? (
              "Product review submitted "
              + "successfully."
            ),
        },
      });
    } catch (error) {
      setFieldErrors({
        product_id: getFieldError(
          error,
          "product_id",
        ),

        order_id: getFieldError(
          error,
          "order_id",
        ),

        rating: getFieldError(
          error,
          "rating",
        ),

        title: getFieldError(
          error,
          "title",
        ),

        comment: getFieldError(
          error,
          "comment",
        ),
      });

      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to submit your review.",
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
          Preparing your review...
        </p>
      </section>
    );
  }

  const isDelivered =
    order?.status === "DELIVERED";

  if (
    !order
    || !orderItem
    || !isDelivered
  ) {
    return (
      <section className="write-review-page">
        <div className="container review-unavailable-card">
          <FiPackage />

          <h1>Review Unavailable</h1>

          <p>
            {errorMessage
              || (
                "This product cannot currently "
                + "be reviewed. Reviews are "
                + "available after delivery."
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

  if (existingReview) {
    return (
      <section className="write-review-page">
        <div className="container review-unavailable-card">
          <FiCheckCircle />

          <h1>Already Reviewed</h1>

          <p>
            You have already reviewed
            {" "}
            <strong>
              {orderItem.product_name}
            </strong>
            . A customer can submit only one
            review for each product.
          </p>

          <Link
            to="/reviews"
            className="primary-button"
          >
            Manage My Reviews
          </Link>
        </div>
      </section>
    );
  }

  const displayedRating =
    hoveredRating || rating;

  return (
    <section className="write-review-page">
      <div className="review-page-header">
        <div className="container">
          <Link
            to={`/orders/${orderNumber}`}
            className="review-back-link"
          >
            <FiArrowLeft />
            Back to Order
          </Link>

          <span className="section-label">
            Verified purchase
          </span>

          <h1>Write a Review</h1>

          <p>
            Share your experience with other
            customers.
          </p>
        </div>
      </div>

      <div className="container write-review-layout">
        <div className="review-product-summary">
          <div className="review-summary-icon">
            <FiPackage />
          </div>

          <span>Product</span>

          <h2>
            {orderItem.product_name}
          </h2>

          {orderItem.variant_name && (
            <p>{orderItem.variant_name}</p>
          )}

          <div>
            <small>Order Number</small>

            <strong>
              {order.order_number}
            </strong>
          </div>

          <div>
            <small>Purchase Price</small>

            <strong>
              {formatCurrency(
                orderItem.unit_price,
              )}
            </strong>
          </div>

          <div>
            <small>Quantity</small>

            <strong>
              {orderItem.quantity}
            </strong>
          </div>

          <div className="verified-review-label">
            <FiCheckCircle />
            Verified Purchase
          </div>
        </div>

        <form
          className="write-review-form"
          onSubmit={handleSubmit}
        >
          <div className="review-form-heading">
            <FiMessageSquare />

            <div>
              <span>Your feedback</span>
              <h2>Rate This Product</h2>
            </div>
          </div>

          {errorMessage && (
            <div className="store-message error">
              {errorMessage}
            </div>
          )}

          {(fieldErrors.product_id
            || fieldErrors.order_id) && (
            <div className="store-message error">
              {fieldErrors.product_id
                || fieldErrors.order_id}
            </div>
          )}

          <div className="review-rating-field">
            <label>
              Overall rating
            </label>

            <div
              className="review-star-input"
              onMouseLeave={() =>
                setHoveredRating(0)
              }
            >
              {Array.from(
                {
                  length: 5,
                },
                (_, index) =>
                  index + 1,
              ).map((starValue) => (
                <button
                  type="button"
                  key={starValue}
                  className={
                    starValue
                    <= displayedRating
                      ? "active"
                      : ""
                  }
                  onMouseEnter={() =>
                    setHoveredRating(
                      starValue,
                    )
                  }
                  onClick={() => {
                    setRating(starValue);

                    setFieldErrors(
                      (current) => ({
                        ...current,
                        rating: "",
                      }),
                    );
                  }}
                  aria-label={
                    `Select ${starValue} stars`
                  }
                >
                  <FiStar />
                </button>
              ))}
            </div>

            <strong>
              {rating}
              {" out of 5"}
            </strong>

            {fieldErrors.rating && (
              <small className="field-error">
                {fieldErrors.rating}
              </small>
            )}
          </div>

          <label className="review-form-field">
            Review title
            <small>Optional</small>

            <input
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);

                setFieldErrors(
                  (current) => ({
                    ...current,
                    title: "",
                  }),
                );
              }}
              placeholder={
                "Summarize your experience"
              }
              maxLength="255"
            />

            {fieldErrors.title && (
              <small className="field-error">
                {fieldErrors.title}
              </small>
            )}
          </label>

          <label className="review-form-field">
            Your review

            <textarea
              value={comment}
              onChange={(event) => {
                setComment(
                  event.target.value,
                );

                setFieldErrors(
                  (current) => ({
                    ...current,
                    comment: "",
                  }),
                );
              }}
              placeholder={
                "What did you like or dislike "
                + "about this product?"
              }
              rows="8"
              required
            />

            <div className="review-character-count">
              <span>
                Write a useful and honest review.
              </span>

              <span>
                {comment.length}
                {" characters"}
              </span>
            </div>

            {fieldErrors.comment && (
              <small className="field-error">
                {fieldErrors.comment}
              </small>
            )}
          </label>

          <button
            type="submit"
            className="review-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting Review..."
              : "Submit Review"}

            {!isSubmitting && (
              <FiCheckCircle />
            )}
          </button>
        </form>
      </div>
    </section>
  );
}


export default WriteReviewPage;