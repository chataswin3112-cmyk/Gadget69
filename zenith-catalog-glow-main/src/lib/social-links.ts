export const DEFAULT_INSTAGRAM_URL = "https://www.instagram.com/gadget69_tuty/";
export const DEFAULT_WHATSAPP_NUMBER = "919361586278";
export const DEFAULT_SHOP_PHONE = "9361586278";

const digitsOnly = (value?: string | null) => (value || "").replace(/[^\d]/g, "");

export const toPhoneHref = (value?: string | null) => {
  const digits = digitsOnly(value);
  return digits ? `tel:${digits}` : "";
};

export const toWhatsAppUrl = (value?: string | null) => {
  const digits = digitsOnly(value);
  return digits ? `https://wa.me/${digits}` : "";
};

export const formatPhoneDisplay = (value?: string | null) => {
  const digits = digitsOnly(value);
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return value || "";
};
