import fs from "node:fs/promises";
import path from "node:path";
import {
  APPENDED_SUSPENSE_EXPORT,
  DUPLICATE_EXPORT_RE,
  JSX_RUNTIME_FILE,
  JSX_RUNTIME_REPLACE,
  JSX_RUNTIME_SEARCH,
  REACT_NAMED_EXPORTS,
  REACT_VENDOR_FILE,
  ROLLUP_SUSPENSE_EXPORT_RE,
  TARGET_DIR,
} from "./react-vendor-constants.js";
import { reactVendorInvalidError } from "./react-vendor-messages.js";

await replaceContents(
  path.join(TARGET_DIR, JSX_RUNTIME_FILE),
  JSX_RUNTIME_SEARCH,
  JSX_RUNTIME_REPLACE,
);

await ensureReactNamedExports(path.join(TARGET_DIR, REACT_VENDOR_FILE));

async function replaceContents(filePath, search, replace) {
  const file = await fs.readFile(filePath, "utf8");
  const newFile = file.replace(search, replace);
  await fs.writeFile(filePath, newFile);
}

/**
 * Admin Console imports `import { Suspense } from 'react'`.
 * Rollup usually already emits `export { M as Suspense, ... }`.
 * An extra `export const Suspense=...` is a SyntaxError and leaves the UI
 * on "Loading the Administration Console".
 */
async function ensureReactNamedExports(filePath) {
  let file = await fs.readFile(filePath, "utf8");
  const hasRollupNamed = ROLLUP_SUSPENSE_EXPORT_RE.test(file);
  const hasAppendedNamed = DUPLICATE_EXPORT_RE.test(file);

  if (hasRollupNamed && hasAppendedNamed) {
    file = file.replace(DUPLICATE_EXPORT_RE, "\n");
    await fs.writeFile(filePath, file);
  } else if (!hasRollupNamed && !file.includes(APPENDED_SUSPENSE_EXPORT)) {
    const namedExports = REACT_NAMED_EXPORTS.map((n) => `${n}=e.${n}`).join(",");
    await fs.writeFile(filePath, `${file}export const ${namedExports};`);
  }

  const result = await fs.readFile(filePath, "utf8");
  const okNamed = ROLLUP_SUSPENSE_EXPORT_RE.test(result) || result.includes(APPENDED_SUSPENSE_EXPORT);
  const duplicate = ROLLUP_SUSPENSE_EXPORT_RE.test(result) && DUPLICATE_EXPORT_RE.test(result);
  if (!okNamed || duplicate) {
    throw new Error(reactVendorInvalidError({
      missingSuspense: !okNamed,
      duplicate,
    }));
  }
}
