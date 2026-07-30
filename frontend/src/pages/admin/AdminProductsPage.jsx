import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiFilter,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import { Link } from "react-router-dom";

import AdminProductTable from "../../components/admin/products/AdminProductTable";
import useStoreSettings from "../../hooks/useStoreSettings";
import {
  deleteAdminProduct,
  fetchAdminCategories,
  fetchAdminProducts,
  updateAdminProduct,
} from "../../services/adminProductService";
import { getApiErrorMessage } from "../../utils/apiData";

import "../../styles/admin-products.css";


const initialFilters = {
  search: "",
  category: "",
  status: "",
  featured: "",
  ordering: "-created_at",
};


function AdminProductsPage() {
  const { formatMoney } = useStoreSettings();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [busyProductSlug, setBusyProductSlug] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  const moneyFormatter = useMemo(
    () => formatMoney || ((value) => `$${Number(value || 0).toFixed(2)}`),
    [formatMoney],
  );

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const params = {
      ordering: appliedFilters.ordering,
    };

    if (appliedFilters.search.trim()) {
      params.search = appliedFilters.search.trim();
    }

    if (appliedFilters.category) {
      params.category = appliedFilters.category;
    }

    if (appliedFilters.status) {
      params.is_active = appliedFilters.status;
    }

    if (appliedFilters.featured) {
      params.is_featured = appliedFilters.featured;
    }

    try {
      const [productData, categoryData] = await Promise.all([
        fetchAdminProducts(params),
        fetchAdminCategories({ ordering: "name" }),
      ]);

      setProducts(productData);
      setCategories(categoryData);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to load the product catalog."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const handleToggleActive = async (product) => {
    setBusyProductSlug(product.slug);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const updated = await updateAdminProduct(product.slug, {
        is_active: !product.is_active,
      });

      setProducts((current) => current.map((item) => (
        item.id === updated.id ? updated : item
      )));

      setNoticeMessage(
        `${updated.name} is now ${updated.is_active ? "active" : "inactive"}.`,
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to update product status."),
      );
    } finally {
      setBusyProductSlug("");
    }
  };

  const handleToggleFeatured = async (product) => {
    setBusyProductSlug(product.slug);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const updated = await updateAdminProduct(product.slug, {
        is_featured: !product.is_featured,
      });

      setProducts((current) => current.map((item) => (
        item.id === updated.id ? updated : item
      )));

      setNoticeMessage(
        `${updated.name} ${updated.is_featured ? "added to" : "removed from"} featured products.`,
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to update featured status."),
      );
    } finally {
      setBusyProductSlug("");
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Delete ${product.name}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setBusyProductSlug(product.slug);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      await deleteAdminProduct(product.slug);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setNoticeMessage(`${product.name} was deleted successfully.`);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to delete this product because it may be linked to existing orders.",
        ),
      );
    } finally {
      setBusyProductSlug("");
    }
  };

  return (
    <section className="admin-catalog-page">
      <div className="admin-catalog-page__heading">
        <div>
          <span className="admin-catalog-eyebrow">Catalog management</span>
          <h1>Products</h1>
          <p>Manage product information, pricing, stock, visibility, and featured status.</p>
        </div>

        <Link to="/admin/products/create" className="admin-primary-button">
          <FiPlus />
          Add Product
        </Link>
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

      <form className="admin-catalog-filters" onSubmit={handleFilterSubmit}>
        <label className="admin-catalog-search">
          <FiSearch />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({
              ...current,
              search: event.target.value,
            }))}
            placeholder="Search by product, SKU, or category"
          />
        </label>

        <select
          value={filters.category}
          onChange={(event) => setFilters((current) => ({
            ...current,
            category: event.target.value,
          }))}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(event) => setFilters((current) => ({
            ...current,
            status: event.target.value,
          }))}
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <select
          value={filters.featured}
          onChange={(event) => setFilters((current) => ({
            ...current,
            featured: event.target.value,
          }))}
        >
          <option value="">All products</option>
          <option value="true">Featured only</option>
          <option value="false">Not featured</option>
        </select>

        <select
          value={filters.ordering}
          onChange={(event) => setFilters((current) => ({
            ...current,
            ordering: event.target.value,
          }))}
        >
          <option value="-created_at">Newest first</option>
          <option value="created_at">Oldest first</option>
          <option value="name">Name A-Z</option>
          <option value="-price">Highest price</option>
          <option value="price">Lowest price</option>
          <option value="stock">Lowest stock</option>
        </select>

        <button type="submit" className="admin-filter-button">
          <FiFilter />
          Apply
        </button>

        <button type="button" className="admin-filter-reset" onClick={handleReset}>
          <FiRefreshCw />
          Reset
        </button>
      </form>

      <div className="admin-catalog-summary">
        <div>
          <FiPackage />
          <span>
            <strong>{products.length}</strong>
            Products shown
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="admin-catalog-loading">
          <div className="admin-loading-spinner" />
          <p>Loading products...</p>
        </div>
      ) : (
        <AdminProductTable
          products={products}
          formatMoney={moneyFormatter}
          busyProductSlug={busyProductSlug}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          onToggleFeatured={handleToggleFeatured}
        />
      )}
    </section>
  );
}


export default AdminProductsPage;