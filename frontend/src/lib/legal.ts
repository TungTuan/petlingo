export type LegalKind = "privacy" | "terms";

export const LEGAL_EFFECTIVE_DATE = "2026-09-04";
export const LEGAL_ENTITY = import.meta.env.VITE_LEGAL_ENTITY?.trim() || "PetLingo (development build)";
export const LEGAL_CONTACT_EMAIL = import.meta.env.VITE_LEGAL_CONTACT_EMAIL?.trim() || "support@example.com";
