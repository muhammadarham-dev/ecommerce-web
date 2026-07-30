import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  FiBell,
  FiChevronDown,
  FiClock,
  FiGrid,
  FiHeart,
  FiHome,
  FiLogOut,
  FiMail,
  FiMenu,
  FiMessageCircle,
  FiPackage,
  FiRotateCcw,
  FiSearch,
  FiShield,
  FiShoppingBag,
  FiStar,
  FiTag,
  FiTruck,
  FiUser,
  FiX,
} from "react-icons/fi";

import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import useCart from "../../hooks/useCart";
import useNotifications from "../../hooks/useNotifications";
import useStoreSettings from "../../hooks/useStoreSettings";
import useWishlist from "../../hooks/useWishlist";


const accountLinks = [
  {
    label: "My Account",
    path: "/account",
    icon: FiUser,
  },
  {
    label: "Security Center",
    path: "/security",
    icon: FiShield,
  },
  {
    label: "Email Preferences",
    path: "/email-preferences",
    icon: FiMail,
  },
  {
    label: "Coupons & Offers",
    path: "/coupons",
    icon: FiTag,
  },
  {
    label: "My Orders",
    path: "/orders",
    icon: FiPackage,
  },
  {
    label: "My Shipments",
    path: "/shipments",
    icon: FiTruck,
  },
  {
    label: "Recently Viewed",
    path: "/recently-viewed",
    icon: FiClock,
  },
  {
    label: "My Reviews",
    path: "/reviews",
    icon: FiStar,
  },
  {
    label: "My Returns",
    path: "/returns",
    icon: FiRotateCcw,
  },
  {
    label: "Support Tickets",
    path: "/tickets",
    icon: FiMessageCircle,
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: FiBell,
  },
];


function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const accountMenuRef = useRef(null);

  const authContext = useAuth();
  const cartContext = useCart();
  const wishlistContext = useWishlist();
  const notificationContext = useNotifications();

  const {
    storeSettings,
  } = useStoreSettings();

  const user =
    authContext.user
    ?? authContext.currentUser;

  const isAuthenticated =
    authContext.isAuthenticated
    ?? Boolean(user);

  const logoutAction =
    authContext.logout
    ?? authContext.signOut;

  const cartCount = Number(
    cartContext.cartCount
    ?? cartContext.totalItems
    ?? cartContext.cart?.item_count
    ?? cartContext.cart?.items?.length
    ?? 0,
  );

  const wishlistCount = Number(
    wishlistContext.wishlistCount
    ?? wishlistContext.totalItems
    ?? wishlistContext.wishlist?.items?.length
    ?? wishlistContext.wishlistItems?.length
    ?? 0,
  );

  const unreadCount = Number(
    notificationContext.unreadCount
    ?? 0,
  );

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    isSearchOpen,
    setIsSearchOpen,
  ] = useState(false);

  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  ] = useState(false);

  const [
    isAccountMenuOpen,
    setIsAccountMenuOpen,
  ] = useState(false);

  useEffect(() => {
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        accountMenuRef.current
        && !accountMenuRef.current.contains(
          event.target,
        )
      ) {
        setIsAccountMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key !== "Escape") {
        return;
      }

      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
      setIsAccountMenuOpen(false);
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow =
      isMobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const normalizedSearch =
      searchTerm.trim();

    navigate(
      normalizedSearch
        ? `/products?search=${encodeURIComponent(
          normalizedSearch,
        )}`
        : "/products",
    );

    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);

    try {
      if (
        typeof logoutAction
        === "function"
      ) {
        await logoutAction();
      }
    } finally {
      navigate("/login", {
        replace: true,
      });
    }
  };

  const storeName =
    storeSettings?.store_name
    || "ShopSphere";

  const userLabel =
    user?.first_name
    || user?.username
    || "Account";

  const brandInitial =
    storeName.charAt(0).toUpperCase();

  const userInitial =
    userLabel.charAt(0).toUpperCase();

  return (
    <header className="ec-navbar">
      <div className="container ec-navbar__row">
        <Link
          to="/"
          className="ec-navbar__brand"
          aria-label={`${storeName} home`}
        >
          {storeSettings?.logo_url ? (
            <img
              src={storeSettings.logo_url}
              alt={storeName}
            />
          ) : (
            <span className="ec-navbar__brand-mark">
              {brandInitial}
            </span>
          )}

          <span className="ec-navbar__brand-name">
            {storeName}
          </span>
        </Link>

        <nav
          className="ec-navbar__nav"
          aria-label="Primary navigation"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            <FiHome />
            Home
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            <FiShoppingBag />
            Shop
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to="/coupons"
              className={({ isActive }) =>
                isActive ? "active" : ""
              }
            >
              <FiTag />
              Coupons
            </NavLink>
          )}

          <Link to="/products?browse=categories">
            <FiGrid />
            Categories
          </Link>
        </nav>

        <form
          className="ec-navbar__search"
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <FiSearch />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search products"
            aria-label="Search products"
          />

          <button type="submit">
            Search
          </button>
        </form>

        <div className="ec-navbar__desktop-actions">
          {isAuthenticated && (
            <>
              <Link
                to="/wishlist"
                className="ec-navbar__icon-button"
                aria-label="Wishlist"
              >
                <FiHeart />

                {wishlistCount > 0 && (
                  <span>
                    {wishlistCount > 99
                      ? "99+"
                      : wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                to="/notifications"
                className="ec-navbar__icon-button"
                aria-label="Notifications"
              >
                <FiBell />

                {unreadCount > 0 && (
                  <span className="ec-navbar__count-danger">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                )}
              </Link>
            </>
          )}

          <Link
            to="/cart"
            className="ec-navbar__icon-button"
            aria-label="Shopping cart"
          >
            <FiShoppingBag />

            {cartCount > 0 && (
              <span>
                {cartCount > 99
                  ? "99+"
                  : cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div
              className="ec-navbar__account"
              ref={accountMenuRef}
            >
              <button
                type="button"
                className="ec-navbar__account-trigger"
                onClick={() =>
                  setIsAccountMenuOpen(
                    (currentValue) =>
                      !currentValue,
                  )
                }
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
              >
                <span className="ec-navbar__avatar">
                  {userInitial}
                </span>

                <strong>{userLabel}</strong>

                <FiChevronDown
                  className={
                    isAccountMenuOpen
                      ? "open"
                      : ""
                  }
                />
              </button>

              {isAccountMenuOpen && (
                <div
                  className="ec-navbar__dropdown"
                  role="menu"
                >
                  <div className="ec-navbar__dropdown-profile">
                    <span className="ec-navbar__avatar ec-navbar__avatar--large">
                      {userInitial}
                    </span>

                    <div>
                      <strong>{userLabel}</strong>
                      <span>{user?.email}</span>
                    </div>
                  </div>

                  <div className="ec-navbar__dropdown-links">
                    {accountLinks.map(
                      (accountLink) => {
                        const Icon =
                          accountLink.icon;

                        const isNotificationLink =
                          accountLink.path
                          === "/notifications";

                        return (
                          <Link
                            key={accountLink.path}
                            to={accountLink.path}
                            role="menuitem"
                          >
                            <Icon />
                            <span>
                              {accountLink.label}
                            </span>

                            {isNotificationLink
                              && unreadCount > 0 && (
                                <small>
                                  {unreadCount > 99
                                    ? "99+"
                                    : unreadCount}
                                </small>
                              )}
                          </Link>
                        );
                      },
                    )}
                  </div>

                  <button
                    type="button"
                    className="ec-navbar__logout"
                    onClick={handleLogout}
                  >
                    <FiLogOut />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="ec-navbar__guest-actions">
              <Link
                to="/login"
                className="ec-navbar__login"
              >
                Sign In
              </Link>

              <Link
                to="/register"
                className="ec-navbar__register"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>

        <div className="ec-navbar__mobile-actions">
          <button
            type="button"
            className="ec-navbar__mobile-button"
            onClick={() =>
              setIsSearchOpen(
                (currentValue) =>
                  !currentValue,
              )
            }
            aria-label="Open search"
            aria-expanded={isSearchOpen}
          >
            <FiSearch />
          </button>

          <Link
            to="/cart"
            className="ec-navbar__mobile-button"
            aria-label="Shopping cart"
          >
            <FiShoppingBag />

            {cartCount > 0 && (
              <span>
                {cartCount > 99
                  ? "99+"
                  : cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="ec-navbar__mobile-button"
            onClick={() =>
              setIsMobileMenuOpen(true)
            }
            aria-label="Open navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <FiMenu />
          </button>
        </div>
      </div>

      {isSearchOpen && (
        <div className="ec-navbar__mobile-search">
          <form
            className="container"
            onSubmit={handleSearchSubmit}
            role="search"
          >
            <FiSearch />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value,
                )
              }
              placeholder="Search products"
              aria-label="Search products"
              autoFocus
            />

            <button type="submit">
              Search
            </button>

            <button
              type="button"
              className="ec-navbar__search-close"
              onClick={() =>
                setIsSearchOpen(false)
              }
              aria-label="Close search"
            >
              <FiX />
            </button>
          </form>
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="ec-drawer">
          <button
            type="button"
            className="ec-drawer__backdrop"
            onClick={() =>
              setIsMobileMenuOpen(false)
            }
            aria-label="Close menu"
          />

          <aside className="ec-drawer__panel">
            <div className="ec-drawer__header">
              <Link
                to="/"
                className="ec-drawer__brand"
              >
                {storeSettings?.logo_url ? (
                  <img
                    src={storeSettings.logo_url}
                    alt={storeName}
                  />
                ) : (
                  <span>
                    {brandInitial}
                  </span>
                )}

                <strong>{storeName}</strong>
              </Link>

              <button
                type="button"
                onClick={() =>
                  setIsMobileMenuOpen(false)
                }
                aria-label="Close menu"
              >
                <FiX />
              </button>
            </div>

            {isAuthenticated && (
              <div className="ec-drawer__profile">
                <span className="ec-navbar__avatar ec-navbar__avatar--large">
                  {userInitial}
                </span>

                <div>
                  <strong>{userLabel}</strong>
                  <span>{user?.email}</span>
                </div>
              </div>
            )}

            <nav className="ec-drawer__nav">
              <Link to="/">
                <FiHome />
                Home
              </Link>

              <Link to="/products">
                <FiShoppingBag />
                Shop Products
              </Link>

              {isAuthenticated && (
                <Link to="/coupons">
                  <FiTag />
                  Coupons & Offers
                </Link>
              )}

              <Link to="/store-information">
                <FiGrid />
                Store Information
              </Link>

              {isAuthenticated && (
                <>
                  <Link to="/wishlist">
                    <FiHeart />
                    Wishlist

                    {wishlistCount > 0 && (
                      <small>
                        {wishlistCount > 99
                          ? "99+"
                          : wishlistCount}
                      </small>
                    )}
                  </Link>

                  {accountLinks.map(
                    (accountLink) => {
                      const Icon =
                        accountLink.icon;

                      const isNotificationLink =
                        accountLink.path
                        === "/notifications";

                      return (
                        <Link
                          key={accountLink.path}
                          to={accountLink.path}
                        >
                          <Icon />
                          {accountLink.label}

                          {isNotificationLink
                            && unreadCount > 0 && (
                              <small>
                                {unreadCount > 99
                                  ? "99+"
                                  : unreadCount}
                              </small>
                            )}
                        </Link>
                      );
                    },
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                  >
                    <FiLogOut />
                    Sign Out
                  </button>
                </>
              )}

              {!isAuthenticated && (
                <>
                  <Link to="/login">
                    <FiUser />
                    Sign In
                  </Link>

                  <Link to="/register">
                    <FiUser />
                    Create Account
                  </Link>
                </>
              )}
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
}


export default Navbar;