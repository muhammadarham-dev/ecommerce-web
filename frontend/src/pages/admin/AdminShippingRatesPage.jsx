import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiDollarSign,
  FiFilter,
  FiMapPin,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTruck,
} from "react-icons/fi";

import {
  Link,
} from "react-router-dom";

import AdminShippingRateTable from
  "../../components/admin/shipping-rates/AdminShippingRateTable";

import ShippingMethodManager from
  "../../components/admin/shipping-rates/ShippingMethodManager";

import ShippingZoneManager from
  "../../components/admin/shipping-rates/ShippingZoneManager";

import {
  createShippingMethod,
  createShippingZone,
  deleteAdminShippingRate,
  deleteShippingMethod,
  deleteShippingZone,
  fetchAdminShippingRates,
  fetchShippingMethods,
  fetchShippingZones,
  updateShippingMethod,
  updateShippingRateStatus,
  updateShippingZone,
} from "../../services/adminShippingRateService";

import {
  getApiErrorMessage,
} from "../../utils/apiData";


const initialRateFilters = {
  search: "",
  zone: "",
  method: "",
  codAvailable: "",
  activeState: "",
  ordering: "zone__name,method__display_order",
};


function AdminShippingRatesPage() {
  const [
    activeTab,
    setActiveTab,
  ] = useState("RATES");

  const [
    rates,
    setRates,
  ] = useState([]);

  const [
    zones,
    setZones,
  ] = useState([]);

  const [
    methods,
    setMethods,
  ] = useState([]);

  const [
    totalRateCount,
    setTotalRateCount,
  ] = useState(0);

  const [
    filters,
    setFilters,
  ] = useState(initialRateFilters);

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState(initialRateFilters);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    isManagerSaving,
    setIsManagerSaving,
  ] = useState(false);

  const [
    isUpdatingRateId,
    setIsUpdatingRateId,
  ] = useState(null);

  const [
    isDeletingRateId,
    setIsDeletingRateId,
  ] = useState(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    noticeMessage,
    setNoticeMessage,
  ] = useState("");

  const loadData = useCallback(
    async ({
      showRefreshState = false,
    } = {}) => {
      if (showRefreshState) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage("");

      const rateParams = {
        ordering:
          appliedFilters.ordering,
      };

      if (
        appliedFilters.search.trim()
      ) {
        rateParams.search =
          appliedFilters.search.trim();
      }

      if (appliedFilters.zone) {
        rateParams.zone =
          appliedFilters.zone;
      }

      if (appliedFilters.method) {
        rateParams.method =
          appliedFilters.method;
      }

      if (
        appliedFilters.codAvailable
        !== ""
      ) {
        rateParams.cod_available =
          appliedFilters.codAvailable;
      }

      if (
        appliedFilters.activeState
        !== ""
      ) {
        rateParams.is_active =
          appliedFilters.activeState;
      }

      try {
        const [
          ratesResult,
          zonesResult,
          methodsResult,
        ] = await Promise.all([
          fetchAdminShippingRates(
            rateParams,
          ),
          fetchShippingZones({
            ordering: "-priority,name",
          }),
          fetchShippingMethods({
            ordering: "display_order,name",
          }),
        ]);

        setRates(ratesResult.items);
        setTotalRateCount(
          ratesResult.count,
        );
        setZones(zonesResult.items);
        setMethods(methodsResult.items);
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to load shipping configuration.",
          ),
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [appliedFilters],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeRateCount = useMemo(
    () =>
      rates.filter(
        (rate) => rate.is_active,
      ).length,
    [rates],
  );

  const codRateCount = useMemo(
    () =>
      rates.filter(
        (rate) => rate.cod_available,
      ).length,
    [rates],
  );

  const handleFilterSubmit = (
    event,
  ) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(initialRateFilters);
    setAppliedFilters(
      initialRateFilters,
    );
  };

  const handleRateStatus =
    async (rate) => {
      setIsUpdatingRateId(rate.id);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        const updatedRate =
          await updateShippingRateStatus(
            rate.id,
            !rate.is_active,
          );

        setRates(
          (currentRates) =>
            currentRates.map(
              (currentRate) =>
                currentRate.id
                === updatedRate.id
                  ? updatedRate
                  : currentRate,
            ),
        );

        setNoticeMessage(
          `Shipping rate ${
            updatedRate.is_active
              ? "activated"
              : "deactivated"
          } successfully.`,
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to update shipping rate.",
          ),
        );
      } finally {
        setIsUpdatingRateId(null);
      }
    };

  const handleRateDelete =
    async (rate) => {
      const confirmed =
        window.confirm(
          `Delete ${rate.zone_name} - `
          + `${rate.method_name} shipping rate?`,
        );

      if (!confirmed) {
        return;
      }

      setIsDeletingRateId(rate.id);
      setErrorMessage("");
      setNoticeMessage("");

      try {
        await deleteAdminShippingRate(
          rate.id,
        );

        setRates(
          (currentRates) =>
            currentRates.filter(
              (currentRate) =>
                currentRate.id !== rate.id,
            ),
        );

        setTotalRateCount(
          (currentCount) =>
            Math.max(
              currentCount - 1,
              0,
            ),
        );

        setNoticeMessage(
          "Shipping rate deleted successfully.",
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to delete shipping rate.",
          ),
        );
      } finally {
        setIsDeletingRateId(null);
      }
    };

  const runManagerAction = async (
    action,
    successMessage,
  ) => {
    setIsManagerSaving(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      await action();
      setNoticeMessage(successMessage);

      const [
        zonesResult,
        methodsResult,
        ratesResult,
      ] = await Promise.all([
        fetchShippingZones({
          ordering: "-priority,name",
        }),
        fetchShippingMethods({
          ordering: "display_order,name",
        }),
        fetchAdminShippingRates({
          ordering:
            "zone__name,method__display_order",
        }),
      ]);

      setZones(zonesResult.items);
      setMethods(methodsResult.items);
      setRates(ratesResult.items);
      setTotalRateCount(
        ratesResult.count,
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to save shipping configuration.",
        ),
      );

      throw error;
    } finally {
      setIsManagerSaving(false);
    }
  };

  const handleCreateZone = (
    values,
  ) =>
    runManagerAction(
      () => createShippingZone(values),
      "Shipping zone created successfully.",
    );

  const handleUpdateZone = (
    zoneCode,
    values,
  ) =>
    runManagerAction(
      () =>
        updateShippingZone(
          zoneCode,
          values,
        ),
      "Shipping zone updated successfully.",
    );

  const handleDeleteZone =
    async (zone) => {
      const confirmed =
        window.confirm(
          `Delete shipping zone "${zone.name}"? `
          + "Its related rates will also be deleted.",
        );

      if (!confirmed) {
        return;
      }

      try {
        await runManagerAction(
          () =>
            deleteShippingZone(
              zone.code,
            ),
          "Shipping zone deleted successfully.",
        );
      } catch {
        // The shared action already displays the API error.
      }
    };

  const handleCreateMethod = (
    values,
  ) =>
    runManagerAction(
      () =>
        createShippingMethod(values),
      "Shipping method created successfully.",
    );

  const handleUpdateMethod = (
    methodCode,
    values,
  ) =>
    runManagerAction(
      () =>
        updateShippingMethod(
          methodCode,
          values,
        ),
      "Shipping method updated successfully.",
    );

  const handleDeleteMethod =
    async (method) => {
      const confirmed =
        window.confirm(
          `Delete shipping method "${method.name}"? `
          + "Its related rates will also be deleted.",
        );

      if (!confirmed) {
        return;
      }

      try {
        await runManagerAction(
          () =>
            deleteShippingMethod(
              method.code,
            ),
          "Shipping method deleted successfully.",
        );
      } catch {
        // The shared action already displays the API error.
      }
    };

  return (
    <section className="admin-shipping-page">
      <div className="admin-shipping-page__heading">
        <div>
          <span className="admin-shipping-eyebrow">
            Delivery configuration
          </span>

          <h1>Shipping Rates</h1>

          <p>
            Manage delivery zones, shipping methods,
            charges, free-shipping thresholds and
            estimated delivery times.
          </p>
        </div>

        <div className="admin-shipping-heading-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() =>
              loadData({
                showRefreshState: true,
              })
            }
            disabled={isRefreshing}
          >
            <FiRefreshCw />

            {isRefreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <Link
            to="/admin/shipping-rates/create"
            className="admin-primary-button"
          >
            <FiPlus />
            Create Rate
          </Link>
        </div>
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

      <div className="admin-shipping-stats">
        <article className="admin-shipping-stat-card">
          <span>
            <FiDollarSign />
          </span>

          <div>
            <small>Total Rates</small>

            <strong>
              {Number(
                totalRateCount,
              ).toLocaleString("en-US")}
            </strong>
          </div>
        </article>

        <article className="admin-shipping-stat-card">
          <span>
            <FiTruck />
          </span>

          <div>
            <small>Active Rates</small>

            <strong>
              {activeRateCount}
            </strong>
          </div>
        </article>

        <article className="admin-shipping-stat-card">
          <span>
            <FiMapPin />
          </span>

          <div>
            <small>Shipping Zones</small>

            <strong>
              {zones.length}
            </strong>
          </div>
        </article>

        <article className="admin-shipping-stat-card">
          <span>
            <FiTruck />
          </span>

          <div>
            <small>COD Rates</small>

            <strong>
              {codRateCount}
            </strong>
          </div>
        </article>
      </div>

      <div className="admin-shipping-tabs">
        <button
          type="button"
          className={
            activeTab === "RATES"
              ? (
                "admin-shipping-tab "
                + "admin-shipping-tab--active"
              )
              : "admin-shipping-tab"
          }
          onClick={() =>
            setActiveTab("RATES")
          }
        >
          <FiDollarSign />
          Rates
        </button>

        <button
          type="button"
          className={
            activeTab === "ZONES"
              ? (
                "admin-shipping-tab "
                + "admin-shipping-tab--active"
              )
              : "admin-shipping-tab"
          }
          onClick={() =>
            setActiveTab("ZONES")
          }
        >
          <FiMapPin />
          Zones
        </button>

        <button
          type="button"
          className={
            activeTab === "METHODS"
              ? (
                "admin-shipping-tab "
                + "admin-shipping-tab--active"
              )
              : "admin-shipping-tab"
          }
          onClick={() =>
            setActiveTab("METHODS")
          }
        >
          <FiTruck />
          Methods
        </button>
      </div>

      {activeTab === "RATES" && (
        <>
          <form
            className="admin-shipping-filters"
            onSubmit={handleFilterSubmit}
          >
            <label className="admin-shipping-search">
              <FiSearch />

              <input
                type="search"
                value={filters.search}
                onChange={(event) =>
                  setFilters(
                    (current) => ({
                      ...current,
                      search:
                        event.target.value,
                    }),
                  )
                }
                placeholder={
                  "Search zone or shipping method"
                }
              />
            </label>

            <select
              value={filters.zone}
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    zone:
                      event.target.value,
                  }),
                )
              }
            >
              <option value="">
                All zones
              </option>

              {zones.map((zone) => (
                <option
                  key={zone.id}
                  value={zone.id}
                >
                  {zone.name}
                </option>
              ))}
            </select>

            <select
              value={filters.method}
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    method:
                      event.target.value,
                  }),
                )
              }
            >
              <option value="">
                All methods
              </option>

              {methods.map((method) => (
                <option
                  key={method.id}
                  value={method.id}
                >
                  {method.name}
                </option>
              ))}
            </select>

            <select
              value={filters.codAvailable}
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    codAvailable:
                      event.target.value,
                  }),
                )
              }
            >
              <option value="">
                All COD states
              </option>

              <option value="true">
                COD available
              </option>

              <option value="false">
                COD unavailable
              </option>
            </select>

            <select
              value={filters.activeState}
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    activeState:
                      event.target.value,
                  }),
                )
              }
            >
              <option value="">
                All statuses
              </option>

              <option value="true">
                Active only
              </option>

              <option value="false">
                Inactive only
              </option>
            </select>

            <select
              value={filters.ordering}
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    ordering:
                      event.target.value,
                  }),
                )
              }
            >
              <option value="zone__name,method__display_order">
                Zone and method
              </option>

              <option value="charge">
                Lowest charge
              </option>

              <option value="-charge">
                Highest charge
              </option>

              <option value="estimated_min_days">
                Fastest delivery
              </option>

              <option value="-created_at">
                Newest first
              </option>
            </select>

            <div className="admin-shipping-filter-actions">
              <button
                type="submit"
                className="admin-primary-button"
              >
                <FiFilter />
                Apply Filters
              </button>

              <button
                type="button"
                className="admin-secondary-button"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </form>

          <AdminShippingRateTable
            rates={rates}
            isLoading={isLoading}
            isUpdatingId={
              isUpdatingRateId
            }
            isDeletingId={
              isDeletingRateId
            }
            onToggleStatus={
              handleRateStatus
            }
            onDelete={
              handleRateDelete
            }
          />
        </>
      )}

      {activeTab === "ZONES" && (
        <ShippingZoneManager
          zones={zones}
          isLoading={isLoading}
          isSaving={isManagerSaving}
          onCreate={handleCreateZone}
          onUpdate={handleUpdateZone}
          onDelete={handleDeleteZone}
        />
      )}

      {activeTab === "METHODS" && (
        <ShippingMethodManager
          methods={methods}
          isLoading={isLoading}
          isSaving={isManagerSaving}
          onCreate={handleCreateMethod}
          onUpdate={handleUpdateMethod}
          onDelete={handleDeleteMethod}
        />
      )}
    </section>
  );
}


export default AdminShippingRatesPage;
