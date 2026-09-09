export const REACT_VENDOR_INVALID =
  "React vendor file is invalid for the Admin Console.";
export const REACT_VENDOR_MISSING_SUSPENSE =
  "Missing Suspense named export.";
export const REACT_VENDOR_DUPLICATE_EXPORTS =
  "Duplicate Suspense exports.";
export const REACT_VENDOR_ADMIN_CONSOLE_HANG =
  "This would leave /admin stuck on 'Loading the Administration Console'.";

export function reactVendorInvalidError({ missingSuspense, duplicate }) {
  return [
    REACT_VENDOR_INVALID,
    missingSuspense ? REACT_VENDOR_MISSING_SUSPENSE : "",
    duplicate ? REACT_VENDOR_DUPLICATE_EXPORTS : "",
    REACT_VENDOR_ADMIN_CONSOLE_HANG,
  ].filter(Boolean).join(" ");
}
