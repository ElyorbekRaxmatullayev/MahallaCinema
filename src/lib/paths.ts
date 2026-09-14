// Must match `basePath` in next.config.ts. Kept as a constant since Next.js
// requires basePath to be a build-time value, not read from process.env at runtime.
export const BASE_PATH = "/cinema";

/**
 * Prefixes a locally-uploaded file path (e.g. "/uploads/x.jpg") with the app's
 * basePath so <Image>/<img> tags actually resolve. Next.js does NOT auto-apply
 * basePath to raw src values (only next/link and the router do) - this is the
 * same class of bug that broke /api/upload before it became a Server Action.
 * Absolute URLs (external posters) and already-prefixed paths pass through unchanged.
 */
export function withBasePath(path?: string | null): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith(BASE_PATH + "/")) return path;
  return `${BASE_PATH}${path}`;
}
