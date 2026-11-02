/** A wa.me link for an international number ("+201065505685"), with an optional ready-typed message. */
export function whatsappLink(phone: string, message?: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
