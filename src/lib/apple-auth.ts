export type AuthIntent = "passenger" | "driver";

export const AUTH_INTENT_KEY = "legoAuthIntent";

export function hasAppleIdentity(metadata: Record<string, unknown> | null | undefined): boolean {
  if (!metadata) return false;
  if (metadata.provider === "apple") return true;
  return Array.isArray(metadata.providers) && metadata.providers.includes("apple");
}