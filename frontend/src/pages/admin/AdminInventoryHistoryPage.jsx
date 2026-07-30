import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiFilter,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import { Link } from "react-router-dom";

import { fetchStockMovements } from "../../services/adminInventoryService";
import { getApiErrorMessage } from "../../utils/apiData";


const INITIAL_FILTERS = {
  search: "",
  movement_type: "",
  product: "",
  variant: "",
  order: "",
  created_from: "",
  created_to: "",
  ordering: "-created_at",
};


const MOVEMENT_TYPES = [
  ["RESTOCK", "Restock"],
  ["SALE", "Sale"],
  ["ORDER_CANCELLED", "Order Cancelled"],
  ["RETURN_RECEIVED", "Return Received"],
  ["MANUAL_INCREASE", "Manual Increase"],
  ["MANUAL_DECREASE", "Manual Decrease"],
  ["CORRECTION", "Correction"],
];


function AdminInventoryHistoryPage() {
  const [movements, setMovements] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadMovements = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const params = {};

    for (const [key, value] of Object.entries(appliedFilters)) {
      if (!value) {
        continue;
      }

      if (key === "created_from") {
        params[key] = `${value}T00:00:00`;
      } else if (key === "created_to") {
        params[key] = `${value}T23:59:59`;
      } else {
        params[key] = value;
      }
    }

    try {
      const data = await fetchStockMovements(params);
      setMovements(data);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to load inventory history."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
  };

  return (
    <div className="admin-page admin-inventory-history-page">
      <header className="admin-page-header">
        <div>
          <span>Inventory audit trail</span>
          <h1>Stock Movement History</h1>
          <p>Review every automated and manual change made to product stock.</p>
        </div>

        <Link to="/admin/inventory" className="admin-button admin-button--secondary">
          <FiArrowLeft />
          Inventory Dashboard
        </Link>
      </header>

      {errorMessage && (
        <div className="admin-inline-message admin-inline-message--error">
          {errorMessage}
        </div>
      )}

      <form className="admin-filter-panel" onSubmit={handleSubmit}>
        <label className="admin-search-field admin-search-field--wide">
          <FiSearch />
          <input
            type="search"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Search item, SKU, order, user, or note"
          />
        </label>

        <div className="admin-form-grid admin-form-grid--four">
          <label className="admin-filter-field">
            <span>Movement Type</span>
            <select
              name="movement_type"
              value={filters.movement_type}
              onChange={handleChange}
            >
              <option value="">All movement types</option>
              {MOVEMENT_TYPES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="admin-filter-field">
            <span>Product Slug</span>
            <input
              type="text"
              name="product"
              value={filters.product}
              onChange={handleChange}
              placeholder="wireless-headphones"
            />
          </label>

          <label className="admin-filter-field">
            <span>Variant SKU</span>
            <input
              type="text"
              name="variant"
              value={filters.variant}
              onChange={handleChange}
              placeholder="SKU-BLACK-L"
            />
          </label>

          <label className="admin-filter-field">
            <span>Order Number</span>
            <input
              type="text"
              name="order"
              value={filters.order}
              onChange={handleChange}
              placeholder="ORD-000001"
            />
          </label>

          <label className="admin-filter-field">
            <span>Created From</span>
            <input
              type="date"
              name="created_from"
              value={filters.created_from}
              onChange={handleChange}
            />
          </label>

          <label className="admin-filter-field">
            <span>Created To</span>
            <input
              type="date"
              name="created_to"
              value={filters.created_to}
              onChange={handleChange}
            />
          </label>
        </div>

        <div className="admin-filter-actions">
          <button type="submit" className="admin-button admin-button--primary">
            <FiFilter /> Apply Filters
          </button>

          <button
            type="button"
            className="admin-button admin-button--secondary"
            onClick={handleReset}
          >
            <FiRefreshCw /> Reset
          </button>
        </div>
      </form>

      <section className="admin-content-card">
        <div className="admin-content-card__heading">
          <div>
            <span>Audited inventory activity</span>
            <h2>{movements.length} Movements</h2>
          </div>
        </div>

        {isLoading ? (
          <div className="admin-module-state">
            <div className="loading-spinner" />
            <p>Loading stock movements...</p>
          </div>
        ) : movements.length ? (
          <div className="admin-table-shell">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Movement</th>
                  <th>Change</th>
                  <th>Stock</th>
                  <th>References</th>
                  <th>Performed By</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>
                      <div className="admin-table-primary">
                        <strong>{movement.target_name}</strong>
                        <span>{movement.target_sku}</span>
                      </div>
                    </td>

                    <td>{movement.movement_type_display}</td>

                    <td>
                      <span
                        className={
                          Number(movement.quantity_change) > 0
                            ? "admin-movement-change admin-movement-change--positive"
                            : "admin-movement-change admin-movement-change--negative"
                        }
                      >
                        {Number(movement.quantity_change) > 0 ? "+" : ""}
                        {movement.quantity_change}
                      </span>
                    </td>

                    <td>{movement.previous_stock} → {movement.new_stock}</td>

                    <td>
                      <div className="admin-reference-list">
                        {movement.order_number && <span>{movement.order_number}</span>}
                        {movement.return_number && <span>{movement.return_number}</span>}
                        {!movement.order_number && !movement.return_number && <span>Manual</span>}
                      </div>
                    </td>

                    <td>{movement.performed_by_username || "System"}</td>

                    <td>
                      {new Date(movement.created_at).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-module-state admin-module-state--empty">
            <h3>No stock movements found</h3>
            <p>Try changing the current filters.</p>
          </div>
        )}
      </section>
    </div>
  );
}


export default AdminInventoryHistoryPage;