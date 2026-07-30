import {
  FiAlertTriangle,
  FiBox,
  FiSliders,
} from "react-icons/fi";


function InventoryTable({
  items = [],
  onAdjust,
}) {
  if (!items.length) {
    return (
      <div className="admin-module-state admin-module-state--empty">
        <FiBox />
        <h3>Stock levels look healthy</h3>
        <p>No active products or variants are currently below the low-stock threshold.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-shell">
      <table className="admin-data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Type</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={`${item.target_type}-${item.id}`}>
              <td>
                <div className="admin-table-primary">
                  <strong>{item.name}</strong>
                  <span>{item.sku}</span>
                </div>
              </td>

              <td>{item.target_type === "VARIANT" ? "Variant" : "Product"}</td>
              <td>{item.category || "—"}</td>

              <td>
                <strong>{item.stock} units</strong>
              </td>

              <td>
                <span
                  className={
                    Number(item.stock) === 0
                      ? "admin-stock-badge admin-stock-badge--out"
                      : "admin-stock-badge admin-stock-badge--low"
                  }
                >
                  <FiAlertTriangle />
                  {Number(item.stock) === 0 ? "Out of stock" : "Low stock"}
                </span>
              </td>

              <td>
                <button
                  type="button"
                  className="admin-icon-action"
                  onClick={() => onAdjust?.(item)}
                  aria-label={`Adjust stock for ${item.name}`}
                >
                  <FiSliders />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


export default InventoryTable;