import { useCallback, useEffect, useState } from "react";
import {
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiFolder,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";

import { Link } from "react-router-dom";

import {
  deleteAdminCategory,
  fetchAdminCategories,
  updateAdminCategory,
} from "../../services/adminProductService";
import { getApiErrorMessage } from "../../utils/apiData";
import { resolveMediaUrl } from "../../utils/media";

import "../../styles/admin-products.css";


function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busySlug, setBusySlug] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const params = {
        ordering: "name",
      };

      if (appliedSearch.trim()) {
        params.search = appliedSearch.trim();
      }

      const data = await fetchAdminCategories(params);
      setCategories(data);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to load categories."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [appliedSearch]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleToggleActive = async (category) => {
    setBusySlug(category.slug);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const formData = new FormData();
      formData.append("is_active", category.is_active ? "false" : "true");

      const updated = await updateAdminCategory(category.slug, formData);

      setCategories((current) => current.map((item) => (
        item.id === updated.id ? updated : item
      )));

      setNoticeMessage(
        `${updated.name} is now ${updated.is_active ? "active" : "inactive"}.`,
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to update category status."),
      );
    } finally {
      setBusySlug("");
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete ${category.name}? Categories linked to products cannot be deleted.`,
    );

    if (!confirmed) {
      return;
    }

    setBusySlug(category.slug);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      await deleteAdminCategory(category.slug);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      setNoticeMessage(`${category.name} was deleted successfully.`);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to delete this category because products are linked to it.",
        ),
      );
    } finally {
      setBusySlug("");
    }
  };

  return (
    <section className="admin-catalog-page">
      <div className="admin-catalog-page__heading">
        <div>
          <span className="admin-catalog-eyebrow">Catalog organization</span>
          <h1>Categories</h1>
          <p>Organize products into customer-friendly store categories.</p>
        </div>

        <Link to="/admin/categories/create" className="admin-primary-button">
          <FiPlus />
          Add Category
        </Link>
      </div>

      {noticeMessage && (
        <div className="admin-form-message admin-form-message--success">
          {noticeMessage}
        </div>
      )}

      {errorMessage && (
        <div className="admin-form-message admin-form-message--error">
          {errorMessage}
        </div>
      )}

      <form
        className="admin-category-search"
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedSearch(search);
        }}
      >
        <label className="admin-catalog-search">
          <FiSearch />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories"
          />
        </label>

        <button type="submit" className="admin-filter-button">
          <FiSearch />
          Search
        </button>

        <button
          type="button"
          className="admin-filter-reset"
          onClick={() => {
            setSearch("");
            setAppliedSearch("");
          }}
        >
          <FiRefreshCw />
          Reset
        </button>
      </form>

      {isLoading ? (
        <div className="admin-catalog-loading">
          <div className="admin-loading-spinner" />
          <p>Loading categories...</p>
        </div>
      ) : categories.length ? (
        <div className="admin-category-grid">
          {categories.map((category) => {
            const isBusy = busySlug === category.slug;
            const imageUrl = resolveMediaUrl(category.image);

            return (
              <article key={category.id} className="admin-category-card">
                <div className="admin-category-card__image">
                  {imageUrl ? (
                    <img src={imageUrl} alt={category.name} />
                  ) : (
                    <FiImage />
                  )}
                </div>

                <div className="admin-category-card__content">
                  <div>
                    <span className="admin-category-card__slug">/{category.slug}</span>
                    <h3>{category.name}</h3>
                    <p>{category.description || "No category description provided."}</p>
                  </div>

                  <div className="admin-category-card__footer">
                    <button
                      type="button"
                      className={
                        category.is_active
                          ? "admin-status-toggle admin-status-toggle--active"
                          : "admin-status-toggle"
                      }
                      disabled={isBusy}
                      onClick={() => handleToggleActive(category)}
                    >
                      {category.is_active ? <FiEye /> : <FiEyeOff />}
                      {category.is_active ? "Active" : "Inactive"}
                    </button>

                    <div className="admin-row-actions">
                      <Link
                        to={`/admin/categories/${category.slug}/edit`}
                        className="admin-row-action"
                        aria-label={`Edit ${category.name}`}
                      >
                        <FiEdit2 />
                      </Link>

                      <button
                        type="button"
                        className="admin-row-action admin-row-action--danger"
                        disabled={isBusy}
                        onClick={() => handleDelete(category)}
                        aria-label={`Delete ${category.name}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="admin-catalog-empty">
          <FiFolder />
          <h3>No categories found</h3>
          <p>Create a category before adding products.</p>
        </div>
      )}
    </section>
  );
}


export default AdminCategoriesPage;