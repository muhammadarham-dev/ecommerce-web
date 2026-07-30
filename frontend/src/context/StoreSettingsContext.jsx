import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchStoreSettings,
} from "../services/storeSettingsService";

import {
  defaultStoreSettings,
  formatStoreCurrency,
  mergeStoreSettings,
} from "../utils/storeSettings";


const StoreSettingsContext =
  createContext(null);


function updateDocumentFavicon(
  faviconUrl,
) {
  if (!faviconUrl) {
    return;
  }

  let faviconElement =
    document.querySelector(
      'link[rel~="icon"]',
    );

  if (!faviconElement) {
    faviconElement =
      document.createElement("link");

    faviconElement.rel = "icon";

    document.head.appendChild(
      faviconElement,
    );
  }

  faviconElement.href = faviconUrl;
}


export function StoreSettingsProvider({
  children,
}) {
  const [
    storeSettings,
    setStoreSettings,
  ] = useState(defaultStoreSettings);

  const [
    isStoreSettingsLoading,
    setIsStoreSettingsLoading,
  ] = useState(true);

  const [
    storeSettingsError,
    setStoreSettingsError,
  ] = useState("");

  const refreshStoreSettings =
    useCallback(async () => {
      setIsStoreSettingsLoading(true);
      setStoreSettingsError("");

      try {
        const settingsData =
          await fetchStoreSettings();

        const normalizedSettings =
          mergeStoreSettings(
            settingsData,
          );

        setStoreSettings(
          normalizedSettings,
        );

        return normalizedSettings;
      } catch (error) {
        setStoreSettingsError(
          "Unable to load store settings.",
        );

        setStoreSettings(
          defaultStoreSettings,
        );

        throw error;
      } finally {
        setIsStoreSettingsLoading(false);
      }
    }, []);

  useEffect(() => {
    refreshStoreSettings().catch(
      () => {
        // Default branding remains available
        // when the API is temporarily unavailable.
      },
    );
  }, [refreshStoreSettings]);

  useEffect(() => {
    document.title =
      storeSettings.store_name
      || "ShopSphere";

    updateDocumentFavicon(
      storeSettings.favicon_url,
    );
  }, [
    storeSettings.favicon_url,
    storeSettings.store_name,
  ]);

  const formatMoney =
    useCallback(
      (value) =>
        formatStoreCurrency(
          value,
          storeSettings,
        ),
      [storeSettings],
    );

  const contextValue = useMemo(
    () => ({
      storeSettings,
      isStoreSettingsLoading,
      storeSettingsError,
      refreshStoreSettings,
      formatMoney,
    }),
    [
      storeSettings,
      isStoreSettingsLoading,
      storeSettingsError,
      refreshStoreSettings,
      formatMoney,
    ],
  );

  return (
    <StoreSettingsContext.Provider
      value={contextValue}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
}


export default StoreSettingsContext;