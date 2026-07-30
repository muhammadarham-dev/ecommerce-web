import {
  useState,
} from "react";

import {
  FiArrowRight,
  FiHeart,
  FiShoppingBag,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import ProductCard from
  "../components/common/ProductCard";

import useCart from "../hooks/useCart";
import useWishlist from "../hooks/useWishlist";

import {
  getApiErrorMessage,
} from "../utils/apiData";

function WishlistPage() {
  const {
    addItem,
  } = useCart();

  const {
    wishlistItems,
    wishlistCount,
    isWishlistLoading,
    wishlistError,
  } = useWishlist();

  const [
    addingProductId,
    setAddingProductId,
  ] = useState(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const products = wishlistItems
    .map((item) => item.product ?? item)
    .filter((product) => product?.id);

  const handleAddToCart = async (
    product,
  ) => {
    setAddingProductId(product.id);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await addItem({
        productId: product.id,
        quantity: 1,
      });

      setSuccessMessage(
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

  if (isWishlistLoading) {
    return (
      <section className="route-loading">
        <div className="loading-spinner" />

        <p>Loading your wishlist...</p>
      </section>
    );
  }

  return (
    <section className="wishlist-page">
      <div className="wishlist-page-header">
        <div className="container">
          <span className="section-label">
            Saved products
          </span>

          <h1>Your Wishlist</h1>

          <p>
            Products you save are synchronized
            directly with your ShopSphere account.
          </p>
        </div>
      </div>

      <div className="container wishlist-content">
        {(wishlistError || errorMessage) && (
          <div className="store-message error">
            {errorMessage || wishlistError}
          </div>
        )}

        {successMessage && (
          <div className="store-message success">
            {successMessage}
          </div>
        )}

        {products.length === 0 ? (
          <div className="empty-wishlist-card">
            <div className="empty-wishlist-icon">
              <FiHeart />
            </div>

            <span className="section-label">
              Nothing saved yet
            </span>

            <h2>Your wishlist is empty</h2>

            <p>
              Save products you love by pressing
              the heart button on any product.
            </p>

            <Link
              to="/products"
              className="primary-button"
            >
              Explore Products
              <FiArrowRight />
            </Link>

            <div className="wishlist-empty-benefit">
              <FiShoppingBag />

              <span>
                Your saved products will remain
                available across future sessions.
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="wishlist-toolbar">
              <div>
                <h2>Saved Products</h2>

                <p>
                  {wishlistCount}
                  {" "}
                  {wishlistCount === 1
                    ? "product"
                    : "products"}
                  {" "}
                  in your wishlist
                </p>
              </div>

              <Link
                to="/products"
                className="secondary-button"
              >
                Continue Shopping
              </Link>
            </div>

            <div className="products-grid wishlist-products-grid">
              {products.map((product) => (
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
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default WishlistPage;