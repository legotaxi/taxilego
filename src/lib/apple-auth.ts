export type AuthIntent = "passenger" | "driver";

export const AUTH_INTENT_KEY = "legoAuthIntent";

export function resolveAuthIntent(queryIntent: string | null, storedIntent: string | null): AuthIntent {
  const requestedIntent = queryIntent || storedIntent;
  return requestedIntent === "driver" ? "driver" : "passenger";
}

export type DriverRegistrationState = {
  status: string;
  bi_url: string | null;
  license_url: string | null;
  criminal_record_url: string | null;
  photo_url: string | null;
} | null;

export function needsDriverRegistration(driver: DriverRegistrationState): boolean {
  if (!driver) return true;
  const documentsComplete = Boolean(
    driver.bi_url && driver.license_url && driver.criminal_record_url && driver.photo_url,
  );
  return driver.status === "pending" && !documentsComplete;
}

export function hasAppleIdentity(metadata: Record<string, unknown> | null | undefined): boolean {
  if (!metadata) return false;
  if (metadata.provider === "apple") return true;
  return Array.isArray(metadata.providers) && metadata.providers.includes("apple");
}