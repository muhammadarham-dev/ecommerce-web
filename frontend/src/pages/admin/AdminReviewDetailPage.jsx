import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiCheckCircle,
  FiExternalLink,
  FiRefreshCw,
  FiShoppingBag,
  FiUser,
} from "react-icons/fi";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import ReviewModerationPanel from
  "../../components/admin/reviews/ReviewModerationPanel";

import ReviewRating from
  "../../components/admin/reviews/ReviewRating";

import {
  deleteAdminReview,
  fetchAdminReview,
  moderateAdminReview,
} from "../../services/adminReviewService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";


function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}


function AdminReviewDetailPage() {
  const {
    reviewId,
  } = useParams();

  const navigate = useNavigate();

  const [
    review,
    setReview,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isModerating,
    setIsModerating,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    noticeMessage,
    setNoticeMessage,
  ] = useState("");

  const loadReview = useCallback(
    async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data =
          await fetchAdminReview(
            reviewId,
          );

        setReview(data);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load this review.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [reviewId],
  );

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  const handleModerate =
    async (isApproved) => {
      setIsModerating(true);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        const result =
          await moderateAdminReview(
            reviewId,
            isApproved,
          );

        setReview(result.review);

        setNoticeMessage(
          result.message
          || "Review updated successfully.",
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to moderate this review.",
          ),
        );
      } finally {
        setIsModerating(false);
      }
    };

  const handleDelete =
    async () => {
      const confirmed =
        window.confirm(
          "Delete this review permanently? "
          + "This action cannot be undone.",
        );

      if (!confirmed) {
        return;
      }

      setIsDeleting(true);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        await deleteAdminReview(reviewId);

        navigate(
          "/admin/reviews",
          {
            replace: true,
          },
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to delete this review.",
          ),
        );
      } finally {
        setIsDeleting(false);
      }
    };

  if (isLoading) {
    return (
      <div className="admin-reviews-state">
        <div className="admin-loading-spinner" />
        <p>Loading review details...</p>
      </div>
    );
  }

  if (!review) {
    return (
      <section className="admin-review-detail-page">
        <div className="admin-form-message admin-form-message--error">
          {errorMessage
            || "Review not found."}
        </div>
      </section>
    );
  }

  return (
    <section className="admin-review-detail-page">
      <div className="admin-review-detail-page__heading">
        <div>
          <Link
            to="/admin/reviews"
            className="admin-review-back-link"
          >
            <FiArrowLeft />
            Back to Reviews
          </Link>

          <span className="admin-reviews-eyebrow">
            Review moderation
          </span>

          <h1>
            Review #{review.id}
          </h1>

          <p>
            {review.title
              || "Customer product review"}
          </p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={loadReview}
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

      <div className="admin-review-detail-summary">
        <div>
          <small>Rating</small>

          <ReviewRating
            rating={review.rating}
          />
        </div>

        <div>
          <small>Visibility</small>

          <strong>
            {review.is_approved
              ? "Published"
              : "Hidden"}
          </strong>
        </div>

        <div>
          <small>Purchase</small>

          <strong>
            {review.is_verified_purchase
              ? "Verified Purchase"
              : "Unverified"}
          </strong>
        </div>

        <div>
          <small>Created</small>

          <strong>
            {formatDateTime(
              review.created_at,
            )}
          </strong>
        </div>
      </div>

      <div className="admin-review-detail-grid">
        <div className="admin-review-detail-main">
          <section className="admin-review-card">
            <div className="admin-review-card__heading">
              <div>
                <span>Customer feedback</span>
                <h2>
                  {review.title
                    || "Untitled Review"}
                </h2>
              </div>
            </div>

            <div className="admin-review-content">
              <ReviewRating
                rating={review.rating}
              />

              <p>{review.comment}</p>
            </div>
          </section>

          <section className="admin-review-card">
            <div className="admin-review-card__heading">
              <div>
                <span>Related records</span>
                <h2>Product and order</h2>
              </div>
            </div>

            <div className="admin-review-related-links">
              <Link
                to={
                  `/admin/products/${
                    encodeURIComponent(
                      review.product.slug,
                    )
                  }/edit`
                }
              >
                <span>
                  <strong>
                    {review.product.name}
                  </strong>

                  <small>
                    SKU:{" "}
                    {review.product.sku}
                  </small>
                </span>

                <FiExternalLink />
              </Link>

              <Link
                to={
                  `/admin/orders/${
                    encodeURIComponent(
                      review.order_number,
                    )
                  }`
                }
              >
                <FiShoppingBag />

                <span>
                  <strong>
                    {review.order_number}
                  </strong>

                  <small>
                    Open related order
                  </small>
                </span>

                <FiExternalLink />
              </Link>
            </div>
          </section>
        </div>

        <aside className="admin-review-detail-sidebar">
          <ReviewModerationPanel
            review={review}
            isModerating={isModerating}
            isDeleting={isDeleting}
            onModerate={handleModerate}
            onDelete={handleDelete}
          />

          <section className="admin-review-card">
            <div className="admin-review-card__heading">
              <div>
                <span>Customer</span>
                <h2>Reviewer details</h2>
              </div>

              <FiUser />
            </div>

            <div className="admin-review-info-list">
              <div>
                <small>Full name</small>

                <strong>
                  {review.customer?.full_name
                    || review.customer?.username}
                </strong>
              </div>

              <div>
                <small>Username</small>

                <strong>
                  {review.customer?.username}
                </strong>
              </div>

              <div>
                <small>Email</small>

                <strong>
                  {review.customer?.email
                    || "Not available"}
                </strong>
              </div>

              <div>
                <small>Verified purchase</small>

                <strong className="admin-review-verified-detail">
                  <FiCheckCircle />

                  {review.is_verified_purchase
                    ? "Yes"
                    : "No"}
                </strong>
              </div>
            </div>
          </section>

          <section className="admin-review-card">
            <div className="admin-review-card__heading">
              <div>
                <span>Activity</span>
                <h2>Review timestamps</h2>
              </div>
            </div>

            <div className="admin-review-info-list">
              <div>
                <small>Created</small>

                <strong>
                  {formatDateTime(
                    review.created_at,
                  )}
                </strong>
              </div>

              <div>
                <small>Last updated</small>

                <strong>
                  {formatDateTime(
                    review.updated_at,
                  )}
                </strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}


export default AdminReviewDetailPage;
