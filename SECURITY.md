# Security Policy & OWASP ASVS Baseline

## 1. Scope & OWASP ASVS Baseline
HumanHub adheres to the **OWASP Application Security Verification Standard (ASVS) Version 4.0.3 Level 2** baseline, with elevated controls for privileged administrative actions and private social media assets.

### Verified ASVS V4.0.3 Domains:
* **V2 Authentication & Password Security:** Argon2id hashing (`m=65536, t=3, p=4`), zero-data-loss bcrypt migration, password length bounds (8–128 chars), rate limiting, timing-safe OTP verification.
* **V3 Session Management:** Database-backed `Session` collection, opaque cryptographically secure 48-byte refresh tokens stored as SHA-256 hashes, atomic single-use refresh token rotation, in-memory frontend bearer tokens, HttpOnly `SameSite=Lax` Secure refresh cookies, immediate session revocation upon logout, password reset, or ban.
* **V4 Access Control (BOLA/IDOR Prevention):** Centralized authorization policy engine (`server/policies/authorization.js`), default-deny access matrices for posts, profiles, media, comments, and direct messages.
* **V5 Validation, Sanitization & Encoding:** Allowlist schema validation, regex escaping on search queries, NoSQL operator injection prevention, dangerous object key rejection.
* **V8 Data Protection & Cryptography:** AES-256-GCM authenticated encryption for TOTP shared secrets with versioned keys, high-entropy CSPRNG tokens, secure password hashing.
* **V12 SSRF Protection:** DNS resolution validation, blocking IPv4/IPv6 private ranges, loopback (`127.0.0.0/8`, `::1`), link-local (`169.254.0.0/16`, `fe80::/10`), unique local (`fc00::/7`), and cloud metadata endpoints (`169.254.169.254`).
* **V13 API & Web Service Security:** Strict CORS allowlists, anti-CSRF protections, request size bounding (`50mb` max with strict JSON parsing), security headers (CSP, HSTS, frame-ancestors 'none', nosniff, strict referrer).
* **V14 Configuration & Container Security:** Minimal Docker base images, dropped Linux capabilities, non-root execution, `no-new-privileges:true`, network isolation for databases and AI workers.

---

## 2. Reporting a Vulnerability
If you discover a security vulnerability within HumanHub, please do NOT file a public issue. Send your report directly to the security response team:
* **Security Contact:** `security@humanhub.example.com`
* **Response SLA:** Acknowledgment within 24 hours; initial triage and remediation plan within 72 hours.
* **PGP Key:** Available upon request for encrypted disclosure.

---

## 3. Supported Versions
| Version | Supported |
| :--- | :--- |
| `security/hardening` (Current) | :white_check_mark: Active |
| `main` (Pre-Hardening) | :x: Deprecated |
