import {
  useEffect,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiEdit2,
  FiMessageSquare,
  FiSave,
  FiStar,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import {
  Link,
  useLocation,
} from "react-router-dom";

import {
  deleteReview,
  fetchMyReviews,
  updateReview,
} from "../services/reviewService";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  formatOrderDate,
} from "../utils/order";


const initialEditForm = {
  rating: 5,
  title: "",
  comment: "",
};


function RatingStars({
  rating,
}) {
  return (
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
            starValue <= rating
              ? "active"
              : ""
          }
        />
      ))}
    </div>
  );
}


function MyReviewsPage() {
  const location = useLocation();

  const [
    reviews,
    setReviews,
  ] = useState([]);

  const [
    editingReviewId,
    setEditingReviewId,
  ] = useState(null);

  const [
    editForm,
    setEditForm,
  ] = useState(initialEditForm);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    deletingReviewId,
    setDeletingReviewId,
  ] = useState(null);

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

    async function loadReviews() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const reviewData =
          await fetchMyReviews({
            ordering: "-created_at",
          });

        if (isActive) {
          setReviews(reviewData);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load your reviews.",
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
  }, []);

  const beginEditing = (review) => {
    setEditingReviewId(review.id);

    setEditForm({
      rating: review.rating,
      title: review.title ?? "",
      comment: review.comment ?? "",
    });

    setErrorMessage("");
    setSuccessMessage("");
  };

  const cancelEditing = () => {
    setEditingReviewId(null);
    setEditForm(initialEditForm);
  };

  const handleUpdate = async (
    reviewId,
  ) => {
    if (!editForm.comment.trim()) {
      setErrorMessage(
        "Review comment is required.",
      );

      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await updateReview(
        reviewId,
        {
          rating: editForm.rating,
          title: editForm.title.trim(),
          comment: editForm.comment.trim(),
        },
      );

      setReviews(
        (currentReviews) =>
          currentReviews.map(
            (review) =>
              review.id === reviewId
                ? result.review
                : review,
          ),
      );

      setSuccessMessage(
        result.message
        ?? "Review updated successfully.",
      );

      cancelEditing();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to update your review.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (
    reviewId,
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingReviewId(reviewId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response =
        await deleteReview(reviewId);

      setReviews(
        (currentReviews) =>
          currentReviews.filter(
            (review) =>
              review.id !== reviewId,
          ),
      );

      setSuccessMessage(
        response.message
        ?? "Review deleted successfully.",
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to delete your review.",
        ),
      );
    } finally {
      setDeletingReviewId(null);
    }
  };

  return (
    <section className="my-reviews-page">
      <div className="review-page-header">
        <div className="container">
          <span className="section-label">
            Customer feedback
          </span>

          <h1>My Reviews</h1>

          <p>
            View, edit and manage the product
            reviews submitted from your account.
          </p>
        </div>
      </div>

      <div className="container my-reviews-content">
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

        {isLoading ? (
          <div className="reviews-loading">
            <div className="loading-spinner" />

            <p>Loading your reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="reviews-empty">
            <FiMessageSquare />

            <h2>No Reviews Yet</h2>

            <p>
              Reviews can be submitted from
              delivered order details.
            </p>

            <Link
              to="/orders"
              className="primary-button"
            >
              View My Orders
            </Link>
          </div>
        ) : (
          <div className="my-reviews-list">
            {reviews.map((review) => {
              const isEditing =
                editingReviewId
                === review.id;

              return (
                <article
                  key={review.id}
                  className="my-review-card"
                >
                  <div className="my-review-header">
                    <div>
                      <span>Product Review</span>

                      <h2>
                        {review.product?.name}
                      </h2>

                      <small>
                        SKU:
                        {" "}
                        {review.product?.sku}
                      </small>
                    </div>

                    {review.is_verified_purchase && (
                      <span className="verified-purchase-badge">
                        <FiCheckCircle />
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="review-edit-form">
                      <div className="review-edit-rating">
                        <label>
                          Rating
                        </label>

                        <div className="review-star-input">
                          {Array.from(
                            {
                              length: 5,
                            },
                            (_, index) =>
                              index + 1,
                          ).map(
                            (starValue) => (
                              <button
                                type="button"
                                key={starValue}
                                className={
                                  starValue
                                  <= editForm.rating
                                    ? "active"
                                    : ""
                                }
                                onClick={() =>
                                  setEditForm(
                                    (current) => ({
                                      ...current,
                                      rating:
                                        starValue,
                                    }),
                                  )
                                }
                              >
                                <FiStar />
                              </button>
                            ),
                          )}
                        </div>
                      </div>

                      <label className="review-form-field">
                        Review title

                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(event) =>
                            setEditForm(
                              (current) => ({
                                ...current,
                                title:
                                  event.target.value,
                              }),
                            )
                          }
                          maxLength="255"
                        />
                      </label>

                      <label className="review-form-field">
                        Review comment

                        <textarea
                          value={
                            editForm.comment
                          }
                          onChange={(event) =>
                            setEditForm(
                              (current) => ({
                                ...current,
                                comment:
                                  event.target.value,
                              }),
                            )
                          }
                          rows="6"
                          required
                        />
                      </label>

                      <div className="review-edit-actions">
                        <button
                          type="button"
                          className="review-cancel-edit"
                          onClick={cancelEditing}
                          disabled={isSaving}
                        >
                          <FiX />
                          Cancel
                        </button>

                        <button
                          type="button"
                          className="review-save-edit"
                          onClick={() =>
                            handleUpdate(
                              review.id,
                            )
                          }
                          disabled={isSaving}
                        >
                          <FiSave />

                          {isSaving
                            ? "Saving..."
                            : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="my-review-content">
                        <RatingStars
                          rating={review.rating}
                        />

                        {review.title && (
                          <h3>{review.title}</h3>
                        )}

                        <p>{review.comment}</p>
                      </div>

                      <div className="my-review-footer">
                        <div>
                          <span>
                            Order
                            {" "}
                            {review.order_number}
                          </span>

                          <small>
                            Submitted
                            {" "}
                            {formatOrderDate(
                              review.created_at,
                            )}
                          </small>
                        </div>

                        <div className="my-review-actions">
                          <Link
                            to={
                              `/products/${
                                review.product?.id
                              }`
                            }
                          >
                            View Product
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              beginEditing(
                                review,
                              )
                            }
                          >
                            <FiEdit2 />
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete"
                            onClick={() =>
                              handleDelete(
                                review.id,
                              )
                            }
                            disabled={
                              deletingReviewId
                              === review.id
                            }
                          >
                            <FiTrash2 />

                            {deletingReviewId
                              === review.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}


export default MyReviewsPage;