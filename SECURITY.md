# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| master  | ✅ |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by emailing:

**khalilmohamed798@gmail.com**

Do not open a public GitHub/GitLab issue for security vulnerabilities.

You should receive a response within 48 hours. Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact

## Automated Scanning

This repository is scanned on every push and merge request using:

- **Gitleaks** — secret detection
- **Semgrep** — static application security testing (SAST)
- **SonarQube / SonarCloud** — code quality and security analysis
- **npm audit** — frontend dependency auditing
- **Snyk** — dependency / software composition analysis (SCA)
- **Hadolint** — Dockerfile linting
- **Syft** — SBOM (Software Bill of Materials) generation
- **Trivy & Grype** — container image vulnerability scanning

## Application & Configuration Security

- Authentication is handled through **Firebase Authentication**; the frontend acquires a Firebase ID token, and the backend independently verifies it server-side — the frontend is not trusted purely because a request originates from it.
- `NEXT_PUBLIC_*` Firebase configuration values are intentionally public client configuration and are supplied at CI/CD build time; they are not treated as confidential secrets and are not sourced from Vault.
- No confidential credentials, private keys, service-account JSON, or tokens are committed to this repository.

A full architecture-level threat model, including trust boundaries, STRIDE analysis, attack paths, mitigations, and residual risks, is maintained at:

```text
~/ApplicationBib/docs/threat-model/threat-model.md
```

Risks that have been formally reviewed and accepted are tracked separately in:

```text
SECURITY-FINDINGS.md
```