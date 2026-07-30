import { useCallback, useEffect, useState } from "react";
import { FiArrowLeft, FiCheckCircle } from "react-icons/fi";

import { Link, useNavigate, useParams } from "react-router-dom";

import CategoryForm from "../../components/admin/products/CategoryForm";
import {
  createAdminCategory,
  fetchAdminCategory,
  updateAdminCategory,
} from "../../services/adminProductService";
import { getApiErrorMessage } from "../../utils/apiData";

import "../../styles/admin-products.css";


function AdminCategoryFormPage() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(categorySlug);

  const [category, setCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  const loadCategory = useCallback(async () => {
    if (!isEditing) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await fetchAdminCategory(categorySlug);
      setCategory(data);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to load the category."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [categorySlug, isEditing]);

  useEffect(() => {
    loadCategory();
  }, [loadCategory]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      if (isEditing) {
        const updated = await updateAdminCategory(categorySlug, formData);
        setCategory(updated);
        setNoticeMessage("Category updated successfully.");
        return;
      }

      const created = await createAdminCategory(formData);
      navigate(`/admin/categories/${created.slug}/edit`, {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to save the category."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-catalog-loading">
        <div className="admin-loading-spinner" />
        <p>Loading category form...</p>
      </div>
    );
  }

  return (
    <section className="admin-catalog-page">
      <div className="admin-catalog-page__heading">
        <div>
          <Link to="/admin/categories" className="admin-back-link">
            <FiArrowLeft />
            Categories
          </Link>

          <span className="admin-catalog-eyebrow">
            {isEditing ? "Edit catalog category" : "Create catalog category"}
          </span>

          <h1>{isEditing ? category?.name || "Edit Category" : "New Category"}</h1>
          <p>Create a clear category that helps customers find products quickly.</p>
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

      <CategoryForm
        initialValues={category}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        submitLabel={isEditing ? "Save Category" : "Create Category"}
      />
    </section>
  );
}


export default AdminCategoryFormPage;