/**
 * Dev-only console logging. `debugLog` binds console.log in development and
 * no-ops in production builds, so client-side debug output never ships.
 * (console.error / console.warn stay live everywhere on purpose.)
 */
export const debugLog =
  process.env.NODE_ENV !== "production" ? console.log.bind(console) : () => {};
