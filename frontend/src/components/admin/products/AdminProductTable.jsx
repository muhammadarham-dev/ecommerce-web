import {
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiImage,
  FiStar,
  FiTrash2,
} from "react-icons/fi";

import { Link } from "react-router-dom";

import { getProductImage } from "../../../utils/media";


function AdminProductTable({
  products,
  formatMoney,
  busyProductSlug,
  onDelete,
  onToggleActive,
  onToggleFeatured,
}) {
  if (!products.length) {
    return (
      <div className="admin-catalog-empty">
        <FiImage />
        <h3>No products found</h3>
        <p>
          Change the filters or create your first product.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-catalog-table-wrap">
      <table className="admin-catalog-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Featured</th>
            <th aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {products.map((product) => {
            const isBusy = busyProductSlug === product.slug;
            const imageUrl = getProductImage(product);

            return (
              <tr key={product.id}>
                <td>
                  <div className="admin-product-cell">
                    <div className="admin-product-cell__image">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                        />
                      ) : (
                        <FiImage />
                      )}
                    </div>

                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.sku}</span>
                    </div>
                  </div>
                </td>

                <td>
                  {product.category?.name || "Uncategorized"}
                </td>

                <td>
                  <div className="admin-price-cell">
                    <strong>
                      {formatMoney(product.final_price ?? product.price)}
                    </strong>

                    {product.discount_price && (
                      <span>{formatMoney(product.price)}</span>
                    )}
                  </div>
                </td>

                <td>
                  <span
                    className={
                      Number(product.stock) === 0
                        ? "admin-stock-pill admin-stock-pill--out"
                        : Number(product.stock) <= 5
                          ? "admin-stock-pill admin-stock-pill--low"
                          : "admin-stock-pill"
                    }
                  >
                    {product.stock}
                  </span>
                </td>

                <td>
                  <button
                    type="button"
                    className={
                      product.is_active
                        ? "admin-status-toggle admin-status-toggle--active"
                        : "admin-status-toggle"
                    }
                    disabled={isBusy}
                    onClick={() => onToggleActive(product)}
                  >
                    {product.is_active ? <FiEye /> : <FiEyeOff />}
                    {product.is_active ? "Active" : "Inactive"}
                  </button>
                </td>

                <td>
                  <button
                    type="button"
                    className={
                      product.is_featured
                        ? "admin-feature-toggle admin-feature-toggle--active"
                        : "admin-feature-toggle"
                    }
                    disabled={isBusy}
                    onClick={() => onToggleFeatured(product)}
                    aria-label={
                      product.is_featured
                        ? "Remove from featured products"
                        : "Add to featured products"
                    }
                  >
                    <FiStar />
                  </button>
                </td>

                <td>
                  <div className="admin-row-actions">
                    <Link
                      to={`/admin/products/${product.slug}/edit`}
                      className="admin-row-action"
                      aria-label={`Edit ${product.name}`}
                    >
                      <FiEdit2 />
                    </Link>

                    <button
                      type="button"
                      className="admin-row-action admin-row-action--danger"
                      disabled={isBusy}
                      onClick={() => onDelete(product)}
                      aria-label={`Delete ${product.name}`}
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


export default AdminProductTable;