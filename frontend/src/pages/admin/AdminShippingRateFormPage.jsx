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

import ShippingRateForm from
  "../../components/admin/shipping-rates/ShippingRateForm";

import {
  createAdminShippingRate,
  fetchAdminShippingRate,
  fetchShippingMethods,
  fetchShippingZones,
  updateAdminShippingRate,
} from "../../services/adminShippingRateService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";


function AdminShippingRateFormPage() {
  const {
    shippingRateId,
  } = useParams();

  const navigate = useNavigate();

  const isEditing =
    Boolean(shippingRateId);

  const [
    rate,
    setRate,
  ] = useState(null);

  const [
    zones,
    setZones,
  ] = useState([]);

  const [
    methods,
    setMethods,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadFormData = useCallback(
    async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const requests = [
          fetchShippingZones({
            is_active: true,
            ordering: "-priority,name",
          }),
          fetchShippingMethods({
            ordering: "display_order,name",
          }),
        ];

        if (isEditing) {
          requests.push(
            fetchAdminShippingRate(
              shippingRateId,
            ),
          );
        }

        const [
          zonesResult,
          methodsResult,
          rateResult,
        ] = await Promise.all(requests);

        setZones(zonesResult.items);
        setMethods(methodsResult.items);

        if (isEditing) {
          setRate(rateResult);
        }
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load the shipping rate form.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      isEditing,
      shippingRateId,
    ],
  );

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  const handleSubmit =
    async (values) => {
      setIsSubmitting(true);
      setErrorMessage("");

      try {
        if (isEditing) {
          await updateAdminShippingRate(
            shippingRateId,
            values,
          );
        } else {
          await createAdminShippingRate(
            values,
          );
        }

        navigate(
          "/admin/shipping-rates",
          {
            replace: true,
          },
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            isEditing
              ? "Unable to update this shipping rate."
              : "Unable to create this shipping rate.",
          ),
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  if (isLoading) {
    return (
      <div className="admin-shipping-state">
        <div className="admin-loading-spinner" />
        <p>Loading shipping rate form...</p>
      </div>
    );
  }

  if (
    isEditing
    && !rate
  ) {
    return (
      <section className="admin-shipping-form-page">
        <div className="admin-form-message admin-form-message--error">
          {errorMessage
            || "Shipping rate not found."}
        </div>
      </section>
    );
  }

  return (
    <section className="admin-shipping-form-page">
      <div className="admin-shipping-form-page__heading">
        <div>
          <Link
            to="/admin/shipping-rates"
            className="admin-shipping-back-link"
          >
            <FiArrowLeft />
            Back to Shipping Rates
          </Link>

          <span className="admin-shipping-eyebrow">
            Delivery configuration
          </span>

          <h1>
            {isEditing
              ? "Edit Shipping Rate"
              : "Create Shipping Rate"}
          </h1>

          <p>
            Connect a delivery zone with a shipping
            method and configure its charges,
            delivery estimate and COD availability.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="admin-form-message admin-form-message--error">
          {errorMessage}
        </div>
      )}

      {!zones.length && (
        <div className="admin-form-message admin-form-message--error">
          Create an active shipping zone before
          creating a rate.
        </div>
      )}

      {!methods.length && (
        <div className="admin-form-message admin-form-message--error">
          Create a shipping method before creating
          a rate.
        </div>
      )}

      <ShippingRateForm
        initialRate={rate}
        zones={zones}
        methods={methods}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </section>
  );
}


export default AdminShippingRateFormPage;
