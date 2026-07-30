import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  FiFilter,
  FiPlus,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import AttributeManager from "../../components/admin/variants/AttributeManager";
import VariantTable from "../../components/admin/variants/VariantTable";
import useStoreSettings from "../../hooks/useStoreSettings";
import { fetchAdminProducts } from "../../services/adminProductService";
import {
  deleteAdminVariant,
  fetchAdminVariants,
} from "../../services/adminVariantService";
import { getApiErrorMessage } from "../../utils/apiData";


const INITIAL_FILTERS = {
  search: "",
  product: "",
  is_active: "",
  in_stock: "",
  ordering: "product__name,sku",
};


function AdminVariantsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { formatMoney } = useStoreSettings();

  const [activeTab, setActiveTab] = useState("variants");
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingSku, setDeletingSku] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  const loadVariants = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const params = {};

    for (const [key, value] of Object.entries(appliedFilters)) {
      if (value !== "") {
        params[key] = value;
      }
    }

    try {
      const [variantData, productData] = await Promise.all([
        fetchAdminVariants(params),
        fetchAdminProducts({ ordering: "name" }),
      ]);

      setVariants(variantData);
      setProducts(productData);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to load product variants."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadVariants();
  }, [loadVariants]);

  useEffect(() => {
    if (!location.state?.notice) {
      return;
    }

    setNoticeMessage(location.state.notice);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
  };

  const handleDelete = async (variant) => {
    const confirmed = window.confirm(
      `Delete variant “${variant.variant_name || variant.sku}”?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingSku(variant.sku);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      await deleteAdminVariant(variant.sku);
      setNoticeMessage("Variant deleted successfully.");
      await loadVariants();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to delete this variant."),
      );
    } finally {
      setDeletingSku("");
    }
  };

  return (
    <div className="admin-page admin-variants-page">
      <header className="admin-page-header">
        <div>
          <span>Catalog management</span>
          <h1>Product Variants</h1>
          <p>Manage product combinations, pricing, stock, and reusable attributes.</p>
        </div>

        <Link to="/admin/variants/create" className="admin-button admin-button--primary">
          <FiPlus />
          Create Variant
        </Link>
      </header>

      <div className="admin-page-tabs">
        <button
          type="button"
          className={activeTab === "variants" ? "active" : ""}
          onClick={() => setActiveTab("variants")}
        >
          Variants
        </button>

        <button
          type="button"
          className={activeTab === "attributes" ? "active" : ""}
          onClick={() => setActiveTab("attributes")}
        >
          Attributes & Values
        </button>
      </div>

      {noticeMessage && (
        <div className="admin-inline-message admin-inline-message--success">
          {noticeMessage}
        </div>
      )}

      {errorMessage && (
        <div className="admin-inline-message admin-inline-message--error">
          {errorMessage}
        </div>
      )}

      {activeTab === "attributes" ? (
        <AttributeManager />
      ) : (
        <>
          <form className="admin-filter-bar" onSubmit={handleFilterSubmit}>
            <label className="admin-search-field">
              <FiSearch />
              <input
                type="search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by product or SKU"
              />
            </label>

            <label className="admin-filter-field">
              <span>Product</span>
              <select
                name="product"
                value={filters.product}
                onChange={handleFilterChange}
              >
                <option value="">All products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.slug}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-filter-field">
              <span>Status</span>
              <select
                name="is_active"
                value={filters.is_active}
                onChange={handleFilterChange}
              >
                <option value="">All statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>

            <label className="admin-filter-field">
              <span>Stock</span>
              <select
                name="in_stock"
                value={filters.in_stock}
                onChange={handleFilterChange}
              >
                <option value="">All stock levels</option>
                <option value="true">In stock</option>
                <option value="false">Out of stock</option>
              </select>
            </label>

            <div className="admin-filter-actions">
              <button type="submit" className="admin-button admin-button--primary">
                <FiFilter /> Apply
              </button>

              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={handleResetFilters}
              >
                <FiRefreshCw /> Reset
              </button>
            </div>
          </form>

          <section className="admin-content-card">
            <div className="admin-content-card__heading">
              <div>
                <span>Inventory-ready combinations</span>
                <h2>{variants.length} Variants</h2>
              </div>
            </div>

            <VariantTable
              variants={variants}
              isLoading={isLoading}
              deletingSku={deletingSku}
              formatMoney={formatMoney}
              onDelete={handleDelete}
            />
          </section>
        </>
      )}
    </div>
  );
}


export default AdminVariantsPage;