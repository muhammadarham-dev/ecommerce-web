export const defaultStoreSettings = {
  store_name: "ShopSphere",
  tagline: "Premium products for modern living.",
  description:
    "Discover quality products with secure payments and dependable delivery.",
  logo_url: null,
  favicon_url: null,
  support_email: "",
  support_phone: "",
  whatsapp_number: "",
  address: "",
  city: "",
  province: "",
  country: "Pakistan",
  postal_code: "",
  currency_code: "PKR",
  currency_symbol: "Rs.",
  tax_percentage: "0.00",
  return_window_days: 7,
  maintenance_mode: false,
  maintenance_message:
    "The store is temporarily unavailable. Please try again later.",
  allow_cash_on_delivery: true,
  allow_bank_transfer: true,
  facebook_url: "",
  instagram_url: "",
  youtube_url: "",
  linkedin_url: "",
  twitter_url: "",
};


export function mergeStoreSettings(
  settings,
) {
  return {
    ...defaultStoreSettings,
    ...(settings ?? {}),
  };
}


export function formatStoreCurrency(
  value,
  settings = defaultStoreSettings,
) {
  const numericValue = Number(value ?? 0);

  const safeValue = Number.isFinite(
    numericValue,
  )
    ? numericValue
    : 0;

  const formattedNumber =
    new Intl.NumberFormat(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(safeValue);

  const currencySymbol =
    settings?.currency_symbol
    || settings?.currency_code
    || "Rs.";

  return `${currencySymbol} ${formattedNumber}`;
}


export function formatStoreAddress(
  settings,
) {
  if (!settings) {
    return "";
  }

  return [
    settings.address,
    settings.city,
    settings.province,
    settings.postal_code,
    settings.country,
  ]
    .filter(Boolean)
    .join(", ");
}


export function buildWhatsAppUrl(
  phoneNumber,
) {
  const normalizedNumber =
    String(phoneNumber ?? "")
      .replace(/\D/g, "");

  if (!normalizedNumber) {
    return "";
  }

  return `https://wa.me/${normalizedNumber}`;
}


export function getEnabledPaymentMethods(
  settings,
) {
  const methods = [];

  if (
    settings?.allow_cash_on_delivery
  ) {
    methods.push({
      value: "CASH_ON_DELIVERY",
      label: "Cash on Delivery",
    });
  }

  if (
    settings?.allow_bank_transfer
  ) {
    methods.push({
      value: "BANK_TRANSFER",
      label: "Bank Transfer",
    });
  }

  return methods;
}