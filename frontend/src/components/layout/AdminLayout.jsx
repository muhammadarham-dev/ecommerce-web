import {
  useMemo,
  useState,
} from "react";

import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import AdminSidebar from
  "../admin/AdminSidebar";

import AdminTopbar from
  "../admin/AdminTopbar";

import useAuth from
  "../../hooks/useAuth";

import useStoreSettings from
  "../../hooks/useStoreSettings";


const exactPageMetadata = {
  "/admin/dashboard": {
    title: "Dashboard",
    subtitle: "Monitor store performance and operational activity.",
  },
  "/admin/products": {
    title: "Products",
    subtitle: "Manage products, pricing, stock, and visibility.",
  },
  "/admin/products/create": {
    title: "Create Product",
    subtitle: "Add a new product to the store catalog.",
  },
  "/admin/categories": {
    title: "Categories",
    subtitle: "Organize products into customer-friendly categories.",
  },
  "/admin/categories/create": {
    title: "Create Category",
    subtitle: "Add a new category to the store catalog.",
  },
};


function getPageMetadata(pathname) {
  if (exactPageMetadata[pathname]) {
    return exactPageMetadata[pathname];
  }

  if (
    pathname.startsWith("/admin/products/")
    && pathname.endsWith("/edit")
  ) {
    return {
      title: "Edit Product",
      subtitle: "Update product information and gallery images.",
    };
  }

  if (
    pathname.startsWith("/admin/categories/")
    && pathname.endsWith("/edit")
  ) {
    return {
      title: "Edit Category",
      subtitle: "Update category information and visibility.",
    };
  }

  return {
    title: "Administration",
    subtitle: "Manage your ecommerce operations.",
  };
}


function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    user,
    isAuthenticated,
    isLoading,
    logout,
  } = useAuth();

  const {
    storeSettings,
  } = useStoreSettings();

  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(false);

  const normalizedRole = String(
    user?.role || "",
  ).toUpperCase();

  const hasAdminAccess = Boolean(
    user?.is_superuser
    || normalizedRole === "ADMIN"
    || normalizedRole === "ORDER_MANAGER",
  );

  const metadata = useMemo(
    () => getPageMetadata(location.pathname),
    [location.pathname],
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login", {
      replace: true,
    });
  };

  if (isLoading) {
    return (
      <div className="admin-access-state">
        <div className="admin-loading-spinner" />
        <p>Checking administrator access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (!hasAdminAccess) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return (
    <div className="admin-shell">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        storeName={
          storeSettings?.store_name
          || "ShopSphere"
        }
        user={user}
      />

      <div className="admin-shell__workspace">
        <AdminTopbar
          title={metadata.title}
          subtitle={metadata.subtitle}
          onOpenNavigation={() => setIsSidebarOpen(true)}
          user={user}
        />

        <main className="admin-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


export default AdminLayout;