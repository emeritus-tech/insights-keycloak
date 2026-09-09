#!/usr/bin/env bash

#curl https://download.oracle.com/java/21/latest/jdk-21_linux-x64_bin.deb --output java.deb
#curl https://download.oracle.com/java/20/archive/jdk-20.0.2_linux-x64_bin.deb --output java.deb
#curl https://download.java.net/java/GA/jdk20/GPL/openjdk-20_linux-x64_bin.tar.gz --output java.tar.gz

#curl -O https://download.java.net/java/GA/jdk20/GPL/openjdk-20_linux-x64_bin.tar.gz

#curl https://download.oracle.com/java/20/archive/jdk-20_linux-x64_bin.deb --output java.deb

curl https://download.oracle.com/java/21/latest/jdk-21_linux-x64_bin.tar.gz --output jdk.tar.gz

#apt install -y libasound2 libc6-i386 libc6-x32 libfreetype6 libxi6 libxrender1 libxtst6

echo "--1--"

#dpkg -i java.deb

tar -xzvf jdk.tar.gz

export JAVA_HOME=$(pwd)/$(ls -d jdk-21* | tail -n 1)

export PATH=$JAVA_HOME/bin:$PATH

echo "--2-- $(which javac)"
echo "--3-- $(readlink -f $( which javac ))"

# Rollup already emits `export { M as Suspense, ... }`. A leftover
# `export const Children=...` is a SyntaxError and hangs the Admin Console.
# Fix every packaged themes-vendor JAR so CI/prod never ships a broken file.
fix_react_vendor_jars() {
  local vendor_path="theme/keycloak/common/resources/vendor/react/react.production.min.js"
  local named_exports="Children=e.Children,Component=e.Component,Fragment=e.Fragment,Profiler=e.Profiler,PureComponent=e.PureComponent,StrictMode=e.StrictMode,Suspense=e.Suspense,cloneElement=e.cloneElement,createContext=e.createContext,createElement=e.createElement,createRef=e.createRef,forwardRef=e.forwardRef,isValidElement=e.isValidElement,lazy=e.lazy,memo=e.memo,startTransition=e.startTransition,use=e.use,useCallback=e.useCallback,useContext=e.useContext,useDebugValue=e.useDebugValue,useDeferredValue=e.useDeferredValue,useEffect=e.useEffect,useId=e.useId,useImperativeHandle=e.useImperativeHandle,useInsertionEffect=e.useInsertionEffect,useLayoutEffect=e.useLayoutEffect,useMemo=e.useMemo,useReducer=e.useReducer,useRef=e.useRef,useState=e.useState,useSyncExternalStore=e.useSyncExternalStore,useTransition=e.useTransition,version=e.version"
  local jar work
  local found=0

  while IFS= read -r jar; do
    found=1
    work=$(mktemp -d)
    unzip -p "$jar" "$vendor_path" > "$work/react.production.min.js" || {
      echo "ERROR: $vendor_path not found in $jar"
      rm -rf "$work"
      exit 1
    }

    python3 - "$work/react.production.min.js" "$named_exports" <<'PY'
import pathlib, re, sys
path = pathlib.Path(sys.argv[1])
named = sys.argv[2]
text = path.read_text()
dup_re = re.compile(r"\n?export const Children=e\.Children[^\n]*\n?$")
has_rollup = bool(re.search(r"\bas Suspense\b", text))
has_dup = bool(dup_re.search(text))
if has_rollup and has_dup:
    text = dup_re.sub("\n", text)
elif not has_rollup and "export const Suspense" not in text:
    text = f"{text}export const {named};"
path.write_text(text)
PY

    if ! grep -qE 'as Suspense|export const Suspense' "$work/react.production.min.js"; then
      echo "ERROR: could not add Suspense named export in $jar"
      rm -rf "$work"
      exit 1
    fi
    if grep -qE 'as Suspense' "$work/react.production.min.js" && grep -q 'export const Children' "$work/react.production.min.js"; then
      echo "ERROR: could not remove duplicate React exports in $jar"
      rm -rf "$work"
      exit 1
    fi

    mkdir -p "$work/theme/keycloak/common/resources/vendor/react"
    cp "$work/react.production.min.js" "$work/$vendor_path"
    (cd "$work" && jar uf "$jar" "$vendor_path")
    echo "React vendor JAR fixed/verified: $jar"
    rm -rf "$work"
  done < <(find quarkus/server/target/lib js/themes-vendor/target -name "*keycloak-themes-vendor*.jar" 2>/dev/null)

  if [ "$found" -eq 0 ]; then
    echo "ERROR: keycloak-themes-vendor JAR not found after Maven build"
    exit 1
  fi
}

./mvnw -pl quarkus/deployment,quarkus/dist,themes, -am -DskipTests clean install 2>&1 | tee "log-$(date +%H-%M-%y-%m-%d).txt"
test "${PIPESTATUS[0]}" -eq 0

fix_react_vendor_jars

echo "Running build command for MSQL database"

java -jar quarkus/server/target/lib/quarkus-run.jar build --db=mysql --health-enabled=true --metrics-enabled=true