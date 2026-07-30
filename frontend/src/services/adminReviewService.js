import apiClient from "../api/client";
import { extractList } from "../utils/apiData";


function normalizeReviewId(value) {
  const reviewId = Number(value);

  if (
    !Number.isInteger(reviewId)
    || reviewId <= 0
  ) {
    throw new Error(
      "A valid review ID is required.",
    );
  }

  return reviewId;
}


export async function fetchAdminReviewDashboard() {
  const response = await apiClient.get(
    "/reviews/management/reviews/dashboard/",
  );

  return response.data;
}


export async function fetchAdminReviews(
  params = {},
) {
  const response = await apiClient.get(
    "/reviews/management/reviews/",
    {
      params,
    },
  );

  const items = extractList(response.data);

  return {
    items,
    count:
      typeof response.data?.count === "number"
        ? response.data.count
        : items.length,
  };
}


export async function fetchAdminReview(
  reviewId,
) {
  const normalizedReviewId =
    normalizeReviewId(reviewId);

  const response = await apiClient.get(
    `/reviews/management/reviews/${
      normalizedReviewId
    }/`,
  );

  return (
    response.data.review
    ?? response.data
  );
}


export async function moderateAdminReview(
  reviewId,
  isApproved,
) {
  const normalizedReviewId =
    normalizeReviewId(reviewId);

  const response = await apiClient.patch(
    `/reviews/management/reviews/${
      normalizedReviewId
    }/moderate/`,
    {
      is_approved:
        Boolean(isApproved),
    },
  );

  return {
    message: response.data.message,
    review:
      response.data.review
      ?? response.data,
  };
}


export async function deleteAdminReview(
  reviewId,
) {
  const normalizedReviewId =
    normalizeReviewId(reviewId);

  const response = await apiClient.delete(
    `/reviews/management/reviews/${
      normalizedReviewId
    }/`,
  );

  return response.data;
}
