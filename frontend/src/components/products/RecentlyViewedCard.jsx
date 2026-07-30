import {
  FiClock,
  FiEye,
  FiShoppingBag,
  FiTrash2,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import {
  formatCurrency,
} from "../../utils/currency";

import {
  resolveMediaUrl,
} from "../../utils/media";

import {
  formatViewedDate,
} from "../../utils/recentlyViewed";


function RecentlyViewedCard({
  entry,
  onRemove,
  isRemoving = false,
  showRemoveButton = true,
}) {
  const product = entry?.product;

  if (!product) {
    return null;
  }

  const productIdentifier =
    encodeURIComponent(
      product.slug
      || product.id,
    );

  const productPrice =
    product.final_price
    ?? product.discount_price
    ?? product.price
    ?? 0;

  const hasDiscount =
    product.discount_price
    && Number(product.discount_price)
      < Number(product.price);

  const imageUrl =
    resolveMediaUrl(
      product.primary_image,
    )
    || "/product-placeholder.svg";

  return (
    <article className="recent-product-card">
      <Link
        to={`/products/${productIdentifier}`}
        className="recent-product-card__image"
      >
        <img
          src={imageUrl}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src =
              "/product-placeholder.svg";
          }}
        />

        <span
          className={
            product.in_stock
              ? "recent-stock available"
              : "recent-stock unavailable"
          }
        >
          {product.in_stock
            ? "In Stock"
            : "Out of Stock"}
        </span>
      </Link>

      <div className="recent-product-card__content">
        <div className="recent-product-card__category">
          <span>
            {product.category_name
              || "Product"}
          </span>

          <small>
            SKU: {product.sku}
          </small>
        </div>

        <Link
          to={`/products/${productIdentifier}`}
          className="recent-product-card__name"
        >
          {product.name}
        </Link>

        <div className="recent-product-card__price">
          <strong>
            {formatCurrency(productPrice)}
          </strong>

          {hasDiscount && (
            <del>
              {formatCurrency(
                product.price,
              )}
            </del>
          )}
        </div>

        <div className="recent-product-card__history">
          <span>
            <FiEye />
            Viewed {entry.view_count}{" "}
            {entry.view_count === 1
              ? "time"
              : "times"}
          </span>

          <span>
            <FiClock />
            {formatViewedDate(
              entry.viewed_at,
            )}
          </span>
        </div>

        <div className="recent-product-card__actions">
          <Link
            to={`/products/${productIdentifier}`}
          >
            <FiShoppingBag />
            View Product
          </Link>

          {showRemoveButton && (
            <button
              type="button"
              onClick={() =>
                onRemove?.(entry.id)
              }
              disabled={isRemoving}
              aria-label={
                `Remove ${product.name} `
                + "from recently viewed"
              }
            >
              <FiTrash2 />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}


export default RecentlyViewedCard;