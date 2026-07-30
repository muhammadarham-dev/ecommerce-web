import {
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiImage,
  FiPower,
  FiTrash2,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import {
  resolveMediaUrl,
} from "../../../utils/media";


function formatDateTime(value) {
  if (!value) {
    return "No limit";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No limit";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}


function AdminBannerTable({
  banners = [],
  isLoading = false,
  isUpdatingId = null,
  isDeletingId = null,
  onToggleStatus,
  onDelete,
}) {
  if (isLoading) {
    return (
      <div className="admin-banners-state">
        <div className="admin-loading-spinner" />
        <p>Loading banners...</p>
      </div>
    );
  }

  if (!banners.length) {
    return (
      <div className="admin-banners-empty">
        <FiImage />

        <h3>No banners found</h3>

        <p>
          No banner records match the selected
          filters.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-banner-table-shell">
      <table className="admin-banner-table">
        <thead>
          <tr>
            <th>Banner</th>
            <th>Position</th>
            <th>Schedule</th>
            <th>Order</th>
            <th>Visibility</th>
            <th>Created By</th>
            <th aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {banners.map((banner) => {
            const imageUrl =
              resolveMediaUrl(
                banner.image,
              );

            const isUpdating =
              Number(isUpdatingId)
              === Number(banner.id);

            const isDeleting =
              Number(isDeletingId)
              === Number(banner.id);

            return (
              <tr key={banner.id}>
                <td>
                  <div className="admin-banner-identity">
                    <span className="admin-banner-thumbnail">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={banner.title}
                        />
                      ) : (
                        <FiImage />
                      )}
                    </span>

                    <span>
                      <strong>
                        {banner.title}
                      </strong>

                      <small>
                        {banner.subtitle
                          || "No subtitle"}
                      </small>
                    </span>
                  </div>
                </td>

                <td>
                  <span className="admin-banner-position">
                    {banner.position}
                  </span>
                </td>

                <td>
                  <div className="admin-banner-schedule">
                    <span>
                      Starts:{" "}
                      {formatDateTime(
                        banner.starts_at,
                      )}
                    </span>

                    <span>
                      Ends:{" "}
                      {formatDateTime(
                        banner.ends_at,
                      )}
                    </span>
                  </div>
                </td>

                <td>
                  <strong className="admin-banner-order">
                    {banner.display_order}
                  </strong>
                </td>

                <td>
                  <div className="admin-banner-visibility">
                    <span
                      className={
                        banner.is_currently_visible
                          ? (
                            "admin-banner-visibility-pill "
                            + "admin-banner-visibility-pill--visible"
                          )
                          : (
                            "admin-banner-visibility-pill "
                            + "admin-banner-visibility-pill--hidden"
                          )
                      }
                    >
                      {banner.is_currently_visible
                        ? <FiEye />
                        : <FiEyeOff />}

                      {banner.is_currently_visible
                        ? "Visible"
                        : "Not Visible"}
                    </span>

                    <span
                      className={
                        banner.is_active
                          ? (
                            "admin-banner-active-pill "
                            + "admin-banner-active-pill--active"
                          )
                          : (
                            "admin-banner-active-pill "
                            + "admin-banner-active-pill--inactive"
                          )
                      }
                    >
                      {banner.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                </td>

                <td>
                  <span className="admin-banner-created-by">
                    {banner.created_by_username
                      || "System"}
                  </span>
                </td>

                <td>
                  <div className="admin-banner-actions">
                    <Link
                      to={
                        `/admin/banners/${
                          banner.id
                        }/edit`
                      }
                      className="admin-banner-action-button"
                      aria-label={
                        `Edit banner ${
                          banner.title
                        }`
                      }
                    >
                      <FiEdit2 />
                    </Link>

                    <button
                      type="button"
                      className="admin-banner-action-button"
                      onClick={() =>
                        onToggleStatus(banner)
                      }
                      disabled={
                        isUpdating
                        || isDeleting
                      }
                      aria-label={
                        banner.is_active
                          ? (
                            `Deactivate banner ${
                              banner.title
                            }`
                          )
                          : (
                            `Activate banner ${
                              banner.title
                            }`
                          )
                      }
                    >
                      <FiPower />
                    </button>

                    <button
                      type="button"
                      className={
                        "admin-banner-action-button "
                        + "admin-banner-action-button--danger"
                      }
                      onClick={() =>
                        onDelete(banner)
                      }
                      disabled={
                        isUpdating
                        || isDeleting
                      }
                      aria-label={
                        `Delete banner ${
                          banner.title
                        }`
                      }
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


export default AdminBannerTable;
