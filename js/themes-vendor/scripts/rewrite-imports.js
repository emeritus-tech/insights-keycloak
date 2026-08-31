import fs from "node:fs/promises";
import path from "node:path";

const targetDir = "target/classes/theme/keycloak/common/resources/vendor";

replaceContents(
  path.join(targetDir, "react/react-jsx-runtime.production.min.js"),
  '"./react.production.min.js"',
  '"react"',
);

// Add named exports to the react vendor wrapper so Vite-built code can use
// named imports like `import { Suspense } from 'react'`.
addNamedExports(path.join(targetDir, "react/react.production.min.js"));

async function replaceContents(filePath, search, replace) {
  const file = await fs.readFile(filePath, "utf8");
  const newFile = file.replace(search, replace);
  await fs.writeFile(filePath, newFile);
}

async function addNamedExports(filePath) {
  const file = await fs.readFile(filePath, "utf8");
  if (file.includes("export const Suspense")) return; // already patched

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
