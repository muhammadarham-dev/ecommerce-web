import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiEyeOff,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiStar,
} from "react-icons/fi";

import AdminReviewTable from
  "../../components/admin/reviews/AdminReviewTable";

import {
  fetchAdminReviewDashboard,
  fetchAdminReviews,
} from "../../services/adminReviewService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";


const initialFilters = {
  search: "",
  product: "",
  customer: "",
  rating: "",
  minimumRating: "",
  approval: "",
  createdFrom: "",
  createdTo: "",
  ordering: "-created_at",
};


function AdminReviewsPage() {
  const [
    reviews,
    setReviews,
  ] = useState([]);

  const [
    totalCount,
    setTotalCount,
  ] = useState(0);

  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    filters,
    setFilters,
  ] = useState(initialFilters);

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState(initialFilters);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadReviews = useCallback(
    async ({
      showRefreshState = false,
    } = {}) => {
      if (showRefreshState) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage("");

      const params = {
        ordering:
          appliedFilters.ordering,
      };

      if (
        appliedFilters.search.trim()
      ) {
        params.search =
          appliedFilters.search.trim();
      }

      if (
        appliedFilters.product.trim()
      ) {
        params.product =
          appliedFilters.product.trim();
      }

      if (
        appliedFilters.customer.trim()
      ) {
        params.customer =
          appliedFilters.customer.trim();
      }

      if (appliedFilters.rating) {
        params.rating =
          appliedFilters.rating;
      }

      if (
        appliedFilters.minimumRating
      ) {
        params.minimum_rating =
          appliedFilters.minimumRating;
      }

      if (
        appliedFilters.approval
        !== ""
      ) {
        params.is_approved =
          appliedFilters.approval;
      }

      if (
        appliedFilters.createdFrom
      ) {
        params.created_from =
          appliedFilters.createdFrom;
      }

      if (
        appliedFilters.createdTo
      ) {
        params.created_to =
          appliedFilters.createdTo;
      }

      try {
        const [
          listResult,
          dashboardResult,
        ] = await Promise.all([
          fetchAdminReviews(params),
          fetchAdminReviewDashboard(),
        ]);

        setReviews(listResult.items);
        setTotalCount(listResult.count);
        setDashboard(dashboardResult);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load customer reviews.",
          ),
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [appliedFilters],
  );

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const summary =
    dashboard?.summary ?? {};

  const ratingCounts = useMemo(
    () =>
      dashboard?.rating_counts ?? {},
    [dashboard],
  );

  const handleSubmit = (
    event,
  ) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  return (
    <section className="admin-reviews-page">
      <div className="admin-reviews-page__heading">
        <div>
          <span className="admin-reviews-eyebrow">
            Customer feedback
          </span>

          <h1>Reviews</h1>

          <p>
            Inspect verified customer feedback,
            publish suitable reviews and hide or
            remove inappropriate content.
          </p>
        </div>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={() =>
            loadReviews({
              showRefreshState: true,
            })
          }
          disabled={isRefreshing}
        >
          <FiRefreshCw />

          {isRefreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {errorMessage && (
        <div className="admin-form-message admin-form-message--error">
          {errorMessage}
        </div>
      )}

      <div className="admin-review-stats">
        <article className="admin-review-stat-card">
          <span>
            <FiStar />
          </span>

          <div>
            <small>Total Reviews</small>

            <strong>
              {Number(
                summary.total_reviews
                ?? totalCount,
              ).toLocaleString("en-US")}
            </strong>
          </div>
        </article>

        <article className="admin-review-stat-card">
          <span>
            <FiCheckCircle />
          </span>

          <div>
            <small>Published</small>

            <strong>
              {Number(
                summary.published_reviews
                || 0,
              ).toLocaleString("en-US")}
            </strong>
          </div>
        </article>

        <article className="admin-review-stat-card">
          <span>
            <FiEyeOff />
          </span>

          <div>
            <small>Hidden</small>

            <strong>
              {Number(
                summary.hidden_reviews || 0,
              ).toLocaleString("en-US")}
            </strong>
          </div>
        </article>

        <article className="admin-review-stat-card">
          <span>
            <FiStar />
          </span>

          <div>
            <small>Average Rating</small>

            <strong>
              {Number(
                summary.average_rating || 0,
              ).toFixed(2)}
            </strong>
          </div>
        </article>
      </div>

      <div className="admin-review-rating-breakdown">
        {[5, 4, 3, 2, 1].map(
          (rating) => (
            <div key={rating}>
              <span>
                {rating} Star
                {rating === 1 ? "" : "s"}
              </span>

              <strong>
                {Number(
                  ratingCounts[
                    String(rating)
                  ] || 0,
                ).toLocaleString("en-US")}
              </strong>
            </div>
          ),
        )}
      </div>

      <form
        className="admin-review-filters"
        onSubmit={handleSubmit}
      >
        <label className="admin-review-search">
          <FiSearch />

          <input
            type="search"
            value={filters.search}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  search:
                    event.target.value,
                }),
              )
            }
            placeholder={
              "Search review, customer, product or order"
            }
          />
        </label>

        <input
          type="text"
          value={filters.product}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                product:
                  event.target.value,
              }),
            )
          }
          placeholder="Product slug"
        />

        <input
          type="text"
          value={filters.customer}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                customer:
                  event.target.value,
              }),
            )
          }
          placeholder="Customer username"
        />

        <select
          value={filters.rating}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                rating:
                  event.target.value,
                minimumRating: "",
              }),
            )
          }
        >
          <option value="">
            Any exact rating
          </option>

          {[5, 4, 3, 2, 1].map(
            (rating) => (
              <option
                key={rating}
                value={rating}
              >
                {rating} Star
                {rating === 1 ? "" : "s"}
              </option>
            ),
          )}
        </select>

        <select
          value={filters.minimumRating}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                minimumRating:
                  event.target.value,
                rating: "",
              }),
            )
          }
        >
          <option value="">
            Any minimum rating
          </option>

          {[5, 4, 3, 2, 1].map(
            (rating) => (
              <option
                key={rating}
                value={rating}
              >
                {rating}+ Stars
              </option>
            ),
          )}
        </select>

        <select
          value={filters.approval}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                approval:
                  event.target.value,
              }),
            )
          }
        >
          <option value="">
            All visibility states
          </option>

          <option value="true">
            Published only
          </option>

          <option value="false">
            Hidden only
          </option>
        </select>

        <label className="admin-review-date-filter">
          <span>Created from</span>

          <input
            type="date"
            value={filters.createdFrom}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  createdFrom:
                    event.target.value,
                }),
              )
            }
          />
        </label>

        <label className="admin-review-date-filter">
          <span>Created to</span>

          <input
            type="date"
            value={filters.createdTo}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  createdTo:
                    event.target.value,
                }),
              )
            }
          />
        </label>

        <select
          value={filters.ordering}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                ordering:
                  event.target.value,
              }),
            )
          }
        >
          <option value="-created_at">
            Newest first
          </option>

          <option value="created_at">
            Oldest first
          </option>

          <option value="-rating">
            Highest rating
          </option>

          <option value="rating">
            Lowest rating
          </option>

          <option value="is_approved">
            Hidden first
          </option>
        </select>

        <div className="admin-review-filter-actions">
          <button
            type="submit"
            className="admin-primary-button"
          >
            <FiFilter />
            Apply Filters
          </button>

          <button
            type="button"
            className="admin-secondary-button"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </form>

      <AdminReviewTable
        reviews={reviews}
        isLoading={isLoading}
      />
    </section>
  );
}


export default AdminReviewsPage;
