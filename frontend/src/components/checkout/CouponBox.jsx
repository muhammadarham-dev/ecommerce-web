import {
  useEffect,
  useState,
} from "react";

import {
  FiCheckCircle,
  FiTag,
  FiX,
} from "react-icons/fi";


function CouponBox({
  appliedCoupon,
  couponResult,
  errorMessage,
  isApplying,
  onApply,
  onRemove,
  formatMoney,
  initialCode = "",
}) {
  const [couponCode, setCouponCode] =
    useState(initialCode);

  useEffect(() => {
    if (appliedCoupon?.code) {
      setCouponCode(
        appliedCoupon.code,
      );
      return;
    }

    setCouponCode(initialCode);
  }, [
    appliedCoupon?.code,
    initialCode,
  ]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedCode = couponCode
      .trim()
      .toUpperCase();

    if (!normalizedCode) {
      return;
    }

    onApply(normalizedCode);
  };

  return (
    <div className="coupon-box">
      <div className="coupon-box__heading">
        <span className="coupon-box__icon">
          <FiTag />
        </span>

        <div>
          <span>Discount</span>
          <h3>Apply Coupon</h3>
        </div>
      </div>

      {appliedCoupon ? (
        <div className="coupon-box__applied">
          <FiCheckCircle />

          <div>
            <strong>
              {appliedCoupon.code}
            </strong>

            <span>
              {appliedCoupon.name}
            </span>

            {couponResult
              ?.discount_amount && (
              <small>
                You saved {formatMoney(
                  couponResult
                    .discount_amount,
                )}
              </small>
            )}
          </div>

          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove coupon"
          >
            <FiX />
          </button>
        </div>
      ) : (
        <form
          className="coupon-box__form"
          onSubmit={handleSubmit}
        >
          <div>
            <FiTag />

            <input
              type="text"
              value={couponCode}
              onChange={(event) =>
                setCouponCode(
                  event.target.value
                    .toUpperCase(),
                )
              }
              placeholder="Enter coupon code"
              maxLength="50"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={
              isApplying
              || !couponCode.trim()
            }
          >
            {isApplying
              ? "Applying..."
              : "Apply"}
          </button>
        </form>
      )}

      {errorMessage && (
        <p className="coupon-box__error">
          {errorMessage}
        </p>
      )}
    </div>
  );
}


export default CouponBox;