import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiEye,
  FiEyeOff,
  FiFilter,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import AdminBannerTable from
  "../../components/admin/banners/AdminBannerTable";

import {
  deleteAdminBanner,
  fetchAdminBanners,
  updateAdminBannerStatus,
} from "../../services/adminBannerService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";


const initialFilters = {
  search: "",
  title: "",
  position: "",
  activeState: "",
  visibilityState: "",
  activeFrom: "",
  activeUntil: "",
  ordering: "display_order,-created_at",
};


function AdminBannersPage() {
  const [
    banners,
    setBanners,
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
    isUpdatingId,
    setIsUpdatingId,
  ] = useState(null);

  const [
    isDeletingId,
    setIsDeletingId,
  ] = useState(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    noticeMessage,
    setNoticeMessage,
  ] = useState("");

  const loadBanners = useCallback(
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
        appliedFilters.title.trim()
      ) {
        params.title =
          appliedFilters.title.trim();
      }

      if (appliedFilters.position) {
        params.position =
          appliedFilters.position;
      }

      if (
        appliedFilters.activeState
        !== ""
      ) {
        params.is_active =
          appliedFilters.activeState;
      }

      if (
        appliedFilters.activeFrom
      ) {
        params.active_from =
          new Date(
            appliedFilters.activeFrom,
          ).toISOString();
      }

      if (
        appliedFilters.activeUntil
      ) {
        params.active_until =
          new Date(
            appliedFilters.activeUntil,
          ).toISOString();
      }

      try {
        const result =
          await fetchAdminBanners(params);

        setBanners(result.items);
        setTotalCount(result.count);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load banners.",
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
    loadBanners();
  }, [loadBanners]);

  const visibleBanners = useMemo(
    () =>
      banners.filter((banner) => {
        if (
          appliedFilters.visibilityState
          === "VISIBLE"
          && !banner.is_currently_visible
        ) {
          return false;
        }

        if (
          appliedFilters.visibilityState
          === "HIDDEN"
          && banner.is_currently_visible
        ) {
          return false;
        }

        return true;
      }),
    [
      appliedFilters.visibilityState,
      banners,
    ],
  );

  const activeCount =
    visibleBanners.filter(
      (banner) => banner.is_active,
    ).length;

  const currentlyVisibleCount =
    visibleBanners.filter(
      (banner) =>
        banner.is_currently_visible,
    ).length;

  const scheduledCount =
    visibleBanners.filter(
      (banner) =>
        banner.starts_at
        || banner.ends_at,
    ).length;

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
    async (banner) => {
      setIsUpdatingId(banner.id);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        const updatedBanner =
          await updateAdminBannerStatus(
            banner.id,
            !banner.is_active,
          );

        setBanners(
          (currentBanners) =>
            currentBanners.map(
              (currentBanner) =>
                currentBanner.id
                === updatedBanner.id
                  ? updatedBanner
                  : currentBanner,
            ),
        );

        setNoticeMessage(
          `${banner.title} ${
            updatedBanner.is_active
              ? "activated"
              : "deactivated"
          } successfully.`,
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to update banner status.",
          ),
        );
      } finally {
        setIsUpdatingId(null);
      }
    };

  const handleDelete =
    async (banner) => {
      const confirmed =
        window.confirm(
          `Delete banner "${banner.title}"? `
          + "This action cannot be undone.",
        );

      if (!confirmed) {
        return;
      }

      setIsDeletingId(banner.id);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        await deleteAdminBanner(
          banner.id,
        );

        setBanners(
          (currentBanners) =>
            currentBanners.filter(
              (currentBanner) =>
                currentBanner.id
                !== banner.id,
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
          `${banner.title} deleted successfully.`,
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to delete this banner.",
          ),
        );
      } finally {
        setIsDeletingId(null);
      }
    };

  return (
    <section className="admin-banners-page">
      <div className="admin-banners-page__heading">
        <div>
          <span className="admin-banners-eyebrow">
            Homepage content
          </span>

          <h1>Banners</h1>

          <p>
            Upload promotional visuals, control
            placement and schedule homepage
            campaigns.
          </p>
        </div>

        <div className="admin-banners-heading-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() =>
              loadBanners({
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
            to="/admin/banners/create"
            className="admin-primary-button"
          >
            <FiPlus />
            Create Banner
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

      <div className="admin-banner-stats">
        <article className="admin-banner-stat-card">
          <span>
            <FiImage />
          </span>

          <div>
            <small>Total Banners</small>

            <strong>
              {Number(
                totalCount,
              ).toLocaleString("en-US")}
            </strong>
          </div>
        </article>

        <article className="admin-banner-stat-card">
          <span>
            <FiEye />
          </span>

          <div>
            <small>Visible Now</small>

            <strong>
              {currentlyVisibleCount}
            </strong>
          </div>
        </article>

        <article className="admin-banner-stat-card">
          <span>
            <FiEyeOff />
          </span>

          <div>
            <small>Visible Active</small>

            <strong>
              {activeCount}
            </strong>
          </div>
        </article>

        <article className="admin-banner-stat-card">
          <span>
            <FiRefreshCw />
          </span>

          <div>
            <small>Scheduled</small>

            <strong>
              {scheduledCount}
            </strong>
          </div>
        </article>
      </div>

      <form
        className="admin-banner-filters"
        onSubmit={handleFilterSubmit}
      >
        <label className="admin-banner-search">
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
              "Search title, subtitle, description or button"
            }
          />
        </label>

        <input
          type="text"
          value={filters.title}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                title:
                  event.target.value,
              }),
            )
          }
          placeholder="Title contains"
        />

        <select
          value={filters.position}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                position:
                  event.target.value,
              }),
            )
          }
        >
          <option value="">
            All positions
          </option>

          <option value="HERO">
            Hero Banner
          </option>

          <option value="PROMOTIONAL">
            Promotional Banner
          </option>

          <option value="CATEGORY">
            Category Banner
          </option>

          <option value="SIDEBAR">
            Sidebar Banner
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

          <option value="true">
            Active only
          </option>

          <option value="false">
            Inactive only
          </option>
        </select>

        <select
          value={filters.visibilityState}
          onChange={(event) =>
            setFilters(
              (current) => ({
                ...current,
                visibilityState:
                  event.target.value,
              }),
            )
          }
        >
          <option value="">
            All visibility states
          </option>

          <option value="VISIBLE">
            Visible now
          </option>

          <option value="HIDDEN">
            Not visible now
          </option>
        </select>

        <label className="admin-banner-date-filter">
          <span>Starts from</span>

          <input
            type="datetime-local"
            value={filters.activeFrom}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  activeFrom:
                    event.target.value,
                }),
              )
            }
          />
        </label>

        <label className="admin-banner-date-filter">
          <span>Ends until</span>

          <input
            type="datetime-local"
            value={filters.activeUntil}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  activeUntil:
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
          <option value="display_order,-created_at">
            Display order
          </option>

          <option value="-created_at">
            Newest first
          </option>

          <option value="created_at">
            Oldest first
          </option>

          <option value="title">
            Title A–Z
          </option>

          <option value="position,display_order">
            Position and order
          </option>

          <option value="starts_at">
            Starting first
          </option>
        </select>

        <div className="admin-banner-filter-actions">
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

      <AdminBannerTable
        banners={visibleBanners}
        isLoading={isLoading}
        isUpdatingId={isUpdatingId}
        isDeletingId={isDeletingId}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />
    </section>
  );
}


export default AdminBannersPage;
