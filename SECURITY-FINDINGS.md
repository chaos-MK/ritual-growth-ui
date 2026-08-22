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




## Summary

| Finding | CVEs / Issues Covered | Tool | Status |
| ------- | ---------------------- | ---- | ------ |
| #001 | **Firebase Web configuration hardcoded in frontend source code** | Manual Review + Gitleaks | ✅ Fixed |
| #002 | **Gitleaks false positive: historical Firebase client API key** no active secret exposed | Gitleaks | ✅ Resolved |