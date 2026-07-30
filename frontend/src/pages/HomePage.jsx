import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiArrowRight,
  FiHeadphones,
  FiRefreshCcw,
  FiShield,
  FiTruck,
} from "react-icons/fi";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import ProductCard from
  "../components/common/ProductCard";

import HeroBannerSlider from
  "../components/home/HeroBannerSlider";

import PromotionBanner from
  "../components/home/PromotionBanner";

import RecentlyViewedProducts from
  "../components/products/RecentlyViewedProducts";

import useAuth from
  "../hooks/useAuth";

import useCart from
  "../hooks/useCart";

import useStoreSettings from
  "../hooks/useStoreSettings";

import {
  fetchHeroBanners,
  fetchPromotionalBanners,
} from "../services/bannerService";

import {
  fetchCategories,
  fetchProducts,
} from "../services/productService";

import {
  extractList,
  getApiErrorMessage,
} from "../utils/apiData";

import {
  resolveMediaUrl,
} from "../utils/media";


function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const authContext = useAuth();
  const cartContext = useCart();

  const {
    storeSettings,
  } = useStoreSettings();

  const isAuthenticated =
    authContext.isAuthenticated
    ?? Boolean(
      authContext.user
      ?? authContext.currentUser,
    );

  const addItem =
    cartContext.addItem
    ?? cartContext.addToCart;

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    featuredProducts,
    setFeaturedProducts,
  ] = useState([]);

  const [
    heroBanners,
    setHeroBanners,
  ] = useState([]);

  const [
    promotionalBanners,
    setPromotionalBanners,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    noticeMessage,
    setNoticeMessage,
  ] = useState("");

  const [
    addingProductId,
    setAddingProductId,
  ] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadHomeData() {
      setIsLoading(true);
      setErrorMessage("");

      const results =
        await Promise.allSettled([
          fetchCategories(),
          fetchProducts(),
          fetchHeroBanners(),
          fetchPromotionalBanners(),
        ]);

      if (!isActive) {
        return;
      }

      const [
        categoriesResult,
        productsResult,
        heroResult,
        promotionResult,
      ] = results;

      try {
        if (
          categoriesResult.status
          === "rejected"
        ) {
          throw categoriesResult.reason;
        }

        if (
          productsResult.status
          === "rejected"
        ) {
          throw productsResult.reason;
        }

        const categoryList =
          extractList(
            categoriesResult.value,
          );

        const productList =
          extractList(
            productsResult.value,
          );

        setCategories(
          categoryList
            .filter(
              (category) =>
                category.is_active
                !== false,
            )
            .slice(0, 4),
        );

        const featured =
          productList.filter(
            (product) =>
              product.is_featured
              === true,
          );

        setFeaturedProducts(
          (
            featured.length > 0
              ? featured
              : productList
          ).slice(0, 8),
        );

        setHeroBanners(
          heroResult.status
          === "fulfilled"
            ? extractList(
              heroResult.value,
            )
            : [],
        );

        setPromotionalBanners(
          promotionResult.status
          === "fulfilled"
            ? extractList(
              promotionResult.value,
            )
            : [],
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load store products.",
          ),
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadHomeData();

    return () => {
      isActive = false;
    };
  }, []);

  const handleAddToCart =
    async (product) => {
      if (!isAuthenticated) {
        navigate("/login", {
          state: {
            from: location.pathname,
          },
        });

        return;
      }

      if (
        typeof addItem
        !== "function"
      ) {
        setErrorMessage(
          "Cart service is unavailable.",
        );

        return;
      }

      setAddingProductId(
        product.id,
      );

      setNoticeMessage("");
      setErrorMessage("");

      try {
        await addItem({
          productId: product.id,
          quantity: 1,
        });

        setNoticeMessage(
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

  const fallbackBanner =
    useMemo(() => {
      const heroProduct =
        featuredProducts[0];

      const image =
        resolveMediaUrl(
          heroProduct?.primary_image
          ?? heroProduct
            ?.images?.[0]?.image,
        );

      return {
        id: "store-fallback-banner",

        title:
          `Discover products from ${
            storeSettings.store_name
          }.`,

        subtitle:
          storeSettings.tagline
          || "Premium ecommerce collection",

        description:
          storeSettings.description
          || (
            "Explore quality products "
            + "with secure checkout and "
            + "dependable delivery."
          ),

        image:
          image
          || "/product-placeholder.svg",

        mobile_image: null,

        button_text:
          "Shop Collection",

        button_url:
          "/products",

        background_color:
          "#11130f",

        text_color:
          "#ffffff",
      };
    }, [
      featuredProducts,
      storeSettings.description,
      storeSettings.store_name,
      storeSettings.tagline,
    ]);

  const benefits = [
    {
      id: "delivery",
      icon: FiTruck,
      title: "Reliable Delivery",
      description: (
        "Track your order and shipment "
        + "directly from your account."
      ),
    },
    {
      id: "security",
      icon: FiShield,
      title: "Secure Payments",
      description: (
        "Protected checkout with configured "
        + "store payment methods."
      ),
    },
    {
      id: "returns",
      icon: FiRefreshCcw,
      title: "Easy Returns",
      description: (
        `Return eligible products within ${
          storeSettings.return_window_days
        } days.`
      ),
    },
    {
      id: "support",
      icon: FiHeadphones,
      title: "Customer Support",
      description:
        storeSettings.support_email
          ? (
            `Contact us at ${
              storeSettings.support_email
            }.`
          )
          : (
            "Helpful support whenever "
            + "you need assistance."
          ),
    },
  ];

  return (
    <>
      <HeroBannerSlider
        banners={heroBanners}
        fallbackBanner={
          fallbackBanner
        }
      />

      <section className="benefits-section">
        <div className="container benefits-grid">
          {benefits.map(
            (benefit) => {
              const Icon =
                benefit.icon;

              return (
                <article
                  key={benefit.id}
                  className="benefit-card"
                >
                  <div className="benefit-icon">
                    <Icon />
                  </div>

                  <div>
                    <h3>
                      {benefit.title}
                    </h3>

                    <p>
                      {
                        benefit.description
                      }
                    </p>
                  </div>
                </article>
              );
            },
          )}
        </div>
      </section>

      {noticeMessage && (
        <div className="container store-message success">
          {noticeMessage}
        </div>
      )}

      {errorMessage && (
        <div className="container store-message error">
          {errorMessage}
        </div>
      )}

      <section className="section categories-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-label">
                Shop by category
              </span>

              <h2>
                Find what fits your style
              </h2>
            </div>

            <Link
              to="/products"
              className="text-link"
            >
              View all categories
              <FiArrowRight />
            </Link>
          </div>

          {isLoading ? (
            <div className="content-loading">
              <div className="loading-spinner" />

              <p>
                Loading categories...
              </p>
            </div>
          ) : categories.length === 0 ? (
            <div className="empty-content">
              <h3>
                No categories available
              </h3>

              <p>
                Active categories will
                appear here automatically.
              </p>
            </div>
          ) : (
            <div className="categories-grid">
              {categories.map(
                (category) => (
                  <Link
                    key={category.id}
                    to={
                      `/products?category=${
                        encodeURIComponent(
                          category.slug,
                        )
                      }`
                    }
                    className="category-card"
                  >
                    <img
                      src={
                        resolveMediaUrl(
                          category.image,
                        )
                        || "/product-placeholder.svg"
                      }
                      alt={category.name}
                      onError={(event) => {
                        event.currentTarget.src =
                          "/product-placeholder.svg";
                      }}
                    />

                    <div className="category-overlay" />

                    <div className="category-content">
                      <span>
                        {category.description
                          || (
                            "Explore our "
                            + "collection"
                          )}
                      </span>

                      <h3>
                        {category.name}
                      </h3>

                      <div>
                        Explore
                        <FiArrowRight />
                      </div>
                    </div>
                  </Link>
                ),
              )}
            </div>
          )}
        </div>
      </section>

      <PromotionBanner
        banners={
          promotionalBanners
        }
      />

      <section className="section featured-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-label">
                Store products
              </span>

              <h2>
                Featured this week
              </h2>
            </div>

            <Link
              to="/products"
              className="text-link"
            >
              Explore all products
              <FiArrowRight />
            </Link>
          </div>

          {isLoading ? (
            <div className="content-loading">
              <div className="loading-spinner" />

              <p>
                Loading products...
              </p>
            </div>
          ) : featuredProducts.length
            === 0 ? (
            <div className="empty-content">
              <h3>
                No products available
              </h3>

              <p>
                Add active products from
                the administration panel.
              </p>
            </div>
          ) : (
            <div className="products-grid">
              {featuredProducts
                .slice(0, 4)
                .map(
                  (product) => (
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
                  ),
                )}
            </div>
          )}
        </div>
      </section>

      <RecentlyViewedProducts
        limit={4}
        title={
          "Recently Viewed Products"
        }
        description={
          "Continue exploring the products "
          + "you recently opened."
        }
      />
    </>
  );
}


export default HomePage;