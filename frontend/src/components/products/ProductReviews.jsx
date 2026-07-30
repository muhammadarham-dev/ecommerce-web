import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiMessageSquare,
  FiStar,
} from "react-icons/fi";

import {
  fetchReviews,
} from "../../services/reviewService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";

import {
  formatOrderDate,
} from "../../utils/order";


function ProductReviews({
  productId,
}) {
  const [
    reviews,
    setReviews,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    if (!productId) {
      return undefined;
    }

    let isActive = true;

    async function loadReviews() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const reviewData =
          await fetchReviews({
            product: productId,
            ordering: "-created_at",
          });

        const matchingReviews =
          reviewData.filter(
            (review) =>
              String(review.product?.id)
              === String(productId),
          );

        if (isActive) {
          setReviews(matchingReviews);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load product reviews.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      isActive = false;
    };
  }, [productId]);

  const averageRating = useMemo(
    () => {
      if (reviews.length === 0) {
        return 0;
      }

      const total = reviews.reduce(
        (sum, review) =>
          sum + Number(review.rating),
        0,
      );

      return total / reviews.length;
    },
    [reviews],
  );

  return (
    <section className="product-reviews-section">
      <div className="product-reviews-heading">
        <div>
          <span className="section-label">
            Customer reviews
          </span>

          <h2>Ratings and Feedback</h2>
        </div>

        {reviews.length > 0 && (
          <div className="product-rating-summary">
            <strong>
              {averageRating.toFixed(1)}
            </strong>

            <div>
              <div className="review-stars-display">
                {Array.from(
                  {
                    length: 5,
                  },
                  (_, index) =>
                    index + 1,
                ).map((starValue) => (
                  <FiStar
                    key={starValue}
                    className={
                      starValue
                      <= Math.round(
                        averageRating,
                      )
                        ? "active"
                        : ""
                    }
                  />
                ))}
              </div>

              <span>
                Based on
                {" "}
                {reviews.length}
                {" "}
                {reviews.length === 1
                  ? "review"
                  : "reviews"}
              </span>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="store-message error">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="product-reviews-loading">
          <div className="loading-spinner" />

          <p>Loading customer reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="product-reviews-empty">
          <FiMessageSquare />

          <h3>No Reviews Yet</h3>

          <p>
            This product has not received any
            customer reviews.
          </p>
        </div>
      ) : (
        <div className="product-reviews-list">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="product-review-card"
            >
              <div className="product-review-top">
                <div className="review-customer-avatar">
                  {(
                    review.customer?.full_name
                    || review.customer?.username
                    || "C"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <strong>
                    {review.customer?.full_name
                      || review.customer?.username}
                  </strong>

                  <small>
                    {formatOrderDate(
                      review.created_at,
                    )}
                  </small>
                </div>

                {review.is_verified_purchase && (
                  <span className="verified-purchase-badge">
                    <FiCheckCircle />
                    Verified
                  </span>
                )}
              </div>

              <div className="review-stars-display">
                {Array.from(
                  {
                    length: 5,
                  },
                  (_, index) =>
                    index + 1,
                ).map((starValue) => (
                  <FiStar
                    key={starValue}
                    className={
                      starValue
                      <= review.rating
                        ? "active"
                        : ""
                    }
                  />
                ))}
              </div>

              {review.title && (
                <h3>{review.title}</h3>
              )}

              <p>{review.comment}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}


export default ProductReviews;