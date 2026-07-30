import {
  Navigate,
  useLocation,
} from "react-router-dom";

import useAuth from "../../hooks/useAuth";

function ProtectedRoute({ children }) {
  const {
    isAuthenticated,
    isLoading,
  } = useAuth();

  const location = useLocation();

  if (isLoading) {
    return (
      <section className="route-loading">
        <div className="loading-spinner" />
        <p>Loading your account...</p>
      </section>
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

  return children;
}

export default ProtectedRoute;