import fs from "node:fs/promises";
import path from "node:path";

const targetDir = "target/classes/theme/keycloak/common/resources/vendor";
const DUPLICATE_EXPORT_RE = /\n?export const Children=e\.Children[^\n]*\n?$/;

await replaceContents(
  path.join(targetDir, "react/react-jsx-runtime.production.min.js"),
  '"./react.production.min.js"',
  '"react"',
);

await ensureReactNamedExports(path.join(targetDir, "react/react.production.min.js"));

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
  const hasRollupNamed = /\bas Suspense\b/.test(file);
  const hasAppendedNamed = DUPLICATE_EXPORT_RE.test(file);

  if (hasRollupNamed && hasAppendedNamed) {
    file = file.replace(DUPLICATE_EXPORT_RE, "\n");
    await fs.writeFile(filePath, file);
  } else if (!hasRollupNamed && !file.includes("export const Suspense")) {
    const namedExports = [
      "Children", "Component", "Fragment", "Profiler", "PureComponent",
      "StrictMode", "Suspense", "cloneElement", "createContext", "createElement",
      "createRef", "forwardRef", "isValidElement", "lazy", "memo",
      "startTransition", "use", "useCallback", "useContext", "useDebugValue",
      "useDeferredValue", "useEffect", "useId", "useImperativeHandle",
      "useInsertionEffect", "useLayoutEffect", "useMemo", "useReducer",
      "useRef", "useState", "useSyncExternalStore", "useTransition", "version",
    ].map((n) => `${n}=e.${n}`).join(",");
    await fs.writeFile(filePath, `${file}export const ${namedExports};`);
  }

  const result = await fs.readFile(filePath, "utf8");
  const okNamed = /\bas Suspense\b/.test(result) || result.includes("export const Suspense");
  const duplicate = /\bas Suspense\b/.test(result) && DUPLICATE_EXPORT_RE.test(result);
  if (!okNamed || duplicate) {
    throw new Error(
      "React vendor file is invalid for the Admin Console. " +
        (!okNamed ? "Missing Suspense named export. " : "") +
        (duplicate ? "Duplicate Suspense exports. " : "") +
        "This would leave /admin stuck on 'Loading the Administration Console'.",
    );
  }
}
