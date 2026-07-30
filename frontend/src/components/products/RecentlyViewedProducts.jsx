import {
  useEffect,
} from "react";

import {
  FiArrowRight,
  FiClock,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import useRecentlyViewed from "../../hooks/useRecentlyViewed";

import RecentlyViewedCard from
  "./RecentlyViewedCard";


function RecentlyViewedProducts({
  limit = 4,
  title = "Recently Viewed",
  description = (
    "Continue browsing products you "
    + "recently explored."
  ),
}) {
  const authContext = useAuth();

  const isAuthenticated = Boolean(
    authContext.isAuthenticated
    ?? authContext.user
    ?? authContext.currentUser,
  );

  const {
    recentlyViewedItems,
    isRecentlyViewedLoading,
    refreshRecentlyViewed,
  } = useRecentlyViewed();

  useEffect(() => {
    if (
      isAuthenticated
      && recentlyViewedItems.length === 0
    ) {
      refreshRecentlyViewed().catch(
        () => {
          // This section remains hidden when
          // history cannot be loaded.
        },
      );
    }
  }, [
    isAuthenticated,
    recentlyViewedItems.length,
    refreshRecentlyViewed,
  ]);

  if (!isAuthenticated) {
    return null;
  }

  if (
    !isRecentlyViewedLoading
    && recentlyViewedItems.length === 0
  ) {
    return null;
  }

  const visibleItems =
    recentlyViewedItems.slice(
      0,
      limit,
    );

  return (
    <section className="recent-products-section">
      <div className="container">
        <div className="recent-products-heading">
          <div>
            <span className="section-label">
              <FiClock />
              Your browsing history
            </span>

            <h2>{title}</h2>

            <p>{description}</p>
          </div>

          <Link to="/recently-viewed">
            View Complete History
            <FiArrowRight />
          </Link>
        </div>

        {isRecentlyViewedLoading ? (
          <div className="recent-products-loading">
            <div className="loading-spinner" />
            <p>
              Loading recently viewed
              products...
            </p>
          </div>
        ) : (
          <div className="recent-products-grid">
            {visibleItems.map(
              (entry) => (
                <RecentlyViewedCard
                  key={entry.id}
                  entry={entry}
                  showRemoveButton={false}
                />
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}


export default RecentlyViewedProducts;