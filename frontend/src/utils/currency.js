export function formatCurrency(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "Rs. 0";
  }

  return `Rs. ${new Intl.NumberFormat(
    "en-PK",
    {
      maximumFractionDigits: 2,
    },
  ).format(numericValue)}`;
}