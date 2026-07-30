export function formatViewedDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}


export function sortRecentlyViewedItems(
  items,
  sortValue,
) {
  const sortedItems = [...items];

  if (sortValue === "MOST_VIEWED") {
    return sortedItems.sort(
      (firstItem, secondItem) =>
        Number(secondItem.view_count ?? 0)
        - Number(firstItem.view_count ?? 0),
    );
  }

  if (sortValue === "NAME_ASC") {
    return sortedItems.sort(
      (firstItem, secondItem) =>
        String(
          firstItem.product?.name ?? "",
        ).localeCompare(
          String(
            secondItem.product?.name ?? "",
          ),
        ),
    );
  }

  if (sortValue === "PRICE_LOW") {
    return sortedItems.sort(
      (firstItem, secondItem) =>
        Number(
          firstItem.product?.final_price
          ?? firstItem.product?.price
          ?? 0,
        )
        - Number(
          secondItem.product?.final_price
          ?? secondItem.product?.price
          ?? 0,
        ),
    );
  }

  if (sortValue === "PRICE_HIGH") {
    return sortedItems.sort(
      (firstItem, secondItem) =>
        Number(
          secondItem.product?.final_price
          ?? secondItem.product?.price
          ?? 0,
        )
        - Number(
          firstItem.product?.final_price
          ?? firstItem.product?.price
          ?? 0,
        ),
    );
  }

  return sortedItems.sort(
    (firstItem, secondItem) =>
      new Date(
        secondItem.viewed_at,
      ).getTime()
      - new Date(
        firstItem.viewed_at,
      ).getTime(),
  );
}