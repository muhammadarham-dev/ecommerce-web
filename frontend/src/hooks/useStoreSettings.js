import {
  useContext,
} from "react";

import StoreSettingsContext from
  "../context/StoreSettingsContext";


function useStoreSettings() {
  const context = useContext(
    StoreSettingsContext,
  );

  if (!context) {
    throw new Error(
      "useStoreSettings must be used "
      + "inside StoreSettingsProvider.",
    );
  }

  return context;
}


export default useStoreSettings;