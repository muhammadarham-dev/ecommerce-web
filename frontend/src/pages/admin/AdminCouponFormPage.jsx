import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  FiArrowLeft,
} from "react-icons/fi";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import CouponForm from
  "../../components/admin/coupons/CouponForm";

import {
  createAdminCoupon,
  fetchAdminCoupon,
  updateAdminCoupon,
} from "../../services/adminCouponService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";


function AdminCouponFormPage() {
  const {
    couponCode,
  } = useParams();

  const navigate = useNavigate();

  const isEditing =
    Boolean(couponCode);

  const [
    coupon,
    setCoupon,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(isEditing);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadCoupon = useCallback(
    async () => {
      if (!isEditing) {
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const data =
          await fetchAdminCoupon(
            couponCode,
          );

        setCoupon(data);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load this coupon.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      couponCode,
      isEditing,
    ],
  );

  useEffect(() => {
    loadCoupon();
  }, [loadCoupon]);

  const handleSubmit =
    async (values) => {
      setIsSubmitting(true);
      setErrorMessage("");

      try {
        if (isEditing) {
          await updateAdminCoupon(
            couponCode,
            values,
          );
        } else {
          await createAdminCoupon(
            values,
          );
        }

        navigate(
          "/admin/coupons",
          {
            replace: true,
          },
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            isEditing
              ? "Unable to update this coupon."
              : "Unable to create this coupon.",
          ),
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  if (isLoading) {
    return (
      <div className="admin-coupons-state">
        <div className="admin-loading-spinner" />
        <p>Loading coupon...</p>
      </div>
    );
  }

  if (
    isEditing
    && !coupon
  ) {
    return (
      <section className="admin-coupon-form-page">
        <div className="admin-form-message admin-form-message--error">
          {errorMessage
            || "Coupon not found."}
        </div>
      </section>
    );
  }

  return (
    <section className="admin-coupon-form-page">
      <div className="admin-coupon-form-page__heading">
        <div>
          <Link
            to="/admin/coupons"
            className="admin-coupon-back-link"
          >
            <FiArrowLeft />
            Back to Coupons
          </Link>

          <span className="admin-coupons-eyebrow">
            Promotions
          </span>

          <h1>
            {isEditing
              ? `Edit ${coupon.code}`
              : "Create Coupon"}
          </h1>

          <p>
            Configure the discount, limits,
            schedule and availability.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="admin-form-message admin-form-message--error">
          {errorMessage}
        </div>
      )}

      <CouponForm
        initialCoupon={coupon}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </section>
  );
}


export default AdminCouponFormPage;
