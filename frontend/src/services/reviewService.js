import apiClient from "../api/client";
import { extractList } from "../utils/apiData";


export async function fetchReviews(
  params = {},
) {
  const response = await apiClient.get(
    "/reviews/",
    {
      params,
    },
  );

  return extractList(response.data);
}


export async function fetchMyReviews(
  params = {},
) {
  const response = await apiClient.get(
    "/reviews/mine/",
    {
      params,
    },
  );

  return extractList(response.data);
}


export async function createReview({
  productId,
  orderId,
  rating,
  title = "",
  comment,
}) {
  const response = await apiClient.post(
    "/reviews/",
    {
      product_id: productId,
      order_id: orderId,
      rating,
      title,
      comment,
    },
  );

  return {
    message: response.data.message,
    review:
      response.data.review
      ?? response.data,
  };
}


export async function updateReview(
  reviewId,
  {
    rating,
    title,
    comment,
  },
) {
  const response = await apiClient.patch(
    `/reviews/${reviewId}/`,
    {
      rating,
      title,
      comment,
    },
  );

  return {
    message: response.data.message,
    review:
      response.data.review
      ?? response.data,
  };
}


export async function deleteReview(
  reviewId,
) {
  const response = await apiClient.delete(
    `/reviews/${reviewId}/`,
  );

  return response.data;
}