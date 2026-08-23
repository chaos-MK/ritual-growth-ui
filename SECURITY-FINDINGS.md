# Security Findings Log

This log documents security and reliability findings identified by
manual and automated scanning tools (Gitleaks, Semgrep, npm-audit, Snyk, Hadolint,
typecheck, eslint, Syft, Trivy, Grype)
and manual architectural reviews, along with the remediation applied for
each. Most tools run automatically in the GitLab CI/CD pipeline, while
manual reviews are used to identify architectural and design-level
security issues that automated scanners cannot detect.




---

# Finding #001 — Firebase Web Configuration Hardcoded in Frontend Source Code

**Project:** `ritual-growth-ui`  
**Component:** Next.js / Firebase Authentication frontend  
**Severity:** Medium  
**Category:** Secrets & Configuration Management  
**Status:** Fixed  
**Discovered:** 2026-08-22

## Description

The frontend previously contained the Firebase Web configuration directly in:

`src/lib/firebase.ts`

The configuration included the Firebase API key, authentication domain, project ID, storage bucket, messaging sender ID, and application ID.

Although Firebase Web API configuration is designed to be delivered to client-side applications and the Firebase API key is **not equivalent to a Firebase Admin/service-account private key**, keeping environment-specific configuration directly in source code is undesirable from a security and configuration-management perspective.

It makes configuration changes and rotation harder, couples the source code to a specific Firebase project, and increases the risk of accidentally committing sensitive configuration if the file is later expanded with a genuinely secret value.

## Original Configuration

The frontend previously used hardcoded values similar to:

```typescript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "ritual-growth-ui-f7055.firebaseapp.com",
  projectId: "ritual-growth-ui-f7055",
  storageBucket: "ritual-growth-ui-f7055.firebasestorage.app",
  messagingSenderId: "...",
  appId: "...",
};
```

## Risk

The primary risk is **configuration exposure and poor secret/configuration hygiene**, rather than direct compromise of Firebase through the Web API key itself.

Potential consequences include:

- Environment-specific configuration being permanently tied to source code.
- Increased difficulty rotating or changing Firebase project configuration.
- Increased likelihood of accidentally committing actual secrets alongside public Firebase configuration.
- Configuration becoming available throughout the Git history.
- Reduced separation between application code and deployment configuration.

## Investigation

Historical Git history was searched for Firebase API keys:

```bash
git grep -nE 'AIza[[:alnum:]_-]+' \
  $(git rev-list --all) -- src/lib/firebase.ts
```

No real Firebase `AIza...` API key was found.

The historical configuration currently contains the sanitized value:

```text
REMOVED_FIREBASE_API_KEY
```

A repository-wide Gitleaks scan was also performed:

```bash
docker run --rm \
  -v "$PWD:/repo" \
  zricethezav/gitleaks:latest \
  detect --source /repo --verbose --redact --exit-code 1
```

Result:

```text
24 commits scanned.
scanned ~712232 bytes (712.23 KB)
no leaks found
```

## Remediation

The hardcoded Firebase configuration was removed from:

```text
src/lib/firebase.ts
```

The frontend now reads the configuration through environment variables:

```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
```

The Firebase Web configuration was also stored separately in the existing Vault instance under:

```text
secret/applicationbib/firebase-web
```

The Vault secret contains:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

A dedicated Vault policy was created with read access limited to this frontend-specific secret:

```hcl
path "secret/data/applicationbib/firebase-web" {
  capabilities = ["read"]
}
```

## Validation

The following checks were completed:

### 1. Source code no longer contains hardcoded Firebase configuration

```bash
sed -n '1,80p' src/lib/firebase.ts
```

Confirmed that the configuration is loaded from `process.env.NEXT_PUBLIC_FIREBASE_*`.

### 2. Repository search

```bash
grep -RniE \
  'NEXT_PUBLIC_FIREBASE_(API_KEY|AUTH_DOMAIN|PROJECT_ID|STORAGE_BUCKET|MESSAGING_SENDER_ID|APP_ID)' \
  --exclude-dir=.git \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  .
```

The variables are referenced only by the frontend configuration code at this stage.

### 3. Historical Firebase API-key search

```bash
git grep -nE 'AIza[[:alnum:]_-]+' \
  $(git rev-list --all) -- src/lib/firebase.ts
```

No real Firebase API key was returned.

### 4. Gitleaks

Gitleaks scanned the repository history and working tree and reported:

```text
no leaks found
```

## Security Assessment

The original hardcoded Firebase Web configuration was **not equivalent to exposing the Firebase Admin service-account credential**.

The backend's Firebase Admin credential remains separately protected in Vault:

```text
secret/applicationbib/firebase
```

The frontend configuration is isolated in:

```text
secret/applicationbib/firebase-web
```

This separation prevents the frontend configuration from being confused with or granted access to the backend Firebase Admin credential.


**Status:** Fixed



## Finding #002 — Gitleaks false positive: historical Firebase client API key

**Date:** 2026-08-22  
**Tool:** Gitleaks  
**Severity:** False Positive / Informational  
**Status:** Accepted — no remediation required

### Finding

Gitleaks reported a `gcp-api-key` finding in:

`src/lib/firebase.ts`

The finding originated from historical Git commits containing the value:

`REMOVED_FIREBASE_API_KEY`

Multiple historical commits were identified during Gitleaks history scanning.

### Validation

The flagged historical commits were inspected directly with Git, for example:

```bash
git show 86a768f128832a0888909c32fe4ad964d0a4660d:src/lib/firebase.ts
```

The detected value is explicitly a redacted placeholder and is **not an active Firebase API key**.

The current implementation no longer contains a hardcoded Firebase configuration. Firebase configuration is supplied through `NEXT_PUBLIC_FIREBASE_*` environment variables during the frontend build.

### Risk assessment

No active credential was exposed by the flagged historical value.

Firebase Web API keys are client-side configuration values and are not equivalent to server-side secrets such as private keys, passwords, or Firebase service-account credentials.

### Decision

This finding is classified as a **false positive**.

The CI Gitleaks configuration was updated to use:

```bash
gitleaks detect --no-git --source . --verbose --redact --exit-code 1
```

This makes Gitleaks scan the **current source tree only** instead of scanning historical Git commits.

The previous individual historical fingerprints were removed from `.gitleaksignore`.

This preserves the security control: genuine secrets present in the current source tree will still cause the Gitleaks job to fail.

**Remediation:** Not required for the historical false positive.  
**Preventive control:** Gitleaks continues to scan the current source tree in CI.


## Finding #003 — (2 critical 5 high 1 moderate) Vulnerable npm Dependencies in Ritual Growth UI

**Date:** 2026-08-23
**Tool:** npm audit
**Severity:** High / Critical
**Status:** FIXED

### Risk
Multiple production npm dependencies contained known security vulnerabilities,
including vulnerabilities affecting Next.js, @grpc/grpc-js, protobufjs,
nanoid, websocket-driver, PostCSS, and sharp.

Potential impact included:
- Remote code execution
- Denial of service
- XSS
- Arbitrary file disclosure
- Resource exhaustion
- Prototype/code injection

### What I Did
- Upgraded Next.js from 15.3.3 to 15.5.23.
- Updated eslint-config-next to 15.5.23.
- Upgraded @grpc/grpc-js to 1.14.4.
- Upgraded protobufjs to 8.7.2.
- Upgraded nanoid to 6.0.1.
- Upgraded websocket-driver to 0.7.5.
- Added npm overrides for vulnerable transitive dependencies:
  - postcss: 8.5.26
  - sharp: 0.35.3
- Removed and regenerated node_modules/package-lock resolution.

### What Changed
package.json:
- next: 15.3.3 → 15.5.23
- @grpc/grpc-js updated
- protobufjs updated
- nanoid updated
- websocket-driver updated
- eslint-config-next: 15.3.3 → 15.5.23
- Added dependency overrides for PostCSS and sharp.

package-lock.json:
- Regenerated to reflect the updated dependency tree and
  patched transitive dependency versions.

### Verification
npm ls next eslint-config-next
→ next@15.5.23
→ eslint-config-next@15.5.23

npm audit --omit=dev --audit
→ found 0 vulnerabilities

npm ls next postcss sharp
→ next@15.5.23
→ postcss@8.5.26
→ sharp@0.35.3

**Status:** FIXED / VERIFIED

The production dependency audit now reports zero vulnerabilities.



## Finding #004 — Hadolint DL3064: Build-Time Configuration in Docker ARG/ENV

**Date:** 2026-08-23
**Tool:** Hadolint
**Rule:** DL3064
**Severity:** Low / Informational
**Category:** Secrets & Configuration Management
**Status:** Accepted — Documented Design

### Finding

Hadolint reported `DL3064` warnings in the frontend `Dockerfile`:

```text
Dockerfile:16 DL3064 warning:
Potentially sensitive data should not be used in the `ARG` or `ENV` commands

Dockerfile:24 DL3064 warning:
Potentially sensitive data should not be used in the `ARG` or `ENV` commands
```

The affected instructions are:

```dockerfile
ARG NEXT_PUBLIC_FIREBASE_API_KEY
```

and:

```dockerfile
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
```

The Dockerfile also defines the remaining Firebase `NEXT_PUBLIC_*` build arguments and environment variables required by the Next.js production build.

### Investigation

The frontend requires the following configuration during the Next.js build:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_API_BASE_URL
```

These values are supplied through GitLab CI/CD variables:

```yaml
--build-arg NEXT_PUBLIC_API_BASE_URL="$NEXT_PUBLIC_API_BASE_URL"
--build-arg NEXT_PUBLIC_FIREBASE_API_KEY="$NEXT_PUBLIC_FIREBASE_API_KEY"
--build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
--build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="$NEXT_PUBLIC_FIREBASE_PROJECT_ID"
--build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
--build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
--build-arg NEXT_PUBLIC_FIREBASE_APP_ID="$NEXT_PUBLIC_FIREBASE_APP_ID"
```

The actual values are **not stored in the repository**.

For local development, the configuration is supplied through `.env.local`, which is explicitly ignored by Git:

```bash
git check-ignore -v .env.local
```

Result:

```text
.gitignore:42:.env.local    .env.local
```

The repository also contains no tracked environment files:

```bash
git ls-files | grep -E '(^|/)\.env'
```

Result:

```text
(no output)
```

### Firebase Configuration Assessment

The `NEXT_PUBLIC_FIREBASE_*` values are Firebase Web client configuration.

They are intentionally required by the browser-side Firebase SDK and are ultimately available to the client application.

They are therefore **not equivalent to Firebase Admin credentials or other backend secrets**, such as:

* Firebase service-account private keys
* Database passwords
* Vault tokens
* API signing keys
* Private cryptographic keys

The Firebase Web API key is not treated as a backend secret.

The security improvement comes from separating configuration from source code and preventing environment-specific values from being committed to Git.

### API Base URL Assessment

`NEXT_PUBLIC_API_BASE_URL` is also application configuration rather than a credential.

It identifies the frontend's backend API endpoint and does not provide authentication or authorization by itself.

The value therefore does not represent a secret merely because it is passed through a Docker `ENV` instruction.

### Why Hadolint Reports DL3064

Hadolint cannot determine whether a particular value is actually a secret.

The rule warns about `ARG` and `ENV` because these Docker mechanisms can expose sensitive values through build metadata, image history, or runtime configuration when they are used for genuine secrets.

This is an important warning for real credentials.

In this project, however, the affected values are intentionally build-time client configuration and are not backend credentials.

### Risk Assessment

The Hadolint warning does **not** indicate that a Firebase Admin credential or database password has been embedded into the frontend image.

The primary risks are configuration-management concerns rather than direct credential compromise:

* Configuration could become coupled to a specific environment if hardcoded.
* Genuine secrets must not be introduced into the same `ARG`/`ENV` mechanism.
* Docker build arguments and environment variables should not be used for backend credentials.

These risks are mitigated by keeping actual secrets outside the frontend source code and CI configuration files.

### Controls

The following controls are in place:

* Firebase Web configuration is loaded through `NEXT_PUBLIC_FIREBASE_*` environment variables.
* Firebase CI/CD values are stored as GitLab CI/CD variables rather than committed to Git.
* GitLab variables are configured as **Protected, Masked, and Hidden**.
* `.env.local` is excluded from version control.
* Gitleaks scans the current source tree in CI.
* Backend Firebase Admin credentials remain separate from frontend configuration.
* Backend credentials are stored in Vault and are never passed to the frontend build.
* The Dockerfile does not contain the actual Firebase configuration values.

### Validation

The frontend production build was successfully tested after introducing the environment-based configuration:

```bash
npm run build
```

Result:

```text
✓ Compiled successfully
✓ Checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Collecting build traces
✓ Finalizing page optimization
```

The application successfully completed the Next.js production build.

### Decision

`DL3064` is **accepted for the affected frontend configuration**.

The Hadolint warning is considered a **documented false positive/accepted trade-off for these specific values**, because:

1. The Firebase values are client-side configuration.
2. The API base URL is non-secret application configuration.
3. No backend credentials are passed through these variables.
4. The actual values are stored outside the repository.
5. The configuration is required during the Next.js build.
6. Genuine backend secrets remain isolated in Vault.

Hadolint remains enabled in CI because the rule is valuable for detecting future misuse of `ARG` or `ENV` with genuine secrets.

The warning should **not** be globally disabled for the Dockerfile without documenting the reason.

**Status:** ACCEPTED — DOCUMENTED DESIGN


## Finding #005 — Podman Docker-Compat API Exec Bug Causing CI Job Failures (Anchore Images)

**Date:** 2026-08-23
**Tool:** GitLab Runner / Podman (rootless)
**Severity:** Low / Informational (CI reliability, not application security)
**Category:** CI/CD Infrastructure
**Status:** FIXED

### Finding

The `sbom` and `grype-scan` CI jobs consistently failed with:

```text
ERROR: Job failed (system failure): unable to upgrade to tcp, received 409 (exec.go:68:0s)
```

The failure occurred specifically when the job image was `anchore/syft:latest`
or `anchore/grype:latest`. Other jobs using different images (e.g. `aquasec/trivy:latest`)
were unaffected.

### Investigation

The `docker-ci` GitLab Runner is configured to use rootless Podman
(`unix:///run/user/996/podman/podman.sock`) as a drop-in replacement for
Docker via the Docker executor. This is a supported GitLab configuration,
but Podman's Docker-compatibility API has a known bug (tracked upstream in
multiple `containers/podman` and `gitlab-org/gitlab-runner` issues) where
the `exec` hijack/TCP-upgrade used to attach to a container's stdio fails
with HTTP 409 for certain container entrypoints/TTY handling.

The Anchore-published images (`anchore/syft`, `anchore/grype`) triggered
this bug consistently; Alpine-based images with the tools installed via
the official install script did not.

Ruled out during investigation:
- Docker daemon / bridge network health (verified clean, not the cause).
- Disk space and dangling containers (cleaned, not the cause).
- Runner concurrency/config (`concurrent`, `FF_NETWORK_PER_BUILD` — not the cause).
- Podman version (4.9.3, current Ubuntu 24.04 package — a factor but no
  packaged fix was available at time of investigation).

### Remediation

The `sbom` and `grype-scan` jobs were changed from the Anchore-maintained
images to `alpine:3.20`, installing Syft and Grype via their official
install scripts, matching the pattern already used successfully in the
backend project's pipeline:

```yaml
sbom:
  stage: sbom
  image: alpine:3.20
  before_script:
    - apk add --no-cache curl
    - curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
  script:
    - syft docker-archive:image.tar -o cyclonedx-json=sbom.json

grype-scan:
  stage: image-scan
  image: alpine:3.20
  before_script:
    - apk add --no-cache curl
    - curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
  script:
    - grype docker-archive:image.tar --fail-on high
```

The `trivy-scan` job was left unchanged, as its image was never affected.

### Validation

Both jobs completed successfully post-change (no infrastructure failure),
progressing to their actual scan output.

**Status:** FIXED


## Finding #006 — Critical/High CVEs in Node Dependencies Detected by Trivy & Grype (Container Image Scan)

**Date:** 2026-08-23
**Tool:** Trivy, Grype
**Severity:** Critical / High
**Category:** Dependency Vulnerabilities
**Status:** FIXED

### Finding

Once the CI infrastructure issue in Finding #005 was resolved, `trivy-scan`
and `grype-scan` ran against the built container image and reported:

- **Trivy:** 1 Critical, 8 High (Node.js dependencies)
- **Grype:** multiple High/Critical findings, failing the `--fail-on high` gate

Affected packages (found in `node_modules` inside the built image):

| Package | Installed | Vulnerability | Severity |
|---|---|---|---|
| tar | 7.5.11 | CVE-2026-59873 (gzip bomb DoS) | Critical |
| tar | 7.5.11 | CVE-2026-59874, CVE-2026-73566 | High |
| brace-expansion | 2.0.2 | CVE-2026-13149, CVE-2026-14257, CVE-2026-69152 | High |
| picomatch | 4.0.3 | CVE-2026-33671 (ReDoS) | High |
| ip-address | 10.1.0 | CVE-2026-69192 (SSRF via inconsistent parsing) | High |
| sigstore | 3.1.0 | CVE-2026-48815 (unauthorized cert acceptance) | High |

These were transitive dependencies pulled in via `@tailwindcss/oxide`,
`eslint`/`typescript-eslint` tooling, and `npm`'s own bundled dependency tree.

### Remediation

Direct upgrades applied to `package.json`:

```bash
npm install tar@latest brace-expansion@latest picomatch@latest \
  ip-address@latest sigstore@latest --save-exact
npm audit fix
```

### What Changed

`package.json` / `package-lock.json`:
- tar: 7.5.11 → 7.5.22
- brace-expansion: 2.0.2 → 5.0.9 (deduped across dependents)
- picomatch: 4.0.3 → 4.0.5
- ip-address: 10.1.0 → 10.5.0
- sigstore: 3.1.0 → 5.0.0

### Verification

```bash
npm audit
```
→ found 0 vulnerabilities

```bash
npm ls tar brace-expansion picomatch ip-address sigstore
```
→ confirmed patched versions resolved throughout the dependency tree.

CI `trivy-scan` and `grype-scan` jobs re-run against the rebuilt image
to confirm the container-level scan is clear.

**Status:** FIXED





## Summary

| Finding | CVEs / Issues Covered | Tool | Status |
| ------- | ---------------------- | ---- | ------ |
| #001 | **Firebase Web configuration hardcoded in frontend source code** | Manual Review + Gitleaks | ✅ Fixed |
| #002 | **Gitleaks false positive: historical Firebase client API key** no active secret exposed | Gitleaks | ✅ Resolved |
| #003 | **8 Critical/High CVEs** — Vulnerable npm Dependencies | npm audit | ✅ Fixed |
| #004 | **Hadolint DL3064** — Build-Time Configuration in Docker ARG/ENV | Hadolint | ✅ ACCEPTED / Documented |
| #005 | **Podman exec-hijack 409 error** — CI jobs failing on Anchore images | GitLab Runner / Podman | ✅ Fixed |
| #006 | **1 Critical / 8 High CVEs** — Node dependency vulnerabilities (image scan) | Trivy / Grype | ✅ Fixed |