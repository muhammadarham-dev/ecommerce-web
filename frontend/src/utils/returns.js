export const returnReasonOptions = [
  {
    value: "DAMAGED",
    label: "Damaged Product",
  },
  {
    value: "WRONG_PRODUCT",
    label: "Wrong Product",
  },
  {
    value: "DEFECTIVE",
    label: "Defective Product",
  },
  {
    value: "NOT_AS_DESCRIBED",
    label: "Product Not as Described",
  },
  {
    value: "SIZE_OR_FIT",
    label: "Size or Fit Issue",
  },
  {
    value: "CHANGED_MIND",
    label: "Changed Mind",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];


export function formatReturnValue(value) {
  if (!value) {
    return "Unknown";
  }

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}


export function getReturnStatusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replaceAll("_", "-");
}