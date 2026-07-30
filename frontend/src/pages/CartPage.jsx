import {
  useState,
} from "react";

import {
  FiArrowLeft,
  FiLock,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiTrash2,
  FiTruck,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import useCart from "../hooks/useCart";

import {
  getApiErrorMessage,
} from "../utils/apiData";

import {
  formatCurrency,
} from "../utils/currency";

import {
  getProductImage,
} from "../utils/media";

function CartPage() {
  const {
    cartItems,
    cartCount,
    cartSubtotal,
    isCartLoading,
    cartError,
    updateItem,
    removeItem,
    clearCart,
  } = useCart();

  const [processingItemId, setProcessingItemId] =
    useState(null);

  const [isClearing, setIsClearing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const handleQuantityChange = async (
    item,
    nextQuantity,
  ) => {
    if (nextQuantity < 1) {
      return;
    }

    setProcessingItemId(item.id);
    setErrorMessage("");

    try {
      await updateItem({
        itemId: item.id,
        quantity: nextQuantity,
      });
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to update cart quantity.",
        ),
      );
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleRemove = async (itemId) => {
    setProcessingItemId(itemId);
    setErrorMessage("");

    try {
      await removeItem(itemId);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to remove the cart item.",
        ),
      );
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleClearCart = async () => {
    setIsClearing(true);
    setErrorMessage("");

    try {
      await clearCart();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to clear the shopping cart.",
        ),
      );
    } finally {
      setIsClearing(false);
    }
  };

  if (isCartLoading) {
    return (
      <section className="route-loading">
        <div className="loading-spinner" />
        <p>Loading your shopping cart...</p>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="container">
        <div className="cart-page-heading">
          <span className="section-label">
            Your selection
          </span>

          <h1>Shopping Cart</h1>

          <p>
            Your cart data is synchronized directly
            with the Django backend.
          </p>
        </div>

        {(errorMessage || cartError) && (
          <div className="store-message error">
            {errorMessage || cartError}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="empty-cart-card">
            <div className="empty-cart-icon">
              <FiShoppingBag />
            </div>

            <h2>Your cart is currently empty</h2>

            <p>
              Explore our store catalog and add
              products you would love to purchase.
            </p>

            <Link
              to="/products"
              className="primary-button"
            >
              Start Shopping
            </Link>

            <div className="cart-benefits">
              <span>
                <FiTruck />
                Fast delivery
              </span>

              <span>
                <FiLock />
                Secure checkout
              </span>
            </div>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items-card">
              <div className="cart-items-header">
                <div>
                  <h2>Your Products</h2>

                  <p>
                    {cartCount} items in your cart
                  </p>
                </div>

                <button
                  type="button"
                  className="clear-cart-button"
                  onClick={handleClearCart}
                  disabled={isClearing}
                >
                  <FiTrash2 />

                  {isClearing
                    ? "Clearing..."
                    : "Clear Cart"}
                </button>
              </div>

              <div className="cart-items-list">
                {cartItems.map((item) => {
                  const product =
                    item.product || {};

                  const unitPrice =
                    item.unit_price
                    ?? product.final_price
                    ?? product.price
                    ?? 0;

                  const lineTotal =
                    item.line_total
                    ?? item.total_price
                    ?? (
                      Number(unitPrice)
                      * Number(item.quantity)
                    );

                  const isProcessing =
                    processingItemId === item.id;

                  return (
                    <article
                      key={item.id}
                      className="cart-item"
                    >
                      <div className="cart-item-image">
                        <img
                          src={getProductImage(product)}
                          alt={
                            product.name
                            || item.product_name
                            || "Cart product"
                          }
                          onError={(event) => {
                            event.currentTarget.src =
                              "/product-placeholder.svg";
                          }}
                        />
                      </div>

                      <div className="cart-item-information">
                        <span>
                          {product.category?.name
                            || product.category_name
                            || "Product"}
                        </span>

                        <h3>
                          {product.name
                            || item.product_name}
                        </h3>

                        {item.variant && (
                          <p>
                            Variant: {
                              item.variant.name
                              || item.variant.sku
                            }
                          </p>
                        )}

                        <strong>
                          {formatCurrency(unitPrice)}
                        </strong>
                      </div>

                      <div className="quantity-control">
                        <button
                          type="button"
                          disabled={
                            isProcessing
                            || item.quantity <= 1
                          }
                          onClick={() =>
                            handleQuantityChange(
                              item,
                              item.quantity - 1,
                            )
                          }
                        >
                          <FiMinus />
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            handleQuantityChange(
                              item,
                              item.quantity + 1,
                            )
                          }
                        >
                          <FiPlus />
                        </button>
                      </div>

                      <div className="cart-item-total">
                        <small>Item Total</small>

                        <strong>
                          {formatCurrency(lineTotal)}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="remove-cart-item"
                        disabled={isProcessing}
                        onClick={() =>
                          handleRemove(item.id)
                        }
                        aria-label="Remove cart item"
                      >
                        <FiTrash2 />
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>

            <aside className="order-summary-card">
              <span className="section-label">
                Order summary
              </span>

              <h2>Cart Total</h2>

              <div className="summary-row">
                <span>
                  Subtotal ({cartCount} items)
                </span>

                <strong>
                  {formatCurrency(cartSubtotal)}
                </strong>
              </div>

              <div className="summary-row">
                <span>Shipping</span>
                <strong>Calculated later</strong>
              </div>

              <div className="summary-total">
                <span>Total</span>

                <strong>
                  {formatCurrency(cartSubtotal)}
                </strong>
              </div>

              <Link
  to="/checkout"
  className="checkout-button"
>
  Proceed to Checkout
</Link>

              <div className="secure-checkout-label">
                <FiLock />
                Secure checkout protected by JWT
              </div>

              <Link
                to="/products"
                className="continue-shopping-link"
              >
                <FiArrowLeft />
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

export default CartPage;