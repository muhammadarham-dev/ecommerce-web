import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiClock,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import RecentlyViewedCard from
  "../components/products/RecentlyViewedCard";

import useRecentlyViewed from
  "../hooks/useRecentlyViewed";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  sortRecentlyViewedItems,
} from "../utils/recentlyViewed";


function RecentlyViewedPage() {
  const {
    recentlyViewedItems,
    recentlyViewedCount,
    isRecentlyViewedLoading,
    refreshRecentlyViewed,
    removeRecentlyViewed,
    clearHistory,
  } = useRecentlyViewed();

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    sortValue,
    setSortValue,
  ] = useState("RECENT");

  const [
    removingId,
    setRemovingId,
  ] = useState(null);

  const [
    isClearing,
    setIsClearing,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    refreshRecentlyViewed().catch(
      (error) => {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load recently viewed products.",
          ),
        );
      },
    );
  }, [refreshRecentlyViewed]);

  const filteredItems = useMemo(
    () => {
      const normalizedSearch =
        searchTerm.trim().toLowerCase();

      const matchingItems =
        recentlyViewedItems.filter(
          (entry) => {
            const searchableText = [
              entry.product?.name,
              entry.product?.sku,
              entry.product?.category_name,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return (
              !normalizedSearch
              || searchableText.includes(
                normalizedSearch,
              )
            );
          },
        );

      return sortRecentlyViewedItems(
        matchingItems,
        sortValue,
      );
    },
    [
      recentlyViewedItems,
      searchTerm,
      sortValue,
    ],
  );

  const handleRemove = async (
    entryId,
  ) => {
    setRemovingId(entryId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result =
        await removeRecentlyViewed(
          entryId,
        );

      setSuccessMessage(
        result.message
        ?? (
          "Product removed from "
          + "recently viewed history."
        ),
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to remove product.",
        ),
      );
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearHistory =
    async () => {
      const confirmed = window.confirm(
        "Clear your complete recently viewed history?",
      );

      if (!confirmed) {
        return;
      }

      setIsClearing(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const result =
          await clearHistory();

        setSuccessMessage(
          result.message
          ?? (
            "Recently viewed history "
            + "cleared successfully."
          ),
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to clear history.",
          ),
        );
      } finally {
        setIsClearing(false);
      }
    };

  return (
    <section className="recent-history-page">
      <div className="recent-history-header">
        <div className="container">
          <span className="section-label">
            Browsing activity
          </span>

          <h1>Recently Viewed</h1>

          <p>
            Return to products you previously
            explored and continue shopping.
          </p>
        </div>
      </div>

      <div className="container recent-history-content">
        <div className="recent-history-summary">
          <div>
            <FiClock />

            <span>
              <small>Products Viewed</small>

              <strong>
                {recentlyViewedCount}
              </strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleClearHistory}
            disabled={
              isClearing
              || recentlyViewedItems.length
                === 0
            }
          >
            <FiTrash2 />

            {isClearing
              ? "Clearing History..."
              : "Clear History"}
          </button>
        </div>

        <div className="recent-history-toolbar">
          <div className="recent-history-search">
            <FiSearch />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value,
                )
              }
              placeholder={
                "Search products, categories "
                + "or SKU"
              }
            />
          </div>

          <select
            value={sortValue}
            onChange={(event) =>
              setSortValue(
                event.target.value,
              )
            }
          >
            <option value="RECENT">
              Recently Viewed
            </option>

            <option value="MOST_VIEWED">
              Most Viewed
            </option>

            <option value="NAME_ASC">
              Product Name
            </option>

            <option value="PRICE_LOW">
              Price: Low to High
            </option>

            <option value="PRICE_HIGH">
              Price: High to Low
            </option>
          </select>
        </div>

        {successMessage && (
          <div className="store-message success">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="store-message error">
            {errorMessage}
          </div>
        )}

        {isRecentlyViewedLoading ? (
          <div className="recent-history-empty">
            <div className="loading-spinner" />

            <p>
              Loading browsing history...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="recent-history-empty">
            <FiClock />

            <h2>
              No Recently Viewed Products
            </h2>

            <p>
              Products you open will appear
              here automatically.
            </p>

            <Link
              to="/products"
              className="primary-button"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="recent-history-grid">
            {filteredItems.map(
              (entry) => (
                <RecentlyViewedCard
                  key={entry.id}
                  entry={entry}
                  onRemove={handleRemove}
                  isRemoving={
                    removingId === entry.id
                  }
                />
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}


export default RecentlyViewedPage;