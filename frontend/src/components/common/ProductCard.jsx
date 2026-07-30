import {
  useMemo,
  useState,
} from "react";

import {
  FiHeart,
  FiShoppingCart,
  FiStar,
} from "react-icons/fi";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import useStoreSettings from
  "../../hooks/useStoreSettings";
import useWishlist from
  "../../hooks/useWishlist";

import {
  getApiErrorMessage,
} from "../../utils/apiData";

import {
  getProductImage,
} from "../../utils/media";


function ProductCard({
  product,
  onAddToCart,
  isAdding = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const authContext = useAuth();
  const wishlistContext =
    useWishlist();

  const {
    formatMoney,
  } = useStoreSettings();

  const [
    isUpdatingWishlist,
    setIsUpdatingWishlist,
  ] = useState(false);

  const [
    actionMessage,
    setActionMessage,
  ] = useState("");

  const currentUser =
    authContext.user
    ?? authContext.currentUser
    ?? null;

  const isAuthenticated =
    authContext.isAuthenticated
    ?? Boolean(currentUser);

  const isCustomer =
    String(
      currentUser?.role ?? "",
    )
      .trim()
      .toUpperCase()
    === "CUSTOMER";

  const productIdentifier =
    encodeURIComponent(
      product?.slug
      || product?.id
      || "",
    );

  const productUrl =
    `/products/${productIdentifier}`;

  const displayedPrice =
    product?.final_price
    ?? product?.discount_price
    ?? product?.price
    ?? 0;

  const originalPrice =
    product?.price
    ?? displayedPrice;

  const hasDiscount =
    product?.discount_price !== null
    && product?.discount_price
      !== undefined
    && Number(displayedPrice)
      < Number(originalPrice);

  const discountPercentage =
    hasDiscount
    && Number(originalPrice) > 0
      ? Math.round(
        (
          (
            Number(originalPrice)
            - Number(displayedPrice)
          )
          / Number(originalPrice)
        )
        * 100,
      )
      : 0;

  const rating = Number(
    product?.average_rating
    ?? product?.rating
    ?? 0,
  );

  const categoryName =
    product?.category?.name
    ?? product?.category_name
    ?? "Product";

  const inStock =
    product?.in_stock
    ?? Number(
      product?.stock ?? 0,
    ) > 0;

  const isWishlisted = useMemo(
    () => {
      const checker =
        wishlistContext.isInWishlist
        ?? wishlistContext
          .isProductInWishlist;

      if (
        typeof checker === "function"
      ) {
        return Boolean(
          checker(product?.id),
        );
      }

      return false;
    },
    [
      product?.id,
      wishlistContext,
    ],
  );

  const requireCustomer = () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from:
            location.pathname
            + location.search,
        },
      });

      return false;
    }

    if (!isCustomer) {
      setActionMessage(
        "Cart and wishlist are available "
        + "for customer accounts.",
      );

      return false;
    }

    return true;
  };

  const handleCartClick = async () => {
    setActionMessage("");

    if (!requireCustomer()) {
      return;
    }

    if (
      typeof onAddToCart
      !== "function"
    ) {
      setActionMessage(
        "Cart action is unavailable.",
      );

      return;
    }

    try {
      await onAddToCart(product);
    } catch (error) {
      setActionMessage(
        getApiErrorMessage(
          error,
          "Unable to add this product.",
        ),
      );
    }
  };

  const handleWishlistToggle =
    async () => {
      setActionMessage("");

      if (!requireCustomer()) {
        return;
      }

      const toggleAction =
        wishlistContext.toggleItem
        ?? wishlistContext
          .toggleWishlistItem
        ?? wishlistContext
          .toggleWishlist
        ?? wishlistContext
          .toggleProduct;

      if (
        typeof toggleAction
        !== "function"
      ) {
        setActionMessage(
          "Wishlist action is unavailable.",
        );

        return;
      }

      setIsUpdatingWishlist(true);

      try {
        await toggleAction(
          product.id,
        );

        setActionMessage(
          isWishlisted
            ? "Removed from wishlist."
            : "Saved to wishlist.",
        );
      } catch (error) {
        setActionMessage(
          getApiErrorMessage(
            error,
            "Unable to update wishlist.",
          ),
        );
      } finally {
        setIsUpdatingWishlist(false);
      }
    };

  return (
    <article className="product-card">
      <div className="product-image-wrapper">
        <Link
          to={productUrl}
          className="product-image-link"
          aria-label={
            `View ${product.name}`
          }
        >
          <img
            src={
              getProductImage(product)
            }
            alt={product.name}
            onError={(event) => {
              event.currentTarget.src =
                "/product-placeholder.svg";
            }}
          />
        </Link>

        {hasDiscount && (
          <span className="discount-badge">
            {discountPercentage}% Off
          </span>
        )}

        <button
          type="button"
          className={
            isWishlisted
              ? (
                "wishlist-button active "
                + "wishlist-button--active"
              )
              : "wishlist-button"
          }
          onClick={
            handleWishlistToggle
          }
          disabled={
            isUpdatingWishlist
          }
          aria-label={
            isWishlisted
              ? "Remove product from wishlist"
              : "Add product to wishlist"
          }
        >
          <FiHeart />
        </button>

        <button
          type="button"
          className="quick-add-button"
          onClick={handleCartClick}
          disabled={
            isAdding || !inStock
          }
        >
          <FiShoppingCart />

          {isAdding
            ? "Adding..."
            : (
              inStock
                ? "Add to Cart"
                : "Out of Stock"
            )}
        </button>
      </div>

      <div className="product-content">
        <div className="product-meta">
          <span>{categoryName}</span>

          <span>
            <FiStar />
            {rating > 0
              ? rating.toFixed(1)
              : "New"}
          </span>
        </div>

        <Link
          to={productUrl}
          className="product-title-link"
        >
          <h3>{product.name}</h3>
        </Link>

        <div className="product-price">
          <strong>
            {formatMoney(displayedPrice)}
          </strong>

          {hasDiscount && (
            <del>
              {formatMoney(
                originalPrice,
              )}
            </del>
          )}
        </div>

        {actionMessage && (
          <p className="product-card-action-message">
            {actionMessage}
          </p>
        )}
      </div>
    </article>
  );
}


export default ProductCard;
