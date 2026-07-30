import {
  FiMenu,
  FiRefreshCw,
} from "react-icons/fi";


function AdminTopbar({
  title,
  subtitle,
  onOpenNavigation,
  onRefresh,
  isRefreshing,
  user,
}) {
  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ""}`.trim()
    : user?.username || "Administrator";

  return (
    <header className="admin-topbar">
      <div className="admin-topbar__heading">
        <button
          type="button"
          className="admin-topbar__menu-button"
          onClick={onOpenNavigation}
          aria-label="Open admin navigation"
        >
          <FiMenu />
        </button>

        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="admin-topbar__actions">
        {typeof onRefresh === "function" && (
          <button
            type="button"
            className="admin-topbar__refresh"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <FiRefreshCw
              className={
                isRefreshing
                  ? "admin-topbar__refresh-icon admin-topbar__refresh-icon--spinning"
                  : "admin-topbar__refresh-icon"
              }
            />

            <span>
              {isRefreshing ? "Refreshing" : "Refresh"}
            </span>
          </button>
        )}

        <div className="admin-topbar__profile">
          <span className="admin-topbar__avatar">
            {displayName.charAt(0).toUpperCase()}
          </span>

          <div>
            <strong>{displayName}</strong>
            <small>
              {String(user?.role || "ADMIN")
                .replaceAll("_", " ")
                .toLowerCase()}
            </small>
          </div>
        </div>
      </div>
    </header>
  );
}


export default AdminTopbar;