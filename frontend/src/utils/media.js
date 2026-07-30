const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "";

const backendBaseUrl = apiBaseUrl.replace(
  /\/api\/?$/,
  "",
);

export function resolveMediaUrl(value) {
  if (!value) {
    return "/product-placeholder.svg";
  }

  if (
    value.startsWith("http://")
    || value.startsWith("https://")
    || value.startsWith("data:")
  ) {
    return value;
  }

  const normalizedPath = value.startsWith("/")
    ? value
    : `/${value}`;

  return `${backendBaseUrl}${normalizedPath}`;
}

export function getProductImage(product) {
  const images = Array.isArray(product?.images)
    ? product.images
    : [];

  const primaryImage =
    images.find((image) => image.is_primary)
    || images[0];

  const imageValue =
    product?.primary_image
    || primaryImage?.image
    || product?.image
    || product?.thumbnail;

  return resolveMediaUrl(imageValue);
}