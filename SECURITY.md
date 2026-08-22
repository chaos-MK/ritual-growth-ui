# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| master    | ✅ |

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
- **Snyk** — dependency / software composition analysis (SCA)
- **Hadolint** — Dockerfile linting
- **Trivy & Grype** — container image vulnerability scanning
- **Syft** — SBOM (Software Bill of Materials) generation
