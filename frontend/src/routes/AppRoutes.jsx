import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from
  "../components/common/ProtectedRoute";

import MainLayout from
  "../components/layout/MainLayout";

import AdminLayout from
  "../components/layout/AdminLayout";

import AccountPage from
  "../pages/AccountPage";

import AdminDashboardPage from
  "../pages/admin/AdminDashboardPage";

import AdminProductsPage from
  "../pages/admin/AdminProductsPage";

import AdminProductFormPage from
  "../pages/admin/AdminProductFormPage";

import AdminCategoriesPage from
  "../pages/admin/AdminCategoriesPage";

import AdminCategoryFormPage from
  "../pages/admin/AdminCategoryFormPage";

import AdminVariantsPage from
  "../pages/admin/AdminVariantsPage";

import AdminVariantFormPage from
  "../pages/admin/AdminVariantFormPage";

import AdminInventoryPage from
  "../pages/admin/AdminInventoryPage";

import AdminInventoryHistoryPage from
  "../pages/admin/AdminInventoryHistoryPage";

import AdminOrdersPage from
  "../pages/admin/AdminOrdersPage";

import AdminOrderDetailPage from
  "../pages/admin/AdminOrderDetailPage";

import AdminReturnsPage from
  "../pages/admin/AdminReturnsPage";

import AdminReturnDetailPage from
  "../pages/admin/AdminReturnDetailPage";

import AdminTicketsPage from
  "../pages/admin/AdminTicketsPage";

import AdminTicketDetailPage from
  "../pages/admin/AdminTicketDetailPage";

import AdminShipmentsPage from
  "../pages/admin/AdminShipmentsPage";

import AdminShipmentDetailPage from
  "../pages/admin/AdminShipmentDetailPage";

import AdminCouponsPage from
  "../pages/admin/AdminCouponsPage";

import AdminCouponFormPage from
  "../pages/admin/AdminCouponFormPage";

import AdminReviewsPage from
  "../pages/admin/AdminReviewsPage";

import AdminReviewDetailPage from
  "../pages/admin/AdminReviewDetailPage";

import AdminBannersPage from
  "../pages/admin/AdminBannersPage";

import AdminBannerFormPage from
  "../pages/admin/AdminBannerFormPage";

import AdminShippingRatesPage from
  "../pages/admin/AdminShippingRatesPage";

import AdminShippingRateFormPage from
  "../pages/admin/AdminShippingRateFormPage";

import AdminStoreSettingsPage from
  "../pages/admin/AdminStoreSettingsPage";

import BankTransferPage from
  "../pages/BankTransferPage";

import CartPage from
  "../pages/CartPage";

import ChangePasswordPage from
  "../pages/ChangePasswordPage";

import CheckoutPage from
  "../pages/CheckoutPage";

import CouponsPage from
  "../pages/CouponsPage";

import CreateReturnPage from
  "../pages/CreateReturnPage";

import CreateTicketPage from
  "../pages/CreateTicketPage";

import EmailPreferencesPage from
  "../pages/EmailPreferencesPage";

import ForgotPasswordPage from
  "../pages/ForgotPasswordPage";

import HomePage from
  "../pages/HomePage";

import LoginPage from
  "../pages/LoginPage";

import MyOrdersPage from
  "../pages/MyOrdersPage";

import MyReturnsPage from
  "../pages/MyReturnsPage";

import MyReviewsPage from
  "../pages/MyReviewsPage";

import MyShipmentsPage from
  "../pages/MyShipmentsPage";

import MyTicketsPage from
  "../pages/MyTicketsPage";

import NotificationsPage from
  "../pages/NotificationsPage";

import NotFoundPage from
  "../pages/NotFoundPage";

import OrderDetailPage from
  "../pages/OrderDetailPage";

import OrderSuccessPage from
  "../pages/OrderSuccessPage";

import ProductDetailPage from
  "../pages/ProductDetailPage";

import ProductsPage from
  "../pages/ProductsPage";

import RecentlyViewedPage from
  "../pages/RecentlyViewedPage";

import RegisterPage from
  "../pages/RegisterPage";

import ResetPasswordPage from
  "../pages/ResetPasswordPage";

import ReturnDetailPage from
  "../pages/ReturnDetailPage";

import SecurityPage from
  "../pages/SecurityPage";

import ShipmentDetailPage from
  "../pages/ShipmentDetailPage";

import StoreInformationPage from
  "../pages/StoreInformationPage";

import TicketDetailPage from
  "../pages/TicketDetailPage";

import VerifyEmailPage from
  "../pages/VerifyEmailPage";

import WishlistPage from
  "../pages/WishlistPage";

import WriteReviewPage from
  "../pages/WriteReviewPage";


function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/admin"
        element={<AdminLayout />}
      >
        <Route
          index
          element={
            <Navigate
              to="dashboard"
              replace
            />
          }
        />

        <Route
          path="dashboard"
          element={<AdminDashboardPage />}
        />

        <Route
          path="products"
          element={<AdminProductsPage />}
        />

        <Route
          path="products/create"
          element={<AdminProductFormPage />}
        />

        <Route
          path="products/:productSlug/edit"
          element={<AdminProductFormPage />}
        />

        <Route
          path="categories"
          element={<AdminCategoriesPage />}
        />

        <Route
          path="categories/create"
          element={<AdminCategoryFormPage />}
        />

        <Route
          path="categories/:categorySlug/edit"
          element={<AdminCategoryFormPage />}
        />

        <Route
          path="variants"
          element={<AdminVariantsPage />}
        />

        <Route
          path="variants/create"
          element={<AdminVariantFormPage />}
        />

        <Route
          path="variants/:variantSku/edit"
          element={<AdminVariantFormPage />}
        />

        <Route
          path="inventory"
          element={<AdminInventoryPage />}
        />

        <Route
          path="inventory/history"
          element={<AdminInventoryHistoryPage />}
        />

        <Route
          path="orders"
          element={<AdminOrdersPage />}
        />

        <Route
          path="orders/:orderNumber"
          element={<AdminOrderDetailPage />}
        />

        <Route
          path="returns"
          element={<AdminReturnsPage />}
        />

        <Route
          path="returns/:returnNumber"
          element={<AdminReturnDetailPage />}
        />

        <Route
          path="tickets"
          element={<AdminTicketsPage />}
        />

        <Route
          path="tickets/:ticketNumber"
          element={<AdminTicketDetailPage />}
        />

        <Route
          path="shipments"
          element={<AdminShipmentsPage />}
        />

        <Route
          path="shipments/:shipmentNumber"
          element={<AdminShipmentDetailPage />}
        />

        <Route
          path="coupons"
          element={<AdminCouponsPage />}
        />

        <Route
          path="coupons/create"
          element={<AdminCouponFormPage />}
        />

        <Route
          path="coupons/:couponCode/edit"
          element={<AdminCouponFormPage />}
        />

        <Route
          path="reviews"
          element={<AdminReviewsPage />}
        />

        <Route
          path="reviews/:reviewId"
          element={<AdminReviewDetailPage />}
        />

        <Route
          path="banners"
          element={<AdminBannersPage />}
        />

        <Route
          path="banners/create"
          element={<AdminBannerFormPage />}
        />

        <Route
          path="banners/:bannerId/edit"
          element={<AdminBannerFormPage />}
        />

        <Route
          path="shipping-rates"
          element={<AdminShippingRatesPage />}
        />

        <Route
          path="shipping-rates/create"
          element={<AdminShippingRateFormPage />}
        />

        <Route
          path="shipping-rates/:shippingRateId/edit"
          element={<AdminShippingRateFormPage />}
        />

        <Route
          path="store-settings"
          element={<AdminStoreSettingsPage />}
        />
      </Route>

      <Route element={<MainLayout />}>
        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/products"
          element={<ProductsPage />}
        />

        <Route
          path="/products/:productId"
          element={<ProductDetailPage />}
        />

        <Route
          path="/store-information"
          element={<StoreInformationPage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />

        <Route
          path="/verify-email"
          element={<VerifyEmailPage />}
        />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/security"
          element={
            <ProtectedRoute>
              <SecurityPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/email-preferences"
          element={
            <ProtectedRoute>
              <EmailPreferencesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coupons"
          element={
            <ProtectedRoute>
              <CouponsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <WishlistPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recently-viewed"
          element={
            <ProtectedRoute>
              <RecentlyViewedPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MyOrdersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders/:orderNumber"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/order-success/:orderNumber"
          element={
            <ProtectedRoute>
              <OrderSuccessPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payments/:orderNumber"
          element={
            <ProtectedRoute>
              <BankTransferPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <MyReviewsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reviews/write/:orderNumber/:productId"
          element={
            <ProtectedRoute>
              <WriteReviewPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/returns"
          element={
            <ProtectedRoute>
              <MyReturnsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/returns/create/:orderNumber"
          element={
            <ProtectedRoute>
              <CreateReturnPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/returns/:returnNumber"
          element={
            <ProtectedRoute>
              <ReturnDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets"
          element={
            <ProtectedRoute>
              <MyTicketsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets/create"
          element={
            <ProtectedRoute>
              <CreateTicketPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets/:ticketNumber"
          element={
            <ProtectedRoute>
              <TicketDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/shipments"
          element={
            <ProtectedRoute>
              <MyShipmentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/shipments/:shipmentNumber"
          element={
            <ProtectedRoute>
              <ShipmentDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Route>
    </Routes>
  );
}


export default AppRoutes;