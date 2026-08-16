import { useCallback, useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiImage,
  FiStar,
  FiTrash2,
  FiUploadCloud,
} from "react-icons/fi";

import { Link, useNavigate, useParams } from "react-router-dom";

import ProductForm from "../../components/admin/products/ProductForm";
import {
  createAdminProduct,
  deleteAdminProductImage,
  fetchAdminCategories,
  fetchAdminProduct,
  setAdminProductImagePrimary,
  updateAdminProduct,
  uploadAdminProductImage,
} from "../../services/adminProductService";
import { getApiErrorMessage } from "../../utils/apiData";
import { resolveMediaUrl } from "../../utils/media";

import "../../styles/admin-products.css";


function AdminProductFormPage() {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(productSlug);

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [busyImageId, setBusyImageId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [imageForm, setImageForm] = useState({
    image: null,
    altText: "",
    isPrimary: false,
  });

  const loadPage = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const categoryPromise = fetchAdminCategories({ ordering: "name" });
      const productPromise = isEditing
        ? fetchAdminProduct(productSlug)
        : Promise.resolve(null);

      const [categoryData, productData] = await Promise.all([
        categoryPromise,
        productPromise,
      ]);

      setCategories(categoryData);
      setProduct(productData);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to load the product form."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [isEditing, productSlug]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      if (isEditing) {
        const updated = await updateAdminProduct(productSlug, payload);
        setProduct(updated);
        setNoticeMessage("Product details were updated successfully.");
        return;
      }

      const created = await createAdminProduct(payload);

      navigate(`/admin/products/${created.slug}/edit`, {
        replace: true,
        state: {
          created: true,
        },
      });
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to save the product."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshProduct = async () => {
    if (!productSlug) {
      return;
    }

    const refreshed = await fetchAdminProduct(productSlug);
    setProduct(refreshed);
  };

  const handleImageUpload = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;

    if (!imageForm.image || !product?.id) {
      setErrorMessage("Choose an image before uploading.");
      return;
    }

    setIsUploadingImage(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      await uploadAdminProductImage({
        productId: product.id,
        image: imageForm.image,
        altText: imageForm.altText.trim(),
        isPrimary: imageForm.isPrimary,
      });

      await refreshProduct();
      setImageForm({
        image: null,
        altText: "",
        isPrimary: false,
      });

      formElement.reset();
      setNoticeMessage("Product image uploaded successfully.");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to upload the product image."),
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSetPrimary = async (imageId) => {
    setBusyImageId(imageId);
    setErrorMessage("");

    try {
      await setAdminProductImagePrimary(imageId);
      await refreshProduct();
      setNoticeMessage("Primary product image updated.");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to update the primary image."),
      );
    } finally {
      setBusyImageId(null);
    }
  };

  const handleDeleteImage = async (imageId) => {
    const confirmed = window.confirm("Delete this product image?");

    if (!confirmed) {
      return;
    }

    setBusyImageId(imageId);
    setErrorMessage("");

    try {
      await deleteAdminProductImage(imageId);
      await refreshProduct();
      setNoticeMessage("Product image deleted successfully.");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to delete the product image."),
      );
    } finally {
      setBusyImageId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-catalog-loading">
        <div className="admin-loading-spinner" />
        <p>Loading product form...</p>
      </div>
    );
  }

  return (
    <section className="admin-catalog-page">
      <div className="admin-catalog-page__heading">
        <div>
          <Link to="/admin/products" className="admin-back-link">
            <FiArrowLeft />
            Products
          </Link>

          <span className="admin-catalog-eyebrow">
            {isEditing ? "Edit catalog item" : "Create catalog item"}
          </span>

          <h1>{isEditing ? product?.name || "Edit Product" : "New Product"}</h1>
          <p>
            {isEditing
              ? "Update product details and manage its gallery images."
              : "Create the product first, then upload its gallery images."}
          </p>
        </div>
      </div>

      {noticeMessage && (
        <div className="admin-form-message admin-form-message--success">
          <FiCheckCircle />
          {noticeMessage}
        </div>
      )}

      {errorMessage && (
        <div className="admin-form-message admin-form-message--error">
          {errorMessage}
        </div>
      )}

      <ProductForm
        categories={categories}
        initialValues={product}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        submitLabel={isEditing ? "Save Product" : "Create Product"}
      />

      {isEditing && product && (
        <section className="admin-form-card admin-image-manager">
          <div className="admin-form-card__heading">
            <div>
              <span>Product gallery</span>
              <h2>Images</h2>
            </div>

            <FiImage />
          </div>

          <form className="admin-image-upload-form" onSubmit={handleImageUpload}>
            <label className="admin-upload-dropzone">
              <FiUploadCloud />
              <strong>Choose product image</strong>
              <span>JPG, PNG, or WebP</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setImageForm((current) => ({
                  ...current,
                  image: event.target.files?.[0] || null,
                }))}
                required
              />
            </label>

            <label className="admin-field">
              <span>Alternative text</span>
              <input
                type="text"
                value={imageForm.altText}
                onChange={(event) => setImageForm((current) => ({
                  ...current,
                  altText: event.target.value,
                }))}
                placeholder="Front view of product"
                maxLength="255"
              />
            </label>

            <label className="admin-image-primary-check">
              <input
                type="checkbox"
                checked={imageForm.isPrimary}
                onChange={(event) => setImageForm((current) => ({
                  ...current,
                  isPrimary: event.target.checked,
                }))}
              />
              Set as primary image
            </label>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={isUploadingImage}
            >
              <FiUploadCloud />
              {isUploadingImage ? "Uploading..." : "Upload Image"}
            </button>
          </form>

          {product.images?.length ? (
            <div className="admin-image-grid">
              {product.images.map((image) => (
                <article key={image.id} className="admin-image-card">
                  <img
                    src={resolveMediaUrl(image.image)}
                    alt={image.alt_text || product.name}
                  />

                  <div className="admin-image-card__content">
                    <span>{image.alt_text || "Product image"}</span>

                    {image.is_primary && (
                      <strong>
                        <FiStar />
                        Primary
                      </strong>
                    )}
                  </div>

                  <div className="admin-image-card__actions">
                    {!image.is_primary && (
                      <button
                        type="button"
                        disabled={busyImageId === image.id}
                        onClick={() => handleSetPrimary(image.id)}
                      >
                        <FiStar />
                        Set Primary
                      </button>
                    )}

                    <button
                      type="button"
                      className="danger"
                      disabled={busyImageId === image.id}
                      onClick={() => handleDeleteImage(image.id)}
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-catalog-empty admin-catalog-empty--compact">
              <FiImage />
              <h3>No product images</h3>
              <p>Upload at least one image and mark it as primary.</p>
            </div>
          )}
        </section>
      )}
    </section>
  );
}


export default AdminProductFormPage;