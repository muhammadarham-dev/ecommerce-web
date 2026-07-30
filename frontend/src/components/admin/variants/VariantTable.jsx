import {
  FiEdit3,
  FiPackage,
  FiSliders,
  FiTrash2,
} from "react-icons/fi";

import { Link } from "react-router-dom";


function VariantTable({
  variants = [],
  isLoading = false,
  deletingSku = "",
  formatMoney,
  onDelete,
}) {
  if (isLoading) {
    return (
      <div className="admin-module-state">
        <div className="loading-spinner" />
        <p>Loading product variants...</p>
      </div>
    );
  }

  if (!variants.length) {
    return (
      <div className="admin-module-state admin-module-state--empty">
        <FiPackage />
        <h3>No variants found</h3>
        <p>Create a product variant or change the current filters.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-shell">
      <table className="admin-data-table admin-variant-table">
        <thead>
          <tr>
            <th>Variant</th>
            <th>Options</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {variants.map((variant) => {
            const isDeleting = deletingSku === variant.sku;

            return (
              <tr key={variant.id ?? variant.sku}>
                <td>
                  <div className="admin-table-primary">
                    <strong>{variant.variant_name || variant.product_name}</strong>
                    <span>{variant.sku}</span>
                  </div>
                </td>

                <td>
                  <div className="admin-option-list">
                    {(variant.options || []).map((option) => (
                      <span key={option.id} className="admin-option-chip">
                        {option.color_code && (
                          <i
                            style={{ backgroundColor: option.color_code }}
                            aria-hidden="true"
                          />
                        )}
                        {option.attribute_name}: {option.display_value}
                      </span>
                    ))}
                  </div>
                </td>

                <td>
                  <strong>
                    {typeof formatMoney === "function"
                      ? formatMoney(variant.final_price)
                      : variant.final_price}
                  </strong>
                </td>

                <td>
                  <span
                    className={
                      Number(variant.stock) === 0
                        ? "admin-stock-badge admin-stock-badge--out"
                        : Number(variant.stock) <= 5
                          ? "admin-stock-badge admin-stock-badge--low"
                          : "admin-stock-badge admin-stock-badge--ok"
                    }
                  >
                    {variant.stock} units
                  </span>
                </td>

                <td>
                  <span
                    className={
                      variant.is_active
                        ? "admin-status-badge admin-status-badge--active"
                        : "admin-status-badge admin-status-badge--inactive"
                    }
                  >
                    {variant.is_active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td>
                  <div className="admin-table-actions">
                    <Link
                      to={`/admin/inventory?variant=${encodeURIComponent(variant.sku)}`}
                      className="admin-icon-action"
                      aria-label={`Adjust stock for ${variant.sku}`}
                      title="Adjust stock"
                    >
                      <FiSliders />
                    </Link>

                    <Link
                      to={`/admin/variants/${encodeURIComponent(variant.sku)}/edit`}
                      className="admin-icon-action"
                      aria-label={`Edit ${variant.sku}`}
                    >
                      <FiEdit3 />
                    </Link>

                    <button
                      type="button"
                      className="admin-icon-action admin-icon-action--danger"
                      onClick={() => onDelete?.(variant)}
                      disabled={isDeleting}
                      aria-label={`Delete ${variant.sku}`}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


export default VariantTable;