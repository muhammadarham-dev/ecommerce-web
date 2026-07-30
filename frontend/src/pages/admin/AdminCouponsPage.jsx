import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiFilter,
  FiPlus,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import AdminCouponTable from
  "../../components/admin/coupons/AdminCouponTable";

import CouponStats from
  "../../components/admin/coupons/CouponStats";

import {
  deleteAdminCoupon,
  fetchAdminCoupons,
  updateAdminCouponStatus,
} from "../../services/adminCouponService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";


const initialFilters = {
  search: "",
  discountType: "",
  activeState: "",
  validityState: "",
  ordering: "-created_at",
};


function AdminCouponsPage() {
  const [
    coupons,
    setCoupons,
  ] = useState([]);

  const [
    totalCount,
    setTotalCount,
  ] = useState(0);

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
    isUpdatingCode,
    setIsUpdatingCode,
  ] = useState("");

  const [
    isDeletingCode,
    setIsDeletingCode,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    noticeMessage,
    setNoticeMessage,
  ] = useState("");

  const loadCoupons = useCallback(
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

      try {
        const result =
          await fetchAdminCoupons(params);

        setCoupons(result.items);
        setTotalCount(result.count);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load coupons.",
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
    loadCoupons();
  }, [loadCoupons]);

  const visibleCoupons = useMemo(
    () =>
      coupons.filter((coupon) => {
        if (
          appliedFilters.discountType
          && coupon.discount_type
            !== appliedFilters.discountType
        ) {
          return false;
        }

        if (
          appliedFilters.activeState
          === "ACTIVE"
          && !coupon.is_active
        ) {
          return false;
        }

        if (
          appliedFilters.activeState
          === "INACTIVE"
          && coupon.is_active
        ) {
          return false;
        }

        if (
          appliedFilters.validityState
          === "VALID"
          && !coupon.is_currently_valid
        ) {
          return false;
        }

        if (
          appliedFilters.validityState
          === "INVALID"
          && coupon.is_currently_valid
        ) {
          return false;
        }

        return true;
      }),
    [
      appliedFilters.activeState,
      appliedFilters.discountType,
      appliedFilters.validityState,
      coupons,
    ],
  );

  const handleFilterSubmit = (
    event,
  ) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const handleToggleStatus =
    async (coupon) => {
      setIsUpdatingCode(coupon.code);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        const updatedCoupon =
          await updateAdminCouponStatus(
            coupon.code,
            !coupon.is_active,
          );

        setCoupons(
          (currentCoupons) =>
            currentCoupons.map(
              (currentCoupon) =>
                currentCoupon.id
                === updatedCoupon.id
                  ? updatedCoupon
                  : currentCoupon,
            ),
        );

        setNoticeMessage(
          `${coupon.code} ${
            updatedCoupon.is_active
              ? "activated"
              : "deactivated"
          } successfully.`,
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to update coupon status.",
          ),
        );
      } finally {
        setIsUpdatingCode("");
      }
    };

  const handleDelete =
    async (coupon) => {
      const confirmed =
        window.confirm(
          `Delete coupon ${coupon.code}? `
          + "This action cannot be undone.",
        );

      if (!confirmed) {
        return;
      }

      setIsDeletingCode(coupon.code);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        await deleteAdminCoupon(
          coupon.code,
        );

        setCoupons(
          (currentCoupons) =>
            currentCoupons.filter(
              (currentCoupon) =>
                currentCoupon.id
                !== coupon.id,
            ),
        );

        setTotalCount(
          (currentCount) =>
            Math.max(
              currentCount - 1,
              0,
            ),
        );

        setNoticeMessage(
          `${coupon.code} deleted successfully.`,
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to delete this coupon. "
            + "Coupons already used by orders "
            + "may be protected from deletion.",
          ),
        );
      } finally {
        setIsDeletingCode("");
      }
    };

  return (
    <section className="admin-coupons-page">
      <div className="admin-coupons-page__heading">
        <div>
          <span className="admin-coupons-eyebrow">
            Promotions
          </span>

          <h1>Coupons</h1>

          <p>
            Create discount codes, control
            availability and monitor coupon
            usage.
          </p>
        </div>

        <div className="admin-coupons-heading-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() =>
              loadCoupons({
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

          <Link
            to="/admin/coupons/create"
            className="admin-primary-button"
          >
            <FiPlus />
            Create Coupon
          </Link>
        </div>
      </div>

      {noticeMessage && (
        <div className="admin-form-message admin-form-message--success">
          {noticeMessage}
        </div>
      )}

      {errorMessage && (
        <div className="admin-form-message admin-form-message--error">
          {errorMessage}
        </div>
      )}

      <CouponStats
        totalCount={totalCount}
        visibleCoupons={visibleCoupons}
      />

      <form
        className="admin-coupon-filters"
        onSubmit={handleFilterSubmit}
      >
        <label className="admin-coupon-search">
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
              "Search code, name or description"
            }
          />
        </label>

        <select
          value={filters.discountType}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                discountType:
                  event.target.value,
              }),
            )
          }
        >
          <option value="">
            All discount types
          </option>

          <option value="PERCENTAGE">
            Percentage
          </option>

          <option value="FIXED">
            Fixed Amount
          </option>
        </select>

        <select
          value={filters.activeState}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                activeState:
                  event.target.value,
              }),
            )
          }
        >
          <option value="">
            All activation states
          </option>

          <option value="ACTIVE">
            Active only
          </option>

          <option value="INACTIVE">
            Inactive only
          </option>
        </select>

        <select
          value={filters.validityState}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                validityState:
                  event.target.value,
              }),
            )
          }
        >
          <option value="">
            All validity states
          </option>

          <option value="VALID">
            Currently valid
          </option>

          <option value="INVALID">
            Not currently valid
          </option>
        </select>

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

          <option value="code">
            Code A–Z
          </option>

          <option value="-value">
            Highest value
          </option>

          <option value="expires_at">
            Expiring first
          </option>
        </select>

        <div className="admin-coupon-filter-actions">
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

      <AdminCouponTable
        coupons={visibleCoupons}
        isLoading={isLoading}
        isUpdatingCode={isUpdatingCode}
        isDeletingCode={isDeletingCode}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />
    </section>
  );
}


export default AdminCouponsPage;
