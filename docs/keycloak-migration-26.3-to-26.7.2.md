# Keycloak Migration Guide: Version 26.3.0 → 26.7.2

**By Ayush Shrivastava**

---

## 📍 Purpose

This document outlines the complete migration process to upgrade Keycloak from **v26.3.0 to v26.7.2**, including:

- MySQL collation fixes required before migration
- Code fixes for compilation errors introduced by upstream changes
- Theme and message property updates
- Admin Console frontend fix (React vendor named exports)
- Rollback plan using Google Cloud SQL Point-in-Time Recovery (PITR)

---

## 📌 Why This Migration?

Keycloak v26.7.2 introduces:

- JGroups mTLS encryption improvements
- Workflow runner task scheduling
- Organization-group relationship schema changes (Liquibase `jpa-changelog-26.6.0.xml`)
- Updated Admin Console build dependencies (React vendor module format changes)
- Various security and performance improvements over 26.3.0

---

## 🧰 Prerequisites

### System Tools
- Java 21+ (with `--enable-preview` support)
- Maven
- Git
- `pnpm` (for frontend vendor build)

### Database
- MySQL instance with full access credentials
- PITR enabled in Google Cloud SQL (for rollback)

### Permissions & Backups
- Root/sudo access
- Backup of:
  - `emeritus-theme/` directory
  - `messages_en.properties` files (login and email)
  - Full database (via PITR or snapshot)

### Disable Authentication for Lead Form

To disable authentication during deployment, set the following flags to `true`:

| Repository | Flag |
|---|---|
| Landing Page | `IS_KEYCLOAK_AUTH_DISABLED = true` |
| Growth Backend | `IS_KEYCLOAK_AUTH_DISABLED = true` |

> ⚠️ Remember to revert these flags to `false` after deployment.

---

## 🪜 Migration Strategy

| Phase | Action |
|---|---|
| DevOps Prep | Take database and instance backup |
| DB Collation Fix | Convert all tables to `utf8mb4_0900_ai_ci` |
| Code Fixes | Resolve compilation errors from upstream merge |
| Theme Migration | Update templates, messages, and JS imports |
| Frontend Fix | Patch React vendor named exports in themes-vendor |
| v26.7.2 Build | Build Keycloak and run DB migration |
| Rollback Plan | PITR to restore database state if needed |

---

## 🛠️ DevOps Prep

**Platform:** Google Kubernetes Engine (GKE)
**CD Pipeline:** Google Cloud Deploy
**Database:** Cloud SQL (MySQL)

### 🔹 Preparation — Pre-Upgrade Checklist
- Maintain a record of valid image commit IDs
- Verify Cloud Deploy releases are available and tested

### 🔹 Initiate Downtime Message
- Deploy planned downtime message for all Keycloak flows
- Stop incoming write operations to ensure data consistency

### 🔹 Database Backup — Backup Procedures
- **Primary:** Export Cloud SQL Keycloak database as `.sql` file to Google Cloud Storage
- **Secondary:** Create Cloud SQL backup snapshot for immediate recovery

### 🔹 Production Deployment
- Promote Keycloak v26.7.2 to production via Cloud Deploy
- Monitor until environment stabilizes
- Validate core functionality via pod proxy

### 🔹 Post-Deployment Actions

**Success Scenario (stable for 5+ minutes):**
- Remove downtime message
- Mark upgrade as complete

**Failure Scenario:**
- Restore database from backup snapshot
- Rollback deployment to Keycloak v26.3.0
- Remove downtime message
- Conduct root cause analysis and schedule retry

---

## 🔁 Migration Instructions

---

### 🔹 Step 1: Git Setup

Create the upgrade branch from the 26.7.2 tag:

```bash
git fetch upstream
git checkout -b upgrade-keycloak-26.7.2 26.7.2
```

Verify:
```bash
git log --oneline -1    # Should show 26.7.2 tag commit
```

---

### 🔹 Step 2: Apply Custom Changes from `main`

Copy the custom theme and build files from your `main` branch:

```bash
# Copy emeritus theme
git checkout main -- themes/src/main/resources/theme/emeritus-theme/
git checkout main -- themes/src/main/resources/META-INF/keycloak-themes.json

# Copy build artifacts
git checkout main -- build.sh
git checkout main -- Dockerfile
git checkout main -- scripts/fix-mysql-collation.sh
```

Ensure the theme structure is intact:
```
themes/src/main/resources/theme/emeritus-theme/
├── login/
│   ├── login.ftl
│   ├── template.ftl
│   ├── theme.properties
│   ├── messages/
│   │   └── messages_en.properties
│   └── resources/
│       └── js/
│           └── authChecker.js (inherited from base — do not copy)
└── email/
    ├── html/
    └── messages/
        └── messages_en.properties
```

---

### 🔹 Step 3: Fix Template — `authChecker.js` API Change

In 26.7.2, `checkCookiesAndSetTimer` was removed from `authChecker.js`. Update `template.ftl`:

**File:** `themes/src/main/resources/theme/emeritus-theme/login/template.ftl`

Replace:
```html
<#if authenticationSession??>
    <script type="module">
        import { checkCookiesAndSetTimer } from "${url.resourcesPath}/js/authChecker.js";
        checkCookiesAndSetTimer(
          "${authenticationSession.authSessionId}",
          "${authenticationSession.tabId}",
          "${url.ssoLoginInOtherTabsUrl}"
        );
    </script>
</#if>
```

With:
```html
<script type="module">
    import { startSessionPolling } from "${url.resourcesPath}/js/authChecker.js";
    startSessionPolling(
        "${url.ssoLoginInOtherTabsUrl?no_esc}"
    );
</script>
<#if authenticationSession??>
    <script type="module">
        import { checkAuthSession } from "${url.resourcesPath}/js/authChecker.js";
        checkAuthSession(
            "${authenticationSession.authSessionIdHash}"
        );
    </script>
</#if>
```

---

### 🔹 Step 4: Fix Messages — Theme Verifier Compliance

**File:** `themes/src/main/resources/theme/emeritus-theme/login/messages/messages_en.properties`

The 26.7.2 theme verifier rejects HTML entities and discouraged words. Make these replacements:

| Find | Replace | Reason |
|---|---|---|
| `&laquo;` | `\u00AB` | HTML entities not allowed; use UTF-8 |
| `&raquo;` | `\u00BB` | HTML entities not allowed; use UTF-8 |
| `blacklisted` | `in the blocklist` | Discouraged terminology |

Ensure the custom "Contact Us" fallback keys are present:
```properties
contactUsForPasswordReset=Contact Us
contactUsEmail=insightsupport@emeritus.org
```

---

### 🔹 Step 5: Fix Admin Console — React Vendor Named Exports

In 26.7.2, the Admin Console's JS bundle uses named imports from `react` (e.g., `Suspense`, `useState`), but the bundled vendor file only provides a default export. Two permanent fixes are required:

**Fix 1:** `js/themes-vendor/scripts/rewrite-imports.js` — append named exports after rollup:

```javascript
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
```

Call it from the `replaceContents` block:
```javascript
addNamedExports(path.join(targetDir, "react/react.production.min.js"));
```

**Fix 2:** `js/themes-vendor/package.json` — add `scripts/` to wireit watched files so cache is invalidated on changes:

```json
"files": [
  "rollup.config.js",
  "scripts",
  "src"
]
```

> ⚠️ Without Fix 2, a fresh `mvn clean install` will use the wireit cache and skip the `rewrite-imports.js` step, reverting the fix.

---

### 🔹 Step 6: Fix Protolock Plugin — Prevent Build Timeout

The `proto-schema-compatibility-maven-plugin` fetches remote `.proto.lock` files from GitHub during builds, causing network timeouts.

**File:** `model/infinispan/pom.xml`

Remove the `<remoteLockFiles>` block from the plugin configuration entirely.

**File:** `build.sh`

Add `-Dprotolock.skip=true` to the Maven command:
```bash
./mvnw -pl quarkus/deployment,quarkus/dist,themes, -am -DskipTests -Dprotolock.skip=true clean install
```

---

### 🔹 Step 8: Remove Unnecessary GitHub Actions Workflows

Delete all upstream CI workflows that are not needed in the fork:

```bash
rm -f .github/workflows/*.yml
```

---

### 🔹 Step 7: Fix MySQL Collation (Critical — Before Running Keycloak)

Keycloak 26.6.0+ adds an `ORG_ID` foreign key on `KEYCLOAK_GROUP`. If your database was originally created with `utf8mb3` collation, this Liquibase migration will fail with:

```
Error 3780: Referencing column 'ORG_ID' and referenced column 'ID' in foreign key constraint 'FK_GROUP_ORGANIZATION' are incompatible.
```

Run the collation fix script **before** starting Keycloak for the first time:

```bash
./scripts/fix-mysql-collation.sh
```

With custom credentials:
```bash
./scripts/fix-mysql-collation.sh -h 127.0.0.1 -P 3306 -u root -p yourpassword -d keycloak
```

The script will:
1. Generate `ALTER TABLE ... CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci` for all tables
2. Run them with `FOREIGN_KEY_CHECKS=0` (safe, no data is modified)
3. Clear any failed Liquibase changeset record for `26.6.0-org-group-relationship`

> ⚠️ If you have already started Keycloak and the migration partially failed, also run:
> ```sql
> USE keycloak;
> DELETE FROM DATABASECHANGELOG
>   WHERE ID = '26.6.0-org-group-relationship'
>     AND FILENAME = 'META-INF/jpa-changelog-26.6.0.xml';
> ```

---

### 🔹 Step 8: Build Keycloak v26.7.2

```bash
sudo ./mvnw -pl quarkus/deployment,quarkus/dist,themes, -am -DskipTests -Dprotolock.skip=true clean install
```

> The `themes` module includes `js/themes-vendor`. On a fresh build (empty wireit cache), it rebuilds the react vendor file with the named exports fix applied.

---

### 🔹 Step 9: Initialize DB with v26.7.2 Build Mode

```bash
sudo java -jar quarkus/server/target/lib/quarkus-run.jar build \
  --db=mysql \
  --health-enabled=true \
  --metrics-enabled=true
```

---

### 🔹 Step 10: Run Keycloak with Snapshot-Based Migration

```bash
sudo java \
  -Dkc.home.dir=/path/to/insights-keycloak/quarkus/server/target \
  --enable-preview \
  -jar quarkus/server/target/lib/quarkus-run.jar start \
  --spi-migration-strategy=update \
  --db=mysql \
  --db-url-host=127.0.0.1 \
  --db-url-database=keycloak \
  --db-username=root \
  --hostname=localhost \
  --hostname-strict=false \
  --http-enabled=true \
  --spi-datastore-legacy-allow-migrate-existing-database-to-snapshot=true
```

> ⚠️ `-Dkc.home.dir` must be set explicitly on the **first run**. Without it, Keycloak cannot persist its configuration hash, causing it to loop on "Changes detected in configuration" on every restart.

Expected successful startup log:
```
INFO  Keycloak 26.7.2 on JVM (powered by Quarkus 3.33.3.1) started in ~12s. Listening on: http://0.0.0.0:8080
```

---

### 🔹 Step 11: Verify Admin Console

1. Open `http://localhost:8080/admin` in an **incognito window** (avoids cached JS)
2. The console should load without getting stuck on "Loading the Administration Console"
3. If it still hangs, open browser DevTools → Console tab and check for:
   - `Uncaught SyntaxError: The requested module 'react' does not provide an export named 'Suspense'`
   - If this error appears, the React named exports fix from Step 5 did not apply — see the **Troubleshooting** section below

---

## 🔧 Troubleshooting

### Admin Console stuck on "Loading the Administration Console"

**Symptom:** `Uncaught SyntaxError: The requested module 'react' does not provide an export named 'Suspense'`

**Cause:** Wireit used a cached build output and skipped `rewrite-imports.js`.

**Fix (quickest path — patch the running JAR in place):**

```bash
# 1. Locate the vendor JAR
JAR=$(find quarkus/server/target/lib -name "keycloak-themes-vendor-26.7.2.jar" | head -1)

# 2. Extract react vendor file
mkdir -p /tmp/kc-patch/theme/keycloak/common/resources/vendor/react
cd /tmp/kc-patch
jar xf "$OLDPWD/$JAR" theme/keycloak/common/resources/vendor/react/react.production.min.js

# 3. Check if already patched
grep -q "Suspense" theme/keycloak/common/resources/vendor/react/react.production.min.js && echo "Already patched" && exit 0

# 4. Append named exports
cat >> theme/keycloak/common/resources/vendor/react/react.production.min.js << 'EOF'
export const Children=e.Children,Component=e.Component,Fragment=e.Fragment,Profiler=e.Profiler,PureComponent=e.PureComponent,StrictMode=e.StrictMode,Suspense=e.Suspense,cloneElement=e.cloneElement,createContext=e.createContext,createElement=e.createElement,createRef=e.createRef,forwardRef=e.forwardRef,isValidElement=e.isValidElement,lazy=e.lazy,memo=e.memo,startTransition=e.startTransition,use=e.use,useCallback=e.useCallback,useContext=e.useContext,useDebugValue=e.useDebugValue,useDeferredValue=e.useDeferredValue,useEffect=e.useEffect,useId=e.useId,useImperativeHandle=e.useImperativeHandle,useInsertionEffect=e.useInsertionEffect,useLayoutEffect=e.useLayoutEffect,useMemo=e.useMemo,useReducer=e.useReducer,useRef=e.useRef,useState=e.useState,useSyncExternalStore=e.useSyncExternalStore,useTransition=e.useTransition,version=e.version;
EOF

# 5. Repack JAR
jar uf "$OLDPWD/$JAR" theme/keycloak/common/resources/vendor/react/react.production.min.js
cd -

# 6. Clear Keycloak's gzip cache
find quarkus/server/target -name "*.gz" \
  -path "*/vendor/react/*" -delete 2>/dev/null || true
```

Then restart Keycloak without rebuilding.

---

## 🔙 Rollback: Google Cloud SQL (PITR)

If migration fails, use Point-in-Time Recovery.

### Prerequisites
- PITR must be enabled **before** migration begins

### To Roll Back

1. Identify the point-in-time before migration started
2. Restore a new instance from PITR:

```bash
gcloud sql instances restore-backup INSTANCE_ID \
  --restore-instance=NEW_INSTANCE_ID \
  --point-in-time="2026-09-01T05:00:00Z"
```

3. Point Keycloak v26.3.0 to the restored instance
4. Retest on staging before redeploying to production

---

## 📊 Impact

All clients dependent on Keycloak will be affected. Expected downtime: **~30 minutes**. During this time, Keycloak token generation APIs will not work. Growth APIs will continue to work since authentication bypass is enabled during migration.

| Module / Client | Impact | Impact Explanation | POC |
|---|---|---|---|
| Insights | High | Login page will not work; Insights is unusable during migration | Hitesh (hithesh.uchil@emeritus.org) |
| Landing Pages | Low | Token generation down, but APIs work — no functional impact | Malar (malarvizhi.anandaselvakumar@emeritus.org) |
| Learners | Low | Token generation down, but APIs work — no functional impact | Sudhakar (sudhakar.chintu@emeritus.org) |
| Enrollments | Low | Admin access provision/deprovision won't have major impact | Mani (mani.madalaimuthu@emeritus.org) |
| Payments | Low | Order/payment service impact minimal (not live in prod yet) | Rohit (rohit.sharma@emeritus.org) |
| Payments (PURL) | Medium | PURL creation API will be down | Rohit (rohit.sharma@emeritus.org) |
| Website (Emeritus.org) | Low | Token generation down, but APIs work | Palivela Srikanth (palivela.srikanth@emeritus.org) |
| Salesforce | Low | Program/pricing API cron jobs may be impacted | Prajaktha (prajakta.deshmukh@emeritus.org) |

---

## 📋 Quick Reference Checklist

- [ ] Disable `IS_KEYCLOAK_AUTH_DISABLED` flags
- [ ] Take Cloud SQL backup
- [ ] Run `fix-mysql-collation.sh`
- [ ] Apply theme changes (template.ftl, messages_en.properties)
- [ ] Apply React vendor fix (rewrite-imports.js + package.json)
- [ ] Fix compilation errors (DeleteAccount.java, Picocli.java, KubernetesPatchConfigurator.java)
- [ ] Remove `.github/workflows/*.yml`
- [ ] Build with `mvnw ... -Dprotolock.skip=true`
- [ ] Run `kc.jar build --db=mysql`
- [ ] Start Keycloak with `-Dkc.home.dir` and `--spi-datastore-legacy-allow-migrate-existing-database-to-snapshot=true`
- [ ] Verify Admin Console loads in incognito
- [ ] Re-enable `IS_KEYCLOAK_AUTH_DISABLED` flags
- [ ] Remove downtime message
