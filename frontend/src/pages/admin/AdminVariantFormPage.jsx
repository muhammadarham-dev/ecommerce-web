import {
  useEffect,
  useState,
} from "react";

import { useNavigate, useParams } from "react-router-dom";

import VariantForm from "../../components/admin/variants/VariantForm";
import { fetchAdminProducts } from "../../services/adminProductService";
import {
  createAdminVariant,
  fetchAdminAttributes,
  fetchAdminVariant,
  updateAdminVariant,
} from "../../services/adminVariantService";
import { getApiErrorMessage } from "../../utils/apiData";


function AdminVariantFormPage() {
  const navigate = useNavigate();
  const { variantSku } = useParams();
  const isEditing = Boolean(variantSku);

  const [products, setProducts] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [variant, setVariant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadPageData() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const requests = [
          fetchAdminProducts({ ordering: "name" }),
          fetchAdminAttributes({ ordering: "display_order,name" }),
        ];

        if (isEditing) {
          requests.push(fetchAdminVariant(variantSku));
        }

        const [productData, attributeData, variantData] = await Promise.all(requests);

        if (!isActive) {
          return;
        }

        setProducts(productData);
        setAttributes(attributeData);
        setVariant(variantData ?? null);
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            getApiErrorMessage(error, "Unable to load the variant form."),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadPageData();

    return () => {
      isActive = false;
    };
  }, [isEditing, variantSku]);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (isEditing) {
        await updateAdminVariant(variantSku, payload);
      } else {
        await createAdminVariant(payload);
      }

      navigate("/admin/variants", {
        replace: true,
        state: {
          notice: isEditing
            ? "Variant updated successfully."
            : "Variant created successfully.",
        },
      });
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Unable to save the product variant."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-page">
        <div className="admin-module-state">
          <div className="loading-spinner" />
          <p>Loading variant form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page admin-form-page">
      <header className="admin-page-header">
        <div>
          <span>Catalog management</span>
          <h1>{isEditing ? "Edit Product Variant" : "Create Product Variant"}</h1>
          <p>Define a unique option combination for a product.</p>
        </div>
      </header>

      <VariantForm
        initialData={variant}
        products={products}
        attributes={attributes}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/admin/variants")}
      />
    </div>
  );
}


export default AdminVariantFormPage;