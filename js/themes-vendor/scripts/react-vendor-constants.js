export const TARGET_DIR = "target/classes/theme/keycloak/common/resources/vendor";
export const REACT_VENDOR_FILE = "react/react.production.min.js";
export const JSX_RUNTIME_FILE = "react/react-jsx-runtime.production.min.js";
export const JSX_RUNTIME_SEARCH = '"./react.production.min.js"';
export const JSX_RUNTIME_REPLACE = '"react"';

export const REACT_NAMED_EXPORTS = [
  "Children", "Component", "Fragment", "Profiler", "PureComponent",
  "StrictMode", "Suspense", "cloneElement", "createContext", "createElement",
  "createRef", "forwardRef", "isValidElement", "lazy", "memo",
  "startTransition", "use", "useCallback", "useContext", "useDebugValue",
  "useDeferredValue", "useEffect", "useId", "useImperativeHandle",
  "useInsertionEffect", "useLayoutEffect", "useMemo", "useReducer",
  "useRef", "useState", "useSyncExternalStore", "useTransition", "version",
];

export const DUPLICATE_EXPORT_RE = /\n?export const Children=e\.Children[^\n]*\n?$/;
export const ROLLUP_SUSPENSE_EXPORT_RE = /\bas Suspense\b/;
export const APPENDED_SUSPENSE_EXPORT = "export const Suspense";
