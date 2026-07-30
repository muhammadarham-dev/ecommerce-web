import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FiActivity,
  FiAlertTriangle,
  FiBox,
  FiClock,
  FiLayers,
} from "react-icons/fi";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import InventoryAdjustmentForm from "../../components/admin/inventory/InventoryAdjustmentForm";
import InventoryTable from "../../components/admin/inventory/InventoryTable";
import { fetchAdminProducts } from "../../services/adminProductService";
import {
  fetchAdminVariants,
} from "../../services/adminVariantService";
import {
  adjustInventory,
  fetchInventorySummary,
  fetchStockMovements,
} from "../../services/adminInventoryService";
import { getApiErrorMessage } from "../../utils/apiData";


function AdminInventoryPage() {
  const [searchParams] = useSearchParams();
  const formSectionRef = useRef(null);

  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [initialTarget, setInitialTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [summaryData, productData, variantData, movementData] = await Promise.all([
        fetchInventorySummary(),
        fetchAdminProducts({ ordering: "name" }),
        fetchAdminVariants({ ordering: "product__name,sku" }),
        fetchStockMovements({ ordering: "-created_at" }),
      ]);

      setSummary(summaryData);
      setProducts(productData);
      setVariants(variantData);
      setRecentMovements(movementData.slice(0, 8));
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to load inventory information."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    if (!products.length && !variants.length) {
      return;
    }

    const variantSku = searchParams.get("variant");
    const productSlug = searchParams.get("product");

    if (variantSku) {
      const selectedVariant = variants.find(
        (variant) => variant.sku.toLowerCase() === variantSku.toLowerCase(),
      );

      if (selectedVariant) {
        setInitialTarget({
          targetType: "VARIANT",
          id: selectedVariant.id,
        });
      }
    } else if (productSlug) {
      const selectedProduct = products.find(
        (product) => product.slug.toLowerCase() === productSlug.toLowerCase(),
      );

      if (selectedProduct) {
        setInitialTarget({
          targetType: "PRODUCT",
          id: selectedProduct.id,
        });
      }
    }
  }, [products, searchParams, variants]);

  const lowStockItems = useMemo(() => {
    const threshold = Number(summary?.low_stock_threshold ?? 0);
    const variantProductIds = new Set(
      variants.map((variant) => Number(variant.product)),
    );

    const simpleProductItems = products
      .filter((product) => (
        product.is_active !== false
        && !variantProductIds.has(Number(product.id))
        && Number(product.stock) <= threshold
      ))
      .map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        category: product.category?.name ?? "—",
        stock: product.stock,
        target_type: "PRODUCT",
      }));

    const variantItems = variants
      .filter((variant) => (
        variant.is_active !== false
        && Number(variant.stock) <= threshold
      ))
      .map((variant) => ({
        id: variant.id,
        name: variant.variant_name || variant.product_name,
        product_name: variant.product_name,
        product_slug: variant.product_slug,
        sku: variant.sku,
        category: "Variant",
        stock: variant.stock,
        target_type: "VARIANT",
      }));

    return [...simpleProductItems, ...variantItems]
      .sort((first, second) => Number(first.stock) - Number(second.stock));
  }, [products, summary?.low_stock_threshold, variants]);

  const handleAdjustSelection = (item) => {
    setInitialTarget({
      targetType: item.target_type,
      id: item.id,
    });

    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleAdjustment = async (payload) => {
    setIsSubmitting(true);
    setFormError("");
    setNoticeMessage("");

    try {
      const response = await adjustInventory(payload);
      setNoticeMessage(
        response.message || "Stock adjusted successfully.",
      );
      await loadInventory();
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, "Unable to adjust the selected stock."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const statCards = [
    {
      label: "Available Units",
      value: summary?.total_available_units ?? 0,
      icon: FiLayers,
    },
    {
      label: "Simple Products",
      value: summary?.simple_products?.total ?? 0,
      icon: FiBox,
    },
    {
      label: "Active Variants",
      value: summary?.variants?.total ?? 0,
      icon: FiActivity,
    },
    {
      label: "Low / Out of Stock",
      value: (
        Number(summary?.simple_products?.low_stock ?? 0)
        + Number(summary?.simple_products?.out_of_stock ?? 0)
        + Number(summary?.variants?.low_stock ?? 0)
        + Number(summary?.variants?.out_of_stock ?? 0)
      ),
      icon: FiAlertTriangle,
    },
  ];

  return (
    <div className="admin-page admin-inventory-page">
      <header className="admin-page-header">
        <div>
          <span>Stock operations</span>
          <h1>Inventory Management</h1>
          <p>Monitor stock health, make controlled adjustments, and review movement history.</p>
        </div>

        <Link
          to="/admin/inventory/history"
          className="admin-button admin-button--secondary"
        >
          <FiClock />
          Movement History
        </Link>
      </header>

      {noticeMessage && (
        <div className="admin-inline-message admin-inline-message--success">
          {noticeMessage}
        </div>
      )}

      {errorMessage && (
        <div className="admin-inline-message admin-inline-message--error">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="admin-module-state">
          <div className="loading-spinner" />
          <p>Loading inventory dashboard...</p>
        </div>
      ) : (
        <>
          <section className="admin-stat-grid admin-stat-grid--inventory">
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <article key={card.label} className="admin-inventory-stat">
                  <span><Icon /></span>
                  <div>
                    <strong>{card.value}</strong>
                    <small>{card.label}</small>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="admin-content-card">
            <div className="admin-content-card__heading">
              <div>
                <span>Threshold: {summary?.low_stock_threshold ?? 0} units</span>
                <h2>Low-Stock Items</h2>
              </div>
            </div>

            <InventoryTable
              items={lowStockItems}
              onAdjust={handleAdjustSelection}
            />
          </section>

          <div className="admin-inventory-layout" ref={formSectionRef}>
            <InventoryAdjustmentForm
              products={products}
              variants={variants}
              initialTarget={initialTarget}
              isSubmitting={isSubmitting}
              errorMessage={formError}
              onSubmit={handleAdjustment}
            />

            <section className="admin-content-card admin-recent-movements">
              <div className="admin-content-card__heading">
                <div>
                  <span>Latest activity</span>
                  <h2>Recent Movements</h2>
                </div>

                <Link to="/admin/inventory/history">View all</Link>
              </div>

              {recentMovements.length ? (
                <div className="admin-movement-list">
                  {recentMovements.map((movement) => (
                    <article key={movement.id}>
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

                      <div>
                        <strong>{movement.target_name}</strong>
                        <small>
                          {movement.movement_type_display} · {movement.previous_stock} → {movement.new_stock}
                        </small>
                      </div>

                      <time>
                        {new Date(movement.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="admin-module-state admin-module-state--compact">
                  <p>No inventory movements have been recorded.</p>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}


export default AdminInventoryPage;