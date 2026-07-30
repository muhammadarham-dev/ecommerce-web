import {
  FiBarChart2,
  FiBox,
  FiChevronRight,
  FiClock,
  FiDollarSign,
  FiFolder,
  FiHome,
  FiImage,
  FiLayers,
  FiLogOut,
  FiMapPin,
  FiMessageSquare,
  FiPackage,
  FiPercent,
  FiRotateCcw,
  FiSettings,
  FiShoppingBag,
  FiStar,
  FiTruck,
  FiX,
} from "react-icons/fi";

import {
  Link,
  NavLink,
} from "react-router-dom";


const navigationSections = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        to: "/admin/dashboard",
        icon: FiBarChart2,
        end: true,
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        label: "Products",
        to: "/admin/products",
        icon: FiPackage,
        end: false,
      },
      {
        label: "Categories",
        to: "/admin/categories",
        icon: FiFolder,
        end: false,
      },
      {
        label: "Variants",
        to: "/admin/variants",
        icon: FiLayers,
        end: false,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Orders",
        to: "/admin/orders",
        icon: FiTruck,
        end: false,
      },
      {
        label: "Returns",
        to: "/admin/returns",
        icon: FiRotateCcw,
        end: false,
      },
      {
        label: "Support Tickets",
        to: "/admin/tickets",
        icon: FiMessageSquare,
        end: false,
      },
      {
        label: "Shipments",
        to: "/admin/shipments",
        icon: FiMapPin,
        end: false,
      },
      {
        label: "Shipping Rates",
        to: "/admin/shipping-rates",
        icon: FiDollarSign,
        end: false,
      },
      {
        label: "Inventory",
        to: "/admin/inventory",
        icon: FiBox,
        end: true,
      },
      {
        label: "Stock History",
        to: "/admin/inventory/history",
        icon: FiClock,
        end: true,
      },
    ],
  },

  {
    label: "Marketing",
    items: [
      {
        label: "Coupons",
        to: "/admin/coupons",
        icon: FiPercent,
        end: false,
      },
      {
        label: "Reviews",
        to: "/admin/reviews",
        icon: FiStar,
        end: false,
      },
      {
        label: "Banners",
        to: "/admin/banners",
        icon: FiImage,
        end: false,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "Store Settings",
        to: "/admin/store-settings",
        icon: FiSettings,
        end: true,
      },
    ],
  },

];


function AdminSidebar({
  isOpen,
  onClose,
  onLogout,
  storeName,
  user,
}) {
  return (
    <>
      <button
        type="button"
        className={
          isOpen
            ? (
              "admin-sidebar-backdrop "
              + "admin-sidebar-backdrop--visible"
            )
            : "admin-sidebar-backdrop"
        }
        onClick={onClose}
        aria-label="Close admin navigation"
      />

      <aside
        className={
          isOpen
            ? (
              "admin-sidebar "
              + "admin-sidebar--open"
            )
            : "admin-sidebar"
        }
      >
        <div className="admin-sidebar__brand">
          <Link
            to="/admin/dashboard"
            onClick={onClose}
          >
            <span className="admin-sidebar__brand-mark">
              <FiShoppingBag />
            </span>

            <span>
              <strong>{storeName}</strong>
              <small>Administration</small>
            </span>
          </Link>

          <button
            type="button"
            className="admin-sidebar__close"
            onClick={onClose}
            aria-label="Close admin navigation"
          >
            <FiX />
          </button>
        </div>

        <div className="admin-sidebar__user">
          <span className="admin-sidebar__avatar">
            {String(
              user?.first_name
              || user?.username
              || "A",
            )
              .charAt(0)
              .toUpperCase()}
          </span>

          <div>
            <strong>
              {user?.first_name
                ? (
                  `${user.first_name} ${
                    user.last_name || ""
                  }`.trim()
                )
                : (
                  user?.username
                  || "Administrator"
                )}
            </strong>

            <small>
              {String(
                user?.role || "ADMIN",
              )
                .replaceAll("_", " ")
                .toLowerCase()}
            </small>
          </div>
        </div>

        <nav className="admin-sidebar__navigation">
          {navigationSections.map(
            (section) => (
              <div
                key={section.label}
                className="admin-sidebar__section"
              >
                <span className="admin-sidebar__section-label">
                  {section.label}
                </span>

                {section.items.map(
                  (item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={({
                          isActive,
                        }) =>
                          isActive
                            ? (
                              "admin-sidebar__link "
                              + "admin-sidebar__link--active"
                            )
                            : (
                              "admin-sidebar__link"
                            )
                        }
                      >
                        <Icon />

                        <span>
                          {item.label}
                        </span>

                        <FiChevronRight />
                      </NavLink>
                    );
                  },
                )}
              </div>
            ),
          )}
        </nav>

        <div className="admin-sidebar__footer">
          <Link
            to="/"
            className="admin-sidebar__store-link"
          >
            <FiHome />
            <span>Open Store</span>
          </Link>

          <button
            type="button"
            className="admin-sidebar__logout"
            onClick={onLogout}
          >
            <FiLogOut />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}


export default AdminSidebar;