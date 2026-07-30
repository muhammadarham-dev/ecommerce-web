import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  FiArrowLeft,
} from "react-icons/fi";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import BannerForm from
  "../../components/admin/banners/BannerForm";

import {
  createAdminBanner,
  fetchAdminBanner,
  updateAdminBanner,
} from "../../services/adminBannerService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";


function AdminBannerFormPage() {
  const {
    bannerId,
  } = useParams();

  const navigate = useNavigate();

  const isEditing =
    Boolean(bannerId);

  const [
    banner,
    setBanner,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(isEditing);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadBanner = useCallback(
    async () => {
      if (!isEditing) {
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const data =
          await fetchAdminBanner(
            bannerId,
          );

        setBanner(data);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load this banner.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      bannerId,
      isEditing,
    ],
  );

  useEffect(() => {
    loadBanner();
  }, [loadBanner]);

  const handleSubmit =
    async (values) => {
      setIsSubmitting(true);
      setErrorMessage("");

      try {
        if (isEditing) {
          await updateAdminBanner(
            bannerId,
            values,
          );
        } else {
          await createAdminBanner(
            values,
          );
        }

        navigate(
          "/admin/banners",
          {
            replace: true,
          },
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            isEditing
              ? "Unable to update this banner."
              : "Unable to create this banner.",
          ),
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  if (isLoading) {
    return (
      <div className="admin-banners-state">
        <div className="admin-loading-spinner" />
        <p>Loading banner...</p>
      </div>
    );
  }

  if (
    isEditing
    && !banner
  ) {
    return (
      <section className="admin-banner-form-page">
        <div className="admin-form-message admin-form-message--error">
          {errorMessage
            || "Banner not found."}
        </div>
      </section>
    );
  }

  return (
    <section className="admin-banner-form-page">
      <div className="admin-banner-form-page__heading">
        <div>
          <Link
            to="/admin/banners"
            className="admin-banner-back-link"
          >
            <FiArrowLeft />
            Back to Banners
          </Link>

          <span className="admin-banners-eyebrow">
            Homepage content
          </span>

          <h1>
            {isEditing
              ? `Edit ${banner.title}`
              : "Create Banner"}
          </h1>

          <p>
            Configure banner media, content,
            placement, appearance and schedule.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="admin-form-message admin-form-message--error">
          {errorMessage}
        </div>
      )}

      <BannerForm
        initialBanner={banner}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </section>
  );
}


export default AdminBannerFormPage;
