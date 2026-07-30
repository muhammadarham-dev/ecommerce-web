import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiArrowLeft,
  FiBox,
  FiCheck,
  FiCheckCircle,
  FiChevronRight,
  FiCreditCard,
  FiHeart,
  FiLock,
  FiMinus,
  FiPackage,
  FiPlus,
  FiRefreshCcw,
  FiShield,
  FiShoppingCart,
  FiStar,
  FiTruck,
  FiZoomIn,
} from "react-icons/fi";

import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import ProductReviews from
  "../components/products/ProductReviews";

import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";
import useRecentlyViewed from
  "../hooks/useRecentlyViewed";
import useStoreSettings from
  "../hooks/useStoreSettings";
import useWishlist from
  "../hooks/useWishlist";

import {
  fetchProductBySlug,
  fetchProducts,
  fetchProductVariants,
} from "../services/productService";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  getProductImage,
  resolveMediaUrl,
} from "../utils/media";


function getImageUrl(image) {
  if (!image) {
    return "";
  }

  if (typeof image === "string") {
    return resolveMediaUrl(image);
  }

  return resolveMediaUrl(
    image.image
    ?? image.image_url
    ?? image.url
    ?? image.file,
  );
}


function getVariantLabel(variant) {
  if (
    variant?.variant_name
    || variant?.name
  ) {
    return (
      variant.variant_name
      || variant.name
    );
  }

  if (
    Array.isArray(variant?.options)
    && variant.options.length > 0
  ) {
    return variant.options
      .map((option) => {
        const attribute =
          option.attribute_name
          ?? option.attribute?.name
          ?? option.name;

        const value =
          option.display_value
          ?? option.value_name
          ?? option.value?.display_value
          ?? option.value?.name
          ?? (
            typeof option.value
            === "string"
              ? option.value
              : ""
          );

        return [attribute, value]
          .filter(Boolean)
          .join(": ");
      })
      .filter(Boolean)
      .join(" · ");
  }

  return (
    variant?.sku
    || "Product Option"
  );
}


function ProductDetailPage() {
  const {
    productId: productSlug,
  } = useParams();

  const navigate = useNavigate();
  const location = useLocation();

  const authContext = useAuth();

  const {
    addItem,
  } = useCart();

  const wishlistContext =
    useWishlist();

  const {
    trackProductView,
  } = useRecentlyViewed();

  const {
    formatMoney,
    storeSettings,
  } = useStoreSettings();

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

  const [
    product,
    setProduct,
  ] = useState(null);

  const [
    variants,
    setVariants,
  ] = useState([]);

  const [
    relatedProducts,
    setRelatedProducts,
  ] = useState([]);

  const [
    selectedVariantId,
    setSelectedVariantId,
  ] = useState("");

  const [
    activeImage,
    setActiveImage,
  ] = useState("");

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isAddingToCart,
    setIsAddingToCart,
  ] = useState(false);

  const [
    isUpdatingWishlist,
    setIsUpdatingWishlist,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadProduct() {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const [
          productData,
          variantData,
        ] = await Promise.all([
          fetchProductBySlug(
            productSlug,
          ),
          fetchProductVariants(
            productSlug,
          ).catch(() => []),
        ]);

        if (!isActive) {
          return;
        }

        const activeVariants =
          variantData.filter(
            (variant) =>
              variant.is_active
              !== false,
          );

        setProduct(productData);
        setVariants(activeVariants);
        setActiveImage(
          getProductImage(
            productData,
          ),
        );

        const defaultVariant =
          activeVariants.find(
            (variant) =>
              variant.is_default,
          )
          ?? activeVariants.find(
            (variant) =>
              Number(
                variant.stock ?? 0,
              ) > 0,
          )
          ?? activeVariants[0];

        setSelectedVariantId(
          defaultVariant
            ? String(
              defaultVariant.id,
            )
            : "",
        );

        const categorySlug =
          productData.category?.slug
          ?? productData
            .category_slug;

        if (categorySlug) {
          const related =
            await fetchProducts({
              category:
                categorySlug,
              ordering:
                "-created_at",
            }).catch(() => []);

          if (isActive) {
            setRelatedProducts(
              related
                .filter(
                  (item) =>
                    item.id
                    !== productData.id,
                )
                .slice(0, 4),
            );
          }
        } else {
          setRelatedProducts([]);
        }
      } catch (error) {
        if (isActive) {
          setProduct(null);

          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load this product.",
            ),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isActive = false;
    };
  }, [productSlug]);

  useEffect(() => {
    if (
      !isCustomer
      || !product?.slug
      || typeof trackProductView
        !== "function"
    ) {
      return;
    }

    trackProductView(
      product.slug,
    ).catch(() => {});
  }, [
    isCustomer,
    product?.slug,
    trackProductView,
  ]);

  const selectedVariant = useMemo(
    () =>
      variants.find(
        (variant) =>
          String(variant.id)
          === String(
            selectedVariantId,
          ),
      )
      ?? null,
    [
      selectedVariantId,
      variants,
    ],
  );

  const galleryImages = useMemo(
    () => {
      if (!product) {
        return [];
      }

      const primaryImage =
        getProductImage(product);

      const additionalImages =
        Array.isArray(
          product.images,
        )
          ? product.images
            .map(getImageUrl)
            .filter(Boolean)
          : [];

      return Array.from(
        new Set(
          [
            primaryImage,
            ...additionalImages,
          ].filter(Boolean),
        ),
      );
    },
    [product],
  );

  const displayedPrice =
    selectedVariant?.final_price
    ?? selectedVariant
      ?.price_override
    ?? product?.final_price
    ?? product?.discount_price
    ?? product?.price
    ?? 0;

  const originalPrice =
    product?.price
    ?? displayedPrice;

  const hasDiscount =
    Number(originalPrice)
    > Number(displayedPrice);

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

  const stock =
    selectedVariant
      ? Number(
        selectedVariant.stock ?? 0,
      )
      : Number(
        product?.stock ?? 0,
      );

  const isInStock =
    selectedVariant?.in_stock
    ?? product?.in_stock
    ?? stock > 0;

  const requiresVariant =
    variants.length > 0;

  const maxQuantity =
    Math.max(stock, 1);

  const rating = Number(
    product?.average_rating
    ?? product?.rating
    ?? 0,
  );

  const reviewCount = Number(
    product?.review_count
    ?? product?.reviews_count
    ?? 0,
  );

  const categoryName =
    product?.category?.name
    ?? product?.category_name
    ?? "Store Product";

  const isWishlisted =
    product
    && typeof wishlistContext
      .isInWishlist === "function"
      ? wishlistContext
        .isInWishlist(product.id)
      : false;

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
      setErrorMessage(
        "Cart and wishlist are customer-only "
        + "features. Sign in with a customer account.",
      );

      return false;
    }

    return true;
  };

  const handleVariantChange = (
    variantId,
  ) => {
    setSelectedVariantId(
      String(variantId),
    );
    setQuantity(1);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleAddToCart =
    async () => {
      if (!requireCustomer()) {
        return;
      }

      if (!isInStock) {
        setErrorMessage(
          "This product is currently out of stock.",
        );

        return;
      }

      if (
        requiresVariant
        && !selectedVariant
      ) {
        setErrorMessage(
          "Please select a product option.",
        );

        return;
      }

      if (
        typeof addItem
        !== "function"
      ) {
        setErrorMessage(
          "Cart action is unavailable.",
        );

        return;
      }

      setIsAddingToCart(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        await addItem({
          productId:
            product.id,
          quantity,
          variantId:
            selectedVariant?.id
            ?? null,
        });

        setSuccessMessage(
          `${product.name} was added to your cart.`,
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to add this product to your cart.",
          ),
        );
      } finally {
        setIsAddingToCart(false);
      }
    };

  const handleWishlistToggle =
    async () => {
      if (!requireCustomer()) {
        return;
      }

      const toggleAction =
        wishlistContext.toggleItem
        ?? wishlistContext
          .toggleWishlistItem;

      if (
        typeof toggleAction
        !== "function"
      ) {
        setErrorMessage(
          "Wishlist action is unavailable.",
        );

        return;
      }

      setIsUpdatingWishlist(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        await toggleAction(
          product.id,
        );

        setSuccessMessage(
          isWishlisted
            ? "Product removed from your wishlist."
            : "Product added to your wishlist.",
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to update your wishlist.",
          ),
        );
      } finally {
        setIsUpdatingWishlist(false);
      }
    };

  if (isLoading) {
    return (
      <section className="route-loading">
        <div className="loading-spinner" />
        <p>Loading product details...</p>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="premium-product-page">
        <div className="container premium-product-empty">
          <FiPackage />

          <h1>Product Unavailable</h1>

          <p>
            {errorMessage
              || (
                "The requested product could "
                + "not be found."
              )}
          </p>

          <Link
            to="/products"
            className="primary-button"
          >
            <FiArrowLeft />
            Back to Products
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="premium-product-page">
      <div className="container">
        <nav className="premium-product-breadcrumb">
          <Link to="/">Home</Link>
          <FiChevronRight />
          <Link to="/products">
            Products
          </Link>
          <FiChevronRight />
          <Link
            to={
              `/products?category=${
                encodeURIComponent(
                  product.category?.slug
                  ?? product.category_slug
                  ?? "",
                )
              }`
            }
          >
            {categoryName}
          </Link>
          <FiChevronRight />
          <strong>{product.name}</strong>
        </nav>

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

        <div className="premium-product-hero">
          <div className="premium-product-gallery">
            <div className="premium-product-thumbnails">
              {galleryImages.map(
                (imageUrl, index) => (
                  <button
                    type="button"
                    key={
                      `${imageUrl}-${index}`
                    }
                    className={
                      activeImage === imageUrl
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setActiveImage(
                        imageUrl,
                      )
                    }
                    aria-label={
                      `View image ${
                        index + 1
                      }`
                    }
                  >
                    <img
                      src={imageUrl}
                      alt={
                        `${product.name} ${
                          index + 1
                        }`
                      }
                      onError={(event) => {
                        event.currentTarget.src =
                          "/product-placeholder.svg";
                      }}
                    />
                  </button>
                ),
              )}
            </div>

            <div className="premium-product-main-image">
              <img
                src={
                  activeImage
                  || getProductImage(
                    product,
                  )
                }
                alt={product.name}
                onError={(event) => {
                  event.currentTarget.src =
                    "/product-placeholder.svg";
                }}
              />

              <span className="premium-product-zoom">
                <FiZoomIn />
                Hover to inspect
              </span>

              {hasDiscount && (
                <span className="premium-product-discount">
                  Save {discountPercentage}%
                </span>
              )}

              {product.is_featured && (
                <span className="premium-product-featured">
                  Featured
                </span>
              )}
            </div>
          </div>

          <article className="premium-product-summary">
            <div className="premium-product-eyebrow">
              <span>{categoryName}</span>

              <span
                className={
                  isInStock
                    ? "available"
                    : "unavailable"
                }
              >
                <i />
                {isInStock
                  ? "In Stock"
                  : "Out of Stock"}
              </span>
            </div>

            <h1>{product.name}</h1>

            <div className="premium-product-rating">
              <div>
                {Array.from(
                  {
                    length: 5,
                  },
                  (_, index) =>
                    index + 1,
                ).map(
                  (starValue) => (
                    <FiStar
                      key={starValue}
                      className={
                        starValue
                        <= Math.round(
                          rating,
                        )
                          ? "active"
                          : ""
                      }
                    />
                  ),
                )}
              </div>

              <strong>
                {rating > 0
                  ? rating.toFixed(1)
                  : "New"}
              </strong>

              <span>
                {reviewCount}
                {" "}
                {reviewCount === 1
                  ? "review"
                  : "reviews"}
              </span>
            </div>

            <div className="premium-product-price">
              <strong>
                {formatMoney(
                  displayedPrice,
                )}
              </strong>

              {hasDiscount && (
                <del>
                  {formatMoney(
                    originalPrice,
                  )}
                </del>
              )}

              {hasDiscount && (
                <span>
                  You save
                  {" "}
                  {formatMoney(
                    Number(originalPrice)
                    - Number(displayedPrice),
                  )}
                </span>
              )}
            </div>

            <p className="premium-product-intro">
              {product.description
                || (
                  "A carefully selected product "
                  + "for quality, performance, "
                  + "and everyday value."
                )}
            </p>

            <div className="premium-product-quick-info">
              <div>
                <small>SKU</small>
                <strong>
                  {selectedVariant?.sku
                    || product.sku
                    || "N/A"}
                </strong>
              </div>

              <div>
                <small>Available stock</small>
                <strong>
                  {isInStock
                    ? `${stock} units`
                    : "Unavailable"}
                </strong>
              </div>

              <div>
                <small>Category</small>
                <strong>
                  {categoryName}
                </strong>
              </div>
            </div>

            {variants.length > 0 && (
              <section className="premium-product-options">
                <div>
                  <span>
                    Choose an option
                  </span>

                  {selectedVariant && (
                    <strong>
                      {getVariantLabel(
                        selectedVariant,
                      )}
                    </strong>
                  )}
                </div>

                <div className="premium-product-option-grid">
                  {variants.map(
                    (variant) => {
                      const selected =
                        String(
                          variant.id,
                        )
                        === String(
                          selectedVariantId,
                        );

                      const variantStock =
                        Number(
                          variant.stock
                          ?? 0,
                        );

                      return (
                        <button
                          type="button"
                          key={variant.id}
                          className={
                            selected
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            handleVariantChange(
                              variant.id,
                            )
                          }
                          disabled={
                            variantStock <= 0
                          }
                        >
                          {selected && (
                            <FiCheck />
                          )}

                          <span>
                            {getVariantLabel(
                              variant,
                            )}
                          </span>

                          <small>
                            {variantStock > 0
                              ? (
                                `${variantStock} left`
                              )
                              : "Sold out"}
                          </small>
                        </button>
                      );
                    },
                  )}
                </div>
              </section>
            )}

            <div className="premium-product-purchase">
              <div className="premium-quantity-control">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      (current) =>
                        Math.max(
                          current - 1,
                          1,
                        ),
                    )
                  }
                  disabled={
                    quantity <= 1
                  }
                  aria-label={
                    "Decrease quantity"
                  }
                >
                  <FiMinus />
                </button>

                <strong>{quantity}</strong>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      (current) =>
                        Math.min(
                          current + 1,
                          maxQuantity,
                        ),
                    )
                  }
                  disabled={
                    !isInStock
                    || quantity
                      >= maxQuantity
                  }
                  aria-label={
                    "Increase quantity"
                  }
                >
                  <FiPlus />
                </button>
              </div>

              <button
                type="button"
                className="premium-add-cart"
                onClick={
                  handleAddToCart
                }
                disabled={
                  isAddingToCart
                  || !isInStock
                }
              >
                <FiShoppingCart />

                {isAddingToCart
                  ? "Adding..."
                  : (
                    isInStock
                      ? "Add to Cart"
                      : "Out of Stock"
                  )}
              </button>

              <button
                type="button"
                className={
                  isWishlisted
                    ? (
                      "premium-wishlist-button "
                      + "active"
                    )
                    : (
                      "premium-wishlist-button"
                    )
                }
                onClick={
                  handleWishlistToggle
                }
                disabled={
                  isUpdatingWishlist
                }
                aria-label={
                  "Update wishlist"
                }
              >
                <FiHeart />

                {isUpdatingWishlist
                  ? "Updating"
                  : (
                    isWishlisted
                      ? "Saved"
                      : "Save"
                  )}
              </button>
            </div>

            {!isAuthenticated && (
              <p className="premium-product-account-note">
                Sign in as a customer to use
                cart and wishlist features.
              </p>
            )}

            {isAuthenticated
              && !isCustomer
              && (
                <p className="premium-product-account-note warning">
                  You are signed in with a
                  non-customer account. Use a
                  customer account to shop.
                </p>
              )}

            <div className="premium-product-assurance">
              <div>
                <FiTruck />
                <span>
                  <strong>
                    Reliable delivery
                  </strong>
                  <small>
                    Shipping cost is calculated
                    at checkout.
                  </small>
                </span>
              </div>

              <div>
                <FiLock />
                <span>
                  <strong>
                    Secure checkout
                  </strong>
                  <small>
                    Protected account and
                    payment workflow.
                  </small>
                </span>
              </div>

              <div>
                <FiRefreshCcw />
                <span>
                  <strong>
                    Easy returns
                  </strong>
                  <small>
                    Eligible within
                    {" "}
                    {
                      storeSettings
                        .return_window_days
                      ?? 7
                    }
                    {" "}
                    days.
                  </small>
                </span>
              </div>
            </div>
          </article>
        </div>

        <section className="premium-product-details">
          <article className="premium-product-description-card">
            <span className="section-label">
              Product overview
            </span>

            <h2>
              Built for everyday performance
            </h2>

            <p>
              {product.description}
            </p>

            <div className="premium-product-highlights">
              <span>
                <FiCheckCircle />
                Quality checked
              </span>

              <span>
                <FiCheckCircle />
                Securely packaged
              </span>

              <span>
                <FiCheckCircle />
                Customer support
              </span>
            </div>
          </article>

          <aside className="premium-product-spec-card">
            <span className="section-label">
              Product information
            </span>

            <div>
              <span>Product</span>
              <strong>
                {product.name}
              </strong>
            </div>

            <div>
              <span>SKU</span>
              <strong>
                {selectedVariant?.sku
                  || product.sku
                  || "N/A"}
              </strong>
            </div>

            <div>
              <span>Category</span>
              <strong>
                {categoryName}
              </strong>
            </div>

            <div>
              <span>Status</span>
              <strong>
                {isInStock
                  ? "Available"
                  : "Out of stock"}
              </strong>
            </div>

            <div>
              <span>Secure payment</span>
              <strong>
                <FiCreditCard />
                Supported
              </strong>
            </div>
          </aside>
        </section>

        <ProductReviews
          productId={product.id}
        />

        {relatedProducts.length > 0 && (
          <section className="premium-related-products">
            <div className="section-heading">
              <div>
                <span className="section-label">
                  You may also like
                </span>

                <h2>
                  More from {categoryName}
                </h2>
              </div>

              <Link
                to={
                  `/products?category=${
                    encodeURIComponent(
                      product.category?.slug
                      ?? product.category_slug
                      ?? "",
                    )
                  }`
                }
                className="text-link"
              >
                View category
                <FiChevronRight />
              </Link>
            </div>

            <div className="premium-related-grid">
              {relatedProducts.map(
                (item) => (
                  <Link
                    key={item.id}
                    to={
                      `/products/${
                        encodeURIComponent(
                          item.slug,
                        )
                      }`
                    }
                    className="premium-related-card"
                  >
                    <div>
                      <img
                        src={
                          getProductImage(
                            item,
                          )
                        }
                        alt={item.name}
                        onError={(event) => {
                          event.currentTarget.src =
                            "/product-placeholder.svg";
                        }}
                      />

                      <span>
                        <FiBox />
                        View product
                      </span>
                    </div>

                    <small>
                      {item.category?.name
                        ?? item.category_name
                        ?? categoryName}
                    </small>

                    <h3>{item.name}</h3>

                    <strong>
                      {formatMoney(
                        item.final_price
                        ?? item.discount_price
                        ?? item.price,
                      )}
                    </strong>
                  </Link>
                ),
              )}
            </div>
          </section>
        )}

        <section className="premium-product-footer-trust">
          <div>
            <FiShield />
            <span>
              <strong>
                Buyer protection
              </strong>
              <small>
                Secure shopping experience
              </small>
            </span>
          </div>

          <div>
            <FiTruck />
            <span>
              <strong>
                Tracked delivery
              </strong>
              <small>
                Follow shipment updates
              </small>
            </span>
          </div>

          <div>
            <FiCreditCard />
            <span>
              <strong>
                Flexible payment
              </strong>
              <small>
                Store-configured methods
              </small>
            </span>
          </div>
        </section>
      </div>
    </section>
  );
}


export default ProductDetailPage;
