import apiClient from "../api/client";

export async function fetchPaymentByOrder(
  orderNumber,
) {
  const response = await apiClient.get(
    `/payments/${orderNumber}/`,
  );

  return (
    response.data.payment
    ?? response.data
  );
}

export async function submitBankTransfer({
  orderNumber,
  transactionReference,
  proof,
}) {
  const formData = new FormData();

  formData.append(
    "transaction_reference",
    transactionReference,
  );

  formData.append(
    "proof",
    proof,
  );

  const response = await apiClient.post(
    `/payments/${orderNumber}/submit-bank-transfer/`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return {
    message: response.data.message,
    payment:
      response.data.payment
      ?? response.data,
  };
}