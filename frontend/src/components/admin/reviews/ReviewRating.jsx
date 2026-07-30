import {
  FiStar,
} from "react-icons/fi";


function ReviewRating({
  rating = 0,
  showValue = true,
}) {
  const normalizedRating =
    Math.max(
      0,
      Math.min(
        5,
        Number(rating) || 0,
      ),
    );

  return (
    <span
      className="admin-review-rating"
      aria-label={
        `${normalizedRating} out of 5 stars`
      }
    >
      <span className="admin-review-rating__stars">
        {Array.from(
          {
            length: 5,
          },
          (_, index) => (
            <FiStar
              key={index}
              className={
                index < normalizedRating
                  ? "admin-review-star admin-review-star--filled"
                  : "admin-review-star"
              }
            />
          ),
        )}
      </span>

      {showValue && (
        <strong>
          {normalizedRating}/5
        </strong>
      )}
    </span>
  );
}


export default ReviewRating;
