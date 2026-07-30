import {
  FiCheckCircle,
  FiEyeOff,
  FiTrash2,
} from "react-icons/fi";


function ReviewModerationPanel({
  review,
  isModerating = false,
  isDeleting = false,
  onModerate,
  onDelete,
}) {
  return (
    <section className="admin-review-card">
      <div className="admin-review-card__heading">
        <div>
          <span>Moderation</span>
          <h2>Review visibility</h2>
        </div>
      </div>

      <div className="admin-review-current-status">
        <small>Current status</small>

        <strong>
          {review.is_approved
            ? "Published"
            : "Hidden"}
        </strong>

        <p>
          {review.is_approved
            ? (
              "This review is visible on the "
              + "customer-facing product pages."
            )
            : (
              "This review is hidden from "
              + "customer-facing product pages."
            )}
        </p>
      </div>

      <div className="admin-review-moderation-actions">
        {review.is_approved ? (
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() =>
              onModerate(false)
            }
            disabled={
              isModerating
              || isDeleting
            }
          >
            <FiEyeOff />

            {isModerating
              ? "Updating..."
              : "Hide Review"}
          </button>
        ) : (
          <button
            type="button"
            className="admin-primary-button"
            onClick={() =>
              onModerate(true)
            }
            disabled={
              isModerating
              || isDeleting
            }
          >
            <FiCheckCircle />

            {isModerating
              ? "Updating..."
              : "Publish Review"}
          </button>
        )}

        <button
          type="button"
          className="admin-review-delete-button"
          onClick={onDelete}
          disabled={
            isModerating
            || isDeleting
          }
        >
          <FiTrash2 />

          {isDeleting
            ? "Deleting..."
            : "Delete Review"}
        </button>
      </div>
    </section>
  );
}


export default ReviewModerationPanel;
