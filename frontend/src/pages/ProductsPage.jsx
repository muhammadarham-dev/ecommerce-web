import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiPackage,
  FiRefreshCcw,
  FiSearch,
} from "react-icons/fi";

import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import ProductCard from
  "../components/common/ProductCard";

import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";

import {
  fetchCategories,
  fetchProductCatalog,
} from "../services/productService";

import {
  getApiErrorMessage,
} from "../utils/apiData";


function readFilters(searchParams) {
  return {
    category:
      searchParams.get("category")
      ?? "",
    search:
      searchParams.get("search")
      ?? "",
    minPrice:
      searchParams.get("min_price")
      ?? "",
    maxPrice:
      searchParams.get("max_price")
      ?? "",
    inStock:
      searchParams.get("in_stock")
      === "true",
    ordering:
      searchParams.get("ordering")
      ?? "-created_at",
  };
}


function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const authContext = useAuth();
  const cartContext = useCart();

  const isAuthenticated =
    authContext.isAuthenticated
    ?? Boolean(
      authContext.user
      ?? authContext.currentUser,
    );

  const addItem =
    cartContext.addItem
    ?? cartContext.addToCart;

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    resultCount,
    setResultCount,
  ] = useState(0);

  const [
    hasNextPage,
    setHasNextPage,
  ] = useState(false);

  const [
    hasPreviousPage,
    setHasPreviousPage,
  ] = useState(false);

  const [
    draftFilters,
    setDraftFilters,
  ] = useState(
    () => readFilters(searchParams),
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isCategoriesLoading,
    setIsCategoriesLoading,
  ] = useState(true);

  const [
    addingProductId,
    setAddingProductId,
  ] = useState(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    noticeMessage,
    setNoticeMessage,
  ] = useState("");

  const queryString =
    searchParams.toString();

  const currentPage = Math.max(
    Number(
      searchParams.get("page")
      ?? 1,
    ),
    1,
  );

  useEffect(() => {
    setDraftFilters(
      readFilters(searchParams),
    );
  }, [queryString, searchParams]);

  useEffect(() => {
    let isActive = true;

    async function loadCategories() {
      setIsCategoriesLoading(true);

      try {
        const categoryData =
          await fetchCategories({
            ordering: "name",
          });

        if (isActive) {
          setCategories(
            categoryData.filter(
              (category) =>
                category.is_active
                !== false,
            ),
          );
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load product categories.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsCategoriesLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      isActive = false;
    };
  }, []);

  const loadProducts =
    useCallback(async () => {
      setIsLoading(true);
      setErrorMessage("");

      const params = {
        page: currentPage,
        ordering:
          searchParams.get("ordering")
          ?? "-created_at",
      };

      const category =
        searchParams.get("category");

      const search =
        searchParams.get("search");

      const minPrice =
        searchParams.get("min_price");

      const maxPrice =
        searchParams.get("max_price");

      const inStock =
        searchParams.get("in_stock");

      if (category) {
        params.category = category;
      }

      if (search) {
        params.search = search;
      }

      if (minPrice) {
        params.min_price = minPrice;
      }

      if (maxPrice) {
        params.max_price = maxPrice;
      }

      if (inStock === "true") {
        params.in_stock = true;
      }

      try {
        const result =
          await fetchProductCatalog(
            params,
          );

        setProducts(result.items);
        setResultCount(result.count);
        setHasNextPage(
          Boolean(result.next),
        );
        setHasPreviousPage(
          Boolean(result.previous),
        );
      } catch (error) {
        setProducts([]);
        setResultCount(0);
        setHasNextPage(false);
        setHasPreviousPage(false);

        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load store products.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      currentPage,
      searchParams,
    ]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) =>
          category.slug
          === searchParams.get(
            "category",
          ),
      )
      ?? null,
    [
      categories,
      searchParams,
    ],
  );

  const updateDraftFilter = (
    name,
    value,
  ) => {
    setDraftFilters(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );
  };

  const applyFilters = (
    event,
  ) => {
    event?.preventDefault();

    const nextParams =
      new URLSearchParams();

    if (draftFilters.category) {
      nextParams.set(
        "category",
        draftFilters.category,
      );
    }

    if (draftFilters.search.trim()) {
      nextParams.set(
        "search",
        draftFilters.search.trim(),
      );
    }

    if (
      draftFilters.minPrice !== ""
    ) {
      nextParams.set(
        "min_price",
        draftFilters.minPrice,
      );
    }

    if (
      draftFilters.maxPrice !== ""
    ) {
      nextParams.set(
        "max_price",
        draftFilters.maxPrice,
      );
    }

    if (draftFilters.inStock) {
      nextParams.set(
        "in_stock",
        "true",
      );
    }

    nextParams.set(
      "ordering",
      draftFilters.ordering
      || "-created_at",
    );

    nextParams.set("page", "1");

    setSearchParams(nextParams);
  };

  const resetFilters = () => {
    const resetValues = {
      category: "",
      search: "",
      minPrice: "",
      maxPrice: "",
      inStock: false,
      ordering: "-created_at",
    };

    setDraftFilters(resetValues);

    setSearchParams({
      ordering: "-created_at",
      page: "1",
    });
  };

  const handleSortChange = (
    event,
  ) => {
    const ordering =
      event.target.value;

    const nextParams =
      new URLSearchParams(
        searchParams,
      );

    nextParams.set(
      "ordering",
      ordering,
    );
    nextParams.set("page", "1");

    setDraftFilters(
      (current) => ({
        ...current,
        ordering,
      }),
    );

    setSearchParams(nextParams);
  };

  const changePage = (
    nextPage,
  ) => {
    const nextParams =
      new URLSearchParams(
        searchParams,
      );

    nextParams.set(
      "page",
      String(
        Math.max(nextPage, 1),
      ),
    );

    setSearchParams(nextParams);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const clearSelectedCategory =
    () => {
      updateDraftFilter(
        "category",
        "",
      );

      const nextParams =
        new URLSearchParams(
          searchParams,
        );

      nextParams.delete("category");
      nextParams.set("page", "1");

      setSearchParams(nextParams);
    };

  const handleAddToCart =
    async (product) => {
      if (!isAuthenticated) {
        navigate("/login", {
          state: {
            from:
              location.pathname
              + location.search,
          },
        });

        return;
      }

      if (
        typeof addItem
        !== "function"
      ) {
        setErrorMessage(
          "Cart service is unavailable.",
        );
        return;
      }

      setAddingProductId(
        product.id,
      );
      setErrorMessage("");
      setNoticeMessage("");

      try {
        await addItem({
          productId: product.id,
          quantity: 1,
        });

        setNoticeMessage(
          `${product.name} added to your cart.`,
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to add the product to cart.",
          ),
        );
      } finally {
        setAddingProductId(null);
      }
    };

  return (
    <section className="products-page">
      <div className="products-page-header">
        <div className="container">
          <span className="section-label">
            Store catalog
          </span>

          <h1>
            {selectedCategory
              ? selectedCategory.name
              : "Explore Our Products"}
          </h1>

          <p>
            {selectedCategory?.description
              || (
                "Browse products loaded directly "
                + "from the live Django catalog."
              )}
          </p>
        </div>
      </div>

      {noticeMessage && (
        <div className="container store-message success">
          {noticeMessage}
        </div>
      )}

      {errorMessage && (
        <div className="container store-message error">
          {errorMessage}
        </div>
      )}

      <div className="container products-layout">
        <aside className="products-sidebar">
          <form onSubmit={applyFilters}>
            <div className="filter-heading">
              <h3>Filters</h3>

              <button
                type="button"
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>

            <div className="filter-group">
              <h4>Categories</h4>

              {isCategoriesLoading ? (
                <p className="catalog-filter-note">
                  Loading categories...
                </p>
              ) : (
                <>
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="category"
                      checked={
                        draftFilters.category
                        === ""
                      }
                      onChange={() =>
                        updateDraftFilter(
                          "category",
                          "",
                        )
                      }
                    />

                    <span>
                      All Categories
                    </span>
                  </label>

                  {categories.map(
                    (category) => (
                      <label
                        key={category.id}
                        className="filter-option"
                      >
                        <input
                          type="radio"
                          name="category"
                          checked={
                            draftFilters.category
                            === category.slug
                          }
                          onChange={() =>
                            updateDraftFilter(
                              "category",
                              category.slug,
                            )
                          }
                        />

                        <span>
                          {category.name}
                        </span>
                      </label>
                    ),
                  )}
                </>
              )}
            </div>

            <div className="filter-group">
              <h4>Price Range</h4>

              <div className="price-inputs">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Min"
                  value={
                    draftFilters.minPrice
                  }
                  onChange={(event) =>
                    updateDraftFilter(
                      "minPrice",
                      event.target.value,
                    )
                  }
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Max"
                  value={
                    draftFilters.maxPrice
                  }
                  onChange={(event) =>
                    updateDraftFilter(
                      "maxPrice",
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>

            <div className="filter-group">
              <h4>Availability</h4>

              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={
                    draftFilters.inStock
                  }
                  onChange={(event) =>
                    updateDraftFilter(
                      "inStock",
                      event.target.checked,
                    )
                  }
                />

                <span>In Stock Only</span>
              </label>
            </div>

            <button
              type="submit"
              className="catalog-filter-button"
            >
              <FiFilter />
              Apply Filters
            </button>
          </form>
        </aside>

        <div className="products-main">
          <div className="products-toolbar">
            <form
              className="product-search"
              onSubmit={applyFilters}
            >
              <FiSearch />

              <input
                type="search"
                placeholder="Search products"
                value={
                  draftFilters.search
                }
                onChange={(event) =>
                  updateDraftFilter(
                    "search",
                    event.target.value,
                  )
                }
              />
            </form>

            <select
              value={
                draftFilters.ordering
              }
              onChange={
                handleSortChange
              }
            >
              <option value="-created_at">
                Newest
              </option>

              <option value="price">
                Price: Low to High
              </option>

              <option value="-price">
                Price: High to Low
              </option>

              <option value="-average_rating">
                Highest Rated
              </option>

              <option value="name">
                Name: A to Z
              </option>
            </select>
          </div>

          <div className="catalog-result-summary">
            <span>
              {resultCount}
              {" "}
              {resultCount === 1
                ? "product"
                : "products"}
              {" found"}
            </span>

            {selectedCategory && (
              <button
                type="button"
                onClick={
                  clearSelectedCategory
                }
              >
                Clear category:
                {" "}
                {selectedCategory.name}
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="content-loading catalog-products-state">
              <div className="loading-spinner" />
              <p>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="catalog-empty-state">
              <FiPackage />

              <h2>No Products Found</h2>

              <p>
                No active products match the
                selected filters.
              </p>

              <button
                type="button"
                className="secondary-button"
                onClick={resetFilters}
              >
                <FiRefreshCcw />
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="products-grid catalog-products-grid">
              {products.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={
                      handleAddToCart
                    }
                    isAdding={
                      addingProductId
                      === product.id
                    }
                  />
                ),
              )}
            </div>
          )}

          {!isLoading
            && (
              hasPreviousPage
              || hasNextPage
            )
            && (
              <nav
                className="catalog-pagination"
                aria-label={
                  "Product pagination"
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    changePage(
                      currentPage - 1,
                    )
                  }
                  disabled={
                    !hasPreviousPage
                  }
                >
                  <FiChevronLeft />
                  Previous
                </button>

                <span>
                  Page {currentPage}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    changePage(
                      currentPage + 1,
                    )
                  }
                  disabled={!hasNextPage}
                >
                  Next
                  <FiChevronRight />
                </button>
              </nav>
            )}
        </div>
      </div>
    </section>
  );
}


export default ProductsPage;
