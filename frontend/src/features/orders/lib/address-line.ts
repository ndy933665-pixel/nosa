import type { Locale, OrderDto } from "@nosa/contracts";

/** One readable line for the address, from the country (or governorate) down to the street. */
export function addressLine(address: OrderDto["address"], locale: Locale) {
  if (!address) return "";
  const region = address.country ?? address.governorateName?.[locale] ?? address.governorate;
  return [region, address.city, address.street, address.building, address.landmark].filter(Boolean).join(locale === "ar" ? "، " : ", ");
}
