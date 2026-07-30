import {
  FiArrowRight,
  FiCheckCircle,
  FiEyeOff,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import ReviewRating from
  "./ReviewRating";


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


function AdminReviewTable({
  reviews = [],
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="admin-reviews-state">
        <div className="admin-loading-spinner" />
        <p>Loading reviews...</p>
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div className="admin-reviews-empty">
        <FiEyeOff />

        <h3>No reviews found</h3>

        <p>
          No customer reviews match the selected
          filters.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-review-table-shell">
      <table className="admin-review-table">
        <thead>
          <tr>
            <th>Review</th>
            <th>Customer</th>
            <th>Product</th>
            <th>Rating</th>
            <th>Purchase</th>
            <th>Status</th>
            <th>Created</th>
            <th aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {reviews.map((review) => (
            <tr key={review.id}>
              <td>
                <div className="admin-review-preview">
                  <strong>
                    {review.title
                      || "Untitled Review"}
                  </strong>

                  <span>
                    {review.comment}
                  </span>
                </div>
              </td>

              <td>
                <div className="admin-review-customer">
                  <strong>
                    {review.customer?.full_name
                      || review.customer?.username
                      || "Customer"}
                  </strong>

                  <span>
                    {review.customer?.email
                      || review.customer?.username}
                  </span>
                </div>
              </td>

              <td>
                <div className="admin-review-product">
                  <strong>
                    {review.product?.name
                      || "Product"}
                  </strong>

                  <span>
                    {review.product?.sku
                      || review.product?.slug}
                  </span>
                </div>
              </td>

              <td>
                <ReviewRating
                  rating={review.rating}
                />
              </td>

              <td>
                <span
                  className={
                    review.is_verified_purchase
                      ? (
                        "admin-review-verified "
                        + "admin-review-verified--yes"
                      )
                      : (
                        "admin-review-verified "
                        + "admin-review-verified--no"
                      )
                  }
                >
                  <FiCheckCircle />

                  {review.is_verified_purchase
                    ? "Verified"
                    : "Unverified"}
                </span>
              </td>

              <td>
                <span
                  className={
                    review.is_approved
                      ? (
                        "admin-review-status "
                        + "admin-review-status--published"
                      )
                      : (
                        "admin-review-status "
                        + "admin-review-status--hidden"
                      )
                  }
                >
                  {review.is_approved
                    ? "Published"
                    : "Hidden"}
                </span>
              </td>

              <td>
                <span className="admin-review-date">
                  {formatDateTime(
                    review.created_at,
                  )}
                </span>
              </td>

              <td>
                <Link
                  to={
                    `/admin/reviews/${
                      review.id
                    }`
                  }
                  className="admin-review-open-button"
                  aria-label={
                    `Open review ${review.id}`
                  }
                >
                  <FiArrowRight />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


export default AdminReviewTable;
