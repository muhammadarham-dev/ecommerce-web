import apiClient from "../api/client";


export async function fetchAdminDashboard() {
  const response = await apiClient.get(
    "/reports/dashboard/",
  );

  return response.data;
}


export async function fetchSalesReport(
  params = {},
) {
  const response = await apiClient.get(
    "/reports/sales/",
    {
      params,
    },
  );

  return response.data;
}


export async function fetchTopProductsReport(
  params = {},
) {
  const response = await apiClient.get(
    "/reports/top-products/",
    {
      params,
    },
  );

  return response.data;
}


export async function fetchInventoryReport(
  params = {},
) {
  const response = await apiClient.get(
    "/reports/inventory/",
    {
      params,
    },
  );

  return response.data;
}


export async function fetchCustomerReport(
  params = {},
) {
  const response = await apiClient.get(
    "/reports/customers/",
    {
      params,
    },
  );

  return response.data;
}