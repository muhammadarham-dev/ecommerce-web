import {
  useContext,
} from "react";

import RecentlyViewedContext from
  "../context/RecentlyViewedContext";


function useRecentlyViewed() {
  const context = useContext(
    RecentlyViewedContext,
  );

  if (!context) {
    throw new Error(
      "useRecentlyViewed must be used "
      + "inside RecentlyViewedProvider.",
    );
  }

  return context;
}


export default useRecentlyViewed;